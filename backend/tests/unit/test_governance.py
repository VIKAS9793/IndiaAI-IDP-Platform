import pytest
from app.services.governance import GovernanceService

@pytest.fixture
def governance_service():
    return GovernanceService()

def test_assess_risk_high_pii(governance_service):
    """Test high risk assessment when PII is detected"""
    result = governance_service.assess_risk(
        document_type="unknown",
        content="Some content",
        pii_detected=True
    )
    assert result["level"] == "HIGH"
    assert "Contains PII" in result["factors"]

def test_assess_risk_medium_keyword(governance_service):
    """Test medium risk assessment based on sensitive keywords"""
    result = governance_service.assess_risk(
        document_type="unknown",
        content="This document contains confidential financial data.",
        pii_detected=False
    )
    assert result["level"] == "MEDIUM"
    assert "Sensitive Keywords Detected" in result["factors"]

def test_assess_risk_low(governance_service):
    """Test low risk assessment for benign content"""
    result = governance_service.assess_risk(
        document_type="public",
        content="This is a public notice.",
        pii_detected=False
    )
    assert result["level"] == "LOW"

def test_validate_fairness_pass(governance_service):
    """Test fairness validation passing with high confidence"""
    # Mock OCR result object
    class MockResult:
        confidence = 0.95
        
    results = [MockResult(), MockResult()]
    validation = governance_service.validate_fairness(results)
    
    assert validation["status"] == "PASS"
    assert validation["avg_confidence"] == 0.95

def test_validate_fairness_fail(governance_service):
    """Test fairness validation failing with low confidence"""
    class MockResult:
        confidence = 0.40
        
    results = [MockResult()]
    validation = governance_service.validate_fairness(results)
    
    assert validation["status"] == "WARNING"
    assert "Low confidence score - potential quality or model bias issue" in validation["issues"]
