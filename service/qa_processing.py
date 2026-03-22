from pathlib import Path
import json
import os
import re
from functools import lru_cache
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from service.pdf_processing import load_pdf_text
from langchain_ollama import ChatOllama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

VECTOR_DB_DIR = Path("vector_dbs")
VECTOR_DB_DIR.mkdir(exist_ok=True)
LOCAL_RESUME_MODEL_DIR = Path(os.getenv("LOCAL_RESUME_MODEL_PATH", "llama_model"))

STOPWORDS = {
    "the", "and", "for", "with", "from", "that", "this", "will", "your", "you", "are", "our",
    "their", "they", "into", "across", "using", "use", "used", "plus", "strong", "excellent",
    "skills", "skill", "experience", "years", "year", "including", "through", "about", "across",
    "have", "has", "had", "can", "should", "must", "able", "work", "working", "role", "team",
    "teams", "product", "products", "responsibilities", "requirements", "candidate", "senior",
}


def _extract_json_object(text: str) -> dict | None:
    """Best-effort extraction of the first JSON object from model output."""
    if not text:
        return None

    text = text.strip()
    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except Exception:
        return None


def _safe_int(value):
    try:
        return int(value)
    except Exception:
        raise ValueError("Expected integer fields in analysis JSON")


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", (value or "").strip().lower())


def _dedupe_keywords(items: list[dict], key_name: str = "word") -> list[dict]:
    seen = set()
    result = []
    for item in items:
        key = _normalize_text(str(item.get(key_name, "")))
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def _derive_missing_keywords(job_description: str, resume_text: str, max_items: int = 6) -> list[dict]:
    """Build missing keywords from JD terms absent in resume text."""
    jd_norm = _normalize_text(job_description)
    resume_norm = _normalize_text(resume_text)

    tokens = re.findall(r"[a-z][a-z0-9\-\+\.]{2,}", jd_norm)
    candidates = []
    seen = set()
    for token in tokens:
        if token in STOPWORDS:
            continue
        if token in seen:
            continue
        seen.add(token)
        candidates.append(token)

    missing_terms = [term for term in candidates if term not in resume_norm]
    missing_terms = missing_terms[:max_items]

    result = []
    for idx, term in enumerate(missing_terms):
        if idx < 3:
            priority = "HIGH"
        elif idx < 8:
            priority = "MEDIUM"
        else:
            priority = "LOW"
        result.append({"word": term, "priority": priority})

    return result


def _jd_overlap_stats(job_description: str, resume_text: str) -> tuple[int, int]:
    """Return (matched_terms, total_jd_terms) using simple deterministic token overlap."""
    jd_norm = _normalize_text(job_description)
    resume_norm = _normalize_text(resume_text)

    jd_tokens = re.findall(r"[a-z][a-z0-9\-\+\.]{2,}", jd_norm)
    jd_terms = []
    seen = set()
    for token in jd_tokens:
        if token in STOPWORDS:
            continue
        if token in seen:
            continue
        seen.add(token)
        jd_terms.append(token)

    if not jd_terms:
        return (0, 0)

    matched = sum(1 for term in jd_terms if term in resume_norm)
    return (matched, len(jd_terms))


def _apply_overlap_guardrails(analysis: dict, job_description: str, resume_text: str) -> dict:
    """Clamp model score/counters using deterministic evidence from resume-vs-JD overlap."""
    matched_terms, total_terms = _jd_overlap_stats(job_description, resume_text)
    if total_terms == 0:
        return analysis

    overlap_ratio = matched_terms / total_terms
    overlap_score = max(10, min(100, int(round(overlap_ratio * 100))))

    model_score = analysis.get("overallScore", 0)
    blended_score = int(round(0.7 * model_score + 0.3 * overlap_score))

    guarded = dict(analysis)
    guarded["overallScore"] = max(min(blended_score, 100), 0)

    guarded["keywordsMatched"] = max(min(guarded.get("keywordsMatched", 0), matched_terms), 0)
    guarded["keywordsMissing"] = max(guarded.get("keywordsMissing", 0), total_terms - matched_terms)

    return guarded


def _validate_analysis(payload: dict | None) -> dict:
    """Validate exact analysis schema returned by model. No fallbacks."""
    if not isinstance(payload, dict):
        raise ValueError("Model did not return a valid JSON object")

    required = [
        "overallScore",
        "keywordsMatched",
        "keywordsMissing",
        "sectionsToImprove",
        "fixesApplied",
        "priorityActions",
    ]
    missing = [k for k in required if k not in payload]
    if missing:
        raise ValueError(f"Model JSON is missing required fields: {', '.join(missing)}")

    overall = _safe_int(payload["overallScore"])
    keywords_matched = _safe_int(payload["keywordsMatched"])
    keywords_missing = _safe_int(payload["keywordsMissing"])
    sections_to_improve = _safe_int(payload["sectionsToImprove"])
    fixes_applied = _safe_int(payload["fixesApplied"])

    actions = payload["priorityActions"]
    if not isinstance(actions, list) or len(actions) == 0:
        raise ValueError("priorityActions must be a non-empty array")

    normalized_actions = []
    for item in actions[:8]:
        if not isinstance(item, dict):
            raise ValueError("Each priority action must be an object")
        priority = str(item.get("priority", "")).upper().strip()
        text = str(item.get("text", "")).strip()
        if priority not in {"HIGH", "MEDIUM", "LOW"}:
            raise ValueError("priorityActions.priority must be HIGH, MEDIUM, or LOW")
        if not text:
            raise ValueError("priorityActions.text cannot be empty")
        normalized_actions.append({"priority": priority, "text": text})

    return {
        "overallScore": max(0, min(100, overall)),
        "keywordsMatched": max(0, keywords_matched),
        "keywordsMissing": max(0, keywords_missing),
        "sectionsToImprove": max(0, sections_to_improve),
        "fixesApplied": max(0, fixes_applied),
        "priorityActions": normalized_actions,
    }


def _validate_keywords(payload: dict | None, job_description: str, resume_text: str) -> dict:
    """Validate keyword detail JSON for Keywords tab."""
    if not isinstance(payload, dict):
        raise ValueError("Model did not return a valid JSON object for keywords")

    if "matchedKeywords" not in payload or "missingKeywords" not in payload:
        raise ValueError("Keywords JSON must include matchedKeywords and missingKeywords")

    matched = payload["matchedKeywords"]
    missing = payload["missingKeywords"]
    jd_text = _normalize_text(job_description)
    resume_norm = _normalize_text(resume_text)

    if not isinstance(matched, list) or not isinstance(missing, list):
        raise ValueError("matchedKeywords and missingKeywords must both be arrays")

    norm_matched = []
    for item in matched[:40]:
        if not isinstance(item, dict):
            raise ValueError("matchedKeywords entries must be objects")
        word = str(item.get("word", "")).strip()
        if not word:
            raise ValueError("matchedKeywords.word cannot be empty")
        norm_matched.append({"word": word})

    norm_missing = []
    for item in missing[:40]:
        if not isinstance(item, dict):
            raise ValueError("missingKeywords entries must be objects")
        word = str(item.get("word", "")).strip()
        priority = str(item.get("priority", "")).upper().strip()
        if not word:
            raise ValueError("missingKeywords.word cannot be empty")
        if priority not in {"HIGH", "MEDIUM", "LOW"}:
            raise ValueError("missingKeywords.priority must be HIGH, MEDIUM, or LOW")
        word_norm = _normalize_text(word)
        if word_norm in jd_text and word_norm not in resume_norm:
            norm_missing.append({"word": word, "priority": priority})

    norm_matched = _dedupe_keywords(norm_matched)
    norm_missing = _dedupe_keywords(norm_missing)

    norm_matched = norm_matched[:6]

    derived_missing = _derive_missing_keywords(job_description, resume_text)
    if derived_missing:
        norm_missing = derived_missing[:6]
    else:
        norm_missing = norm_missing[:6]

    if not norm_matched and not norm_missing:
        raise ValueError("Model returned keywords not grounded in JD/resume content")

    return {
        "matchedKeywords": norm_matched,
        "missingKeywords": norm_missing,
    }


@lru_cache(maxsize=1)
def _get_local_resume_pipeline():
    from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

    if not LOCAL_RESUME_MODEL_DIR.exists():
        raise RuntimeError(f"Local resume model directory not found: {LOCAL_RESUME_MODEL_DIR}")

    tokenizer = AutoTokenizer.from_pretrained(
        str(LOCAL_RESUME_MODEL_DIR),
        local_files_only=True,
        fix_mistral_regex=True,
    )
    try:
        model = AutoModelForCausalLM.from_pretrained(
            str(LOCAL_RESUME_MODEL_DIR),
            local_files_only=True,
            device_map="auto",
        )
    except Exception:
        model = AutoModelForCausalLM.from_pretrained(
            str(LOCAL_RESUME_MODEL_DIR),
            local_files_only=True,
        )
    return pipeline("text-generation", model=model, tokenizer=tokenizer)


def analyze_resume_first_pass(resume_id: str, job_description: str) -> dict | None:
    """Return first-pass resume analysis as strict JSON-friendly dict for UI cards/actions."""
    resume_text = load_pdf_text(resume_id)
    if not resume_text:
        return None

    resume_chunk = resume_text[:6000]
    jd_chunk = (job_description or "")[:3500]

    prompt = f"""
            You are an ATS resume evaluator.
            Return ONLY valid JSON (no markdown, no extra text) with this exact schema:
            {{
                "overallScore": number,
                "keywordsMatched": number,
                "keywordsMissing": number,
                "sectionsToImprove": number,
                "fixesApplied": number,
                "priorityActions": [
                    {{"priority": "HIGH|MEDIUM|LOW", "text": "action sentence"}}
                ],
                "matchedKeywords": [
                    {{"word": "keyword"}}
                ],
                "missingKeywords": [
                    {{"word": "keyword", "priority": "HIGH|MEDIUM|LOW"}}
                ]
            }}

            Scoring Guidance:
            - Give a high score (80-100) if the resume strongly matches the job description, with most key skills and requirements present.
            - Give a moderate score (40-79) if the resume matches some important keywords but is missing several key requirements.
            - Give a low score (0-39) if the resume is missing most important keywords and requirements.
            - Do NOT default to 0 unless the resume is almost entirely irrelevant.
            - Scores/counts must be integers.
            - fixesApplied must be 0.
            - priorityActions must contain 3-5 actions.
            - Focus on keyword alignment and section-level improvement opportunities.
            - matchedKeywords should contain strongest present terms.
            - missingKeywords should contain important gaps.
            - INCLUDE the priority of missing keywords as HIGH, MEDIUM, or LOW based on their importance in the job description and absence in the resume.
            - Include the matched keywords such that each is a separate json object with a "word" field. Do not return them as a comma-separated string or in a single field. for e.g. "word": "UX", "word": "design", "word": "research" is correct, while "words": "UX, design, research" is not.
            - Include ALL of the information mentioned in this format; 
                {{
                    "overallScore": number,
                    "keywordsMatched": number,
                    "keywordsMissing": number,
                    "sectionsToImprove": number,
                    "fixesApplied": number,
                    "priorityActions": [
                        {{"priority": "HIGH|MEDIUM|LOW", "text": "action sentence"}}
                    ],
                    "matchedKeywords": [
                        {{"word": "keyword"}}
                    ],
                    "missingKeywords": [
                        {{"word": "keyword", "priority": "HIGH|MEDIUM|LOW"}}
                    ]
                }}
            Example:
            If the resume matches most of the job description's key skills and requirements, return an overallScore between 85 and 100.

            Resume Text:
            {resume_chunk}

            Job Description:
            {jd_chunk}
            """.strip()

    try:
        ollama = ChatOllama(model="llama3.1:8b", temperature=0.1, base_url="http://localhost:11434")
        raw = ollama.invoke(prompt)
        content = raw.content if hasattr(raw, "content") else str(raw)
        print("[resumeParser][model-ollama] Raw response:")
        print(content)
        model_payload = _extract_json_object(content)
        analysis = _validate_analysis(model_payload)
        keywords = _validate_keywords(model_payload, jd_chunk, resume_chunk)
        analysis["matchedKeywords"] = keywords["matchedKeywords"]
        analysis["missingKeywords"] = keywords["missingKeywords"]
        analysis["keywordsMatched"] = len(keywords["matchedKeywords"])
        analysis["keywordsMissing"] = len(keywords["missingKeywords"])
        return _apply_overlap_guardrails(analysis, jd_chunk, resume_chunk)
    except Exception as ollama_exc:
        raise RuntimeError(f"Ollama fallback failed: {str(ollama_exc)}")


def analyze_resume_keywords(resume_id: str, job_description: str) -> dict | None:
    """Return keyword-level JSON for the Keywords tab (strict schema, no content fallback)."""
    resume_text = load_pdf_text(resume_id)
    if not resume_text:
        return None

    resume_chunk = resume_text[:6000]
    jd_chunk = (job_description or "")[:3500]

    prompt = f"""
            You are an ATS keyword matching evaluator.
            Return ONLY valid JSON (no markdown, no extra text) with this exact schema:
            {{
            "matchedKeywords": [
                {{"word": "keyword", "score": number}}
            ],
            "missingKeywords": [
                {{"word": "keyword", "priority": "HIGH|MEDIUM|LOW"}}
            ]
            }}

            Rules:
            - Return 6-15 matched keywords with score 0-100.
            - Return 4-15 missing keywords with priority HIGH, MEDIUM, or LOW.
            - Use concise keyword phrases.
            - Choose keywords only from the provided Job Description.
            - Do not invent unrelated terms.

            Resume Text:
            {resume_chunk}

            Job Description:
            {jd_chunk}
        """.strip()

    try:
        ollama = ChatOllama(model="llama3.1:8b", temperature=0.1, base_url="http://localhost:11434")
        raw = ollama.invoke(prompt)
        content = raw.content if hasattr(raw, "content") else str(raw)
        print("[resumeParser][keywords-ollama] Raw response:")
        print(content)
        model_payload = _extract_json_object(content)
        return _validate_keywords(model_payload, jd_chunk, resume_chunk)
    except Exception as ollama_exc:
        raise RuntimeError(f"Ollama fallback failed for keywords: {str(ollama_exc)}")

def get_embeddings():
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def create_or_load_vectordb(document_id):
    """
    Create vector database for a document or load existing one
    
    Args:
        document_id: ID of the PDF document
    
    Returns:
        FAISS vector store
    """
    vectordb_path = VECTOR_DB_DIR / document_id

    if vectordb_path.exists():
        embeddings = get_embeddings()
        vectordb = FAISS.load_local(str(vectordb_path), embeddings, allow_dangerous_deserialization=True)
        return vectordb

    text = load_pdf_text(document_id)

    if not text:
        return None

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", " ", ""]
    )

    chunks = text_splitter.split_text(text)

    docs = [Document(page_content=chunk, metadata={"source": document_id}) for chunk in chunks]

    embeddings = get_embeddings()

    vectordb = FAISS.from_documents(docs, embeddings)

    vectordb.save_local(str(vectordb_path))

    return vectordb

def answer_question_ollama(document_id, question, model_name="llama3.1:8b"):
    """
    Answer questions about a PDF using Ollama with RAG
    
    Args:
        document_id: ID of the PDF document
        question: User's question
        model_name: Ollama model name
    """
    try:
        
        vectordb = create_or_load_vectordb(document_id)

        if not vectordb:
            return None

        retriever = vectordb.as_retriever(search_kwargs={"k": 3})

        relevant_docs = retriever.invoke(question)

        context = "\n\n".join([doc.page_content for doc in relevant_docs])

        prompt_template = """
        Based on the following context, answer the question. If the answer is not in the context, say "Answer is not available in the context."
        
        Context:
        {context}
        
        Question: {question}
        
        Answer:
        """

        prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])

        model = ChatOllama(
            model=model_name,
            temperature=0.3,
            base_url="http://localhost:11434"
        )

        chain = prompt | model | StrOutputParser()

        result = chain.invoke({"context": context, "question": question})

        return result

    except Exception as e:
        return f"Error processing question: {str(e)}"

def summarize_pdf_ollama(document_id, model_name="llama3.1:8b"):
    """
    Summarize a PDF using Ollama
    
    Args:
        document_id: ID of the PDF document
        model_name: Ollama model name
    """
    try:

        text = load_pdf_text(document_id)

        if not text:
            return None

        vectordb = create_or_load_vectordb(document_id)

        if vectordb:
            retriever = vectordb.as_retriever(search_kwargs={"k": 5})

            relevant_docs = retriever.invoke("summary main points key topics")

            context = "\n\n".join([doc.page_content for doc in relevant_docs])
        else:
            context = text[:3000]

        prompt_template = """
        Summarize the following text in 5 bullet points:
        
        Text:
        {context}
        
        Summary:
        """

        prompt = PromptTemplate(template=prompt_template, input_variables=["context"])

        model = ChatOllama(
            model=model_name,
            temperature=0.3,
            base_url="http://localhost:11434"
        )

        chain = prompt | model | StrOutputParser()

        result = chain.invoke({"context": context})

        return result

    except Exception as e:
        return f"Error summarizing PDF: {str(e)}"
