from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from models.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    first_name = Column(String, nullable=False, server_default="")
    last_name = Column(String, nullable=False, server_default="")
    phone_number = Column(String, nullable=False, server_default="")
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    user_type = Column("userType", String, nullable=False, server_default="normal")
    profile_image_path = Column(String, nullable=True, server_default=None)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return (
            f"<User(id={self.id}, first_name={self.first_name}, last_name={self.last_name}, "
            f"email={self.email}, user_type={self.user_type})>"
        )
