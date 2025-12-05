# 🛠️ Setup Guide: IndiaAI IDP Platform

> **🚀 One-Click Setup (Recommended):**  
> - **Windows:** Run `.\setup.ps1` in PowerShell
> - **Linux/Mac:** Run `chmod +x setup.sh && ./setup.sh`
>
> Right-click → "Run with PowerShell" (Windows) or execute from terminal.

---

## Prerequisites
*   Python 3.10+
*   Node.js 18+
*   Git

## 1. Backend Setup (FastAPI)

The backend handles document processing, OCR, and governance logic.

### ⚠️ Important: Fresh Environment Setup

**Due to numpy compatibility requirements with secure PaddlePaddle 3.0.0, a fresh virtual environment is required:**

```bash
cd backend

# Delete old environment if it exists
# Windows:
Remove-Item -Recurse -Force .venv -ErrorAction SilentlyContinue
# Linux/Mac:
rm -rf .venv

# Create fresh virtual environment
python -m venv .venv

# Activate
# Windows:
.\.venv\Scripts\Activate.ps1
# Linux/Mac:
source .venv/bin/activate

# Upgrade pip (critical)
python -m pip install --upgrade pip setuptools wheel

# Install dependencies (numpy will be installed with correct version)
pip install -r requirements.txt
```

**Critical Dependency Versions (Verified Working):**
- `paddlepaddle==3.0.0` (fixes 7 critical CVEs)
- `numpy<2.0.0` (auto-installed, required for PaddlePaddle)
- `Pillow==10.3.0` (security patch)
- `python-multipart==0.0.9` (security patch)

### Database Setup

Initialize SQLite database and create required tables:

```bash
# Run migrations
alembic upgrade head

# Create audit_logs table (if missing)
python scripts/create_audit_table.py
```

**Note:** If `alembic upgrade head` doesn't create all tables, the `scripts/create_audit_table.py` script will create the missing `audit_logs` table.

### Running the Server
```bash
python -m uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.
Docs: `http://localhost:8000/docs`

### v2.0 Feature Flags (Optional)

Enable smart search features with environment variables:

```bash
# Windows PowerShell
$env:ENABLE_VECTOR_SEARCH="true"      # ChromaDB semantic search
$env:ENABLE_FULLTEXT_SEARCH="true"    # SQLite FTS5 keyword search

# Linux/Mac
export ENABLE_VECTOR_SEARCH=true
export ENABLE_FULLTEXT_SEARCH=true
```

**PDF Support Requirements:**
- Install Poppler: `winget install oschwartz10612.Poppler` (Windows)
- Linux: `apt install poppler-utils`
- Add Poppler to PATH for pdf2image

## 2. Frontend Setup (React + Vite)

The frontend provides the user interface for uploading documents and viewing results.

### Installation
```bash
# In the project root
npm install
```

### Running the Development Server
```bash
npm run dev
```
The UI will be available at `http://localhost:5173`.

## 3. Configuration
*   **Backend:** Configuration is managed in `backend/app/core/config.py`. No `.env` file is required for local dev (defaults are set).
*   **Frontend:** API URL is configured in `src/lib/api.ts`.

## 4. Verify Installation

Run the security scan to verify everything is set up correctly:

```bash
# Windows
npm run security:scan:win

# Unix/Linux/macOS
npm run security:scan:unix
```

This will check:
- ✅ Dependencies installed correctly
- ✅ No security vulnerabilities
- ✅ Code quality passes
- ✅ Build works

For more details, see [SECURITY.md](SECURITY.md).
