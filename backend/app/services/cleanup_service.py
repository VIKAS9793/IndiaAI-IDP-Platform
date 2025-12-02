"""
Cleanup Service for managing data retention and compliance.
Handles deletion of expired jobs, files, and audit logs.
"""
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import select, delete

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.job import Job
from app.models.audit_log import AuditLog
from app.services.storage import StorageService
from app.services.audit import AuditService

logger = logging.getLogger(__name__)

class CleanupService:
    """
    Service to handle data cleanup and retention policies.
    Enforces Cert-IN and DPDP Act compliance.
    """
    
    # Retention Periods (in days)
    RETENTION_SYSTEM_TEST = 1      # 24 hours
    RETENTION_DEFAULT = 30         # 30 days
    RETENTION_AUDIT_LOGS = 365     # 1 year (Mandatory)
    RETENTION_ORPHANED = 1         # 24 hours
    
    def __init__(self, db: Session, audit_service: AuditService):
        self.db = db
        self.audit_service = audit_service
        self.retention_policies = {
            "System Testing": self.RETENTION_SYSTEM_TEST * 24, # hours
            "General": self.RETENTION_DEFAULT * 24,            # hours
            "Financial": 365 * 24,                             # hours
            "Legal": 7 * 365 * 24,                             # hours
            "Medical": 10 * 365 * 24                           # hours
        }

    async def cleanup_expired_jobs(self):
        """
        Delete jobs and associated files that have exceeded their retention period.
        Returns: (deleted_count, failed_count)
        """
        logger.info("Starting cleanup of expired jobs...")
        deleted_count = 0
        failed_count = 0
        failed_files = []
        errors = []
        
        try:
            # 1. Calculate thresholds
            now = datetime.now(timezone.utc)
            
            # 2. Find expired jobs
            # We fetch all jobs and filter in python for complex purpose-based logic
            # Or we can construct a complex query. For now, let's use the query approach for efficiency.
            
            # Base query
            stmt = select(Job)
            all_jobs = self.db.execute(stmt).scalars().all()
            
            expired_jobs = []
            for job in all_jobs:
                # Default to General if purpose not found
                retention_hours = self.retention_policies.get(job.purpose_code, self.RETENTION_DEFAULT * 24)
                
                created_at = job.created_at
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                    
                age_hours = (now - created_at).total_seconds() / 3600
                
                if age_hours > retention_hours:
                    expired_jobs.append(job)
            
            logger.info(f"Found {len(expired_jobs)} expired jobs to clean up.")
            
            for job in expired_jobs:
                try:
                    await self._delete_job(job)
                    deleted_count += 1
                except Exception as e:
                    failed_count += 1
                    failed_files.append(job.file_key)
                    errors.append(str(e))
                
            self.db.commit()
            
            # Log summary audit
            self.audit_service.log_action(
                user_ip="system",
                action_type="cleanup_expired_jobs",
                resource_type="system",
                details={
                    "deleted_count": deleted_count,
                    "failed_count": failed_count,
                    "failed_files": failed_files[:10], # Limit size
                    "errors": errors[:10]
                },
                status="success" if failed_count == 0 else "warning"
            )
            
            logger.info(f"Expired job cleanup completed. Deleted: {deleted_count}, Failed: {failed_count}")
            return deleted_count, failed_count
            
        except Exception as e:
            logger.error(f"Error during job cleanup: {e}")
            self.db.rollback()
            return deleted_count, failed_count

    async def _delete_job(self, job: Job):
        """Helper to delete a single job and its file."""
        # 1. Delete file from storage (Data Minimization)
        if job.file_key:
            try:
                # Extract filename from path if needed, or pass full path
                # StorageService expects filename usually, checking implementation...
                # Assuming file_key stores the relative path/filename
                filename = os.path.basename(job.file_key)
                
                # Get storage service instance
                from app.services.storage import get_storage_service
                storage = get_storage_service()
                
                await storage.delete(filename)
                logger.info(f"Deleted file for job {job.id}: {filename}")
            except Exception as e:
                logger.warning(f"Failed to delete file {job.file_key}: {e}")
                # We continue to delete the DB record even if file delete fails?
                # ADR says: "If file deletion fails, DB record remains (orphan) -> Mitigation: Retry logic"
                # So we should probably RAISE here to prevent DB deletion if file deletion fails, 
                # OR we log it and proceed if we want to clean up DB. 
                # The ADR says "Retry logic + manual cleanup script". 
                # Let's raise for now to be safe and keep DB record as pointer.
                raise e

        # 2. Delete job record from DB
        self.db.delete(job)

    async def cleanup_audit_logs(self):
        """
        Archive/Delete audit logs older than 1 year.
        Complies with Cert-IN and DPDP Act requirements.
        """
        logger.info("Starting cleanup of old audit logs...")
        try:
            now = datetime.now(timezone.utc)
            threshold = now - timedelta(days=self.RETENTION_AUDIT_LOGS)
            
            # Count logs to be deleted
            stmt = select(AuditLog).where(AuditLog.timestamp < threshold)
            logs_to_delete = self.db.execute(stmt).scalars().all()
            count = len(logs_to_delete)
            
            if count > 0:
                # Bulk delete
                delete_stmt = delete(AuditLog).where(AuditLog.timestamp < threshold)
                self.db.execute(delete_stmt)
                self.db.commit()
                logger.info(f"Deleted {count} audit logs older than {self.RETENTION_AUDIT_LOGS} days.")
            else:
                logger.info("No expired audit logs found.")
                
        except Exception as e:
            logger.error(f"Error during audit log cleanup: {e}")
            self.db.rollback()

    async def cleanup_orphaned_files(self):
        """
        Delete files in storage that have no corresponding DB record.
        """
        logger.info("Starting cleanup of orphaned files...")
        try:
            # 1. List all files in storage
            if settings.STORAGE_TYPE == "local":
                upload_dir = settings.storage_path # Use correct property
                if not os.path.exists(upload_dir):
                    return

                files = os.listdir(upload_dir)
                for filename in files:
                    file_path = os.path.join(upload_dir, filename)
                    
                    # Check age
                    stat = os.stat(file_path)
                    file_age = datetime.now().timestamp() - stat.st_mtime
                    if file_age < (self.RETENTION_ORPHANED * 86400):
                        continue # Skip young files
                        
                    # Check DB
                    stmt = select(Job).where(Job.file_key.contains(filename))
                    job = self.db.execute(stmt).scalars().first()
                    
                    if not job:
                        # Orphaned
                        try:
                            os.remove(file_path)
                            logger.info(f"Deleted orphaned file: {filename}")
                        except Exception as e:
                            logger.error(f"Failed to delete orphaned file {filename}: {e}")
            
        except Exception as e:
            logger.error(f"Error during orphaned file cleanup: {e}")

# Wrapper functions for Scheduler
async def run_cleanup_jobs():
    """Wrapper to run job cleanup with fresh DB session."""
    db = SessionLocal()
    try:
        audit_service = AuditService(db)
        service = CleanupService(db, audit_service)
        await service.cleanup_expired_jobs()
    finally:
        db.close()

async def run_cleanup_audit():
    """Wrapper to run audit log cleanup with fresh DB session."""
    db = SessionLocal()
    try:
        audit_service = AuditService(db)
        service = CleanupService(db, audit_service)
        await service.cleanup_audit_logs()
    finally:
        db.close()

async def run_cleanup_orphaned():
    """Wrapper to run orphaned file cleanup with fresh DB session."""
    db = SessionLocal()
    try:
        audit_service = AuditService(db)
        service = CleanupService(db, audit_service)
        await service.cleanup_orphaned_files()
    finally:
        db.close()
