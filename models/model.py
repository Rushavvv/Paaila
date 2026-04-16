from pydantic import BaseModel, field_validator

from models.validation import (
    ValidationError,
    SUMMARY_DOC_ID_MAX_LENGTH,
    sanitize_ai_text,
)

class ChatRequest(BaseModel):
    document_id: str
    question: str
    api_key: str | None = None  

    @field_validator("document_id")
    @classmethod
    def validate_document_id(cls, value: str) -> str:
        doc_id = str(value or "").strip()
        if not doc_id:
            raise ValidationError("document_id is required")
        if len(doc_id) > SUMMARY_DOC_ID_MAX_LENGTH:
            raise ValidationError(f"document_id must be at most {SUMMARY_DOC_ID_MAX_LENGTH} characters")
        return doc_id

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        return sanitize_ai_text(value, field_name="Question")


class ResumeAnalysisRequest(BaseModel):
    resume_id: str
    job_description: str

    @field_validator("resume_id")
    @classmethod
    def validate_resume_id(cls, value: str) -> str:
        resume_id = str(value or "").strip()
        if not resume_id:
            raise ValidationError("resume_id is required")
        if len(resume_id) > SUMMARY_DOC_ID_MAX_LENGTH:
            raise ValidationError(f"resume_id must be at most {SUMMARY_DOC_ID_MAX_LENGTH} characters")
        return resume_id

    @field_validator("job_description")
    @classmethod
    def validate_job_description(cls, value: str) -> str:
        return sanitize_ai_text(value, field_name="Job description")


class ResumeImproveRequest(BaseModel):
    resume_id: str
    job_description: str

    @field_validator("resume_id")
    @classmethod
    def validate_resume_id(cls, value: str) -> str:
        resume_id = str(value or "").strip()
        if not resume_id:
            raise ValidationError("resume_id is required")
        if len(resume_id) > SUMMARY_DOC_ID_MAX_LENGTH:
            raise ValidationError(f"resume_id must be at most {SUMMARY_DOC_ID_MAX_LENGTH} characters")
        return resume_id

    @field_validator("job_description")
    @classmethod
    def validate_job_description(cls, value: str) -> str:
        return sanitize_ai_text(value, field_name="Job description")


class ResumeSaveEditedRequest(BaseModel):
    resume_id: str
    edited_html: str

    @field_validator("resume_id")
    @classmethod
    def validate_resume_id(cls, value: str) -> str:
        resume_id = str(value or "").strip()
        if not resume_id:
            raise ValidationError("resume_id is required")
        if len(resume_id) > SUMMARY_DOC_ID_MAX_LENGTH:
            raise ValidationError(f"resume_id must be at most {SUMMARY_DOC_ID_MAX_LENGTH} characters")
        return resume_id

    @field_validator("edited_html")
    @classmethod
    def validate_edited_html(cls, value: str) -> str:
        html_value = str(value or "").strip()
        if not html_value:
            raise ValidationError("edited_html is required")
        return html_value