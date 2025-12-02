#!/usr/bin/env python3
"""
Bootstrap ground truth file from OCR output.
Human must review/correct before using in production.

Usage:
    python scripts/bootstrap_ground_truth.py \
        --data-dir data/test_images \
        --output data/ground_truth_DRAFT.json
"""

import json
import logging
import asyncio
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
import sys
import argparse
from pathlib import Path

# Add parent directory to path to allow importing app
sys.path.append(str(Path(__file__).resolve().parent.parent))

try:
    from app.services.ocr import get_ocr_service
except ImportError:
    print("ERROR: Cannot import ocr_service. Adjust PYTHONPATH or import path.")
    sys.exit(1)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def bootstrap_ground_truth(
    data_dir: Path,
    output_path: Path,
    file_patterns: List[str] = None
) -> Dict[str, Any]:
    """
    Generate initial ground truth file from OCR output.
    
    Args:
        data_dir: Directory containing test files
        output_path: Where to save ground truth JSON
        file_patterns: List of glob patterns (default: ["*.pdf", "*.png", "*.jpg"])
    
    Returns:
        Ground truth dictionary
    """
    if file_patterns is None:
        file_patterns = ["*.pdf", "*.png", "*.jpg", "*.jpeg", "*.tiff"]
    
    if not data_dir.exists():
        raise FileNotFoundError(f"Data directory not found: {data_dir}")
    
    # Collect all test files
    test_files = []
    for pattern in file_patterns:
        test_files.extend(data_dir.glob(pattern))
    
    if not test_files:
        logger.warning(f"No files found in {data_dir} matching {file_patterns}")
        return {"version": "1.0", "samples": []}
    
    logger.info(f"Found {len(test_files)} files to process")
    
    ocr_service = get_ocr_service()

    # Run OCR on each file
    samples = []
    for idx, file_path in enumerate(sorted(test_files), 1):
        logger.info(f"[{idx}/{len(test_files)}] Processing {file_path.name}...")
        
        try:
            # OCR service is async
            ocr_result = await ocr_service.extract_text(str(file_path))
            ocr_text = ocr_result.full_text
            
            sample = {
                "file": file_path.name,
                "text": ocr_text,
                "metadata": {
                    "labeler": "AUTO_GENERATED",
                    "review_status": "NEEDS_REVIEW",
                    "generated_at": datetime.now().isoformat(),
                    "source": "bootstrap_ocr",
                    "confidence": "unverified"
                }
            }
            samples.append(sample)
            logger.info(f"  ✓ Extracted {len(ocr_text)} characters")
            
        except Exception as e:
            logger.error(f"  ✗ Failed to process {file_path.name}: {e}")
            # Add placeholder for manual entry
            samples.append({
                "file": file_path.name,
                "text": "",  # Human must fill this in
                "metadata": {
                    "labeler": "NEEDS_MANUAL_ENTRY",
                    "review_status": "ERROR",
                    "error": str(e),
                    "generated_at": datetime.now().isoformat()
                }
            })
    
    # Create ground truth structure
    ground_truth = {
        "version": "1.0",
        "created_at": datetime.now().isoformat(),
        "source": "bootstrap_script",
        "status": "DRAFT",
        "instructions": (
            "REVIEW REQUIRED: This file was auto-generated from OCR output. "
            "Human must verify each sample before marking status='APPROVED'."
        ),
        "samples": samples
    }
    
    # Save to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(ground_truth, f, indent=2, ensure_ascii=False)
    
    logger.info(f"\n✅ Generated {len(samples)} samples")
    logger.info(f"📁 Saved to: {output_path}")
    logger.info(f"\n⚠️  NEXT STEPS:")
    logger.info(f"   1. Open {output_path}")
    logger.info(f"   2. Manually review/correct each 'text' field")
    logger.info(f"   3. Update metadata.labeler to your name")
    logger.info(f"   4. Change status from 'DRAFT' to 'APPROVED'")
    logger.info(f"   5. Run: python scripts/validate_ground_truth.py")
    
    return ground_truth


def main():
    parser = argparse.ArgumentParser(
        description="Bootstrap ground truth from OCR output"
    )
    parser.add_argument(
        '--data-dir',
        type=Path,
        default=Path('data/eval_sample'), # Default to our sample dir
        help='Directory containing test files'
    )
    parser.add_argument(
        '--output',
        type=Path,
        default=Path('data/ground_truth_DRAFT.json'),
        help='Output path for ground truth file'
    )
    parser.add_argument(
        '--patterns',
        nargs='+',
        default=["*.pdf", "*.png", "*.jpg"],
        help='File patterns to process (e.g., *.pdf *.png)'
    )
    
    args = parser.parse_args()
    
    try:
        asyncio.run(bootstrap_ground_truth(
            data_dir=args.data_dir,
            output_path=args.output,
            file_patterns=args.patterns
        ))
    except Exception as e:
        logger.error(f"Bootstrap failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == '__main__':
    main()
