from pydantic import BaseModel, field_validator

from models.validation import ValidationError, SUMMARY_DOC_ID_MAX_LENGTH

class SummaryRequest(BaseModel):
    document_id: str
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