import pytest
from app.models.job import Job

def test_upload_missing_dpdp_fields(client):
    """Test that upload fails without DPDP fields"""
    files = {"file": ("test.txt", b"content", "text/plain")}
    # Missing 'purpose' and 'consent'
    response = client.post("/api/upload", files=files)
    assert response.status_code == 422  # Validation Error

def test_upload_with_dpdp_fields(client, db_session):
    """Test successful upload with DPDP fields"""
    files = {"file": ("test.png", b"fake image content", "image/png")}
    data = {
        "purpose": "KYC",
        "consent": "true"
    }
    response = client.post("/api/upload", files=files, data=data)
    
    assert response.status_code == 200
    job_id = response.json()["job_id"]
    
    # Verify DB persistence
    job = db_session.query(Job).filter(Job.id == job_id).first()
    assert job is not None
    assert job.purpose_code == "KYC"
    assert job.consent_verified is True
    assert job.data_retention_policy is not None

def test_job_status_includes_governance(client, db_session):
    """Test that job status response includes governance fields"""
    # Create a dummy job
    from app.models.job import Job
    import uuid
    from datetime import datetime
    
    job = Job(
        id=str(uuid.uuid4()),
        filename="test.png",
        file_key="key",
        status="completed",
        purpose_code="VERIFICATION",
        consent_verified=True,
        created_at=datetime.now()
    )
    db_session.add(job)
    db_session.commit()
    
    response = client.get(f"/api/jobs/{job.id}")
    assert response.status_code == 200
    data = response.json()
    
    assert data["purpose_code"] == "VERIFICATION"
    assert data["consent_verified"] is True
