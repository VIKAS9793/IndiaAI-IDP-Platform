"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, UUID4
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# Job schemas
class JobCreate(BaseModel):
    """Schema for creating a new job"""
    filename: str
    file_size: int
    file_key: str
    file_type: str
    language: str = "auto"
    ocr_engine: str = "chandra"


class JobUpdate(BaseModel):
    """Schema for updating job status"""
    status: Optional[str] = None
    progress: Optional[int] = None
    current_step: Optional[str] = None
    total_pages: Optional[int] = None
    processed_pages: Optional[int] = None
    confidence_score: Optional[Decimal] = None
    detected_language: Optional[str] = None
    error_message: Optional[str] = None
    review_status: Optional[str] = None


class JobResponse(BaseModel):
    """Schema for job response"""
    id: UUID4
    filename: str
    file_size: Optional[int]
    file_key: str  # Storage key for accessing the uploaded file
    file_type: Optional[str]
    status: str
    progress: int
    current_step: Optional[str]
    total_pages: Optional[int]
    processed_pages: Optional[int]
    confidence_score: Optional[Decimal]
    detected_language: Optional[str]
    error_message: Optional[str]
    review_status: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    
    # DPDP & Governance
    data_principal_id: Optional[str] = None
    purpose_code: Optional[str] = None
    consent_verified: Optional[bool] = None
    data_retention_policy: Optional[datetime] = None
    contains_pii: Optional[bool] = None
    pii_types: Optional[str] = None
    guardrail_flags: Optional[str] = None
    
    class Config:
        from_attributes = True


# OCR Result schemas
class OCRResultCreate(BaseModel):
    """Schema for creating OCR result"""
    job_id: UUID4
    page_number: int
    full_text: str
    confidence: Optional[Decimal]
    language: Optional[str]
    word_count: Optional[int]
    char_count: Optional[int]
    processing_time: Optional[Decimal]


class OCRResultResponse(BaseModel):
    """Schema for OCR result response"""
    id: UUID4
    job_id: UUID4
    page_number: int
    full_text: str
    confidence: Optional[Decimal]
    language: Optional[str]
    word_count: Optional[int]
    char_count: Optional[int]
    processing_time: Optional[Decimal]
    raw_data: Optional[str]  # JSON string with bounding boxes
    created_at: datetime
    
    class Config:
        from_attributes = True


# Upload response
class UploadResponse(BaseModel):
    """Response after file upload"""
    job_id: UUID4
    filename: str
    status: str
    message: str


# Job results response
class JobResultsResponse(BaseModel):
    """Complete job results"""
    job: JobResponse
    ocr_results: List[OCRResultResponse]
