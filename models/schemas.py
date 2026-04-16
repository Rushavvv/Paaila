from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

from models.validation import (
    ValidationError,
    normalize_email,
    validate_name,
    validate_password,
    validate_phone_number,
)


class RegisterRequest(BaseModel):
    first_name: str
    last_name: str
    phone_number: str
    email: EmailStr
    password: str

    @field_validator("first_name")
    @classmethod
    def validate_first_name(cls, value: str) -> str:
        return validate_name(value, "First name")

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, value: str) -> str:
        return validate_name(value, "Last name")

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return validate_phone_number(value)

    @field_validator("password")
    @classmethod
    def validate_pwd(cls, value: str) -> str:
        return validate_password(value)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_register_email(cls, value: str) -> str:
        return normalize_email(value)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_login_email(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("password")
    @classmethod
    def validate_login_password(cls, value: str) -> str:
        password = str(value or "")
        if not password.strip():
            raise ValidationError("Password is required")
        return password


class UserResponse(BaseModel):
    id: int
    name: str
    first_name: str
    last_name: str
    phone_number: str
    email: str
    userType: str
    profile_image_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    token: str
    user: UserResponse
