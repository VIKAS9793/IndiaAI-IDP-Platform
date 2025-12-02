# RUNBOOK: Ground Truth Operations
**IndiaAI IDP Platform - Evaluation System**

**Owner**: ML/AI Engineering Team  
**Last Updated**: 2025-11-30  
**Oncall**: @ml-team

---

## Table of Contents
1. [Overview](#overview)
2. [Common Operations](#common-operations)
3. [Failure Modes](#failure-modes)
4. [Rollback Procedures](#rollback-procedures)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Emergency Contacts](#emergency-contacts)

---

## Overview

### What is Ground Truth?
Ground truth is the **authoritative reference text** used to evaluate OCR accuracy. Each test file has a corresponding ground truth entry that represents the "correct" extracted text.

### System Components
- **Ground Truth File**: `data/ground_truth.json` (version-controlled)
- **Lockfile**: `data/.ground_truth.lock` (checksums for tamper detection)
- **Schema**: `data/ground_truth.schema.json` (validation rules)
- **Scripts**:
  - `scripts/bootstrap_ground_truth.py` - Generate draft
  - `scripts/validate_ground_truth.py` - Validate & verify
  - `scripts/review_ground_truth.py` - Human review
  - `evaluate_ocr.py` - Run evaluation

### Key Metrics
- **CER (Character Error Rate)**: Lower is better (target: <5%)
- **WER (Word Error Rate)**: Lower is better (target: <10%)
- **Success Rate**: Percentage of files that complete (target: >95%)

---

## Common Operations

### OP-001: Add New Test Files

**When**: New document types added to system, expanding test coverage

**Steps**:
```bash
# 1. Add files to test directory
cp /path/to/new_invoice.pdf data/test_images/

# 2. Generate draft ground truth for new file
python scripts/bootstrap_ground_truth.py \
    --data-dir data/test_images \
    --output data/ground_truth_NEW.json

# 3. Extract only the new entries
# (Manually copy new sample from ground_truth_NEW.json to ground_truth.json)

# 4. Review the new entry
python scripts/review_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --output data/ground_truth.json \
    --reviewer $(whoami)

# 5. Validate
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --data-dir data/test_images \
    --generate-lockfile

# 6. Commit changes
git add data/ground_truth.json data/.ground_truth.lock data/test_images/
git commit -m "test: add new_invoice.pdf to evaluation set"
```

**Expected Duration**: 15-30 minutes per file

**Verification**:
```bash
# Run evaluation on new file only
python evaluate_ocr.py \
    --ground-truth data/ground_truth.json \
    --data-dir data/test_images \
    --output results/eval_new_file.json

# Check that CER is reasonable (<10%)
cat results/eval_new_file.json | jq '.per_file_results[] | select(.file=="new_invoice.pdf")'
```

---

### OP-002: Correct Ground Truth Error

**When**: OCR evaluation reveals incorrect ground truth (human labeling error)

**Steps**:
```bash
# 1. Create feature branch
git checkout -b fix/ground-truth-invoice-001

# 2. Edit ground truth file
# - Open data/ground_truth.json
# - Find the entry for the problematic file
# - Correct the 'text' field
# - Update metadata.notes with explanation
# - Increment version if major change

# 3. Validate changes
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --data-dir data/test_images \
    --strict

# 4. Regenerate lockfile
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --generate-lockfile

# 5. Re-run evaluation to verify fix
python evaluate_ocr.py \
    --ground-truth data/ground_truth.json \
    --output results/eval_$(date +%Y%m%d).json

# 6. Commit and push
git add data/ground_truth.json data/.ground_truth.lock
git commit -m "fix: correct ground truth for invoice_001.pdf (date format error)"
git push origin fix/ground-truth-invoice-001

# 7. Create PR with before/after CER comparison
```

**Expected Duration**: 10-20 minutes

**Verification**:
- PR must show improved CER for corrected file
- Validation must pass in CI

---

### OP-003: Run Full Evaluation

**When**: Weekly evaluation, pre-release validation, OCR model change

**Steps**:
```bash
# 1. Ensure ground truth is up-to-date
git pull origin main
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --strict

# 2. Run evaluation
python evaluate_ocr.py \
    --ground-truth data/ground_truth.json \
    --data-dir data/test_images \
    --output results/eval_$(date +%Y%m%d_%H%M%S).json

# 3. Review results
cat results/eval_*.json | jq '.aggregate'

# 4. Check for regressions
# Compare current CER to previous evaluation
# Alert if mean CER increased by >10%
```

**Expected Duration**: 10-30 minutes (depends on dataset size)

**Success Criteria**:
- Success rate ≥ 95%
- Mean CER ≤ 5%
- p95 Latency ≤ 25s per file

---

### OP-004: Bootstrap New Dataset

**When**: Starting from scratch, creating new test environment

**Steps**:
```bash
# 1. Prepare test files
mkdir -p data/test_images
cp /path/to/documents/* data/test_images/

# 2. Generate initial ground truth
python scripts/bootstrap_ground_truth.py \
    --data-dir data/test_images \
    --output data/ground_truth_DRAFT.json

# 3. Review all samples
python scripts/review_ground_truth.py \
    --ground-truth data/ground_truth_DRAFT.json \
    --output data/ground_truth.json \
    --reviewer $(whoami)

# 4. Validate final result
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --data-dir data/test_images \
    --generate-lockfile \
    --strict

# 5. Run baseline evaluation
python evaluate_ocr.py \
    --ground-truth data/ground_truth.json \
    --output results/baseline_$(date +%Y%m%d).json

# 6. Commit
git add data/ground_truth.json data/.ground_truth.lock data/test_images/
git commit -m "test: initialize ground truth dataset (N files)"
```

**Expected Duration**: 1-4 hours (depends on dataset size)

---

## Failure Modes

### FM-001: Validation Fails (Missing Files)

**Symptom**:
```
❌ ERRORS (1):
   • Sample 5: File not found: invoice_missing.pdf
```

**Root Cause**: File referenced in ground truth doesn't exist in `data/test_images/`

**Resolution**:
```bash
# Option A: Add missing file
cp /path/to/invoice_missing.pdf data/test_images/

# Option B: Remove from ground truth
# Edit data/ground_truth.json, delete the sample entry
python scripts/validate_ground_truth.py --ground-truth data/ground_truth.json
```

**Prevention**: Always commit test files alongside ground truth updates

---

### FM-002: Lockfile Mismatch

**Symptom**:
```
❌ Lockfile out of sync with ground truth
```

**Root Cause**: Ground truth was edited but lockfile wasn't regenerated

**Resolution**:
```bash
# Regenerate lockfile
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --generate-lockfile

# Commit both files
git add data/ground_truth.json data/.ground_truth.lock
git commit -m "fix: regenerate lockfile after ground truth update"
```

**Prevention**: Use pre-commit hooks to auto-regenerate lockfile

---

### FM-003: High CER (Evaluation Degradation)

**Symptom**:
```
Average CER: 0.2500 (target: <0.05) ❌
```

**Root Cause**: OCR model change, preprocessing bug, or incorrect ground truth

**Diagnosis**:
```bash
# 1. Check which files have high errors
cat results/eval_latest.json | jq '.per_file_results[] | select(.cer > 0.1)'

# 2. Inspect specific failures
python evaluate_ocr.py --ground-truth data/ground_truth.json | grep "HIGH ERROR"

# 3. Compare OCR output to ground truth manually
# (Review logs for "Ground Truth:" vs "OCR Output:" lines)
```

**Resolution**:
```bash
# If ground truth is wrong:
# - Follow OP-002 to correct it

# If OCR regressed:
# - Check PaddleOCR version: pip show paddleocr
# - Review recent code changes affecting OCR service
# - Rollback to last known-good commit if needed

# If preprocessing changed:
# - Check image preprocessing pipeline (resize, rotation, etc.)
# - Verify test images aren't corrupted
```

**Prevention**: Golden test set (see Phase 4)

---

### FM-004: Evaluation Script Crashes

**Symptom**:
```
ValueError: not enough values to unpack
```

**Root Cause**: OCR library API change, missing dependency, or corrupt input

**Resolution**:
```bash
# 1. Check dependencies
pip list | grep -E "(jiwer|Levenshtein|paddleocr)"

# 2. Run validation on ground truth first
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --strict

# 3. Test OCR service in isolation
python -c "
from app.services.ocr_client import ocr_service
result = ocr_service.extract_text('data/test_images/sample.pdf')
print(result[:100])
"

# 4. Check logs for specific error
tail -n 50 logs/evaluation.log
```

**Escalation**: If issue persists after basic checks, contact @ml-team

---

### FM-005: CI Validation Failure in PR

**Symptom**:
```
GitHub Actions: ❌ Validate Ground Truth failed
```

**Root Cause**: Ground truth changed but not properly validated locally

**Resolution**:
```bash
# 1. Pull PR branch
git fetch origin pull/123/head:pr-123
git checkout pr-123

# 2. Run validation locally
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --data-dir data/test_images \
    --strict

# 3. Fix errors (usually missing files or invalid JSON)

# 4. Regenerate lockfile
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --generate-lockfile

# 5. Force-push fix
git add data/ground_truth.json data/.ground_truth.lock
git commit --amend --no-edit
git push origin pr-123 --force
```

---

## Rollback Procedures

### RB-001: Rollback Ground Truth Changes

**When**: Recent ground truth update caused evaluation failures

**Steps**:
```bash
# 1. Identify last good commit
git log --oneline data/ground_truth.json

# 2. Revert to previous version
git checkout <commit-hash> -- data/ground_truth.json data/.ground_truth.lock

# 3. Validate rollback
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --strict

# 4. Re-run evaluation to confirm fix
python evaluate_ocr.py --ground-truth data/ground_truth.json

# 5. Commit rollback
git commit -m "revert: rollback ground truth to <commit-hash> (reason)"
git push origin main
```

**Expected Duration**: 5-10 minutes

---

### RB-002: Restore from Backup

**When**: Ground truth file corrupted or accidentally deleted

**Steps**:
```bash
# 1. Check Git history (first line of defense)
git reflog data/ground_truth.json

# 2. If available, restore from Git
git checkout HEAD~1 -- data/ground_truth.json

# 3. If Git history lost, restore from backup
# (Assumes backup process in place - see Monitoring section)
cp /backup/ground_truth_$(date -d yesterday +%Y%m%d).json data/ground_truth.json

# 4. Regenerate lockfile
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --generate-lockfile

# 5. Verify integrity
python scripts/validate_ground_truth.py --strict
```

---

## Monitoring & Alerts

### Metrics to Track

**Daily**:
- Ground truth file size (should grow slowly, sudden changes = issue)
- Number of samples (track dataset expansion)
- Lockfile age (should update when ground truth changes)

**Weekly**:
- Mean/Median CER (track accuracy over time)
- Success rate (track system reliability)
- p95 Latency (track performance degradation)

**Monthly**:
- Ground truth version changes (track data quality improvements)
- Inter-annotator agreement (if multiple reviewers)

### Automated Checks

**Pre-Commit Hook** (`.git/hooks/pre-commit`):
```bash
#!/bin/bash
# Validate ground truth before allowing commit

if git diff --cached --name-only | grep -q "ground_truth.json"; then
    echo "🔍 Validating ground truth..."
    python scripts/validate_ground_truth.py \
        --ground-truth data/ground_truth.json \
        --data-dir data/test_images \
        --strict
    
    if [ $? -ne 0 ]; then
        echo "❌ Ground truth validation failed. Fix errors before committing."
        exit 1
    fi
    
    echo "✅ Ground truth valid"
fi
```

**CI Check** (GitHub Actions):
- Runs on every PR touching `data/ground_truth.json`
- Fails if validation errors or lockfile mismatch
- Blocks merge until fixed

### Alerts (Future)

**Recommended Alerts**:
1. **CER Degradation**: Alert if mean CER increases >10% week-over-week
2. **Success Rate Drop**: Alert if <90% of files complete successfully
3. **Latency Spike**: Alert if p95 latency >2x baseline
4. **Ground Truth Staleness**: Warn if no updates in >30 days (may indicate stale test set)

**Implementation**: Integrate with Grafana/Prometheus (Phase 3+)

---

## Emergency Contacts

### Escalation Path

1. **Evaluation Failures**: @ml-team (Slack: #ml-eng)
2. **Ground Truth Issues**: @data-quality-team (Slack: #data-quality)
3. **CI/CD Problems**: @devops (Slack: #devops)
4. **After-Hours**: Oncall rotation (PagerDuty: ml-evaluation)

### Key People

- **Ground Truth Owner**: [Your Name] (email@example.com)
- **OCR Service Owner**: [ML Engineer] (email@example.com)
- **Evaluation Pipeline Owner**: [Senior Engineer] (email@example.com)

### Documentation Links

- **ADR**: `docs/adr/0004-ground-truth-system.md`
- **Engineering Log**: `docs/engineering_log.md` (Section 7.4)
- **API Docs**: `docs/api/evaluation.md`

---

## Appendix: Useful Commands

### Quick Diagnostics

```bash
# Check ground truth status
python -c "
import json
with open('data/ground_truth.json') as f:
    data = json.load(f)
print(f'Version: {data.get(\"version\")}')
print(f'Status: {data.get(\"status\")}')
print(f'Samples: {len(data.get(\"samples\", []))}')
"

# List files without ground truth
comm -23 \
    <(ls data/test_images/ | sort) \
    <(jq -r '.samples[].file' data/ground_truth.json | sort)

# Check lockfile integrity
python scripts/validate_ground_truth.py \
    --ground-truth data/ground_truth.json \
    --generate-lockfile
git diff data/.ground_truth.lock  # Should show no changes
```

### Performance Testing

```bash
# Measure end-to-end evaluation time
time python evaluate_ocr.py \
    --ground-truth data/ground_truth.json \
    --output results/perf_test.json

# Profile memory usage
/usr/bin/time -v python evaluate_ocr.py \
    --ground-truth data/ground_truth.json \
    2>&1 | grep "Maximum resident"
```

---

**Last Reviewed**: 2025-11-30  
**Next Review Due**: 2025-12-30  
**Version**: 1.0
