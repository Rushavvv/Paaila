from pydantic import BaseModel

class ChatRequest(BaseModel):
    document_id: str
    question: str
    api_key: str | None = None  
