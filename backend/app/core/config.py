"""
Configuration settings for the application
Supports modular database backend: SQLite (dev/MVP) or PostgreSQL (production)
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings"""
    
    # App
    APP_NAME: str = "IndiaAI IDP Platform"
    APP_VERSION: str = "3.0.0"
    DEBUG: bool = Field(default=False, description="Debug mode - set via DEBUG env var")
    
    # API
    API_V1_PREFIX: str = "/api"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:4173",  # Vite preview server
    ]
    
    # Database Configuration (Modular - supports SQLite and PostgreSQL)
    DATABASE_TYPE: str = "sqlite"  # "sqlite" for local dev, "postgresql" for production
    
    # SQLite (default for MVP/local development)
    SQLITE_DB_PATH: str = "./data/indiaai.db"
    
    # PostgreSQL (optional, for production scaling)
    DATABASE_URL: Optional[str] = None  # Only needed if DATABASE_TYPE="postgresql"
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    
    # Storage (Modular - local filesystem or Cloudflare R2)
    STORAGE_TYPE: str = "local"  # "local" for dev, "r2" for production
    
    # Local storage (default for MVP)
    LOCAL_STORAGE_PATH: str = "./data/uploads"
    
    # Cloudflare R2 (optional, for production)
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: str = "indiaai-documents"
    
    # Queue (Modular - in-memory or Redis)
    QUEUE_TYPE: str = "memory"  # "memory" for dev, "redis" for production
    
    # Redis (optional, for production)
    REDIS_URL: Optional[str] = None
    
    # File upload limits
    MAX_FILE_SIZE: int = 25 * 1024 * 1024  # 25MB
    ALLOWED_FILE_TYPES: list = ["application/pdf", "image/png", "image/jpeg", "image/tiff"]
    SAFE_EXTENSIONS: set = {"pdf", "png", "jpg", "jpeg", "tiff", "tif"}  # Whitelist for security
    
    # OCR Configuration (Modular backend)
    OCR_BACKEND: str = "paddle"  # "paddle" (fast, CPU) or "easyocr" (accurate, slower)
    
    # Processing
    DEFAULT_OCR_ENGINE: str = "chandra"
    DEFAULT_LANGUAGE: str = "auto"
    
    # Modal.com (for ML models)
    MODAL_TOKEN_ID: Optional[str] = None
    MODAL_TOKEN_SECRET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def base_dir(self) -> Path:
        """Get absolute path to backend directory"""
        return Path(__file__).resolve().parent.parent.parent

    @property
    def database_url(self) -> str:
        """Get database URL based on DATABASE_TYPE"""
        if self.DATABASE_TYPE == "sqlite":
            # Ensure data directory exists
            # Use absolute path relative to backend root
            db_path = self.base_dir / "data" / "indiaai.db"
            db_path.parent.mkdir(parents=True, exist_ok=True)
            return f"sqlite:///{db_path}"
        elif self.DATABASE_TYPE == "postgresql":
            if not self.DATABASE_URL:
                raise ValueError("DATABASE_URL required when DATABASE_TYPE=postgresql")
            return self.DATABASE_URL
        else:
            raise ValueError(f"Invalid DATABASE_TYPE: {self.DATABASE_TYPE}")
    
    @property
    def r2_endpoint_url(self) -> str:
        """Construct R2 endpoint URL"""
        if self.STORAGE_TYPE == "r2" and self.R2_ACCOUNT_ID:
            return f"https://{self.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        return ""
    
    @property
    def storage_path(self) -> Path:
        """Get local storage path"""
        # Use absolute path relative to backend root
        path = self.base_dir / "data" / "uploads"
        path.mkdir(parents=True, exist_ok=True)
        return path


# Global settings instance
settings = Settings()
