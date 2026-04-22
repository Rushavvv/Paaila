from fastapi import FastAPI, HTTPException, UploadFile, Depends, Header, Query, Form, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from models.model import ChatRequest, ResumeAnalysisRequest, ResumeImproveRequest, ResumeSaveEditedRequest
from models.summary import SummaryRequest
from models.database import init_db, get_db, SessionLocal
from models.schemas import RegisterRequest, LoginRequest, AuthResponse, UserResponse
from models.user import User
from models.storage import Document, Resume, ChatHistory
from datetime import datetime, timezone
from service.pdf_processing import save_pdf_text
from service.qa_processing import improve_resume_json
import os
from dotenv import load_dotenv
from pathlib import Path
from PyPDF2 import PdfReader
from service.qa_processing import answer_question_ollama
from service.qa_processing import summarize_pdf_ollama
from service.qa_processing import analyze_resume_first_pass
import bcrypt
from datetime import datetime, timedelta
import jwt
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional
import io
import uuid
import re

from models.validation import (
    PROFILE_IMAGE_MAX_SIZE_BYTES,
    RESUME_EDITED_HTML_MAX_LENGTH,
    ValidationError,
    normalize_email,
    sanitize_search_input,
    validate_name,
    validate_phone_number,
    validate_pdf_upload,
    validate_profile_image_upload,
)

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "").strip()
if not JWT_SECRET_KEY:
    raise RuntimeError("Missing required environment variable: JWT_SECRET_KEY")

if JWT_SECRET_KEY.lower() in {"secret_key", "changeme", "default", "password"}:
    raise RuntimeError("JWT_SECRET_KEY is insecure. Set a strong random value in environment variables.")

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "20"))

cors_raw = os.getenv(
    "CORS_ALLOW_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
)
CORS_ALLOW_ORIGINS = [origin.strip().rstrip("/") for origin in cors_raw.split(",") if origin.strip()]
if not CORS_ALLOW_ORIGINS:
    raise RuntimeError("CORS_ALLOW_ORIGINS must include at least one origin")
if "*" in CORS_ALLOW_ORIGINS:
    raise RuntimeError("CORS_ALLOW_ORIGINS cannot include '*' when credentials are enabled")

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


def _extract_text_from_pdf_bytes(content: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text
        return text
    except Exception:
        raise ValueError("Invalid PDF")


def _parse_admin_name(raw_name: str) -> tuple[str, str, str]:
    name = re.sub(r"\s+", " ", str(raw_name or "").strip())
    if not name:
        raise ValidationError("Name is required")
    parts = name.split(" ", 1)
    first = validate_name(parts[0], "First name")
    last = validate_name(parts[1], "Last name") if len(parts) > 1 and parts[1].strip() else ""
    return name, first, last


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
    except jwt.ExpiredSignatureError:
        # Token is expired
        return None
    except jwt.PyJWTError:
        # Token is malformed or invalid
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
    # Check if Authorization header is missing
    if not authorization:
        raise HTTPException(
            status_code=401, 
            detail="Authentication required. Missing Authorization header."
        )
    
    # Check if Authorization header has proper Bearer format
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=401, 
            detail="Invalid Authorization header format. Expected: Bearer <token>"
        )
    
    # Extract token and check if it's empty
    token = _extract_bearer_token(authorization)
    if not token:
        raise HTTPException(
            status_code=401, 
            detail="Invalid token. Token is missing or malformed."
        )
    
    # Try to decode and validate token
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401, 
            detail="Token has expired. Please log in again."
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=401, 
            detail="Invalid or malformed token. Authentication failed."
        )
    
    # Validate token payload
    user_id = payload.get("user_id")
    email = payload.get("email")
    if not user_id or not email:
        raise HTTPException(
            status_code=401, 
            detail="Invalid token payload. User information missing."
        )
    
    # Query user from database
    user = db.query(User).filter(User.id == user_id, User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=401, 
            detail="User not found or session is no longer valid."
        )
    
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

app = FastAPI(
    title="Paaila",
    description="AI powered document assistant and resume parser",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static", html = True), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/", include_in_schema=False)
async def root():
    return FileResponse(Path("static/index.html"))


@app.get("/home", include_in_schema=False)
async def home():
    return FileResponse(Path("static/index.html"))


@app.post("/api/register", response_model=AuthResponse, tags=["Authentication"], summary="Register a new user")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user."""
    email = normalize_email(request.email)

    try:
        first_name = validate_name(request.first_name, "First name")
        last_name = validate_name(request.last_name, "Last name")
        phone_number = validate_phone_number(request.phone_number)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    existing_user = db.query(User).filter(func.lower(User.email) == email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    password_hash = hash_password(request.password)
    full_name = f"{first_name} {last_name}".strip()
    
    user = User(
        name=full_name,
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        email=email,
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
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": user.phone_number,
            "email": user.email,
            "userType": user.user_type,
            "created_at": user.created_at
        }
    }


@app.post("/api/login", response_model=AuthResponse, tags=["Authentication"], summary="User login and JWT token retrieval")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    email = normalize_email(request.email)
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email not registered")
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect password")

    token = create_jwt_token(user.id, user.email)
    return {
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone_number": user.phone_number,
            "email": user.email,
            "userType": user.user_type,
            "created_at": user.created_at
        }
    }


@app.get("/api/user", response_model=UserResponse, tags=["Authentication"], summary="Get current user profile")
async def get_user_profile(
    current_user: User = Depends(get_current_user)
):
    """Get the current authenticated user's profile."""
    return {
        "id": current_user.id,
        "name": current_user.name,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone_number": current_user.phone_number,
        "email": current_user.email,
        "userType": current_user.user_type,
        "profile_image_path": current_user.profile_image_path,
        "created_at": current_user.created_at
    }


@app.put("/api/user", tags=["Authentication"], summary="Update current user profile")
async def update_user_profile(
    first_name: Optional[str] = Form(default=None),
    last_name: Optional[str] = Form(default=None),
    phone_number: Optional[str] = Form(default=None),
    profile_image: Optional[UploadFile] = File(default=None),
    delete_profile_image: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the current authenticated user's profile with optional profile image."""
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update allowed fields for the user's own profile
    if first_name is not None:
        try:
            user.first_name = validate_name(first_name, "First name")
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
    if last_name is not None:
        try:
            user.last_name = validate_name(last_name, "Last name")
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
    if phone_number is not None:
        try:
            user.phone_number = validate_phone_number(phone_number)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
    
    # Handle profile image deletion
    if delete_profile_image and delete_profile_image.lower() == 'true':
        try:
            # Delete the file from disk if it exists
            if user.profile_image_path:
                profile_path = Path(user.profile_image_path)
                if profile_path.exists():
                    profile_path.unlink()
            # Clear the profile image path from database
            user.profile_image_path = None
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete profile image: {str(e)}")
    # Handle profile image upload
    elif profile_image:
        try:
            image_bytes = await profile_image.read()
            file_ext = validate_profile_image_upload(
                profile_image.filename,
                profile_image.content_type,
                image_bytes,
                max_size_bytes=PROFILE_IMAGE_MAX_SIZE_BYTES,
            )
            profile_filename = f"profile_{user.id}{file_ext}"
            profile_path = PROFILES_UPLOAD_DIR / profile_filename
            
            with open(profile_path, 'wb') as f:
                f.write(image_bytes)
            
            user.profile_image_path = str(profile_path)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save profile image: {str(e)}")
    
    # Recompute full name if first or last name was updated
    if first_name is not None or last_name is not None:
        user.name = f"{user.first_name} {user.last_name}".strip()
    
    db.commit()
    db.refresh(user)
    
    return {
        "id": user.id,
        "name": user.name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.phone_number,
        "email": user.email,
        "userType": user.user_type,
        "profile_image_path": user.profile_image_path,
        "created_at": user.created_at,
        "message": "Profile updated successfully"
    }


@app.post("/resumeParser/", tags=["Resume Parser"], summary="Upload and process a resume PDF")
async def resume_parser(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    file_bytes = await file.read()
    try:
        validate_pdf_upload(file.filename, file.content_type, file_bytes)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    resume_id = f"resume_{uuid.uuid4().hex[:12]}"
    pdf_file_path = RESUME_UPLOAD_DIR / f"{resume_id}.pdf"
    text_file_path = PDF_TEXT_DIR / f"{resume_id}.txt"

    try:
        text = await save_pdf_text(file_bytes, pdf_file_path, text_file_path)
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Invalid PDF")

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


@app.post("/resumeParser/analyze", tags=["Resume Parser"], summary="Analyze resume for job description match")
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


@app.post("/resumeParser/keywords", tags=["Resume Parser"], summary="Extract resume keywords for job description")
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


@app.post("/resumeParser/improve", tags=["Resume Parser"], summary="Suggest improvements for resume based on job description")
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


@app.post("/resume/save-edited", tags=["Resume Parser"], summary="Save edited tailored resume HTML")
async def save_edited_resume_html(
    request: ResumeSaveEditedRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    resume_id = (request.resume_id or "").strip()
    edited_html = (request.edited_html or "").strip()

    if not resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")
    if not edited_html:
        raise HTTPException(status_code=400, detail="edited_html is required")
    if len(edited_html) > RESUME_EDITED_HTML_MAX_LENGTH:
        raise HTTPException(status_code=413, detail="edited_html payload is too large")

    query = db.query(Resume).filter(Resume.resume_id == resume_id)
    if current_user:
        query = query.filter(Resume.user_id == current_user.id)
    resume_row = query.first()

    if not resume_row:
        raise HTTPException(status_code=404, detail="Resume not found")

    edited_dir = RESUME_UPLOAD_DIR / "edited"
    edited_dir.mkdir(parents=True, exist_ok=True)
    edited_file_path = edited_dir / f"{resume_id}.html"

    try:
        with open(edited_file_path, "w", encoding="utf-8") as f:
            f.write(edited_html)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to persist edited resume: {str(exc)}")

    return {
        "message": "Edited resume saved",
        "resume_id": resume_id,
        "edited_path": str(edited_file_path),
    }

@app.post("/chat/", tags=["PDF Chat"], summary="Ask a question about a PDF document")
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

    now = datetime.now(timezone.utc)
    chat_row = ChatHistory(
        user_id=current_user.id if current_user else None,
        document_id=request.document_id,
        question=request.question,
        answer=answer,
        created_at=now
    )
    db.add(chat_row)
    db.commit()

    return {"answer": answer, "created_at": chat_row.created_at.isoformat()}


@app.post("/upload/", tags=["PDF Documents"], summary="Upload a PDF document for processing")
async def upload_pdf(
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        file_bytes = await file.read()
        try:
            validate_pdf_upload(file.filename, file.content_type, file_bytes)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

        base_id = Path(file.filename).stem
        if not base_id:
            raise HTTPException(status_code=422, detail="Invalid file name")
            
        document_id = base_id
        suffix = 1
        while db.query(Document).filter_by(document_id=document_id).first() is not None:
            document_id = f"{base_id}_{suffix}"
            suffix += 1

        pdf_file_path = PDF_UPLOAD_DIR / f"{document_id}.pdf"
        text_file_path = PDF_TEXT_DIR / f"{document_id}.txt"

        try:
            text = await save_pdf_text(file_bytes, pdf_file_path, text_file_path)
        except Exception as exc:
            raise HTTPException(status_code=422, detail="Invalid PDF")

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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


PDF_TEXT_DIR = Path("pdf_texts")
PDF_TEXT_DIR.mkdir(exist_ok=True)

PDF_UPLOAD_DIR = Path("uploads/pdfs")
PDF_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

RESUME_UPLOAD_DIR = Path("uploads/resumes")
RESUME_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

PROFILES_UPLOAD_DIR = Path("uploads/profiles")
PROFILES_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@app.get("/documents/", tags=["PDF Documents"], summary="List all uploaded PDF documents")
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


@app.get("/resumes/", tags=["Resume Parser"], summary="List all uploaded resumes")
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


@app.delete("/resumes/{resume_id}", tags=["Resume Parser"], summary="Delete a resume and its files")
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


@app.delete("/documents/{document_id}", tags=["PDF Documents"], summary="Delete a PDF document and its files")
def delete_document(
    document_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    row = db.query(Document).filter(Document.user_id == current_user.id, Document.document_id == document_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    # Remove files
    for candidate in (row.file_path, row.text_path):
        if not candidate:
            continue
        try:
            path = Path(candidate)
            if path.exists() and path.is_file():
                path.unlink()
        except Exception:
            pass
    db.delete(row)
    db.commit()
    return {"message": "Document deleted", "document_id": document_id}


async def save_pdf_text(content: bytes, pdf_file_path: Path, text_file_path: Path):
    """Save uploaded PDF and extracted text to disk."""
    try:
        with open(pdf_file_path, "wb") as pdf_file:
            pdf_file.write(content)

        text = _extract_text_from_pdf_bytes(content)

        with open(text_file_path, "w", encoding="utf-8") as f:
            f.write(text)

        return text
    except ValueError as e:
        if pdf_file_path.exists():
            try:
                pdf_file_path.unlink()
            except:
                pass
        raise


@app.get("/chat/history", tags=["PDF Chat"], summary="Get chat history for a PDF document")
def get_chat_history(
    document_id: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if document_id:
        try:
            document_id = sanitize_search_input(document_id)
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

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
                "date": row.created_at.isoformat() if row.created_at else None,
            }
            for row in rows
        ]
    }

@app.delete("/chat/delete_history", tags=["PDF Chat"], summary="Delete chat history for a PDF document")
def delete_chat_history(
    document_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        document_id = sanitize_search_input(document_id)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    query = db.query(ChatHistory).filter(ChatHistory.user_id == current_user.id)
    if document_id:
        query = query.filter(ChatHistory.document_id == document_id)
    deleted = query.delete(synchronize_session=False)
    db.commit()
    return {"message": f"Deleted {deleted} chat messages for document {document_id}"}

@app.post("/summarize/", tags=["PDF Chat"], summary="Summarize a PDF document")
async def summarize(request: SummaryRequest):
    summary = summarize_pdf_ollama(request.document_id)
    print("The summary is:", summary)
    return {"summary": summary}


@app.get("/admin/stats", tags=["Admin"], summary="Get admin statistics")
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


@app.get("/admin/users", tags=["Admin"], summary="List all users (admin only)")
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
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone_number": user.phone_number,
                "email": user.email,
                "user_type": user.user_type or "normal",
                "status": status,
                "joined": user.created_at,
            }
        )

    return {"users": items}


@app.put("/admin/users/{user_id}", tags=["Admin"], summary="Update a user (admin only)")
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
        try:
            raw_name, first, last = _parse_admin_name(data["name"])
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        user.name = raw_name
        user.first_name = first
        user.last_name = last
    if "first_name" in data:
        try:
            user.first_name = validate_name(data["first_name"], "First name")
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
    if "last_name" in data:
        try:
            user.last_name = validate_name(data["last_name"], "Last name")
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
    if "phone_number" in data:
        try:
            user.phone_number = validate_phone_number(data["phone_number"])
        except ValidationError as exc:
            raise HTTPException(status_code=422, detail=str(exc))

    if "first_name" in data or "last_name" in data:
        user.name = f"{user.first_name} {user.last_name}".strip()

    if "user_type" in data:
        user_type_value = str(data["user_type"]).strip().lower()
        if user_type_value not in {"admin", "normal"}:
            raise HTTPException(status_code=422, detail="user_type must be either 'admin' or 'normal'")
        user.user_type = user_type_value
    
    db.commit()
    db.refresh(user)
    return {
        "id": user.id,
        "name": user.name,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone_number": user.phone_number,
        "email": user.email,
        "user_type": user.user_type,
        "message": "User updated successfully"
    }


@app.delete("/admin/users/{user_id}", tags=["Admin"], summary="Delete a user (admin only)")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete all related ChatHistory
    chat_rows = db.query(ChatHistory).filter(ChatHistory.user_id == user_id).all()
    for row in chat_rows:
        db.delete(row)

    # Delete all related Documents
    doc_rows = db.query(Document).filter(Document.user_id == user_id).all()
    for row in doc_rows:
        # Remove files
        for candidate in (row.file_path, row.text_path):
            if not candidate:
                continue
            try:
                path = Path(candidate)
                if path.exists() and path.is_file():
                    path.unlink()
            except Exception:
                pass
        db.delete(row)

    # Delete all related Resumes
    resume_rows = db.query(Resume).filter(Resume.user_id == user_id).all()
    for row in resume_rows:
        for candidate in (row.file_path, row.text_path):
            if not candidate:
                continue
            try:
                path = Path(candidate)
                if path.exists() and path.is_file():
                    path.unlink()
            except Exception:
                pass
        db.delete(row)

    db.delete(user)
    db.commit()
    return {"message": f"User {user.name} deleted successfully (and all their data)"}

