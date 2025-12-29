"""
FastAPI main application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger
from app.api.routes import health, upload, jobs
import os

# Initialize structured logging
log_level = "DEBUG" if settings.DEBUG else "INFO"
json_logs = not settings.DEBUG  # JSON in production, pretty in dev
setup_logging(level=log_level, json_logs=json_logs)
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intelligent Document Processing Platform for Indian languages"
)

# Configure CORS - Production-grade setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:4173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services and database on startup"""
    # 1. Initialize Logging
    logger.info(
        "Application starting",
        extra={
            "app_name": settings.APP_NAME,
            "version": settings.APP_VERSION, 
            "debug": settings.DEBUG,
            "database_type": settings.DATABASE_TYPE,
            "storage_type": settings.STORAGE_TYPE
        }
    )
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} starting...")

    # 2. Database Initialization (Create Tables)
    from app.core.database import Base, engine
    # Import models to ensure they are registered with Base.metadata
    import app.models.job        # Register Job, OCRResult
    import app.models.audit_log  # Register AuditLog
    
    print("📦 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("   ✓ Tables created/verified")
    
    # Log database type
    db_info = f"SQLite ({settings.SQLITE_DB_PATH})" if settings.DATABASE_TYPE == "sqlite" else "PostgreSQL"
    print(f"📊 Database: {db_info}")

    # 3. Start worker in background (Memory Queue only)
    if settings.QUEUE_TYPE == "memory":
        from app.worker import run_worker
        import asyncio
        asyncio.create_task(run_worker())
        print(f"🔄 Queue: Memory (Worker started)")
    else:
        print(f"🔄 Queue: {settings.QUEUE_TYPE.capitalize()}")

    # 4. Feature Initialization
    # Pre-warm embedding model
    if os.getenv("ENABLE_VECTOR_SEARCH", "false").lower() == "true":
        try:
            print("🧠 Pre-warming embedding model...")
            from app.services.vector import get_vector_service
            get_vector_service()._lazy_init()
            print("   ✓ Embedding model ready")
        except Exception as e:
            print(f"   ⚠️ Embedding pre-warm failed: {e}")
            
    # Initialize FTS5
    if os.getenv("ENABLE_FULLTEXT_SEARCH", "false").lower() == "true":
        try:
            print("🔍 Initializing FTS5 full-text search...")
            from app.services.search import get_fts_service
            from app.core.database import SessionLocal
            db = SessionLocal()
            get_fts_service().initialize_fts_table(db)
            db.close()
            print("   ✓ FTS5 search ready")
        except Exception as e:
            print(f"   ⚠️ FTS initialization failed: {e}")

    # 5. Initialize Scheduler
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from app.services.cleanup_service import run_cleanup_jobs, run_cleanup_audit, run_cleanup_orphaned
    
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_cleanup_jobs, 'cron', hour=2, minute=0, id='cleanup_jobs')
    scheduler.add_job(run_cleanup_audit, 'cron', day_of_week='sun', hour=3, minute=0, id='cleanup_audit')
    scheduler.add_job(run_cleanup_orphaned, 'cron', day_of_week='sun', hour=4, minute=0, id='cleanup_orphaned')
    scheduler.start()
    print("⏰ Scheduler started")


# Shutdown event  
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Application shutting down")
    print("👋 Shutting down...")

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(upload.router, prefix=settings.API_V1_PREFIX, tags=["upload"])
app.include_router(jobs.router, prefix=f"{settings.API_V1_PREFIX}/jobs", tags=["jobs"])

# Admin Router (Protected in production)
from app.api.routes import admin
app.include_router(admin.router, prefix=f"{settings.API_V1_PREFIX}/admin", tags=["admin"])

# Vector Search Router (Feature-flagged)
from app.api.routes import vector
app.include_router(vector.router, prefix=f"{settings.API_V1_PREFIX}", tags=["vector-search"])

# Full-Text Search Router (Feature-flagged)
from app.api.routes import search
app.include_router(search.router, tags=["fulltext-search"])

# Serve uploaded files as-static content
import os
uploads_dir = os.path.join(os.path.dirname(__file__), "data", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/data/uploads", StaticFiles(directory=uploads_dir), name="uploads")





if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
