"""
Audit Service for logging user actions and system events
"""
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from fastapi import Request
import json
from datetime import datetime

from app.core.security_utils import SecurityUtils

class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log_action(
        self,
        action_type: str,
        resource_type: str,
        resource_id: str = None,
        details: dict = None,
        status: str = "success",
        error_message: str = None,
        request: Request = None,
        user_id: str = None,
        user_ip: str = None
    ) -> AuditLog:
        """
        Log an action to the audit trail
        """
        # Determine IP address
        ip_address = user_ip
        if not ip_address and request:
            ip_address = request.client.host
            # Check for X-Forwarded-For header if behind proxy
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                ip_address = forwarded.split(",")[0]
        
        if not ip_address:
            ip_address = "unknown"

        # Security Hardening: Sanitize and Minimize
        # 1. Sanitize inputs to prevent injection
        safe_action_type = SecurityUtils.sanitize_input(action_type)
        safe_resource_type = SecurityUtils.sanitize_input(resource_type)
        safe_resource_id = SecurityUtils.sanitize_input(resource_id)
        safe_user_id = SecurityUtils.sanitize_input(user_id)
        
        # 2. Minimize and Mask details (PII protection)
        safe_details = None
        if details:
            safe_details = SecurityUtils.minimize_details(details)

        # Create audit log entry
        audit_log = AuditLog(
            user_id=safe_user_id,
            user_ip=ip_address,
            action_type=safe_action_type,
            resource_type=safe_resource_type,
            resource_id=safe_resource_id,
            details=json.dumps(safe_details, default=str) if safe_details else None,
            status=status,
            error_message=error_message
        )
        
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        
        return audit_log

    def get_logs(
        self,
        skip: int = 0,
        limit: int = 100,
        action_type: str = None,
        resource_type: str = None,
        user_ip: str = None
    ):
        """
        Retrieve audit logs with filtering
        """
        query = self.db.query(AuditLog)
        
        if action_type:
            query = query.filter(AuditLog.action_type == action_type)
        
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
            
        if user_ip:
            query = query.filter(AuditLog.user_ip == user_ip)
            
        return query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
