"""
Full-Text Search Service using SQLite FTS5
Zero additional dependencies - uses built-in SQLite FTS5

India AI Governance Compliant:
- No external network calls
- Same audit trail as main database
- DPDP-compliant data handling
"""
import os
import logging
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    """Individual search result"""
    job_id: str
    text_snippet: str
    rank: float
    language: Optional[str] = None
    confidence: Optional[float] = None


class FTS5SearchService:
    """
    Full-text search using SQLite FTS5
    
    Features:
    - BM25 ranking algorithm
    - Phrase and proximity search
    - Prefix matching
    - Hybrid search with vector results
    """
    
    FTS_TABLE_NAME = "document_fts"
    
    def __init__(self):
        self._initialized = False
    
    def initialize_fts_table(self, db: Session) -> bool:
        """
        Create FTS5 virtual table if not exists.
        Should be called during app startup.
        """
        try:
            # Create FTS5 virtual table
            db.execute(text(f"""
                CREATE VIRTUAL TABLE IF NOT EXISTS {self.FTS_TABLE_NAME}
                USING fts5(
                    job_id,
                    full_text,
                    language,
                    tokenize='porter unicode61'
                )
            """))
            db.commit()
            
            self._initialized = True
            logger.info("FTS5 table initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize FTS5 table: {e}")
            return False
    
    def index_document(
        self,
        db: Session,
        job_id: str,
        full_text: str,
        language: str = "en"
    ) -> bool:
        """
        Index a document for full-text search.
        Called after OCR processing completes.
        """
        try:
            # Check if already indexed
            existing = db.execute(
                text(f"SELECT job_id FROM {self.FTS_TABLE_NAME} WHERE job_id = :job_id"),
                {"job_id": job_id}
            ).fetchone()
            
            if existing:
                # Update existing
                db.execute(
                    text(f"""
                        UPDATE {self.FTS_TABLE_NAME} 
                        SET full_text = :full_text, language = :language
                        WHERE job_id = :job_id
                    """),
                    {"job_id": job_id, "full_text": full_text, "language": language}
                )
            else:
                # Insert new
                db.execute(
                    text(f"""
                        INSERT INTO {self.FTS_TABLE_NAME} (job_id, full_text, language)
                        VALUES (:job_id, :full_text, :language)
                    """),
                    {"job_id": job_id, "full_text": full_text, "language": language}
                )
            
            db.commit()
            logger.info(f"Indexed document {job_id} for FTS")
            return True
            
        except Exception as e:
            logger.error(f"Failed to index document {job_id}: {e}")
            db.rollback()
            return False
    
    def search(
        self,
        db: Session,
        query: str,
        limit: int = 10,
        language: Optional[str] = None
    ) -> List[SearchResult]:
        """
        Full-text search with BM25 ranking.
        
        Args:
            query: Search query (supports phrases, prefix with *)
            limit: Maximum results
            language: Filter by language (optional)
        
        Returns:
            List of SearchResult sorted by relevance
        """
        if not query or not query.strip():
            return []
        
        try:
            # Escape special FTS5 characters
            safe_query = self._sanitize_query(query)
            
            # Build query with optional language filter
            sql = f"""
                SELECT 
                    job_id,
                    snippet({self.FTS_TABLE_NAME}, 1, '<b>', '</b>', '...', 32) as text_snippet,
                    bm25({self.FTS_TABLE_NAME}) as rank,
                    language
                FROM {self.FTS_TABLE_NAME}
                WHERE {self.FTS_TABLE_NAME} MATCH :query
            """
            
            params: Dict[str, Any] = {"query": safe_query}
            
            if language:
                sql += " AND language = :language"
                params["language"] = language
            
            sql += " ORDER BY rank LIMIT :limit"
            params["limit"] = limit
            
            results = db.execute(text(sql), params).fetchall()
            
            return [
                SearchResult(
                    job_id=row[0],
                    text_snippet=row[1] or "",
                    rank=float(row[2]) if row[2] else 0.0,
                    language=row[3]
                )
                for row in results
            ]
            
        except Exception as e:
            logger.error(f"FTS search failed: {e}")
            return []
    
    def delete_document(self, db: Session, job_id: str) -> bool:
        """Remove a document from the FTS index"""
        try:
            db.execute(
                text(f"DELETE FROM {self.FTS_TABLE_NAME} WHERE job_id = :job_id"),
                {"job_id": job_id}
            )
            db.commit()
            logger.info(f"Removed document {job_id} from FTS index")
            return True
        except Exception as e:
            logger.error(f"Failed to delete document {job_id} from FTS: {e}")
            return False
    
    def get_stats(self, db: Session) -> Dict[str, Any]:
        """Get FTS index statistics"""
        try:
            count = db.execute(
                text(f"SELECT COUNT(*) FROM {self.FTS_TABLE_NAME}")
            ).scalar() or 0
            
            languages = db.execute(
                text(f"""
                    SELECT language, COUNT(*) as cnt 
                    FROM {self.FTS_TABLE_NAME} 
                    GROUP BY language
                """)
            ).fetchall()
            
            return {
                "total_documents": count,
                "languages": {row[0]: row[1] for row in languages},
                "fts_version": "FTS5",
                "tokenizer": "porter unicode61"
            }
        except Exception as e:
            logger.error(f"Failed to get FTS stats: {e}")
            return {"error": str(e)}
    
    def _sanitize_query(self, query: str) -> str:
        """
        Sanitize query for FTS5 safety.
        Prevents FTS injection attacks.
        """
        # Remove FTS5 special operators that could cause issues
        # Keep basic operators like AND, OR, NOT
        dangerous_chars = ['"', "'", "(", ")", "{", "}", "[", "]", "^", "~"]
        
        sanitized = query
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, " ")
        
        # Collapse multiple spaces
        sanitized = " ".join(sanitized.split())
        
        return sanitized


# Singleton instance
_fts_service: Optional[FTS5SearchService] = None


def get_fts_service() -> FTS5SearchService:
    """Get or create FTS5 search service singleton"""
    global _fts_service
    if _fts_service is None:
        _fts_service = FTS5SearchService()
    return _fts_service


# Feature flag check
def is_fts_enabled() -> bool:
    """Check if full-text search is enabled via environment variable"""
    return os.getenv("ENABLE_FULLTEXT_SEARCH", "false").lower() in ("true", "1", "yes")
