from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, Depends, Header, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from models.model import ChatRequest
from models.summary import SummaryRequest
from models.database import init_db, get_db, SessionLocal
from models.schemas import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from models.user import User
from models.storage import Document, Resume, ChatHistory
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
from sqlalchemy import desc
from typing import Optional
import io
import uuid


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


def _extract_bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    if not authorization.lower().startswith("bearer "):
        return None
    return authorization.split(" ", 1)[1].strip()


def get_current_user_optional(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    token = _extract_bearer_token(authorization)
    if not token:
        return None

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None

    user_id = payload.get("user_id")
    email = payload.get("email")
    if not user_id or not email:
        return None

    return db.query(User).filter(User.id == user_id, User.email == email).first()


def get_current_user(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
) -> User:
    user = get_current_user_optional(authorization=authorization, db=db)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user

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


@app.post("/api/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_jwt_token(user.id, user.email)
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
async def resume_parser(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    resume_id = f"resume_{uuid.uuid4().hex[:12]}"
    pdf_file_path = RESUME_UPLOAD_DIR / f"{resume_id}.pdf"
    text_file_path = PDF_TEXT_DIR / f"{resume_id}.txt"

    text = await save_pdf_text(file, pdf_file_path, text_file_path)

    resume_record = Resume(
        user_id=current_user.id if current_user else None,
        resume_id=resume_id,
        original_filename=file.filename,
        file_path=str(pdf_file_path),
        text_path=str(text_file_path)
    )
    db.add(resume_record)
    db.commit()
    db.refresh(resume_record)

    return {
        "resume_id": resume_id,
        "message": f"Resume processed, {len(text)} characters extracted",
        "file_path": str(pdf_file_path),
        "text_path": str(text_file_path)
    }


@app.post("/chat/")
async def chat_pdf(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    print(request.document_id, request.question)
    answer = answer_question_ollama(request.document_id, request.question)
    print("Answer:", answer)
    if not answer:
        raise HTTPException(status_code=404, detail="Document not found or not processed")

    chat_row = ChatHistory(
        user_id=current_user.id if current_user else None,
        document_id=request.document_id,
        question=request.question,
        answer=answer
    )
    db.add(chat_row)
    db.commit()

    return {"answer": answer}


@app.post("/upload/")
async def upload_pdf(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Generate unique document_id
    document_id = f"document_{uuid.uuid4().hex[:12]}"
    pdf_file_path = PDF_UPLOAD_DIR / f"{document_id}.pdf"
    text_file_path = PDF_TEXT_DIR / f"{document_id}.txt"

    # Save PDF file + extracted text
    text = await save_pdf_text(file, pdf_file_path, text_file_path)

    document_record = Document(
        user_id=current_user.id if current_user else None,
        document_id=document_id,
        original_filename=file.filename,
        file_path=str(pdf_file_path),
        text_path=str(text_file_path)
    )
    db.add(document_record)
    db.commit()
    db.refresh(document_record)

    return {
        "document_id": document_id,
        "message": f"PDF processed, {len(text)} characters extracted",
        "file_path": str(pdf_file_path),
        "text_path": str(text_file_path)
    }


PDF_TEXT_DIR = Path("pdf_texts")
PDF_TEXT_DIR.mkdir(exist_ok=True)

PDF_UPLOAD_DIR = Path("uploads/pdfs")
PDF_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

RESUME_UPLOAD_DIR = Path("uploads/resumes")
RESUME_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

pdf_text_store = {}

@app.get("/documents/")
def list_documents(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    query = db.query(Document)
    if current_user:
        query = query.filter(Document.user_id == current_user.id)

    rows = query.order_by(desc(Document.created_at)).all()
    documents = [row.document_id for row in rows]
    return {
        "documents": documents,
        "items": [
            {
                "document_id": row.document_id,
                "original_filename": row.original_filename,
                "file_path": row.file_path,
                "text_path": row.text_path,
                "created_at": row.created_at,
            }
            for row in rows
        ]
    }


@app.get("/resumes/")
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rows = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(desc(Resume.created_at))
        .all()
    )
    return {
        "resumes": [
            {
                "resume_id": row.resume_id,
                "original_filename": row.original_filename,
                "file_path": row.file_path,
                "text_path": row.text_path,
                "created_at": row.created_at,
            }
            for row in rows
        ]
    }


async def save_pdf_text(file: UploadFile, pdf_file_path: Path, text_file_path: Path):
    """Save uploaded PDF and extracted text to disk."""
    content = await file.read()

    with open(pdf_file_path, "wb") as pdf_file:
        pdf_file.write(content)

    reader = PdfReader(io.BytesIO(content))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text

    with open(text_file_path, "w", encoding="utf-8") as f:
        f.write(text)

    return text


@app.get("/chat/history")
def get_chat_history(
    document_id: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id)
    if document_id:
        query = query.filter(ChatHistory.document_id == document_id)

    rows = query.order_by(desc(ChatHistory.created_at)).limit(limit).all()
    return {
        "history": [
            {
                "id": row.id,
                "document_id": row.document_id,
                "question": row.question,
                "answer": row.answer,
                "created_at": row.created_at,
            }
            for row in rows
        ]
    }

@app.post("/summarize/")
async def summarize(request: SummaryRequest):
    summary = summarize_pdf_ollama(request.document_id)
    print("The summary is:", summary)
    return {"summary": summary}

