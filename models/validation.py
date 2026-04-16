import html
import io
import re
from typing import Optional

from PyPDF2 import PdfReader

NAME_MIN_LENGTH = 2
NAME_MAX_LENGTH = 50
PASSWORD_MIN_LENGTH = 8
PHONE_MIN_LENGTH = 7
PHONE_MAX_LENGTH = 15
SEARCH_MAX_LENGTH = 120
AI_INPUT_MAX_LENGTH = 4000
SUMMARY_DOC_ID_MAX_LENGTH = 120
RESUME_EDITED_HTML_MAX_LENGTH = 2_000_000
PDF_MAX_SIZE_BYTES = 10 * 1024 * 1024
PROFILE_IMAGE_MAX_SIZE_BYTES = 2 * 1024 * 1024

NAME_RE = re.compile(r"^[A-Za-z]+(?:-[A-Za-z]+)*$")
EMAIL_SPLIT_RE = re.compile(r"\s+")
PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$")
PHONE_RE = re.compile(r"^\d+$")
ALNUM_RE = re.compile(r"[A-Za-z0-9]")
CONTROL_CHAR_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")


class ValidationError(ValueError):
    pass


def normalize_email(value: str) -> str:
    email = EMAIL_SPLIT_RE.sub("", str(value or "")).strip().lower()
    return email


def validate_name(value: str, field_name: str) -> str:
    name = str(value or "").strip()
    if not name:
        raise ValidationError(f"{field_name} is required")
    if len(name) < NAME_MIN_LENGTH or len(name) > NAME_MAX_LENGTH:
        raise ValidationError(
            f"{field_name} must be between {NAME_MIN_LENGTH} and {NAME_MAX_LENGTH} characters"
        )
    if not NAME_RE.fullmatch(name):
        raise ValidationError(f"{field_name} can only contain letters and hyphens")
    return name


def validate_password(value: str) -> str:
    password = str(value or "")
    if len(password) < PASSWORD_MIN_LENGTH:
        raise ValidationError(f"Password must be at least {PASSWORD_MIN_LENGTH} characters long")
    if not PASSWORD_RE.match(password):
        raise ValidationError(
            "Password must contain at least one uppercase letter, one lowercase letter, and one number"
        )
    return password


def validate_phone_number(value: str) -> str:
    phone = str(value or "").strip()
    if not phone:
        raise ValidationError("Phone number is required")
    if not PHONE_RE.fullmatch(phone):
        raise ValidationError("Phone number must contain digits only")
    if len(phone) < PHONE_MIN_LENGTH or len(phone) > PHONE_MAX_LENGTH:
        raise ValidationError(
            f"Phone number must be between {PHONE_MIN_LENGTH} and {PHONE_MAX_LENGTH} digits"
        )
    return phone


def sanitize_search_input(value: str) -> str:
    query = str(value or "").strip()
    if not query:
        return ""
    if len(query) > SEARCH_MAX_LENGTH:
        raise ValidationError(f"Search query must be at most {SEARCH_MAX_LENGTH} characters")
    if not ALNUM_RE.search(query):
        raise ValidationError("Search query must include letters or numbers")
    return html.escape(query, quote=False)


def sanitize_ai_text(value: str, field_name: str = "Input", max_length: int = AI_INPUT_MAX_LENGTH) -> str:
    text = str(value or "").strip()
    text = CONTROL_CHAR_RE.sub("", text)
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        raise ValidationError(f"{field_name} is required")
    if len(text) > max_length:
        raise ValidationError(f"{field_name} must be at most {max_length} characters")
    return html.escape(text, quote=False)


def _is_pdf_content(file_bytes: bytes) -> bool:
    if not file_bytes.startswith(b"%PDF"):
        return False
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        return len(reader.pages) > 0
    except Exception:
        return False


def validate_pdf_upload(
    filename: Optional[str],
    content_type: Optional[str],
    file_bytes: bytes,
    max_size_bytes: int = PDF_MAX_SIZE_BYTES,
) -> str:
    raw_filename = str(filename or "").strip()
    if not raw_filename:
        raise ValidationError("File name is required")

    if len(file_bytes) == 0:
        raise ValidationError("Uploaded file is empty")

    if len(file_bytes) > max_size_bytes:
        raise ValidationError(f"PDF file size must be <= {max_size_bytes // (1024 * 1024)} MB")

    suffix = raw_filename.rsplit(".", 1)
    extension = f".{suffix[1].lower()}" if len(suffix) == 2 else ""
    if extension != ".pdf":
        raise ValidationError("Only PDF files are supported")

    allowed_mime = {"application/pdf", "application/x-pdf", "application/octet-stream"}
    if content_type and content_type.lower() not in allowed_mime:
        raise ValidationError("Invalid PDF MIME type")

    if not _is_pdf_content(file_bytes):
        raise ValidationError("Invalid PDF")

    return extension


def validate_profile_image_upload(
    filename: Optional[str],
    content_type: Optional[str],
    file_bytes: bytes,
    max_size_bytes: int = PROFILE_IMAGE_MAX_SIZE_BYTES,
) -> str:
    raw_filename = str(filename or "").strip()
    if not raw_filename:
        raise ValidationError("Image file name is required")

    if len(file_bytes) == 0:
        raise ValidationError("Uploaded image is empty")

    if len(file_bytes) > max_size_bytes:
        raise ValidationError(f"Image file size must be <= {max_size_bytes // (1024 * 1024)} MB")

    suffix = raw_filename.rsplit(".", 1)
    extension = f".{suffix[1].lower()}" if len(suffix) == 2 else ""
    if extension not in {".jpg", ".jpeg", ".png"}:
        raise ValidationError("Only JPG and PNG images are supported")

    allowed_mime = {"image/jpeg", "image/png", "image/jpg", "application/octet-stream"}
    if content_type and content_type.lower() not in allowed_mime:
        raise ValidationError("Invalid image MIME type")

    is_jpeg = file_bytes.startswith(b"\xff\xd8\xff")
    is_png = file_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    if extension in {".jpg", ".jpeg"} and not is_jpeg:
        raise ValidationError("Image content does not match JPG extension")
    if extension == ".png" and not is_png:
        raise ValidationError("Image content does not match PNG extension")

    return ".jpg" if extension == ".jpeg" else extension
