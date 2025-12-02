#!/usr/bin/env python3
"""
Validate ground truth file for schema compliance and data integrity.

Usage:
    python scripts/validate_ground_truth.py \
        --ground-truth data/ground_truth.json \
        --data-dir data/test_images \
        --strict
"""

import json
import hashlib
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple
import argparse
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class GroundTruthValidator:
    """Validates ground truth files for production use."""
    
    def __init__(self, gt_path: Path, data_dir: Path, strict: bool = False):
        self.gt_path = gt_path
        self.data_dir = data_dir
        self.strict = strict
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def validate(self) -> bool:
        """
        Run all validation checks.
        
        Returns:
            True if valid, False otherwise
        """
        logger.info(f"Validating ground truth: {self.gt_path}")
        
        # Load ground truth
        try:
            with open(self.gt_path, 'r', encoding='utf-8') as f:
                self.gt_data = json.load(f)
        except FileNotFoundError:
            self.errors.append(f"Ground truth file not found: {self.gt_path}")
            return False
        except json.JSONDecodeError as e:
            self.errors.append(f"Invalid JSON: {e}")
            return False
        
        # Run validation checks
        self._validate_schema()
        self._validate_samples()
        self._validate_files_exist()
        self._validate_text_content()
        self._check_approval_status()
        
        # Report results
        self._print_report()
        
        # Fail on errors, warn on warnings
        if self.errors:
            return False
        
        if self.strict and self.warnings:
            logger.error("STRICT MODE: Failing due to warnings")
            return False
        
        return True
    
    def _validate_schema(self):
        """Check required top-level fields."""
        required_fields = ['version', 'samples']
        for field in required_fields:
            if field not in self.gt_data:
                self.errors.append(f"Missing required field: '{field}'")
        
        # Version check
        version = self.gt_data.get('version')
        if version != '1.0':
            self.warnings.append(f"Unexpected version: {version} (expected 1.0)")
    
    def _validate_samples(self):
        """Validate each sample entry."""
        samples = self.gt_data.get('samples', [])
        
        if not samples:
            self.errors.append("No samples found in ground truth")
            return
        
        logger.info(f"Validating {len(samples)} samples...")
        
        seen_files = set()
        for idx, sample in enumerate(samples):
            # Required fields
            if 'file' not in sample:
                self.errors.append(f"Sample {idx}: Missing 'file' field")
                continue
            
            filename = sample['file']
            
            # Duplicate check
            if filename in seen_files:
                self.errors.append(f"Sample {idx}: Duplicate file '{filename}'")
            seen_files.add(filename)
            
            # Text field
            if 'text' not in sample:
                self.errors.append(f"Sample {idx} ({filename}): Missing 'text' field")
            elif not isinstance(sample['text'], str):
                self.errors.append(f"Sample {idx} ({filename}): 'text' must be string")
            
            # Metadata validation
            self._validate_metadata(idx, filename, sample.get('metadata', {}))
    
    def _validate_metadata(self, idx: int, filename: str, metadata: Dict[str, Any]):
        """Validate sample metadata."""
        if not metadata:
            self.warnings.append(f"Sample {idx} ({filename}): Missing metadata")
            return
        
        # Check review status
        review_status = metadata.get('review_status', '').upper()
        if review_status == 'NEEDS_REVIEW':
            self.warnings.append(
                f"Sample {idx} ({filename}): Still marked NEEDS_REVIEW"
            )
        elif review_status == 'ERROR':
            self.warnings.append(
                f"Sample {idx} ({filename}): Contains error: {metadata.get('error')}"
            )
        
        # Check labeler
        labeler = metadata.get('labeler', '')
        if labeler in ['AUTO_GENERATED', 'NEEDS_MANUAL_ENTRY']:
            self.warnings.append(
                f"Sample {idx} ({filename}): Unverified labeler '{labeler}'"
            )
    
    def _validate_files_exist(self):
        """Check that all referenced files exist in data directory."""
        samples = self.gt_data.get('samples', [])
        
        for idx, sample in enumerate(samples):
            filename = sample.get('file')
            if not filename:
                continue
            
            file_path = self.data_dir / filename
            if not file_path.exists():
                self.errors.append(
                    f"Sample {idx}: File not found: {filename} "
                    f"(expected at {file_path})"
                )
    
    def _validate_text_content(self):
        """Check text content quality."""
        samples = self.gt_data.get('samples', [])
        
        for idx, sample in enumerate(samples):
            text = sample.get('text', '')
            filename = sample.get('file', f'sample_{idx}')
            
            # Empty text
            if not text.strip():
                if sample.get('metadata', {}).get('review_status') != 'ERROR':
                    self.errors.append(
                        f"Sample {idx} ({filename}): Empty ground truth text"
                    )
            
            # Suspiciously short text
            elif len(text) < 10:
                self.warnings.append(
                    f"Sample {idx} ({filename}): Very short text ({len(text)} chars)"
                )
            
            # Check for placeholder text
            placeholders = ['TODO', 'FIXME', 'XXX', 'sample text']
            if any(p.lower() in text.lower() for p in placeholders):
                self.warnings.append(
                    f"Sample {idx} ({filename}): Contains placeholder text"
                )
    
    def _check_approval_status(self):
        """Warn if ground truth is still in draft status."""
        status = self.gt_data.get('status', '').upper()
        if status == 'DRAFT':
            self.warnings.append(
                "Ground truth is marked as DRAFT - not production-ready"
            )
    
    def _print_report(self):
        """Print validation report."""
        print("\n" + "="*70)
        print("GROUND TRUTH VALIDATION REPORT")
        print("="*70)
        
        if not self.errors and not self.warnings:
            print("✅ PASSED - Ground truth is valid")
            return
        
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"   • {error}")
        
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   • {warning}")
        
        print("\n" + "="*70)
    
    def generate_checksums(self) -> Dict[str, str]:
        """Generate checksums for tamper detection."""
        checksums = {}
        
        for sample in self.gt_data.get('samples', []):
            filename = sample.get('file')
            text = sample.get('text', '')
            
            # SHA-256 of text content
            checksum = hashlib.sha256(text.encode('utf-8')).hexdigest()
            checksums[filename] = checksum
        
        return checksums
    
    def save_lockfile(self, output_path: Path):
        """Save checksums to lockfile."""
        checksums = self.generate_checksums()
        
        lockfile = {
            "version": "1.0",
            "ground_truth_file": str(self.gt_path),
            "checksums": checksums,
            "generated_at": Path(self.gt_path).stat().st_mtime
        }
        
        with open(output_path, 'w') as f:
            json.dump(lockfile, f, indent=2)
        
        logger.info(f"✅ Saved checksums to {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description="Validate ground truth file"
    )
    parser.add_argument(
        '--ground-truth',
        type=Path,
        default=Path('data/ground_truth.json'),
        help='Path to ground truth JSON file'
    )
    parser.add_argument(
        '--data-dir',
        type=Path,
        default=Path('data/test_images'),
        help='Directory containing test files'
    )
    parser.add_argument(
        '--strict',
        action='store_true',
        help='Fail on warnings (for CI/CD)'
    )
    parser.add_argument(
        '--generate-lockfile',
        action='store_true',
        help='Generate checksums lockfile'
    )
    
    args = parser.parse_args()
    
    validator = GroundTruthValidator(
        gt_path=args.ground_truth,
        data_dir=args.data_dir,
        strict=args.strict
    )
    
    is_valid = validator.validate()
    
    if args.generate_lockfile and is_valid:
        lockfile_path = args.ground_truth.parent / '.ground_truth.lock'
        validator.save_lockfile(lockfile_path)
    
    sys.exit(0 if is_valid else 1)


if __name__ == '__main__':
    main()
