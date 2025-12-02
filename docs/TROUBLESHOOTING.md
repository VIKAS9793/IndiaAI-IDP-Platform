# 🔧 Troubleshooting Guide

## Common Issues

### 1. "Ghost Job" (404 Not Found)
**Symptom:** You upload a file, get a Job ID, but polling status returns `404 Not Found`.
**Cause:** Relative path mismatch in `DATABASE_URL`. If you run `uvicorn` from the root instead of `backend/`, it creates a new empty database.
**Fix:**
*   Always run `uvicorn` from the `backend` directory.
*   We have patched `config.py` to use absolute paths, so this should be rare now.

### 2. Upload Fails with 500 Internal Server Error
**Symptom:** Upload endpoint returns 500.
**Cause:** Missing `audit_logs` table in the database.
**Fix:** Run migrations to update the schema:
```bash
cd backend
alembic upgrade head
```

### 3. Worker Crashes with "Not enough values to unpack"
**Symptom:** Worker dies at 30% progress.
**Cause:** PaddleOCR version mismatch returning different data structure.
**Fix:** We have patched `PaddleOCRService` to handle both list-of-lists and list-of-dicts formats. Ensure you are using the latest code.

### 4. CORS Errors (Network Failed)
**Symptom:** Upload fails with "Network Error" or CORS policy errors in browser console.
**Cause:** Frontend and backend running on different origins without proper CORS configuration.
**Fix:** 
- Ensure backend is running on `http://127.0.0.1:8000` (not `localhost`)
- Frontend should use `http://127.0.0.1:5173`
- CORS origins are whitelisted in `backend/main.py`

### 5. "Field Required" on Upload
**Symptom:** Upload fails with "Field required" validation errors.
**Cause:** Global `Content-Type: application/json` header interfering with FormData.
**Fix:** This has been fixed in `src/lib/api.ts`. Ensure you're using the latest code.

### 6. Pytest "ModuleNotFoundError"
**Symptom:** Running tests fails with import errors.
**Fix:** Run tests as a module to add current directory to path:
```bash
python -m pytest tests/
```

## Debugging Tips
*   **Backend Logs:** Check the terminal running `uvicorn`.
*   **Worker Logs:** The worker runs in the same process (dev mode). Check console output.
*   **Database:** Use a SQLite viewer to inspect `backend/data/indiaai.db`.
