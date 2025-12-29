"""
Jobs router - Get job status and results
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.logging_config import get_logger
from app.models.job import Job, OCRResult
from app.schemas.job import JobResponse, JobResultsResponse, OCRResultResponse
from app.services.audit import AuditService
from typing import List
from uuid import UUID
import json

router = APIRouter()
logger = get_logger(__name__)


@router.get("/{job_id}", response_model=JobResponse)
def get_job_status(
    job_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get job status and progress
    
    - **job_id**: UUID of the job
    """
    # Convert UUID to string for SQLite compatibility
    job = db.query(Job).filter(Job.id == str(job_id)).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job


@router.get("/{job_id}/results", response_model=JobResultsResponse)
def get_job_results(
    job_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get complete job results including all OCR output
    
    - **job_id**: UUID of the job
    """
    # Convert UUID to string for SQLite compatibility
    job = db.query(Job).filter(Job.id == str(job_id)).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status not in ["completed", "ocr_complete"]:
        raise HTTPException(
            status_code=400,
            detail=f"Job is not complete yet. Current status: {job.status}"
        )
    
    # Audit Log
    try:
        audit_service = AuditService(db)
        audit_service.log_action(
            action_type="view_results",
            resource_type="job",
            resource_id=job_id,
            status="success",
            request=request
        )
    except Exception as e:
        logger.error(f"Audit log failed: {e}", exc_info=True, extra={"job_id": job_id})
    
    # Get all OCR results for this job
    ocr_results = db.query(OCRResult).filter(
        OCRResult.job_id == str(job_id)
    ).order_by(OCRResult.page_number).all()
    
    return JobResultsResponse(
        job=job,
        ocr_results=ocr_results
    )


@router.get("/", response_model=List[JobResponse])
def list_jobs(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    List recent jobs
    
    - **skip**: Number of jobs to skip
    - **limit**: Maximum number of jobs to return
    """
    jobs = db.query(Job).order_by(Job.created_at.desc()).offset(skip).limit(limit).all()
    return jobs


@router.get("/needs-review", response_model=List[JobResponse])
def get_jobs_needing_review(
    db: Session = Depends(get_db)
):
    """
    Get all jobs flagged for manual review
    """
    jobs = db.query(Job).filter(
        (Job.review_status == "needs_review") | 
        (Job.confidence_score < 90.0) & (Job.status == "completed")
    ).order_by(Job.created_at.desc()).all()
    return jobs


@router.patch("/{job_id}/review", response_model=JobResponse)
def submit_job_review(
    job_id: str,
    review_data: dict,  # Simplified for now, can be a schema
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Submit manual review for a job
    """
    job = db.query(Job).filter(Job.id == str(job_id)).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Update status
    action = review_data.get("action")  # approve, reject
    if action == "approve":
        job.review_status = "approved"
    elif action == "reject":
        job.review_status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # Audit Log
    try:
        audit_service = AuditService(db)
        audit_service.log_action(
            action_type="manual_review",
            resource_type="job",
            resource_id=job_id,
            status="success",
            details=json.dumps(review_data),
            request=request
        )
    except Exception as e:
        logger.error(f"Audit log failed: {e}", exc_info=True, extra={"job_id": job_id})
        
    db.commit()
    db.refresh(job)
    return job
