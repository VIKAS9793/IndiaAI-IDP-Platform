"""
Security Utilities (Production-Grade)
Provides helper functions for PII masking, input sanitization, and data minimization.

Key Features:
- Pre-compiled regexes for performance
- Comprehensive PII detection (Email, Phone, Aadhaar, PAN, Credit Cards)
- ReDoS protection via input length limits
- Structured logging for security events
- Type safety and validation
"""

import re
import html
import logging
from typing import Dict, Any, Optional
from functools import lru_cache

logger = logging.getLogger(__name__)

# Configuration
MAX_INPUT_LENGTH = 10_000_000  # 10MB limit for PII masking
MAX_DETAILS_SIZE = 100_000      # 100KB limit for audit details

# Pre-compiled regex patterns for performance
# Email: standard RFC-like pattern with reasonable length limits
EMAIL_PATTERN = re.compile(
    r'\b[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Z|a-z]{2,}\b'
)

# Phone: Indian mobile numbers (10 digits, optionally prefixed with +91)
# Uses negative lookbehind (?<!\w) instead of \b to match +91 (non-word char) correctly
PHONE_PATTERN = re.compile(
    r'(?<!\w)(?:\+91[-\s]?)?[6-9](?:[-\s]?\d){9}\b'
)

# Aadhaar: 12-digit number (often formatted as XXXX XXXX XXXX)
# Matches both spaced and unspaced formats
AADHAAR_PATTERN = re.compile(
    r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'
)

# PAN: Indian tax ID (format: ABCDE1234F)
PAN_PATTERN = re.compile(
    r'\b[A-Z]{5}\d{4}[A-Z]\b'
)

# Credit Card: 13-19 digits (with optional spaces/dashes)
# Luhn algorithm validation is expensive, so we use simple pattern matching
CREDIT_CARD_PATTERN = re.compile(
    r'\b(?:\d{4}[-\s]?){3}\d{1,7}\b'
)

# SSN/National ID: Common formats (XXX-XX-XXXX or 9 digits)
SSN_PATTERN = re.compile(
    r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b'
)


class SecurityUtilsError(Exception):
    """Base exception for SecurityUtils errors."""
    pass


class InputTooLargeError(SecurityUtilsError):
    """Raised when input exceeds size limits."""
    pass


class SecurityUtils:
    """
    Security utilities for PII masking and input sanitization.
    
    All methods are thread-safe and optimized for high-volume processing.
    """
    
    @staticmethod
    def mask_pii(
        text: str,
        mask_email: bool = True,
        mask_phone: bool = True,
        mask_aadhaar: bool = True,
        mask_pan: bool = True,
        mask_credit_card: bool = True,
        mask_ssn: bool = True
    ) -> str:
        """
        Masks PII (Email, Phone, Aadhaar, PAN, Credit Cards) in the given text.
        
        Args:
            text: Input string (can be JSON string or plain text)
            mask_email: Whether to mask email addresses
            mask_phone: Whether to mask phone numbers
            mask_aadhaar: Whether to mask Aadhaar numbers
            mask_pan: Whether to mask PAN card numbers
            mask_credit_card: Whether to mask credit card numbers
            mask_ssn: Whether to mask SSN/National IDs
            
        Returns:
            Masked string
            
        Raises:
            InputTooLargeError: If input exceeds MAX_INPUT_LENGTH
        """
        if not text:
            return text
        
        # Protection against DoS via large inputs
        if len(text) > MAX_INPUT_LENGTH:
            logger.warning(
                f"Input too large for PII masking: {len(text)} bytes "
                f"(limit: {MAX_INPUT_LENGTH})"
            )
            raise InputTooLargeError(
                f"Input size {len(text)} exceeds limit {MAX_INPUT_LENGTH}"
            )
        
        # Apply masking in order of sensitivity (most sensitive first)
        if mask_credit_card:
            text = SecurityUtils._mask_credit_cards(text)
        
        if mask_aadhaar:
            text = SecurityUtils._mask_aadhaar(text)
        
        if mask_ssn:
            text = SecurityUtils._mask_ssn(text)
        
        if mask_pan:
            text = SecurityUtils._mask_pan(text)
        
        if mask_email:
            text = SecurityUtils._mask_emails(text)
        
        if mask_phone:
            text = SecurityUtils._mask_phones(text)
        
        return text
    
    @staticmethod
    def _mask_emails(text: str) -> str:
        """Mask email addresses: j***@domain.com"""
        def mask_match(match):
            email = match.group(0)
            try:
                user, domain = email.split('@', 1)
                if len(user) > 1:
                    masked_user = user[0] + "***"
                else:
                    masked_user = "***"
                return f"{masked_user}@{domain}"
            except ValueError:
                # Malformed email (shouldn't happen with regex, but defensive)
                logger.debug(f"Malformed email during masking: {email}")
                return "***@***.com"
        
        return EMAIL_PATTERN.sub(mask_match, text)
    
    @staticmethod
    def _mask_phones(text: str) -> str:
        """
        Mask phone numbers: +91-98******* or 9*********
        
        Fixed to handle multiple phones and spaces correctly.
        """
        def mask_match(match):
            phone = match.group(0)
            
            # Extract only digits for processing
            digits = re.sub(r'\D', '', phone)
            
            # Determine mask based on original format
            if len(digits) >= 10:
                # Check if original had +91 prefix
                if phone.startswith('+91'):
                    return "+91-*******"
                else:
                    # For 10-digit numbers, show first digit + 9 stars
                    return digits[0] + "*********"
            else:
                # Fallback for unexpected formats
                return "*" * len(digits)
        
        return PHONE_PATTERN.sub(mask_match, text)
    
    @staticmethod
    def _mask_aadhaar(text: str) -> str:
        """Mask Aadhaar numbers: XXXX-XXXX-1234"""
        def mask_match(match):
            aadhaar = match.group(0)
            # Keep last 4 digits visible (common practice)
            digits = re.sub(r'\D', '', aadhaar)
            if len(digits) == 12:
                return "XXXX-XXXX-" + digits[-4:]
            else:
                return "XXXX-XXXX-XXXX"
        
        return AADHAAR_PATTERN.sub(mask_match, text)
    
    @staticmethod
    def _mask_pan(text: str) -> str:
        """Mask PAN card numbers: XXX**1234X"""
        def mask_match(match):
            pan = match.group(0)
            # Mask middle characters, keep first 3 and last 2
            if len(pan) == 10:
                return pan[:3] + "**" + pan[5:9] + pan[-1]
            else:
                return "XXXXX****X"
        
        return PAN_PATTERN.sub(mask_match, text)
    
    @staticmethod
    def _mask_credit_cards(text: str) -> str:
        """Mask credit card numbers: ****-****-****-1234"""
        def mask_match(match):
            card = match.group(0)
            digits = re.sub(r'\D', '', card)
            if len(digits) >= 13:
                # Keep last 4 digits visible
                return "****-****-****-" + digits[-4:]
            else:
                return "****-****-****-****"
        
        return CREDIT_CARD_PATTERN.sub(mask_match, text)
    
    @staticmethod
    def _mask_ssn(text: str) -> str:
        """Mask SSN/National ID: XXX-XX-1234"""
        def mask_match(match):
            ssn = match.group(0)
            digits = re.sub(r'\D', '', ssn)
            if len(digits) == 9:
                return "XXX-XX-" + digits[-4:]
            else:
                return "XXX-XX-XXXX"
        
        return SSN_PATTERN.sub(mask_match, text)

    @staticmethod
    def sanitize_input(text: str, max_length: Optional[int] = None) -> str:
        """
        Sanitizes input string to prevent Injection/XSS.
        
        Args:
            text: Input string
            max_length: Optional maximum length (truncates if exceeded)
            
        Returns:
            Sanitized string
            
        Raises:
            InputTooLargeError: If max_length exceeded and truncation not desired
        """
        if not text:
            return text
        
        # Length check
        if max_length and len(text) > max_length:
            logger.warning(f"Input truncated from {len(text)} to {max_length} chars")
            text = text[:max_length]
        
        # 1. HTML Escape (converts <, >, &, ", ' to entities)
        sanitized = html.escape(text, quote=True)
        
        # 2. Remove control characters (keep printable + whitespace)
        # Allow: printable, space, tab, newline
        sanitized = "".join(
            ch for ch in sanitized 
            if ch.isprintable() or ch in (' ', '\t', '\n', '\r')
        )
        
        # 3. Strip leading/trailing whitespace
        sanitized = sanitized.strip()
        
        return sanitized

    @staticmethod
    def minimize_details(details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Removes unnecessary keys and masks PII in details dictionary for audit logging.
        
        Args:
            details: Dictionary containing action details
            
        Returns:
            Minimized and sanitized dictionary
            
        Raises:
            InputTooLargeError: If details dictionary is too large
        """
        if not details:
            return {}
        
        # Serialize to check size (rough approximation)
        import json
        try:
            details_size = len(json.dumps(details, default=str))
            if details_size > MAX_DETAILS_SIZE:
                logger.warning(
                    f"Details dictionary too large: {details_size} bytes "
                    f"(limit: {MAX_DETAILS_SIZE})"
                )
                raise InputTooLargeError(
                    f"Details size {details_size} exceeds limit {MAX_DETAILS_SIZE}"
                )
        except (TypeError, ValueError) as e:
            logger.error(f"Failed to serialize details for size check: {e}")
            # Continue with processing, but log the error
        
        # Create a copy to avoid modifying original
        clean_details = {}
        
        # List of sensitive keys to exclude entirely
        EXCLUDED_KEYS = {
            'password', 'secret', 'token', 'api_key', 'private_key',
            'session_id', 'csrf_token', 'auth_token'
        }
        
        for key, value in details.items():
            # Sanitize key to prevent injection via keys
            clean_key = SecurityUtils.sanitize_input(key, max_length=255)
            
            # Skip sensitive keys (check original key)
            if key.lower() in EXCLUDED_KEYS:
                clean_details[clean_key] = "***REDACTED***"
                continue
            
            # Process string values
            if isinstance(value, str):
                # Mask PII
                masked = SecurityUtils.mask_pii(value)
                # Sanitize
                clean_details[clean_key] = SecurityUtils.sanitize_input(
                    masked, 
                    max_length=1000  # Limit individual field length
                )
            
            # Process nested dictionaries (recursive)
            elif isinstance(value, dict):
                clean_details[clean_key] = SecurityUtils.minimize_details(value)
            
            # Process lists (mask PII in string elements)
            elif isinstance(value, list):
                clean_details[clean_key] = [
                    SecurityUtils.mask_pii(str(item)) if isinstance(item, str) else item
                    for item in value
                ]
            
            # Keep primitives as-is
            else:
                clean_details[clean_key] = value
        
        return clean_details
    
    @staticmethod
    @lru_cache(maxsize=128)
    def is_sensitive_field(field_name: str) -> bool:
        """
        Checks if a field name indicates sensitive data.
        
        Args:
            field_name: Field name to check
            
        Returns:
            True if field is sensitive, False otherwise
            
        Note:
            This method is cached for performance.
        """
        sensitive_patterns = {
            'password', 'secret', 'token', 'key', 'credential',
            'ssn', 'aadhaar', 'pan', 'credit', 'card', 'cvv',
            'pin', 'otp', 'session', 'auth'
        }
        
        field_lower = field_name.lower()
        return any(pattern in field_lower for pattern in sensitive_patterns)


# Convenience functions for common use cases
def mask_pii_quick(text: str) -> str:
    """Quick PII masking with default settings."""
    return SecurityUtils.mask_pii(text)


def sanitize_quick(text: str) -> str:
    """Quick input sanitization."""
    return SecurityUtils.sanitize_input(text)
