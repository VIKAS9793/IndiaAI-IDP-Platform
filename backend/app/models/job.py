"""
Database models for jobs and OCR results
Compatible with both SQLite (String UUID) and PostgreSQL (UUID type)
"""
from sqlalchemy import Column, String, Integer, Text, DECIMAL, DateTime, ForeignKey, Boolean, func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Job(Base):
    """Job model - represents a document processing job"""
    __tablename__ = "jobs"
    
    # Use String for UUID to support SQLite
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # File info
    filename = Column(String, nullable=False)
    file_size = Column(Integer)
    file_key = Column(String, nullable=False)  # R2 storage key
    file_type = Column(String)
    
    # Configuration
    language = Column(String, default="auto")
    ocr_engine = Column(String, default="chandra")
    
    # Status tracking
    status = Column(String, default="queued")
    # Status values: queued, processing, ocr_complete, completed, failed
    progress = Column(Integer, default=0)  # 0-100
    current_step = Column(String)
    
    # HITL Review Status
    review_status = Column(String, default="pending")  # pending, needs_review, approved, rejected
    
    # Results
    total_pages = Column(Integer)
    processed_pages = Column(Integer, default=0)
    confidence_score = Column(DECIMAL(5, 2))
    detected_language = Column(String)
    
    # Error handling
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    
    # Governance & Compliance (New fields)
    contains_pii = Column(Boolean, default=False)
    pii_types = Column(Text)  # JSON array of detected PII types
    guardrail_flags = Column(Text)  # JSON array of validation warnings
    
    # DPDP Act Compliance
    data_principal_id = Column(String(255))  # User ID or hashed identifier
    purpose_code = Column(String(50))  # Enum: KYC, VERIFICATION, etc.
    consent_verified = Column(Boolean, default=False)
    data_retention_policy = Column(DateTime(timezone=True))  # Expiry date
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    ocr_results = relationship("OCRResult", back_populates="job", cascade="all, delete-orphan")


class OCRResult(Base):
    """OCR result model - one per page"""
    __tablename__ = "ocr_results"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    
    # Text content
    full_text = Column(Text, nullable=False)
    confidence = Column(DECIMAL(5, 2))
    language = Column(String)
    
    # Metadata
    word_count = Column(Integer)
    char_count = Column(Integer)
    processing_time = Column(DECIMAL(10, 3))  # seconds
    
    # Raw OCR data (bounding boxes, coordinates, etc.)
    raw_data = Column(Text)  # JSON string containing bounding box coordinates and metadata
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    job = relationship("Job", back_populates="ocr_results")
