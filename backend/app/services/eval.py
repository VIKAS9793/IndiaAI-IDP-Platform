"""
AI Evaluation Service
Calculates accuracy metrics (CER, WER) and performance metrics (Latency) for OCR.
"""
import time
import logging
from typing import Dict, Any
from functools import wraps

logger = logging.getLogger(__name__)

def safe_compute_metrics(ground_truth: str, hypothesis: str) -> Dict[str, Any]:
    """
    Compute CER/WER with fallback for jiwer API changes.
    
    Returns:
        {"cer": float, "wer": float, "error": str | None}
    """
    try:
        import jiwer
        
        # Simple normalization
        ground_truth = ground_truth.lower().strip()
        hypothesis = hypothesis.lower().strip()
        
        cer = jiwer.cer(ground_truth, hypothesis)
        wer = jiwer.wer(ground_truth, hypothesis)
        
        return {"cer": cer, "wer": wer, "error": None}
        
    except (AttributeError, ImportError) as e:
        # Fallback for older jiwer versions or manual calculation
        logger.warning(f"jiwer API error: {e}. Falling back to manual CER.")
        
        try:
            # Simple Levenshtein-based CER fallback
            import Levenshtein
            dist = Levenshtein.distance(ground_truth, hypothesis)
            length = max(len(ground_truth), 1)
            cer = dist / length
            
            return {
                "cer": cer,
                "wer": None,  # Skip WER if jiwer fails
                "error": f"jiwer incompatible: {str(e)}"
            }
        except ImportError:
             return {"cer": None, "wer": None, "error": "jiwer and Levenshtein both failed"}
    
    except Exception as e:
        logger.error(f"Metric computation failed: {e}")
        return {"cer": None, "wer": None, "error": str(e)}

def track_latency(func):
    """Decorator to track function execution time"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        latency_ms = (end_time - start_time) * 1000
        return result, latency_ms
    return wrapper
