"""
Database configuration and session management
Supports modular backends: SQLite (local) or PostgreSQL (production)
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create SQLAlchemy engine with modular database URL
engine_kwargs = {
    "pool_pre_ping": True,
}

# SQLite-specific configuration
if settings.DATABASE_TYPE == "sqlite":
    engine_kwargs.update({
        "connect_args": {"check_same_thread": False},  # Required for SQLite
    })
else:  # PostgreSQL
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_engine(
    settings.database_url,  # Uses property that returns correct URL
    **engine_kwargs
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency to get database session
    Usage in FastAPI:
        def route(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
