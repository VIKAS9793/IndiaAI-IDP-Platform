"""
Unit tests for upload route security enhancements
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from io import BytesIO


class TestUploadSecurity:
    """Tests for upload route security features"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        from main import app
        return TestClient(app)
    
    def test_invalid_file_extension_rejected(self, client):
        """Test that files with invalid extensions are rejected"""
        # Create a fake file with .exe extension but valid MIME type to test extension validation
        file_content = b"fake executable content"
        files = {"file": ("malware.exe", BytesIO(file_content), "application/pdf")}  # Valid MIME, invalid ext
        data = {
            "language": "auto",
            "ocr_engine": "chandra",
            "purpose": "VERIFICATION",
            "consent": "true"
        }
        
        response = client.post("/api/upload", files=files, data=data)
        
        assert response.status_code == 400
        assert "Invalid file extension" in response.json()["detail"]
        
    def test_invalid_mime_type_rejected_first(self, client):
        """Test that invalid MIME types are rejected before extension check"""
        file_content = b"content"
        files = {"file": ("document.pdf", BytesIO(file_content), "application/octet-stream")}
        data = {
            "language": "auto",
            "ocr_engine": "chandra",
            "purpose": "VERIFICATION",
            "consent": "true"
        }
        
        response = client.post("/api/upload", files=files, data=data)
        
        assert response.status_code == 400
        assert "File type" in response.json()["detail"] and "not allowed" in response.json()["detail"]
        
    def test_valid_pdf_extension_accepted(self, client):
        """Test that valid PDF extension is accepted (up to storage)"""
        file_content = b"%PDF-1.4 fake pdf content"
        files = {"file": ("document.pdf", BytesIO(file_content), "application/pdf")}
        data = {
            "language": "auto",
            "ocr_engine": "chandra",
            "purpose": "KYC",
            "consent": "true"
        }
        
        # Mock only storage and queue - DB is provided by client fixture
        with patch('app.services.storage.get_storage_service') as mock_storage:
            with patch('app.services.queue.get_queue_service') as mock_queue:
                mock_storage_instance = MagicMock()
                mock_storage_instance.upload.return_value = "http://fake-storage-url"
                mock_storage.return_value = mock_storage_instance
                
                mock_queue_instance = MagicMock()
                mock_queue.return_value = mock_queue_instance
                
                response = client.post("/api/upload", files=files, data=data)
                
                # Should succeed
                assert response.status_code == 200
                assert "job_id" in response.json()
                
    def test_valid_image_extensions_accepted(self, client):
        """Test that valid image extensions are accepted"""
        for ext, mime in [("png", "image/png"), ("jpg", "image/jpeg"), ("jpeg", "image/jpeg")]:
            file_content = b"fake image content"
            files = {"file": (f"image.{ext}", BytesIO(file_content), mime)}
            data = {
                "language": "auto",
                "ocr_engine": "chandra",
                "purpose": "VERIFICATION",
                "consent": "true"
            }
            
            with patch('app.services.storage.get_storage_service') as mock_storage:
                with patch('app.services.queue.get_queue_service') as mock_queue:
                    mock_storage_instance = MagicMock()
                    mock_storage_instance.upload.return_value = "http://fake-url"
                    mock_storage.return_value = mock_storage_instance
                    
                    mock_queue_instance = MagicMock()
                    mock_queue.return_value = mock_queue_instance
                    
                    response = client.post("/api/upload", files=files, data=data)
                    
                    # Should succeed
                    assert response.status_code == 200
                    
    def test_case_insensitive_extension_validation(self, client):
        """Test that extension validation is case-insensitive"""
        file_content = b"%PDF-1.4"
        files = {"file": ("DOCUMENT.PDF", BytesIO(file_content), "application/pdf")}
        data = {
            "language": "auto",
            "ocr_engine": "chandra",
            "purpose": "KYC",
            "consent": "true"
        }
        
        with patch('app.services.storage.get_storage_service') as mock_storage:
            with patch('app.services.queue.get_queue_service') as mock_queue:
                mock_storage_instance = MagicMock()
                mock_storage_instance.upload.return_value = "http://fake-url"
                mock_storage.return_value = mock_storage_instance
                
                mock_queue_instance = MagicMock()
                mock_queue.return_value = mock_queue_instance
                
                response = client.post("/api/upload", files=files, data=data)
                
                # Should succeed
                assert response.status_code == 200
                
    def test_file_without_extension_rejected(self, client):
        """Test that files without extensions are rejected"""
        file_content = b"content"
        files = {"file": ("noextension", BytesIO(file_content), "application/pdf")}  # Valid MIME, no extension
        data = {
            "language": "auto",
            "ocr_engine": "chandra",
            "purpose": "VERIFICATION",
            "consent": "true"
        }
        
        response = client.post("/api/upload", files=files, data=data)
        
        assert response.status_code == 400
        assert "Invalid file extension" in response.json()["detail"]
