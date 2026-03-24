from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, Depends, Header, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from models.model import ChatRequest, ResumeAnalysisRequest
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
from service.qa_processing import analyze_resume_first_pass
from service.qa_processing import analyze_resume_keywords
from service.pdf_processing import extract_first_word_from_pdf
import bcrypt
from datetime import datetime, timedelta
import jwt
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
import io
import uuid

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "secret_key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "20"))

# Initialize database on startup
init_db()

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
        'exp': datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
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


def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if (current_user.user_type or "normal").lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def _active_user_ids_last_30_days(db: Session) -> set[int]:
    cutoff = datetime.utcnow() - timedelta(days=30)
    active_ids: set[int] = set()

    for model in (ChatHistory, Document, Resume):
        rows = (
            db.query(model.user_id)
            .filter(model.user_id.isnot(None), model.created_at >= cutoff)
            .distinct()
            .all()
        )
        active_ids.update(user_id for (user_id,) in rows if user_id is not None)

    return active_ids

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
        password_hash=password_hash,
        user_type="normal"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_jwt_token(user.id, user.email)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "userType": user.user_type,
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
            "userType": user.user_type,
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


@app.post("/resumeParser/analyze")
async def analyze_resume_parser_first_pass(
    request: ResumeAnalysisRequest,
    _: Optional[User] = Depends(get_current_user_optional),
):
    try:
        analysis = analyze_resume_first_pass(request.resume_id, request.job_description)
        if not analysis:
            raise HTTPException(status_code=404, detail="Resume not found or not processed")
        return {"analysis": analysis}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid model JSON response: {str(exc)}")
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/resumeParser/keywords")
async def analyze_resume_parser_keywords(
    request: ResumeAnalysisRequest,
    _: Optional[User] = Depends(get_current_user_optional),
):
    try:
        analysis = analyze_resume_first_pass(request.resume_id, request.job_description)
        if not analysis:
            raise HTTPException(status_code=404, detail="Resume not found or not processed")
        keywords = {
            "matchedKeywords": analysis.get("matchedKeywords", []),
            "missingKeywords": analysis.get("missingKeywords", []),
        }
        return {"keywords": keywords}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid model JSON response: {str(exc)}")
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

from service.qa_processing import improve_resume_json

from pydantic import BaseModel
class ResumeImproveRequest(BaseModel):
    resume_id: str
    job_description: str

@app.post("/resumeParser/improve")
async def improve_resume_parser(
    request: ResumeImproveRequest,
    _: Optional[User] = Depends(get_current_user_optional),
):
    try:
        improved = improve_resume_json(request.resume_id, request.job_description)
        if not improved:
            raise HTTPException(status_code=404, detail="Resume not found or not processed")
        return {"improved": improved}
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid model JSON response: {str(exc)}")
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

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


    base_id = Path(file.filename).stem
    document_id = base_id
    suffix = 1
    while db.query(Document).filter_by(document_id=document_id).first() is not None:
        document_id = f"{base_id}_{suffix}"
        suffix += 1

    pdf_file_path = PDF_UPLOAD_DIR / f"{document_id}.pdf"
    text_file_path = PDF_TEXT_DIR / f"{document_id}.txt"

    # Save PDF file
    with open(pdf_file_path, "wb") as out_pdf:
        out_pdf.write(await file.read())
    file.file.seek(0)

    # Save extracted text
    from service.pdf_processing import save_pdf_text
    text = await save_pdf_text(file, document_id)

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


@app.delete("/resumes/{resume_id}")
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    row = (
        db.query(Resume)
        .filter(Resume.user_id == current_user.id, Resume.resume_id == resume_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Resume not found")

    for candidate in (row.file_path, row.text_path):
        if not candidate:
            continue
        try:
            path = Path(candidate)
            if path.exists() and path.is_file():
                path.unlink()
        except Exception:
            # Do not block DB deletion if file cleanup fails.
            pass

    db.delete(row)
    db.commit()
    return {"message": "Resume deleted", "resume_id": resume_id}


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


@app.get("/admin/stats")
def admin_stats(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    active_user_ids = _active_user_ids_last_30_days(db)
    return {
        "totalUsers": db.query(User).count(),
        "totalResumes": db.query(Resume).count(),
        "activeUsers": len(active_user_ids),
    }


@app.get("/admin/users")
def admin_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    active_user_ids = _active_user_ids_last_30_days(db)
    users = db.query(User).order_by(User.id.asc()).all()

    items = []
    for user in users:
        status = "active" if user.id in active_user_ids else "inactive"
        items.append(
            {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "status": status,
                "joined": user.created_at,
            }
        )

    return {"users": items}


@app.put("/admin/users/{user_id}")
def update_user(
    user_id: int,
    data: dict,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update allowed fields
    if "name" in data:
        user.name = data["name"]
    if "email" in data:
        user.email = data["email"]
    
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "message": "User updated successfully"
    }


@app.delete("/admin/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": f"User {user.name} deleted successfully"}

