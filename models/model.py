from pydantic import BaseModel

class ChatRequest(BaseModel):
    document_id: str
    question: str
    api_key: str | None = None  


class ResumeAnalysisRequest(BaseModel):
    resume_id: str
    job_description: str
