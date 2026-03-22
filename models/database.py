from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
import os

# PostgreSQL connection string
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres123@localhost:5432/Paaila")

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,
    echo=False
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()

def get_db():
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all database tables and apply lightweight schema updates."""
    Base.metadata.create_all(bind=engine)

    # Backfill for existing deployments that already have a users table.
    with engine.begin() as conn:
        conn.execute(
            text(
                'ALTER TABLE users ADD COLUMN IF NOT EXISTS "userType" VARCHAR(20) NOT NULL DEFAULT \''
                'normal\''
            )
        )
