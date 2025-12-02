import asyncio
import json
import os
import argparse
import logging
import time
from pathlib import Path
from collections import defaultdict
from app.services.ocr import get_ocr_service, validate_file_input, OCRServiceError
from app.services.eval import safe_compute_metrics

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def evaluate_dataset(dataset_dir: str, gt_file_path: str, output_file: str):
    """
    Run evaluation on a dataset directory with robust error handling and observability.
    """
    dataset_path = Path(dataset_dir)
    gt_file = Path(gt_file_path)
    
    if not gt_file.exists():
        logger.error(f"❌ Ground truth file not found at {gt_file}")
        return

    with open(gt_file, "r", encoding="utf-8") as f:
        gt_data = json.load(f)
        
    # Support both new schema (list of samples) and old schema (dict)
    if "samples" in gt_data:
        # New schema: Convert list to dict for easy lookup
        ground_truth = {s["file"]: s["text"] for s in gt_data["samples"]}
    else:
        # Old schema (or simple dict)
        ground_truth = gt_data

    ocr_service = get_ocr_service()
    
    results = []
    stats = defaultdict(int)
    total_cer = 0.0
    total_wer = 0.0
    total_latency = 0.0
    
    logger.info(f"🚀 Starting evaluation on {len(ground_truth)} images...")

    for idx, (filename, expected_text) in enumerate(ground_truth.items(), 1):
        image_path = dataset_path / filename
        logger.info(f"[{idx}/{len(ground_truth)}] Processing: {filename}")
        
        start_time = time.time()
        
        try:
            # 1. Validate Input
            validated_path = validate_file_input(image_path)
            
            # 2. Run OCR
            ocr_result = await ocr_service.extract_text(str(validated_path))
            extracted_text = ocr_result.full_text
            
            latency_ms = (time.time() - start_time) * 1000
            
            # 3. Compute Metrics (Safe)
            metrics = safe_compute_metrics(expected_text, extracted_text)
            
            if metrics["error"]:
                logger.warning(f"Metric computation warning for {filename}: {metrics['error']}")
            
            # Record Result
            result_entry = {
                "filename": filename,
                "expected": expected_text,
                "extracted": extracted_text,
                "metrics": metrics,
                "latency_ms": latency_ms,
                "status": "success" if not metrics["error"] else "partial_success"
            }
            results.append(result_entry)
            
            # Update Stats
            if metrics["cer"] is not None:
                total_cer += metrics["cer"]
                stats["cer_count"] += 1
            if metrics["wer"] is not None:
                total_wer += metrics["wer"]
                stats["wer_count"] += 1
                
            total_latency += latency_ms
            stats["success"] += 1
            
            logger.info(f" ✓ Done. CER: {metrics['cer']:.2f}, Latency: {latency_ms:.0f}ms")
            
            # Inspect High Error Cases
            if metrics['cer'] > 0.5:
                logger.warning(f"⚠️ HIGH ERROR on {filename}:")
                logger.warning(f"  Ground Truth (First 100): {expected_text[:100]}...")
                logger.warning(f"  OCR Output   (First 100): {extracted_text[:100]}...")
                logger.warning(f"  CER: {metrics['cer']:.2f}, WER: {metrics['wer']:.2f}")

        except OCRServiceError as e:
            logger.error(f"Validation failed for {filename}: {e}")
            results.append({
                "filename": filename,
                "status": "validation_error",
                "error": str(e)
            })
            stats["failed"] += 1
            
        except Exception as e:
            logger.error(f"Unexpected failure on {filename}: {e}", exc_info=True)
            results.append({
                "filename": filename,
                "status": "failed",
                "error": str(e)
            })
            stats["failed"] += 1

    # Aggregate Report
    success_count = stats["success"]
    avg_cer = total_cer / stats["cer_count"] if stats["cer_count"] > 0 else 1.0
    avg_wer = total_wer / stats["wer_count"] if stats["wer_count"] > 0 else 1.0
    avg_latency = total_latency / success_count if success_count > 0 else 0.0
    
    report = {
        "summary": {
            "total_images": len(ground_truth),
            "processed_successfully": success_count,
            "failed": stats["failed"],
            "average_cer": avg_cer,
            "average_wer": avg_wer,
            "average_latency_ms": avg_latency,
            "accuracy_score": 1 - avg_cer
        },
        "details": results
    }
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        
    logger.info("\n📊 Evaluation Complete!")
    logger.info(f"Success: {success_count}/{len(ground_truth)}")
    logger.info(f"Average CER: {avg_cer:.4f}")
    logger.info(f"Avg Latency: {avg_latency:.2f} ms")
    logger.info(f"Report saved to {output_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run OCR Evaluation")
    parser.add_argument("--dataset", required=True, help="Path to dataset directory (images)")
    parser.add_argument("--ground-truth", help="Path to ground truth JSON file (optional, defaults to dataset/ground_truth.json)")
    parser.add_argument("--output", default="eval_report.json", help="Output JSON report file")
    
    args = parser.parse_args()
    
    # Determine ground truth path
    dataset_path = Path(args.dataset)
    if args.ground_truth:
        gt_path = Path(args.ground_truth)
    else:
        gt_path = dataset_path / "ground_truth.json"

    asyncio.run(evaluate_dataset(str(dataset_path), str(gt_path), args.output))
