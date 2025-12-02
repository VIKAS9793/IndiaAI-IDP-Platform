"""
Health check router
"""
from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "status": "healthy",
        "service": "IndiaAI IDP Platform API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "api": "operational",
            "database": "operational",  # TODO: Add actual DB check
            "storage": "operational",    # TODO: Add R2 check
            "queue": "operational"       # TODO: Add Redis check
        },
        "timestamp": datetime.utcnow().isoformat()
    }
