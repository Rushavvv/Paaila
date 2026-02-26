from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from models.model import ChatRequest
from models.summary import SummaryRequest
from models.database import init_db, get_db, SessionLocal
from models.schemas import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from models.user import User
import random
import os
from pathlib import Path
from PyPDF2 import PdfReader
from service.qa_processing import answer_question_ollama
from service.qa_processing import summarize_pdf_ollama
import bcrypt
from datetime import datetime, timedelta
import jwt
from sqlalchemy.orm import Session


# Configuration
JWT_SECRET_KEY = "your_secret_key_change_this_in_production"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Initialize database on startup
init_db()

# Helper functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_jwt_token(user_id: int, email: str) -> str:
    """Create a JWT token for the user."""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

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


@app.post("/api/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    password_hash = hash_password(request.password)
    
    user = User(
        name=request.name,
        email=request.email,
        password_hash=password_hash
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate JWT token
    token = create_jwt_token(user.id, user.email)
    
    # Return response
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "created_at": user.created_at
        }
    }


@app.post("/resumeParser/")
async def resume_parser(file: UploadFile):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    document_id = str("document" + str(random.randint(0, 100)))

    text = await save_pdf_text(file, document_id + ".txt")

    return {"document_id": document_id, "message": f"PDF processed, {len(text)} characters extracted"}


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

