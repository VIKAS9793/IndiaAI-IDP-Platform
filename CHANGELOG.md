# Changelog

All notable changes to the IndiaAI IDP Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-12-29

### 🎨 MAJOR UI OVERHAUL - UX4G Migration

**Breaking Change:** Complete frontend redesign to comply with Government of India Design System (UX4G v2.0.8).

#### 🚀 Added

**UX4G Design System Integration**
- **Official Design System:** [UX4G v2.0.8](https://ux4g.gov.in/) (Government of India)
- **CDN Integration:** `https://cdn.ux4g.gov.in/UX4G@2.0.8/`
- **Accessibility Widget:** UX4G Accessibility Widget for WCAG 2.1 compliance
- **Typography:** Noto Sans font (government-approved)
- **Components:** Full UX4G component library (Navbar, Footer, Breadcrumbs, Cards, Alerts, Modals, Forms)
- **Branding:** Tricolor bars, national emblem placeholders, PROTOTYPE/NOT OFFICIAL badges
- **Icons:** Inline SVG icons (removed external icon library dependency)

**Component Migration (11 components)**
- `Header.tsx` → UX4G Navbar with tricolor bar and government branding
- `Footer.tsx` → UX4G Footer with bilingual legal disclaimers
- `Breadcrumbs.tsx` → UX4G Breadcrumb navigation
- `Button.tsx` → UX4G Button variants (primary, secondary, outline, danger, warning, success)
- `Alert.tsx` → UX4G Alert with dismissible support
- `Card.tsx` → UX4G Card anatomy (Header, Title, Body, Footer)
- `DisclaimerBanner.tsx` → UX4G Alert with inline SVG
- `DisclaimerModal.tsx` → UX4G Modal structure
- `ErrorBoundary.tsx` → UX4G Alert-based error UI
- `PrototypeWatermark.tsx` → UX4G utility classes
- `App.tsx` → UX4G layout wrapper

**Page Migration (7 pages)**
- `HomePage.tsx` → UX4G grid, cards, buttons
- `UploadPage.tsx` → UX4G forms, progress bars, file upload
- `ResultsPage.tsx` → UX4G layout with dropdown menus
- `ReviewPage.tsx` → UX4G PDF viewer with form controls
- `DisclaimerPage.tsx` → UX4G cards and alerts
- `AboutPage.tsx` → UX4G information layout
- `PrivacyPage.tsx` → UX4G policy documentation

#### 🔧 Changed

**Dependency Removals**
- ❌ Removed `tailwindcss` and all Tailwind plugins
- ❌ Removed `lucide-react` icon library
- ✅ Replaced with UX4G CDN and inline SVGs

**Configuration Updates**
- `index.html`: Added UX4G CSS/JS CDN links
- `src/index.css`: Removed Tailwind, added UX4G base styles
- `package.json`: Removed Tailwind-related dependencies

**Visual Changes**
- All components now use Bootstrap-style UX4G classes (`d-flex`, `container`, `row`, `col-*`)
- Government-compliant color palette (greens for primary actions, amber for warnings)
- Consistent spacing and typography using UX4G utilities
- Responsive design with UX4G breakpoints

#### 📊 Migration Stats

| Metric | Count |
|--------|-------|
| Components Migrated | 11 |
| Pages Migrated | 7 |
| Tailwind Classes Removed | ~500+ |
| UX4G CDN Assets | 3 (CSS, JS, Fonts) |
| Build Size Reduction | ~200KB (Tailwind removed) |

#### 🛡️ Compliance & Accessibility

- ✅ WCAG 2.1 Level AA compliance via UX4G Accessibility Widget
- ✅ Government branding guidelines followed
- ✅ Legal disclaimers preserved and enhanced
- ✅ Bilingual support (English/Hindi) in footer

#### 🛠️ Backend & Infrastructure Fixes

- **PaddleOCR Compatibility:** Added `langchain` and `langchain-community` dependencies to support PaddleOCR 3.0/PP-OCRv5 workflows.
- **Dependency Constraints:** Verified and enforced `numpy<2.0.0` to prevent PaddlePaddle crashes.
- **Database Initialization:** Fixed startup sequence to consistently create `audit_logs` and `jobs` tables if missing.
- **Startup Logic:** Consolidated duplicate startup events in `main.py` for reliable service initialization.
- **Security:** Enhanced file extension validation logic and sanitization.

#### 📄 Documentation Updates

- Updated `README.md` with UX4G screenshots and tech stack
- Added UX4G copyright attribution and official links
- Updated setup guides to reference UX4G
- Added design system compliance notes

### 🔗 UX4G Resources

- **Official Site:** [ux4g.gov.in](https://ux4g.gov.in/)
- **Documentation:** [ux4g.gov.in/docs](https://ux4g.gov.in/docs)
- **CDN:** [cdn.ux4g.gov.in](https://cdn.ux4g.gov.in/)
- **Copyright:** © Government of India

---

## [2.0.0] - 2025-12-XX

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

---

## [1.0.0] - 2025-12-04

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

#### Frontend (Tailwind CSS - Deprecated in v3.0.0)
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

## Migration Guide: 2.0.0 → 3.0.0 (UX4G)

### For Existing Installations

**⚠️ Important: This is a MAJOR UI redesign. No backend changes required.**

#### Frontend Migration

**What Changed:**
- Tailwind CSS → UX4G v2.0.8
- lucide-react icons → Inline SVGs
- Custom components → UX4G government-approved components

**No Action Required:**
- Backend API remains unchanged
- Database schema unchanged
- All existing data compatible
- No dependency reinstallation needed (frontend only)

#### Visual Verification

After pulling latest code:
```bash
# Frontend
npm run dev

# Visit http://localhost:5173
# Verify UX4G components render correctly
```

**Expected Changes:**
- Green government-themed buttons (instead of blue)
- Tricolor bars at top/bottom
- PROTOTYPE and NOT OFFICIAL badges in header
- Government typography (Noto Sans)
- UX4G-compliant spacing and colors

---

## Notes

### Versioning Strategy
- **Major version (x.0.0)**: Breaking changes, major feature releases, UI redesigns
- **Minor version (0.x.0)**: New features, non-breaking changes
- **Patch version (0.0.x)**: Bug fixes, security patches

### Security Policy
All security vulnerabilities are tracked in `backend/SECURITY_ADVISORY.md`. Critical vulnerabilities (CVSS ≥ 7.0) are patched immediately.

### Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

[3.0.0]: https://github.com/VIKAS9793/IndiaAI-IDP-Platform/releases/tag/v3.0.0
[2.0.0]: https://github.com/VIKAS9793/IndiaAI-IDP-Platform/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/VIKAS9793/IndiaAI-IDP-Platform/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/VIKAS9793/IndiaAI-IDP-Platform/releases/tag/v0.1.0
