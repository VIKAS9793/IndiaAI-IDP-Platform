"""
Background worker for processing OCR tasks
Consumes tasks from the modular queue and executes them using modular services
"""
import asyncio
import json
import traceback
import os
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.queue import get_queue_service
from app.services.storage import get_storage_service
from app.services.ocr import get_ocr_service
# Note: PII detection removed - was Presidio-based, now handled by SecurityUtils
from app.services.governance import GovernanceService
from app.models.job import Job, OCRResult


async def process_document_task(task_data: dict, db: Session):
    """
    Process a document: Download -> OCR -> Save Results -> Governance Checks
    """
    job_id = task_data.get("job_id")
    file_key = task_data.get("file_key")
    language = task_data.get("language", "auto")
    
    print(f"Processing job {job_id} for file {file_key}...")
    
    # Get job record
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        print(f"Job {job_id} not found")
        return
    
    try:
        # Update status to processing
        job.status = "processing"
        job.progress = 10
        job.started_at = datetime.now(timezone.utc)
        db.commit()
        
        # 1. Download file
        print("Downloading file...")
        storage = get_storage_service()
        
        if settings.STORAGE_TYPE == "local":
            # Optimization for local: get direct path
            file_path = storage.storage_path / file_key
        else:
            # For R2, download to temp file
            import tempfile
            
            file_content = await storage.download(file_key)
            
            # Create temp file
            fd, temp_path = tempfile.mkstemp(suffix=f".{job.file_type.split('/')[-1]}")
            with os.fdopen(fd, 'wb') as tmp:
                tmp.write(file_content)
            file_path = temp_path
            
        job.progress = 30
        db.commit()
        
        # 2. Run OCR
        print(f"Running OCR ({settings.OCR_BACKEND})...")
        try:
            ocr = get_ocr_service()
            result = await ocr.extract_text(str(file_path), language=language)
        except Exception as e:
            print(f"CRASH IN WORKER DURING OCR CALL: {e}")
            raise e
        
        job.progress = 60
        db.commit()
        
        # 3. Governance Checks
        print("Running Governance Checks...")
        # Note: Presidio PII detection removed
        # SecurityUtils provides PII masking in app/core/security_utils.py
        governance_service = GovernanceService()
        
        # Risk Assessment (without Presidio PII data)
        risk_assessment = governance_service.assess_risk(
            document_type=job.filename,
            content=result.full_text,
            pii_detected=False  # Can enhance with SecurityUtils if needed
        )
        
        # Fairness Check
        fairness_check = governance_service.validate_fairness(
            [type('obj', (object,), {'confidence': result.average_confidence})]
        )
        
        # Store Governance Results in guardrail_flags
        guardrail_data = {
            "risk_assessment": risk_assessment,
            "fairness_check": fairness_check,
            "note": "PII masking available via SecurityUtils"
        }
        job.guardrail_flags = json.dumps(guardrail_data)
        
        job.progress = 80
        db.commit()
        
        # 4. Save Results
        print("Saving results...")
        
        # Serialize bounding box data
        raw_data = {
            "blocks": [
                {
                    "text": block.text,
                    "confidence": block.confidence,
                    "bbox": {
                        "x": block.bbox.x,
                        "y": block.bbox.y,
                        "width": block.bbox.width,
                        "height": block.bbox.height
                    }
                }
                for block in result.blocks
            ],
            "language": result.language,
            "full_text": result.full_text
        }
        
        ocr_record = OCRResult(
            job_id=job.id,
            page_number=1,
            full_text=result.full_text,
            confidence=result.average_confidence,
            language=result.language,
            processing_time=result.processing_time,
            raw_data=json.dumps(raw_data)
        )
        db.add(ocr_record)
        
        # Update job completion
        job.status = "completed"
        job.progress = 100
        job.completed_at = datetime.now(timezone.utc)
        job.detected_language = result.language
        job.confidence_score = result.average_confidence
        
        # Auto-flag for review if confidence is low
        if result.average_confidence < 90.0:
            job.review_status = "needs_review"
            print(f"Job {job_id} flagged for review (Confidence: {result.average_confidence}%)")
        
        db.commit()
        print(f"Job {job_id} completed successfully!")
        
        # Cleanup temp file if needed
        if settings.STORAGE_TYPE != "local" and 'temp_path' in locals():
            os.remove(temp_path)
            
    except Exception as e:
        print(f"Error processing job {job_id}: {str(e)}")
        traceback.print_exc()
        job.status = "failed"
        job.error_message = str(e)
        db.commit()


async def run_worker():
    """Main worker loop"""
    print(f"👷 OCR Worker started (Background Task)")
    print(f"   Queue: {settings.QUEUE_TYPE}")
    print(f"   OCR: {settings.OCR_BACKEND}")
    
    queue = get_queue_service()
    
    while True:
        try:
            # Get task
            task = await queue.dequeue()
            
            if task:
                task_name = task.get("name")
                task_data = task.get("data")
                
                if task_name == "process_document":
                    # Create new DB session for each task
                    db = SessionLocal()
                    try:
                        await process_document_task(task_data, db)
                    finally:
                        db.close()
                else:
                    print(f"Unknown task: {task_name}")
            else:
                # No tasks, wait a bit
                await asyncio.sleep(1)
                
        except asyncio.CancelledError:
            print("👷 Worker shutting down...")
            break
        except Exception as e:
            print(f"Worker error: {str(e)}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    # Run the worker
    asyncio.run(run_worker())
