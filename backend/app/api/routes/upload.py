"""
File upload router
Uses modular storage service (local or R2)
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.job import Job
from app.schemas.job import UploadResponse
from app.services.storage import get_storage_service
from app.services.queue import get_queue_service
from app.services.audit import AuditService
from fastapi import Request, Form
from datetime import datetime, timedelta, timezone
import uuid

router = APIRouter()


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    language: str = Form("auto", description="Language for OCR"),
    ocr_engine: str = Form("chandra", description="OCR engine to use"),
    purpose: str = Form(..., description="Purpose of processing (DPDP Act)"),
    consent: str = Form(..., description="User consent verified (true/false)"),
    db: Session = Depends(get_db)
):
    """
    Upload a document for processing
    
    - **file**: PDF, PNG, JPEG, or TIFF file
    - **language**: Language for OCR (default: auto-detect)
    - **ocr_engine**: OCR engine to use (chandra, deepseek, paddle)
    
    Uses modular storage and queue backends configured via environment
    """
    
    # Validate file type
    if file.content_type not in settings.ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type {file.content_type} not allowed. Supported: PDF, PNG, JPEG, TIFF"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Validate file size
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size {file_size} bytes exceeds maximum {settings.MAX_FILE_SIZE} bytes (25MB)"
        )
    
    # Validate and extract file extension securely
    file_extension = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if not file_extension or file_extension not in settings.SAFE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '{file_extension}'. Allowed: {', '.join(sorted(settings.SAFE_EXTENSIONS))}"
        )
    
    # Generate secure file key for storage
    file_key = f"{uuid.uuid4()}.{file_extension}"
    
    # Upload to storage (modular: local or R2)
    storage_service = get_storage_service()
    try:
        storage_url = await storage_service.upload(file_key, file_content, file.content_type)
    except Exception as e:
        # TODO: Replace with logger once logging is implemented
        raise HTTPException(
            status_code=500,
            detail="Failed to upload file. Please contact support."
        )
    
    # Convert consent to boolean
    consent_bool = str(consent).lower() == 'true'

    # Create job record
    job = Job(
        filename=file.filename,
        file_size=file_size,
        file_key=file_key,
        file_type=file.content_type,
        language=language,
        ocr_engine=ocr_engine,
        status="queued",
        progress=0,
        # DPDP Compliance
        purpose_code=purpose,
        consent_verified=consent_bool,
        data_retention_policy=datetime.now(timezone.utc) + timedelta(days=30)  # Default 30 days retention
    )
    
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Enqueue processing task (modular: in-memory or Redis)
    queue_service = get_queue_service()
    try:
        task_id = await queue_service.enqueue(
            task_name="process_document",
            task_data={
                "job_id": str(job.id),
                "file_key": file_key,
                "language": language,
                "ocr_engine": ocr_engine
            }
        )
    except Exception as e:
        # Job created but queue failed - still return success
        # Worker can pick up from database
        pass
    
    # Audit Log
    try:
        audit_service = AuditService(db)
        audit_service.log_action(
            action_type="upload",
            resource_type="job",
            resource_id=str(job.id),
            details={
                "filename": job.filename,
                "file_size": job.file_size,
                "file_type": job.file_type,
                "language": language,
                "ocr_engine": ocr_engine,
                "purpose": purpose,
                "consent": consent_bool
            },
            request=request
        )
    except Exception as e:
        print(f"Audit log failed: {e}")
        db.rollback()

    return UploadResponse(
        job_id=job.id,
        filename=job.filename,
        status=job.status,
        message=f"Document uploaded successfully. Processing will begin shortly. (Storage: {settings.STORAGE_TYPE}, Queue: {settings.QUEUE_TYPE})"
    )
