from fastapi import FastAPI, APIRouter, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from models.model import ChatRequest
import random
import os
from pathlib import Path
from PyPDF2 import PdfReader
from service.qa_processing import answer_question_ollama
from service.qa_processing import summarize_pdf_ollama
from models.summary import SummaryRequest


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static", html = True), name="static")


@app.get("/") 
async def root():
    return FileResponse(Path("static/index.html"))


@app.get("/home")
async def home():
    return FileResponse(Path("static/index.html"))


@app.post("/chat/")
async def chat_pdf(request: ChatRequest):
    print(request.document_id, request.question)
    answer = answer_question_ollama(request.document_id, request.question)
    print("Answer:", answer)
    if not answer:
        raise HTTPException(status_code=404, detail="Document not found or not processed")
    return {"answer": answer}


@app.post("/upload/")
async def upload_pdf(file: UploadFile):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Generate unique document_id
    document_id = str("document" + str(random.randint(0, 100)))

    # Save PDF text
    text = await save_pdf_text(file, document_id + ".txt")

    return {"document_id": document_id, "message": f"PDF processed, {len(text)} characters extracted"}


PDF_TEXT_DIR = Path("pdf_texts")
PDF_TEXT_DIR.mkdir(exist_ok=True)

pdf_text_store = {}

@app.get("/documents/")
def list_documents():
    files = [f for f in os.listdir(PDF_TEXT_DIR) if f.endswith(".txt")]
    print(files)
    return {"documents": files}


async def save_pdf_text(file: UploadFile, document_id: str):
    """Extract text from uploaded PDF and save as a .txt file."""
    reader = PdfReader(file.file)
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text

    text_file_path = PDF_TEXT_DIR / f"{document_id}"
    with open(text_file_path, "w", encoding="utf-8") as f:
        f.write(text)

    return text

@app.post("/summarize/")
async def summarize(request: SummaryRequest):
    summary = summarize_pdf_ollama(request.document_id)
    print("The summary is:", summary)
    return {"summary": summary}

