"""
Vector Search Service for Document Similarity
Uses ChromaDB for storage and sentence-transformers for embeddings.

Aligns with IndiaAI Governance Sutras:
- Transparency: Similarity scores are explainable
- Privacy: All processing local (no cloud API)
- Accountability: All embeddings tracked in audit logs
"""
import os
import logging
from typing import List, Dict, Optional
from datetime import datetime

# Feature flag - disabled by default
ENABLE_VECTOR_SEARCH = os.getenv("ENABLE_VECTOR_SEARCH", "false").lower() == "true"

logger = logging.getLogger(__name__)


class VectorService:
    """
    Document vector search using ChromaDB and sentence-transformers.
    
    Features:
    - Document similarity search
    - Duplicate detection
    - Semantic clustering
    - 100% local processing (no cloud APIs)
    """
    
    def __init__(self, collection_name: str = "documents"):
        """
        Initialize the vector service.
        
        Args:
            collection_name: Name of the ChromaDB collection
        """
        self.collection_name = collection_name
        self._client = None
        self._collection = None
        self._model = None
        self._initialized = False
        
    def _lazy_init(self):
        """Lazy initialization to avoid import overhead if feature is disabled."""
        if self._initialized:
            return
            
        if not ENABLE_VECTOR_SEARCH:
            logger.warning("Vector search is disabled. Set ENABLE_VECTOR_SEARCH=true to enable.")
            return
            
        try:
            import chromadb
            from sentence_transformers import SentenceTransformer
            
            # Initialize ChromaDB (persistent storage)
            persist_dir = os.getenv("CHROMADB_PERSIST_DIR", "./data/chromadb")
            os.makedirs(persist_dir, exist_ok=True)
            
            self._client = chromadb.PersistentClient(path=persist_dir)
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "IndiaAI IDP document embeddings"}
            )
            
            # Load embedding model (80MB, runs on CPU)
            # all-MiniLM-L6-v2 is optimized for semantic similarity
            model_name = os.getenv(
                "EMBEDDING_MODEL", 
                "sentence-transformers/all-MiniLM-L6-v2"
            )
            self._model = SentenceTransformer(model_name)
            
            self._initialized = True
            logger.info(f"VectorService initialized with model: {model_name}")
            
        except ImportError as e:
            logger.error(f"Failed to import vector dependencies: {e}")
            logger.error("Install with: pip install chromadb sentence-transformers")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize VectorService: {e}")
            raise
    
    def add_document(
        self, 
        job_id: str, 
        text: str, 
        metadata: Optional[Dict] = None
    ) -> bool:
        """
        Add a document embedding to the vector store.
        
        Args:
            job_id: Unique job identifier
            text: Document text to embed
            metadata: Optional metadata (filename, doc_type, etc.)
            
        Returns:
            True if successful, False otherwise
        """
        self._lazy_init()
        
        if not self._initialized:
            return False
            
        if not text or not text.strip():
            logger.warning(f"Empty text for job {job_id}, skipping embedding")
            return False
            
        try:
            # Generate embedding
            embedding = self._model.encode(text, convert_to_numpy=True).tolist()
            
            # Prepare metadata
            doc_metadata = {
                "job_id": str(job_id),
                "created_at": datetime.utcnow().isoformat(),
                "text_length": len(text),
            }
            if metadata:
                doc_metadata.update(metadata)
            
            # Add to collection
            self._collection.add(
                ids=[str(job_id)],
                embeddings=[embedding],
                documents=[text[:10000]],  # Truncate for storage
                metadatas=[doc_metadata]
            )
            
            logger.info(f"Added embedding for job {job_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add embedding for job {job_id}: {e}")
            return False
    
    def find_similar(
        self, 
        text: str, 
        n_results: int = 5,
        min_similarity: float = 0.5
    ) -> List[Dict]:
        """
        Find documents similar to the given text.
        
        Args:
            text: Query text
            n_results: Maximum number of results
            min_similarity: Minimum similarity threshold (0-1)
            
        Returns:
            List of similar documents with scores
        """
        self._lazy_init()
        
        if not self._initialized:
            return []
            
        if not text or not text.strip():
            return []
            
        try:
            # Query the collection
            results = self._collection.query(
                query_texts=[text],
                n_results=n_results,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results with similarity scores
            similar_docs = []
            if results and results["ids"] and results["ids"][0]:
                for i, doc_id in enumerate(results["ids"][0]):
                    # ChromaDB returns distances, convert to similarity
                    distance = results["distances"][0][i] if results["distances"] else 0
                    similarity = 1 - (distance / 2)  # Normalize to 0-1
                    
                    if similarity >= min_similarity:
                        similar_docs.append({
                            "job_id": doc_id,
                            "similarity": round(similarity, 4),
                            "text_preview": (results["documents"][0][i][:200] + "...") 
                                if results["documents"] else None,
                            "metadata": results["metadatas"][0][i] 
                                if results["metadatas"] else {}
                        })
            
            return sorted(similar_docs, key=lambda x: x["similarity"], reverse=True)
            
        except Exception as e:
            logger.error(f"Failed to find similar documents: {e}")
            return []
    
    def find_similar_by_job(
        self, 
        job_id: str, 
        n_results: int = 5,
        min_similarity: float = 0.5
    ) -> List[Dict]:
        """
        Find documents similar to an existing job.
        
        Args:
            job_id: Job ID to find similar documents for
            n_results: Maximum number of results
            min_similarity: Minimum similarity threshold
            
        Returns:
            List of similar documents (excluding the query job)
        """
        self._lazy_init()
        
        if not self._initialized:
            return []
            
        try:
            # Get the document for this job
            result = self._collection.get(
                ids=[str(job_id)],
                include=["documents"]
            )
            
            if not result["documents"] or not result["documents"][0]:
                logger.warning(f"No document found for job {job_id}")
                return []
                
            text = result["documents"][0]
            
            # Find similar (excluding self)
            similar = self.find_similar(text, n_results + 1, min_similarity)
            
            # Remove the query job from results
            return [doc for doc in similar if doc["job_id"] != str(job_id)][:n_results]
            
        except Exception as e:
            logger.error(f"Failed to find similar for job {job_id}: {e}")
            return []
    
    def delete_document(self, job_id: str) -> bool:
        """
        Delete a document embedding from the store.
        Called during job cleanup (DPDP compliance).
        
        Args:
            job_id: Job ID to delete
            
        Returns:
            True if deleted, False otherwise
        """
        self._lazy_init()
        
        if not self._initialized:
            return False
            
        try:
            self._collection.delete(ids=[str(job_id)])
            logger.info(f"Deleted embedding for job {job_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete embedding for job {job_id}: {e}")
            return False
    
    def get_stats(self) -> Dict:
        """
        Get vector store statistics.
        
        Returns:
            Dictionary with collection stats
        """
        self._lazy_init()
        
        if not self._initialized:
            return {"enabled": False, "error": "Vector search not enabled"}
            
        try:
            count = self._collection.count()
            return {
                "enabled": True,
                "collection": self.collection_name,
                "document_count": count,
                "model": os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            }
        except Exception as e:
            return {"enabled": True, "error": str(e)}


# Singleton instance
_vector_service: Optional[VectorService] = None


def get_vector_service() -> VectorService:
    """Get the singleton vector service instance."""
    global _vector_service
    if _vector_service is None:
        _vector_service = VectorService()
    return _vector_service
