# Changelog

All notable changes to the IndiaAI IDP Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - v2.0-dev

### 🚀 Added

#### Smart Search (Phase 1 & 2)
- **ChromaDB Vector Search** - Semantic document similarity using sentence-transformers
  - Endpoint: `GET /api/jobs/{id}/similar` - Find similar documents
  - Endpoint: `POST /api/search/semantic` - Semantic text search
  - Endpoint: `GET /api/vector/stats` - Vector store statistics
  - Embedding model: `all-MiniLM-L6-v2` (384 dimensions)
  - Feature flag: `ENABLE_VECTOR_SEARCH=true`

- **SQLite FTS5 Full-Text Search** - Zero-dependency keyword search
  - Endpoint: `POST /api/search/text` - Full-text keyword search
  - Endpoint: `POST /api/search/hybrid` - Combined FTS5 + vector search
  - Endpoint: `GET /api/search/stats` - Index statistics
  - BM25 ranking algorithm
  - Feature flag: `ENABLE_FULLTEXT_SEARCH=true`

#### PDF Processing
- **pdf2image integration** - PDF to image conversion for OCR
- **Multi-page PDF support** - Automatic page merging
- **Poppler integration** - Native PDF rendering (150 DPI)

#### Performance Optimizations
- **Embedding pre-warming** - Model loaded on startup (6s → 1.6s latency)
- **Pipeline instrumentation** - Detailed timing logs for all stages
- **Fast FTS indexing** - Sub-second document indexing

### 🔧 Changed

#### Backend
- `backend/app/services/vector.py` - New VectorService for ChromaDB
- `backend/app/services/search.py` - New FTS5SearchService
- `backend/app/services/ocr.py` - Added PDF conversion functions
- `backend/app/worker.py` - Integrated vector/FTS indexing after OCR
- `backend/main.py` - Added router registration and service initialization

#### Frontend
- `src/components/DocumentViewer.tsx` - Fixed bounding box scaling

### 📊 New Dependencies

```txt
chromadb>=0.4.0
sentence-transformers>=2.2.0
pdf2image>=1.16.0
```

**External requirement:** Poppler (for PDF rendering on Windows)

### 📈 Performance Metrics

| Metric | Before | After |
|--------|--------|-------|
| PDF Confidence | N/A | 96%+ |
| Pipeline Time | ~42s | ~17-21s |
| First Embedding | 6s | 1.6s |
| FTS Index | N/A | <0.1s |

### 🛡️ Security

- Zero new network ports (FTS5 uses existing SQLite)
- Query sanitization prevents FTS injection attacks
- Same audit scope as existing database
- India AI Governance Guidelines compliant

## [0.1.1] - 2025-12-04

### 🔐 Security

**CRITICAL VULNERABILITIES RESOLVED** - This release addresses 7 critical and high-severity security vulnerabilities identified by Dependabot.

#### PaddlePaddle Vulnerabilities Fixed
- **CVE-2024-0917**: Remote Code Execution (CVSS 9.4) - CRITICAL ✅
- **CVE-2024-1603**: Arbitrary file read via paddle.vision.ops.read_file (CVSS 7.5) ✅
- **CVE-2024-0521**: Command injection via URL parameter ✅
- **CVE-2024-0818**: Arbitrary file overwrite via path traversal ✅
- **CVE-2024-0817**: Command injection in IrGraph.draw method ✅

#### Additional Security Fixes
- Fixed arbitrary code execution vulnerability in Pillow ✅
- Fixed buffer overflow vulnerability in Pillow ✅
- Fixed ReDoS vulnerability in python-multipart ✅
- Removed sensitive data logging from test files (CodeQL alert) ✅

### Changed

#### Dependency Upgrades
- **PaddlePaddle**: `2.6.0` → `3.0.0` (latest stable, all CVEs fixed)
- **Pillow**: `10.1.0` → `10.3.0` (security patch)
- **python-multipart**: `0.0.6` → `0.0.9` (ReDoS fix)
- **numpy**: Pinned to `<2.0.0` for PaddlePaddle compatibility

#### Documentation Updates
- Updated `docs/SETUP.md` with critical fresh virtual environment setup instructions
- Updated `backend/SECURITY_ADVISORY.md` to reflect all vulnerabilities as RESOLVED
- Enhanced setup guide with exact verified dependency versions
- Added database initialization steps (audit_logs table creation)

### Added

#### Database Utilities
- Added `backend/scripts/create_audit_table.py` - Utility script for creating missing audit_logs table

#### CI/CD Improvements
- Enhanced GitHub Actions workflow for platform-specific dependency handling
- Added automated security scanning in CI pipeline

### Removed

#### Breaking Changes
- **Removed Presidio PII detection** (`presidio-analyzer`, `presidio-anonymizer`)
  - **Reason**: Incompatible with secure PaddlePaddle 3.0.0 due to numpy 2.x dependency conflict
  - **Migration**: PII protection now handled by `SecurityUtils` (app/core/security_utils.py)
  - **Impact**: No functional regression - SecurityUtils provides equivalent PII masking for structured documents
  
#### Code Cleanup
- Deleted `backend/app/services/pii.py` (Presidio-based service)
- Removed PIIService imports and references from `backend/app/worker.py`

### Fixed

- Fixed missing `audit_logs` table issue in database initialization
- Resolved numpy DLL import conflicts on Windows
- Fixed platform-specific PaddlePaddle installation issues in CI/CD
- Corrected CodeQL security alert regarding sensitive data logging

---

## [0.1.0] - 2024-12-XX

### Added

#### Core Features
- Document upload with DPDP Act 2023 compliance (purpose selection, consent verification)
- OCR processing using PaddleOCR (PP-OCRv4)
- Human-in-the-loop review interface for low-confidence extractions
- Audit logging for all document processing activities
- PII detection and masking (SecurityUtils)
- Governance and fairness checks

#### Backend
- FastAPI-based REST API
- SQLite database with Alembic migrations
- Modular architecture (storage, queue, OCR services)
- Local filesystem storage (with R2/S3 support)
- Background worker for async OCR processing
- Comprehensive unit test suite (56+ tests)

#### Frontend
- React + TypeScript + Vite
- PDF viewer with bounding box visualization
- Side-by-side document and extracted text display
- DPDP compliance UI components
- Real-time job status tracking

#### CI/CD & Security
- GitHub Actions CI/CD pipeline
- Automated security scanning (npm audit, Safety, Bandit, CodeQL)
- Dependabot for automated dependency updates
- Local security scan scripts (Windows + Unix)

#### Documentation
- Comprehensive README with product vision
- Setup guide (SETUP.md)
- Security policy (SECURITY.md)
- Architecture documentation
- Contributing guidelines

---

## Migration Guide: 0.1.0 → 0.1.1

### For Existing Installations

**⚠️ Important: This release requires a fresh Python virtual environment due to numpy compatibility changes.**

#### Step 1: Backup Current Environment
```bash
cd backend
pip freeze > requirements_backup.txt
```

#### Step 2: Rebuild Virtual Environment
```bash
# Delete old environment
Remove-Item -Recurse -Force .venv  # Windows
rm -rf .venv  # Linux/Mac

# Create fresh environment
python -m venv .venv

# Activate
.\.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate  # Linux/Mac

# Upgrade pip
python -m pip install --upgrade pip setuptools wheel

# Install dependencies (numpy will be installed correctly)
pip install -r requirements.txt
```

#### Step 3: Initialize Database
```bash
# Run migrations
alembic upgrade head

# Create audit_logs table if missing
python scripts/create_audit_table.py
```

#### Step 4: Verify Installation
```bash
# Check versions
pip list | grep -E "paddlepaddle|pillow|python-multipart|numpy"

# Expected output:
# paddlepaddle    3.0.0
# pillow          10.3.0
# python-multipart 0.0.9
# numpy           1.26.4
```

#### Step 5: Test OCR Functionality
```bash
# Start backend
python -m uvicorn main:app --reload

# In another terminal, start frontend
npm run dev

# Upload a test document through UI
```

### Code Changes Required

#### If you used PIIService directly:

**Before:**
```python
from app.services.pii import PIIService

pii_service = PIIService()
entities = pii_service.analyze_text(text)
```

**After:**
```python
from app.core.security_utils import SecurityUtils

masked_text = SecurityUtils.mask_pii_in_text(text)
```

**SecurityUtils methods available:**
- `mask_email(text)` - Mask email addresses
- `mask_phone(text)` - Mask phone numbers (Indian +91, 10-digit)
- `mask_aadhaar(text)` - Mask Aadhaar numbers
- `mask_pan(text)` - Mask PAN cards
- `mask_credit_card(text)` - Mask credit card numbers
- `mask_ssn(text)` - Mask SSNs
- `mask_pii_in_text(text)` - Mask all PII types

---

## Notes

### Versioning Strategy
- **Major version (x.0.0)**: Breaking changes, major feature releases
- **Minor version (0.x.0)**: New features, non-breaking changes
- **Patch version (0.0.x)**: Bug fixes, security patches

### Security Policy
All security vulnerabilities are tracked in `backend/SECURITY_ADVISORY.md`. Critical vulnerabilities (CVSS ≥ 7.0) are patched immediately.

### Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

[unreleased]: https://github.com/VIKAS9793/IndiaAI-IDP-Platform/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/VIKAS9793/IndiaAI-IDP-Platform/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/VIKAS9793/IndiaAI-IDP-Platform/releases/tag/v0.1.0
