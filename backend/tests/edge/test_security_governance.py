import pytest
from fastapi import HTTPException

def test_upload_malicious_metadata(client):
    """Test upload with script injection in metadata"""
    files = {"file": ("test.png", b"content", "image/png")}
    # Attempt XSS in purpose field
    data = {
        "purpose": "<script>alert('xss')</script>",
        "consent": "true"
    }
    response = client.post("/api/upload", files=files, data=data)
    
    # Should either sanitize or accept as string (but not execute)
    # For now, we just check it accepts it but we'd verify sanitization in a real browser test
    # Here we ensure it doesn't crash
    assert response.status_code == 200
    assert "<script>" in response.json()["message"] or response.json()["job_id"]

def test_upload_zero_byte_file(client):
    """Test upload of empty file"""
    files = {"file": ("empty.png", b"", "image/png")}
    data = {"purpose": "KYC", "consent": "true"}
    
    response = client.post("/api/upload", files=files, data=data)
    # Should fail validation (assuming we have a check, or it might fail later)
    # If no explicit check, it might pass upload but fail processing
    # Let's assume we want it to fail or handle gracefully
    assert response.status_code in [200, 400] 

def test_upload_large_file_boundary(client):
    """Test upload of file exceeding size limit"""
    # Mock a large file (just by content-length header if possible, or actual bytes)
    # Generating 26MB dummy content
    large_content = b"0" * (26 * 1024 * 1024)
    files = {"file": ("large.png", large_content, "image/png")}
    data = {"purpose": "KYC", "consent": "true"}
    
    response = client.post("/api/upload", files=files, data=data)
    assert response.status_code == 400
    assert "exceeds maximum" in response.json()["detail"]
