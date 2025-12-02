#!/usr/bin/env python3
"""
Interactive CLI for reviewing and correcting ground truth.

Usage:
    python scripts/review_ground_truth.py \
        --ground-truth data/ground_truth_DRAFT.json \
        --output data/ground_truth.json
"""

import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any
import argparse
import sys

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GroundTruthReviewer:
    """Interactive tool for reviewing ground truth samples."""
    
    def __init__(self, gt_path: Path):
        self.gt_path = gt_path
        self.changes_made = 0
        
        with open(gt_path, 'r', encoding='utf-8') as f:
            self.gt_data = json.load(f)
    
    def review_all(self, reviewer_name: str) -> bool:
        """
        Interactively review all samples.
        
        Returns:
            True if review completed, False if aborted
        """
        samples = self.gt_data.get('samples', [])
        total = len(samples)
        
        print("\n" + "="*70)
        print(f"GROUND TRUTH REVIEW - {total} samples")
        print("="*70)
        print("Commands: [a]ccept, [e]dit, [s]kip, [q]uit")
        print("="*70 + "\n")
        
        for idx, sample in enumerate(samples, 1):
            # Skip already reviewed samples
            if sample.get('metadata', {}).get('review_status') == 'APPROVED':
                continue
            
            print(f"\n📄 Sample {idx}/{total}: {sample.get('file', 'unknown')}")
            print("-" * 70)
            
            # Show current text
            text = sample.get('text', '')
            preview = text[:200] + ('...' if len(text) > 200 else '')
            print(f"Current text:\n{preview}\n")
            
            # User action
            while True:
                action = input(f"Action [a/e/s/q]: ").strip().lower()
                
                if action == 'a':
                    # Accept as-is
                    sample['metadata']['review_status'] = 'APPROVED'
                    sample['metadata']['labeler'] = reviewer_name
                    sample['metadata']['reviewed_at'] = datetime.now().isoformat()
                    self.changes_made += 1
                    print("✅ Accepted")
                    break
                
                elif action == 'e':
                    # Edit text
                    print("\nEnter corrected text (Ctrl+D when done):")
                    lines = []
                    try:
                        while True:
                            line = input()
                            lines.append(line)
                    except EOFError:
                        pass
                    
                    new_text = '\n'.join(lines)
                    sample['text'] = new_text
                    sample['metadata']['review_status'] = 'APPROVED'
                    sample['metadata']['labeler'] = reviewer_name
                    sample['metadata']['reviewed_at'] = datetime.now().isoformat()
                    sample['metadata']['edited'] = True
                    self.changes_made += 1
                    print("✅ Updated")
                    break
                
                elif action == 's':
                    # Skip for now
                    print("⏭️  Skipped")
                    break
                
                elif action == 'q':
                    # Quit review
                    print("\n⚠️  Review aborted")
                    return False
                
                else:
                    print("Invalid command. Use a/e/s/q")
        
        print(f"\n✅ Review completed: {self.changes_made} changes made")
        return True
    
    def save(self, output_path: Path):
        """Save reviewed ground truth."""
        # Update top-level status if all samples approved
        all_approved = all(
            s.get('metadata', {}).get('review_status') == 'APPROVED'
            for s in self.gt_data.get('samples', [])
        )
        
        if all_approved:
            self.gt_data['status'] = 'APPROVED'
            self.gt_data['approved_at'] = datetime.now().isoformat()
        
        # Save
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.gt_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"💾 Saved to {output_path}")
        
        if all_approved:
            logger.info("✅ All samples approved - ready for production")


def main():
    parser = argparse.ArgumentParser(
        description="Interactively review ground truth"
    )
    parser.add_argument(
        '--ground-truth',
        type=Path,
        required=True,
        help='Path to draft ground truth file'
    )
    parser.add_argument(
        '--output',
        type=Path,
        required=True,
        help='Path to save reviewed ground truth'
    )
    parser.add_argument(
        '--reviewer',
        type=str,
        default='human_reviewer',
        help='Reviewer name for metadata'
    )
    
    args = parser.parse_args()
    
    if not args.ground_truth.exists():
        logger.error(f"Ground truth file not found: {args.ground_truth}")
        sys.exit(1)
    
    reviewer = GroundTruthReviewer(args.ground_truth)
    completed = reviewer.review_all(args.reviewer)
    
    if completed:
        reviewer.save(args.output)
    else:
        logger.warning("Review incomplete - not saving")
        sys.exit(1)


if __name__ == '__main__':
    main()
