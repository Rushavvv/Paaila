from pydantic import BaseModel, EmailStr
from typing import Optional

# User creation model
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

# User response model (what we send back)
class UserResponse(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    disabled: bool = False

# Token model
class Token(BaseModel):
    access_token: str
    token_type: str