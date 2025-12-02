"""
Admin routes for system management and manual triggers.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional

from app.services.cleanup_service import CleanupService

router = APIRouter()

class CleanupResponse(BaseModel):
    message: str
    status: str

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.audit import AuditService

@router.post("/cleanup", response_model=CleanupResponse)
async def trigger_cleanup(
    task: str = "all",
    db: Session = Depends(get_db)
    # In production, add authentication dependency here!
    # current_user: User = Depends(get_current_admin_user)
):
    """
    Manually trigger cleanup tasks.
    
    Args:
        task: "jobs", "audit", "orphaned", or "all" (default)
    """
    try:
        audit_service = AuditService(db)
        cleanup_service = CleanupService(db, audit_service)
        
        if task == "jobs" or task == "all":
            await cleanup_service.cleanup_expired_jobs()
            
        if task == "audit" or task == "all":
            await cleanup_service.cleanup_audit_logs()
            
        if task == "orphaned" or task == "all":
            await cleanup_service.cleanup_orphaned_files()
            
        return CleanupResponse(
            message=f"Cleanup task '{task}' executed successfully.",
            status="success"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cleanup failed: {str(e)}"
        )
