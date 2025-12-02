"""
Audit Log model for tracking all user actions and system events
Provides accountability and compliance for government document processing
"""
from sqlalchemy import Column, String, DateTime, Text, Index
from sqlalchemy.sql import func
from app.core.database import Base
import uuid


class AuditLog(Base):
    """Audit log model - records all user actions and system events"""
    __tablename__ = "audit_logs"
    
    # Primary key
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Timestamp (indexed for efficient querying)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # User identification (IP-based for now, user_id for future auth)
    user_id = Column(String(255), nullable=True)  # Future: authenticated user ID
    user_ip = Column(String(45), nullable=False, index=True)  # IPv4 or IPv6
    
    # Action details
    action_type = Column(String(50), nullable=False, index=True)
    # Enum: upload, view_job, view_results, download_text, download_json, delete_job, etc.
    
    resource_type = Column(String(50), nullable=False, index=True)
    # Enum: job, document, ocr_result, audit_log
    
    resource_id = Column(String(255), nullable=True, index=True)  # Job ID, document ID, etc.
    
    # Additional context (JSON-serialized)
    details = Column(Text, nullable=True)
    # Example: {"filename": "doc.pdf", "file_size": 12345, "language": "en"}
    
    # Status
    status = Column(String(20), nullable=False)
    # Enum: success, failed, unauthorized, suspicious
    
    error_message = Column(Text, nullable=True)
    
    # Created timestamp
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Create composite indexes for common query patterns
Index('idx_audit_action_timestamp', AuditLog.action_type, AuditLog.timestamp)
Index('idx_audit_resource', AuditLog.resource_type, AuditLog.resource_id)
Index('idx_audit_user_ip_timestamp', AuditLog.user_ip, AuditLog.timestamp)
