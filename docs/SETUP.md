# 🛠️ Setup Guide: IndiaAI IDP Platform

## Prerequisites
*   Python 3.10+
*   Node.js 18+
*   Git

## 1. Backend Setup (FastAPI)

The backend handles document processing, OCR, and governance logic.

### Installation
```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

### Database Setup
We use SQLite for development. Initialize the database with Alembic:
```bash
alembic upgrade head
```

### Running the Server
```bash
python -m uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.
Docs: `http://localhost:8000/docs`

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

