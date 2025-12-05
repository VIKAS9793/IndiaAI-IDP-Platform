"""
API routes for vector search functionality
Provides document similarity and semantic search endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.services.vector import get_vector_service, ENABLE_VECTOR_SEARCH
from app.models.job import Job

router = APIRouter()


class SimilarDocument(BaseModel):
    """Response model for similar documents"""
    job_id: str
    similarity: float
    text_preview: Optional[str] = None
    metadata: dict = {}


class SimilarityResponse(BaseModel):
    """Response for similarity search"""
    query_job_id: str
    similar_documents: List[SimilarDocument]
    count: int


class VectorStatsResponse(BaseModel):
    """Response for vector store stats"""
    enabled: bool
    collection: Optional[str] = None
    document_count: Optional[int] = None
    model: Optional[str] = None
    error: Optional[str] = None


class SemanticSearchRequest(BaseModel):
    """Request for semantic text search"""
    query: str
    n_results: int = 5
    min_similarity: float = 0.5


@router.get("/jobs/{job_id}/similar", response_model=SimilarityResponse)
async def get_similar_documents(
    job_id: str,
    n_results: int = Query(default=5, ge=1, le=20),
    min_similarity: float = Query(default=0.5, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    """
    Find documents similar to a given job.
    
    - **job_id**: The job ID to find similar documents for
    - **n_results**: Maximum number of results (1-20)
    - **min_similarity**: Minimum similarity threshold (0-1)
    
    Returns:
        List of similar documents with similarity scores
    """
    if not ENABLE_VECTOR_SEARCH:
        raise HTTPException(
            status_code=503,
            detail="Vector search is not enabled. Set ENABLE_VECTOR_SEARCH=true"
        )
    
    # Verify job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    
    # Find similar documents
    vector_service = get_vector_service()
    similar = vector_service.find_similar_by_job(
        job_id=job_id,
        n_results=n_results,
        min_similarity=min_similarity
    )
    
    return SimilarityResponse(
        query_job_id=job_id,
        similar_documents=[SimilarDocument(**doc) for doc in similar],
        count=len(similar)
    )


@router.post("/search/semantic", response_model=List[SimilarDocument])
async def semantic_search(
    request: SemanticSearchRequest,
    db: Session = Depends(get_db)
):
    """
    Search for documents semantically similar to query text.
    
    - **query**: Text to search for
    - **n_results**: Maximum number of results
    - **min_similarity**: Minimum similarity threshold
    
    Returns:
        List of matching documents with similarity scores
    """
    if not ENABLE_VECTOR_SEARCH:
        raise HTTPException(
            status_code=503,
            detail="Vector search is not enabled. Set ENABLE_VECTOR_SEARCH=true"
        )
    
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    vector_service = get_vector_service()
    results = vector_service.find_similar(
        text=request.query,
        n_results=request.n_results,
        min_similarity=request.min_similarity
    )
    
    return [SimilarDocument(**doc) for doc in results]


@router.get("/vector/stats", response_model=VectorStatsResponse)
async def get_vector_stats():
    """
    Get vector store statistics.
    
    Returns:
        Collection name, document count, and model info
    """
    vector_service = get_vector_service()
    stats = vector_service.get_stats()
    return VectorStatsResponse(**stats)
