# Import Path for file system operations
from pathlib import Path
# Import RecursiveCharacterTextSplitter to split large texts into smaller chunks
from langchain_text_splitters import RecursiveCharacterTextSplitter
# Import HuggingFaceEmbeddings to convert text chunks into numerical vectors (embeddings)
from langchain_huggingface import HuggingFaceEmbeddings
# Import FAISS vector store for efficient similarity search on embeddings
from langchain_community.vectorstores import FAISS
# Import Document class to structure text chunks with metadata
from langchain_core.documents import Document
# Import function to load PDF text from our pdf_processing module
from service.pdf_processing import load_pdf_text
# Import ChatOllama to interact with local Ollama LLM models
from langchain_ollama import ChatOllama
# Import PromptTemplate to create structured prompts for the LLM
from langchain_core.prompts import PromptTemplate
# Import StrOutputParser to parse LLM output as plain text strings
from langchain_core.output_parsers import StrOutputParser

# Define the directory path where vector databases will be stored
VECTOR_DB_DIR = Path("vector_dbs")
# Create the vector_dbs directory if it doesn't already exist
VECTOR_DB_DIR.mkdir(exist_ok=True)

def get_embeddings():
    """Get HuggingFace embeddings model"""
    # Return a HuggingFace embeddings model using the all-MiniLM-L6-v2 transformer
    # This model converts text into 384-dimensional vectors for semantic similarity
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def create_or_load_vectordb(document_id):
    """
    Create vector database for a document or load existing one
    
    Args:
        document_id: ID of the PDF document
    
    Returns:
        FAISS vector store
    """
    # Construct the path where the vector database for this document is stored
    vectordb_path = VECTOR_DB_DIR / document_id
    
    # Check if a vector database already exists for this document
    if vectordb_path.exists():
        # Get the embeddings model for loading the vector database
        embeddings = get_embeddings()
        # Load the existing FAISS vector database from disk
        # allow_dangerous_deserialization=True is needed to load pickled data
        vectordb = FAISS.load_local(str(vectordb_path), embeddings, allow_dangerous_deserialization=True)
        # Return the loaded vector database
        return vectordb
    
    # If no existing database, create a new one
    # Load the PDF text content using the document ID
    text = load_pdf_text(document_id)
    # If no text was found, return None
    if not text:
        return None
    
    # Create a text splitter to divide the PDF into smaller chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,          # Each chunk will be max 500 characters
        chunk_overlap=100,       # Overlap 100 chars between chunks to preserve context
        separators=["\n\n", "\n", " ", ""]  # Split by paragraphs, lines, spaces, then characters
    )
    # Split the text into chunks using the configured splitter
    chunks = text_splitter.split_text(text)
    
    # Convert each text chunk into a Document object with metadata
    docs = [Document(page_content=chunk, metadata={"source": document_id}) for chunk in chunks]
    
    # Get the embeddings model for creating vector representations
    embeddings = get_embeddings()
    # Create a FAISS vector database from the document chunks and their embeddings
    vectordb = FAISS.from_documents(docs, embeddings)
    
    # Save the vector database to disk for future use
    vectordb.save_local(str(vectordb_path))
    
    # Return the newly created vector database
    return vectordb

def answer_question_ollama(document_id, question, model_name="llama3.2"):
    """
    Answer questions about a PDF using Ollama with RAG
    
    Args:
        document_id: ID of the PDF document
        question: User's question
        model_name: Ollama model name
    """
    # Wrap everything in a try-except block to handle errors gracefully
    try:
        
        # Get or create the vector database for this document
        vectordb = create_or_load_vectordb(document_id)
        # If vector database creation failed, return None
        if not vectordb:
            return None
        
        # Create a retriever that will search for the top 3 most relevant chunks
        retriever = vectordb.as_retriever(search_kwargs={"k": 3})
        # Retrieve the 3 most relevant document chunks based on the question
        relevant_docs = retriever.invoke(question)
        
        # Combine all retrieved chunks into a single context string
        # Separate each chunk with double newlines for readability
        context = "\n\n".join([doc.page_content for doc in relevant_docs])
        
        # Define the prompt template that will be sent to the LLM
        prompt_template = """
        Based on the following context, answer the question. If the answer is not in the context, say "Answer is not available in the context."
        
        Context:
        {context}
        
        Question: {question}
        
        Answer:
        """
        
        # Create a PromptTemplate object with placeholders for context and question
        prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
        
        # Initialize the ChatOllama model with specified settings
        model = ChatOllama(
            model=model_name,              # Name of the Ollama model to use
            temperature=0.3,               # Lower temperature = more focused/deterministic responses
            base_url="http://localhost:11434"  # URL where Ollama server is running
        )
        
        # Create a chain: Prompt -> Model -> String Output Parser
        # The | operator pipes output from one component to the next
        chain = prompt | model | StrOutputParser()
        # Execute the chain with the context and question, get the answer
        result = chain.invoke({"context": context, "question": question})
        
        # Return the generated answer
        return result
    # If any error occurs, catch it and return an error message
    except Exception as e:
        return f"Error processing question: {str(e)}"

def summarize_pdf_ollama(document_id, model_name="llama3.2"):
    """
    Summarize a PDF using Ollama
    
    Args:
        document_id: ID of the PDF document
        model_name: Ollama model name
    """
    # Wrap everything in a try-except block to handle errors gracefully
    try:

        # Load the full text content of the PDF
        text = load_pdf_text(document_id)
        # If no text was found, return None
        if not text:
            return None
        
        # For long texts, use the vector database to get representative chunks
        # Get or create the vector database for this document
        vectordb = create_or_load_vectordb(document_id)
        # If vector database was created successfully
        if vectordb:
            # Create a retriever that will get the top 5 most relevant chunks
            retriever = vectordb.as_retriever(search_kwargs={"k": 5})
            # Search for chunks most relevant to summarization keywords
            relevant_docs = retriever.invoke("summary main points key topics")
            # Combine the top 5 chunks into a single context string
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
        else:
            # If vector database creation failed, use the first 3000 characters
            context = text[:3000]
        
        # Define the prompt template for summarization
        prompt_template = """
        Summarize the following text in 5 bullet points:
        
        Text:
        {context}
        
        Summary:
        """
        
        # Create a PromptTemplate object with a placeholder for context
        prompt = PromptTemplate(template=prompt_template, input_variables=["context"])
        
        # Initialize the ChatOllama model with specified settings
        model = ChatOllama(
            model=model_name,              # Name of the Ollama model to use
            temperature=0.3,               # Lower temperature for more focused summaries
            base_url="http://localhost:11434"  # URL where Ollama server is running
        )
        
        # Create a chain: Prompt -> Model -> String Output Parser
        # The | operator pipes output from one component to the next
        chain = prompt | model | StrOutputParser()
        # Execute the chain with the context to generate the summary
        result = chain.invoke({"context": context})
        
        # Return the generated summary
        return result
    # If any error occurs, catch it and return an error message
    except Exception as e:
        return f"Error summarizing PDF: {str(e)}"
