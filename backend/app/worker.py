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
from app.core.logging_config import get_logger
from app.services.queue import get_queue_service
from app.services.storage import get_storage_service
from app.services.ocr import get_ocr_service
# Note: PII detection removed - was Presidio-based, now handled by SecurityUtils
from app.services.governance import GovernanceService
from app.services.vector import get_vector_service, ENABLE_VECTOR_SEARCH
from app.models.job import Job, OCRResult

logger = get_logger(__name__)

# TODO: Migrate progress print() statements to logger.info() in next sprint
# Currently keeping print() for development visibility (pipeline steps, page progress)
# Priority: Replace error/crash logging first (security/monitoring critical)

async def process_document_task(task_data: dict, db: Session):
    """
    Process a document: Download -> OCR -> Save Results -> Governance Checks
    """
    import time
    pipeline_start = time.time()
    timings = {}
    
    job_id = task_data.get("job_id")
    file_key = task_data.get("file_key")
    language = task_data.get("language", "auto")
    
    print(f"\n{'='*60}")
    print(f"⏱️  PIPELINE START: Job {job_id}")
    print(f"{'='*60}")
    
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
        step_start = time.time()
        print("📁 Step 1: Downloading file...")
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
        timings['download'] = round(time.time() - step_start, 2)
        print(f"   ✓ Download: {timings['download']}s")
        db.commit()
        
        # 2. Run OCR (with PDF handling)
        step_start = time.time()
        print(f"🔍 Step 2: Running OCR ({settings.OCR_BACKEND})...")
        
        pdf_image_paths = []  # Track temp images for cleanup
        
        try:
            ocr = get_ocr_service()
            
            # Check if file is PDF - convert to images first
            file_str = str(file_path).lower()
            is_pdf = file_str.endswith('.pdf') or job.file_type == 'application/pdf'
            
            if is_pdf:
                from app.services.ocr import convert_pdf_to_images, cleanup_temp_images
                
                # Convert PDF to images
                pdf_step_start = time.time()
                pdf_image_paths = convert_pdf_to_images(file_path, dpi=150)
                timings['pdf_convert'] = round(time.time() - pdf_step_start, 2)
                print(f"   ✓ PDF Conversion: {timings['pdf_convert']}s ({len(pdf_image_paths)} pages)")
                
                # OCR each page and merge results
                all_blocks = []
                all_text_parts = []
                total_confidence = 0.0
                total_blocks = 0
                
                for i, img_path in enumerate(pdf_image_paths):
                    print(f"   📄 Processing page {i+1}/{len(pdf_image_paths)}...")
                    page_result = await ocr.extract_text(str(img_path), language=language)
                    
                    # Adjust bounding boxes for page offset (vertical stacking)
                    page_height = 1000  # Approximate page height in pixels
                    for block in page_result.blocks:
                        block.bbox.y += i * page_height  # Offset for page
                        all_blocks.append(block)
                    
                    all_text_parts.append(page_result.full_text)
                    total_confidence += page_result.average_confidence * len(page_result.blocks)
                    total_blocks += len(page_result.blocks)
                
                # Create merged result
                from app.services.ocr import OCRResult as OCRResultData
                result = OCRResultData(
                    full_text='\n\n--- Page Break ---\n\n'.join(all_text_parts),
                    blocks=all_blocks,
                    average_confidence=total_confidence / total_blocks if total_blocks > 0 else 0.0,
                    language=language,
                    processing_time=time.time() - step_start
                )
                
                # Cleanup temp images
                cleanup_temp_images(pdf_image_paths)
                print(f"   ✓ Merged {len(pdf_image_paths)} pages, {total_blocks} text blocks")
            else:
                # Direct image OCR
                result = await ocr.extract_text(str(file_path), language=language)
                
        except Exception as e:
            # Cleanup on error
            if pdf_image_paths:
                from app.services.ocr import cleanup_temp_images
                cleanup_temp_images(pdf_image_paths)
            
            logger.error(
                "OCR processing crashed",
                exc_info=True,
                extra={"job_id": job_id, "file_key": file_key}
            )
            raise e
        
        job.progress = 60
        timings['ocr'] = round(time.time() - step_start, 2)
        print(f"   ✓ OCR: {timings['ocr']}s (Confidence: {result.average_confidence * 100:.1f}%)")
        db.commit()
        
        # 3. Governance Checks
        step_start = time.time()
        print("🛡️  Step 3: Running Governance Checks...")
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
        timings['governance'] = round(time.time() - step_start, 2)
        print(f"   ✓ Governance: {timings['governance']}s")
        
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
            print(f"Job {job_id} flagged for review (Confidence: {result.average_confidence * 100:.1f}%)")
        
        db.commit()
        print(f"Job {job_id} completed successfully!")
        
        # 5. Generate vector embedding (if enabled)
        if ENABLE_VECTOR_SEARCH:
            step_start = time.time()
            try:
                print("🧠 Step 5: Generating document embedding...")
                vector_service = get_vector_service()
                vector_service.add_document(
                    job_id=str(job.id),
                    text=result.full_text,
                    metadata={
                        "filename": job.filename,
                        "language": result.language,
                        "confidence": result.average_confidence
                    }
                )
                timings['embedding'] = round(time.time() - step_start, 2)
                print(f"   ✓ Embedding: {timings['embedding']}s")
            except Exception as e:
                print(f"   ✗ Embedding failed: {e}")
                # Don't fail the job - vector search is optional
        
        # 6. Index for full-text search (if enabled)
        ENABLE_FTS = os.getenv("ENABLE_FULLTEXT_SEARCH", "false").lower() == "true"
        if ENABLE_FTS:
            step_start = time.time()
            try:
                print("🔍 Step 6: Indexing for full-text search...")
                from app.services.search import get_fts_service
                fts_service = get_fts_service()
                fts_service.index_document(
                    db=db,
                    job_id=str(job.id),
                    full_text=result.full_text,
                    language=result.language or "en"
                )
                timings['fts'] = round(time.time() - step_start, 2)
                print(f"   ✓ FTS Index: {timings['fts']}s")
            except Exception as e:
                print(f"   ✗ FTS indexing failed: {e}")
                # Don't fail the job - FTS is optional
        
        # Print pipeline summary
        total_time = round(time.time() - pipeline_start, 2)
        print(f"\n{'='*60}")
        print(f"⏱️  PIPELINE COMPLETE: {total_time}s total")
        print(f"{'='*60}")
        print(f"   📁 Download:   {timings.get('download', 'N/A')}s")
        print(f"   🔍 OCR:        {timings.get('ocr', 'N/A')}s")
        print(f"   🛡️  Governance: {timings.get('governance', 'N/A')}s")
        if 'embedding' in timings:
            print(f"   🧠 Embedding:  {timings.get('embedding', 'N/A')}s")
        if 'fts' in timings:
            print(f"   🔍 FTS Index:  {timings.get('fts', 'N/A')}s")
        print(f"   📊 Confidence: {result.average_confidence * 100:.1f}%")
        print(f"{'='*60}\n")
        
        # Cleanup temp file if needed
        if settings.STORAGE_TYPE != "local" and 'temp_path' in locals():
            os.remove(temp_path)
            
    except Exception as e:
        # Log the full error for debugging
        logger.error(
            f"Job processing failed: {job_id}",
            exc_info=True,
            extra={"job_id": job_id, "error": str(e), "traceback": traceback.format_exc()}
        )
        
        # Update job status
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
