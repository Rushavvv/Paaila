from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

# PostgreSQL connection string
DATABASE_URL = "postgresql://username:password@localhost:5432/paaila_db"

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
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)
