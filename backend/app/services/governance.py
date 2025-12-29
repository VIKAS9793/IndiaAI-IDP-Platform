"""
Governance Service for AI Safety, Risk Assessment, and Fairness
Aligns with IndiaAI Mission "Seven Sutras" and NITI Aayog guidelines
"""
import json
from datetime import datetime
from app.models.job import Job

class GovernanceService:
    def __init__(self):
        pass

    def assess_risk(self, document_type: str, content: str, pii_detected: bool) -> dict:
        """
        Assess risk level of the document processing task
        Risk Levels: LOW, MEDIUM, HIGH
        """
        risk_level = "LOW"
        risk_factors = []
        
        # Factor 1: PII Presence
        if pii_detected:
            risk_level = "HIGH"
            risk_factors.append("Contains PII")
            
        # Factor 2: Document Type Sensitivity
        high_risk_docs = ["aadhaar", "pan", "passport", "medical_record", "bank_statement"]
        if any(doc in document_type.lower() for doc in high_risk_docs):
            risk_level = "HIGH"
            risk_factors.append("High Sensitivity Document Type")
            
        # Factor 3: Content Keywords (Basic check)
        sensitive_keywords = ["confidential", "secret", "restricted", "internal use only"]
        if any(keyword in content.lower() for keyword in sensitive_keywords):
            if risk_level != "HIGH":
                risk_level = "MEDIUM"
            risk_factors.append("Sensitive Keywords Detected")
            
        return {
            "level": risk_level,
            "factors": risk_factors,
            "timestamp": datetime.utcnow().isoformat()
        }

    def validate_fairness(self, ocr_results: list) -> dict:
        """
        Check for potential bias or fairness issues in processing
        Example: Check if confidence scores vary significantly by language region
        """
        # Simplified fairness check: Low average confidence might indicate bias against document quality/language
        if not ocr_results:
            return {"status": "UNKNOWN", "details": "No results to analyze"}
            
        avg_confidence = sum(r.confidence for r in ocr_results) / len(ocr_results)
        
        fairness_status = "PASS"
        issues = []
        
        if avg_confidence < 0.6:
            fairness_status = "WARNING"
            issues.append("Low confidence score - potential quality or model bias issue")
            
        return {
            "status": fairness_status,
            "avg_confidence": float(avg_confidence),
            "issues": issues
        }

    def generate_transparency_report(self, job: Job) -> dict:
        """
        Generate a transparency report explaining how AI processed the document
        """
        return {
            "job_id": str(job.id),
            "model_info": {
                "name": "IndiaAI-OCR-v1",
                "type": "Hybrid (PaddleOCR + Custom)",
                "version": "1.2.0"
            },
            "processing_steps": [
                {"step": "Upload", "status": "Completed", "timestamp": str(job.created_at)},
                {"step": "Virus Scan", "status": "Skipped (Dev Mode)", "timestamp": str(job.created_at)},
                {"step": "OCR Extraction", "status": "Completed", "engine": job.ocr_engine},
                {"step": "PII Detection", "status": "Completed", "detected": job.contains_pii},
                {"step": "Risk Assessment", "status": "Completed"}
            ],
            "governance": {
                "purpose": job.purpose_code,
                "consent_verified": job.consent_verified,
                "data_retention": str(job.data_retention_policy)
            },
            "contact": "vikassahani17@gmail.com",  # Actual maintainer
            "disclaimer": "PROTOTYPE - Not affiliated with or endorsed by Government of India",
            "source_code": "https://github.com/VIKAS9793/IndiaAI-IDP-Platform"
        }
