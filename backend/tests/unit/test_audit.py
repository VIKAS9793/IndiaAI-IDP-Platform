import pytest
from app.services.audit import AuditService
from app.models.audit_log import AuditLog
from fastapi import Request
from unittest.mock import Mock

@pytest.fixture
def mock_request():
    request = Mock(spec=Request)
    request.client = Mock()
    request.client.host = "127.0.0.1"
    request.headers = {"user-agent": "test-agent"}
    return request

def test_log_action_success(db_session, mock_request):
    """Test successful logging of an action"""
    audit_service = AuditService(db_session)
    
    audit_service.log_action(
        action_type="test_action",
        resource_type="job",
        resource_id="123",
        details={"foo": "bar"},
        request=mock_request
    )
    
    # Verify log in DB
    log = db_session.query(AuditLog).first()
    assert log is not None
    assert log.action_type == "test_action"
    assert log.resource_id == "123"
    assert log.user_ip == "127.0.0.1"
    assert "bar" in log.details

def test_log_action_no_request(db_session):
    """Test logging without a request object"""
    audit_service = AuditService(db_session)
    
    audit_service.log_action(
        action_type="system_action",
        resource_type="system",
        resource_id="sys",
        status="success"
    )
    
    log = db_session.query(AuditLog).first()
    assert log is not None
    assert log.user_ip == "unknown"
