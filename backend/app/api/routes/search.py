"""
Full-Text Search API Routes
Uses SQLite FTS5 - zero external dependencies
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional

from app.core.database import get_db
from app.services.search import get_fts_service, is_fts_enabled, SearchResult

router = APIRouter(prefix="/api/search", tags=["search"])


# --- Request/Response Models ---

class TextSearchRequest(BaseModel):
    """Full-text search request"""
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    limit: int = Field(default=10, ge=1, le=100, description="Max results")
    language: Optional[str] = Field(default=None, description="Filter by language")


class HybridSearchRequest(BaseModel):
    """Hybrid search combining FTS5 and vector search"""
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=100)
    fts_weight: float = Field(default=0.5, ge=0.0, le=1.0, description="Weight for FTS results (0-1)")


class SearchResultResponse(BaseModel):
    """Individual search result"""
    job_id: str
    text_snippet: str
    score: float
    language: Optional[str] = None
    source: str = "fts"  # fts, vector, or hybrid


class SearchResponse(BaseModel):
    """Search response with results and metadata"""
    query: str
    results: List[SearchResultResponse]
    total: int
    search_type: str


class SearchStatsResponse(BaseModel):
    """FTS index statistics"""
    total_documents: int
    languages: dict
    fts_version: str
    tokenizer: str


# --- Helper ---

def require_fts_enabled():
    """Dependency to check if FTS is enabled"""
    if not is_fts_enabled():
        raise HTTPException(
            status_code=503,
            detail="Full-text search is not enabled. Set ENABLE_FULLTEXT_SEARCH=true"
        )


# --- Endpoints ---

@router.post("/text", response_model=SearchResponse)
async def text_search(
    request: TextSearchRequest,
    db: Session = Depends(get_db),
    _: None = Depends(require_fts_enabled)
):
    """
    Full-text keyword search using SQLite FTS5.
    
    Features:
    - BM25 relevance ranking
    - Phrase search: "exact phrase"
    - Prefix matching: term*
    - Language filtering
    """
    fts = get_fts_service()
    
    results = fts.search(
        db=db,
        query=request.query,
        limit=request.limit,
        language=request.language
    )
    
    return SearchResponse(
        query=request.query,
        results=[
            SearchResultResponse(
                job_id=r.job_id,
                text_snippet=r.text_snippet,
                score=abs(r.rank),  # BM25 returns negative scores
                language=r.language,
                source="fts"
            )
            for r in results
        ],
        total=len(results),
        search_type="fulltext"
    )


@router.post("/hybrid", response_model=SearchResponse)
async def hybrid_search(
    request: HybridSearchRequest,
    db: Session = Depends(get_db),
    _: None = Depends(require_fts_enabled)
):
    """
    Hybrid search combining FTS5 (keyword) and ChromaDB (semantic).
    
    Combines results using weighted scoring:
    - fts_weight: 0.5 = equal weight
    - fts_weight: 1.0 = FTS only
    - fts_weight: 0.0 = Vector only
    """
    from app.services.vector import get_vector_service, is_vector_enabled
    
    fts = get_fts_service()
    results_map: dict = {}
    
    # FTS5 Search
    if request.fts_weight > 0:
        fts_results = fts.search(db=db, query=request.query, limit=request.limit * 2)
        for r in fts_results:
            if r.job_id not in results_map:
                results_map[r.job_id] = {
                    "job_id": r.job_id,
                    "text_snippet": r.text_snippet,
                    "fts_score": abs(r.rank),
                    "vector_score": 0.0,
                    "language": r.language
                }
            else:
                results_map[r.job_id]["fts_score"] = abs(r.rank)
    
    # Vector Search (if enabled)
    vector_weight = 1.0 - request.fts_weight
    if vector_weight > 0 and is_vector_enabled():
        try:
            vector_svc = get_vector_service()
            vector_results = vector_svc.find_similar(request.query, n_results=request.limit * 2)
            
            for vr in vector_results:
                job_id = vr.get("job_id", "")
                if job_id not in results_map:
                    results_map[job_id] = {
                        "job_id": job_id,
                        "text_snippet": vr.get("text", "")[:200] if vr.get("text") else "",
                        "fts_score": 0.0,
                        "vector_score": vr.get("similarity", 0.0),
                        "language": None
                    }
                else:
                    results_map[job_id]["vector_score"] = vr.get("similarity", 0.0)
        except Exception as e:
            # Vector search failed, continue with FTS only
            pass
    
    # Calculate combined scores
    combined_results = []
    for job_id, data in results_map.items():
        combined_score = (
            data["fts_score"] * request.fts_weight +
            data["vector_score"] * vector_weight
        )
        combined_results.append(
            SearchResultResponse(
                job_id=job_id,
                text_snippet=data["text_snippet"],
                score=combined_score,
                language=data["language"],
                source="hybrid"
            )
        )
    
    # Sort by combined score
    combined_results.sort(key=lambda x: x.score, reverse=True)
    
    return SearchResponse(
        query=request.query,
        results=combined_results[:request.limit],
        total=len(combined_results[:request.limit]),
        search_type="hybrid"
    )


@router.get("/stats", response_model=SearchStatsResponse)
async def get_search_stats(
    db: Session = Depends(get_db),
    _: None = Depends(require_fts_enabled)
):
    """Get full-text search index statistics"""
    fts = get_fts_service()
    stats = fts.get_stats(db)
    
    if "error" in stats:
        raise HTTPException(status_code=500, detail=stats["error"])
    
    return SearchStatsResponse(**stats)
