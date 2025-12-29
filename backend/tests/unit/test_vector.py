"""
Unit tests for VectorService
"""
import pytest
from unittest.mock import patch, MagicMock


class TestVectorServiceInitialization:
    """Tests for VectorService initialization"""
    
    def test_lazy_init_disabled(self):
        """Test that service doesn't initialize when feature is disabled"""
        with patch.dict('os.environ', {'ENABLE_VECTOR_SEARCH': 'false'}):
            from app.services.vector import VectorService
            service = VectorService()
            assert service._initialized is False
    
    def test_lazy_init_enabled(self):
        """Test that service can be initialized when feature is enabled"""
        with patch.dict('os.environ', {'ENABLE_VECTOR_SEARCH': 'true'}):
            # Import service
            from app.services.vector import VectorService
            service = VectorService()
            
            # Verify service created (initialization happens on first use)
            assert service._initialized is False  # Lazy init - hasn't been called yet
            assert service._client is None
            assert service._collection is None


class TestVectorServiceOperations:
    """Tests for VectorService CRUD operations"""
    
    @pytest.mark.skip(reason="Requires chromadb dependency - skipping for CI")
    @pytest.fixture
    def mock_vector_service(self):
        """Create a mocked vector service"""
        with patch.dict('os.environ', {'ENABLE_VECTOR_SEARCH': 'true'}):
            with patch('chromadb.PersistentClient') as mock_client_class:
                with patch('sentence_transformers.SentenceTransformer') as mock_st_class:
                    mock_client = MagicMock()
                    mock_collection = MagicMock()
                    mock_client_class.return_value = mock_client
                    mock_client.get_or_create_collection.return_value = mock_collection
                    
                    mock_model = MagicMock()
                    mock_model.encode.return_value = MagicMock(tolist=lambda: [0.1] * 384)
                    mock_st_class.return_value = mock_model
                    
                    from app.services.vector import VectorService
                    service = VectorService()
                    service._lazy_init()
                    
                    yield service, mock_collection

    @pytest.mark.skip(reason="Requires chromadb dependency - skipping for CI")
    def test_add_document_success(self, mock_vector_service):
        """Test adding a document embedding"""
        service, mock_collection = mock_vector_service
        
        result = service.add_document(
            job_id="test-job-123",
            text="This is a test document for embeddings",
            metadata={"filename": "test.pdf"}
        )
        
        assert result is True
        mock_collection.add.assert_called_once()
    
    @pytest.mark.skip(reason="Requires chromadb dependency - skipping for CI")
    def test_add_document_empty_text(self, mock_vector_service):
        """Test that empty text returns False"""
        service, mock_collection = mock_vector_service
        
        result = service.add_document(
            job_id="test-job-123",
            text="",
            metadata={}
        )
        
        assert result is False
        mock_collection.add.assert_not_called()
    
    @pytest.mark.skip(reason="Requires chromadb dependency - skipping for CI")
    def test_find_similar(self, mock_vector_service):
        """Test finding similar documents"""
        service, mock_collection = mock_vector_service
        
        # Mock query results
        mock_collection.query.return_value = {
            "ids": [["job-1", "job-2"]],
            "documents": [["similar doc 1", "similar doc 2"]],
            "distances": [[0.2, 0.4]],
            "metadatas": [[{"filename": "a.pdf"}, {"filename": "b.pdf"}]]
        }
        
        results = service.find_similar("test query", n_results=5)
        
        assert len(results) == 2
        assert results[0]["job_id"] == "job-1"
        assert results[0]["similarity"] > results[1]["similarity"]
    
    @pytest.mark.skip(reason="Requires chromadb dependency - skipping for CI")
    def test_delete_document(self, mock_vector_service):
        """Test deleting a document embedding"""
        service, mock_collection = mock_vector_service
        
        result = service.delete_document("test-job-123")
        
        assert result is True
        mock_collection.delete.assert_called_with(ids=["test-job-123"])


class TestVectorServiceStats:
    """Tests for vector store statistics"""
    
    def test_get_stats_disabled(self):
        """Test stats when feature is disabled"""
        with patch.dict('os.environ', {'ENABLE_VECTOR_SEARCH': 'false'}):
            from app.services.vector import VectorService
            service = VectorService()
            
            stats = service.get_stats()
            
            assert stats["enabled"] is False
            assert "error" in stats
