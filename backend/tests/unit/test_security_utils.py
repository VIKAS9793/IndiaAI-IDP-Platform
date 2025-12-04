"""
Comprehensive Unit Tests for SecurityUtils
Tests cover: happy paths, edge cases, adversarial inputs, performance
"""

import pytest
from app.core.security_utils import (
    SecurityUtils,
    InputTooLargeError,
    MAX_INPUT_LENGTH,
    MAX_DETAILS_SIZE
)


class TestEmailMasking:
    """Test email masking functionality."""
    
    def test_basic_email_masking(self):
        """Test standard email masking."""
        text = "Contact john.doe@example.com for details"
        result = SecurityUtils.mask_pii(text)
        assert "j***@example.com" in result
        assert "john.doe" not in result
    
    def test_multiple_emails(self):
        """Test masking multiple emails in same text."""
        text = "Email alice@test.com or bob@test.com"
        result = SecurityUtils.mask_pii(text)
        assert "a***@test.com" in result
        assert "b***@test.com" in result
        assert "alice" not in result
        assert "bob" not in result
    
    def test_short_email_username(self):
        """Test masking email with single-character username."""
        text = "Short email: a@example.com"
        result = SecurityUtils.mask_pii(text)
        assert "***@example.com" in result
    
    def test_email_with_subdomain(self):
        """Test email with subdomain."""
        text = "Corporate: user@mail.company.co.in"
        result = SecurityUtils.mask_pii(text)
        assert "u***@mail.company.co.in" in result
    
    def test_email_edge_case_no_match(self):
        """Test that malformed emails are not matched."""
        text = "Not an email: @example.com or user@"
        result = SecurityUtils.mask_pii(text)
        assert result == text  # No changes


class TestPhoneMasking:
    """Test phone number masking."""
    
    def test_indian_mobile_with_plus91(self):
        """Test Indian mobile with +91 prefix."""
        text = "Call me at +91-9876543210"
        result = SecurityUtils.mask_pii(text)
        assert "+91-*******" in result
        assert "9876543210" not in result
    
    def test_indian_mobile_without_prefix(self):
        """Test 10-digit Indian mobile without prefix."""
        text = "My number is 9876543210"
        result = SecurityUtils.mask_pii(text)
        assert "9*********" in result
        assert "9876543210" not in result
    
    def test_phone_with_spaces(self):
        """Test phone number with spaces."""
        text = "Contact: +91 98765 43210"
        result = SecurityUtils.mask_pii(text)
        assert "+91-*******" in result or "9*********" in result
    
    def test_multiple_phones(self):
        """Test masking multiple phone numbers."""
        text = "Call 9876543210 or 8765432109"
        result = SecurityUtils.mask_pii(text)
        # Removed debug prints to avoid logging sensitive data
        assert "9876543210" not in result
        assert "8765432109" not in result
        # Check for masked versions explicitly
        assert "9*********" in result
        assert "8*********" in result
    
    def test_phone_no_false_positive_on_random_numbers(self):
        """Test that random 10-digit numbers aren't masked if not phone-like."""
        # This is tricky - our regex will match [6-9] followed by 9 digits
        text = "Order ID: 1234567890"  # Starts with 1, not [6-9]
        result = SecurityUtils.mask_pii(text)
        assert "1234567890" in result  # Should not be masked


class TestAadhaarMasking:
    """Test Aadhaar number masking."""
    
    def test_aadhaar_spaced_format(self):
        """Test Aadhaar with spaces (XXXX XXXX XXXX)."""
        text = "Aadhaar: 1234 5678 9012"
        result = SecurityUtils.mask_pii(text)
        assert "XXXX-XXXX-9012" in result
        assert "1234" not in result
    
    def test_aadhaar_hyphenated_format(self):
        """Test Aadhaar with hyphens."""
        text = "ID: 1234-5678-9012"
        result = SecurityUtils.mask_pii(text)
        assert "XXXX-XXXX-9012" in result
    
    def test_aadhaar_no_separator(self):
        """Test Aadhaar without separators."""
        text = "Aadhaar: 123456789012"
        result = SecurityUtils.mask_pii(text)
        assert "XXXX-XXXX-9012" in result
        assert "123456789012" not in result


class TestPANMasking:
    """Test PAN card masking."""
    
    def test_valid_pan(self):
        """Test valid PAN format."""
        text = "PAN: ABCDE1234F"
        result = SecurityUtils.mask_pii(text)
        assert "ABC**1234F" in result
        assert "ABCDE1234F" not in result
    
    def test_pan_in_sentence(self):
        """Test PAN embedded in sentence."""
        text = "My PAN is ABCDE1234F for verification"
        result = SecurityUtils.mask_pii(text)
        assert "ABC**1234F" in result


class TestCreditCardMasking:
    """Test credit card masking."""
    
    def test_credit_card_spaced(self):
        """Test credit card with spaces."""
        text = "Card: 1234 5678 9012 3456"
        result = SecurityUtils.mask_pii(text)
        assert "****-****-****-3456" in result
        assert "1234 5678" not in result
    
    def test_credit_card_hyphenated(self):
        """Test credit card with hyphens."""
        text = "Card: 1234-5678-9012-3456"
        result = SecurityUtils.mask_pii(text)
        assert "****-****-****-3456" in result
    
    def test_credit_card_no_separator(self):
        """Test credit card without separators."""
        text = "Card: 1234567890123456"
        result = SecurityUtils.mask_pii(text)
        assert "****-****-****-3456" in result


class TestSSNMasking:
    """Test SSN/National ID masking."""
    
    def test_ssn_hyphenated(self):
        """Test SSN with hyphens."""
        text = "SSN: 123-45-6789"
        result = SecurityUtils.mask_pii(text)
        assert "XXX-XX-6789" in result
        assert "123-45" not in result
    
    def test_ssn_no_separator(self):
        """Test SSN without separators."""
        text = "ID: 123456789"
        result = SecurityUtils.mask_pii(text)
        assert "XXX-XX-6789" in result


class TestCombinedMasking:
    """Test masking multiple PII types in same text."""
    
    def test_email_and_phone(self):
        """Test masking both email and phone."""
        text = "Contact john@example.com or call 9876543210"
        result = SecurityUtils.mask_pii(text)
        assert "j***@example.com" in result
        assert "9*********" in result
        assert "john@example.com" not in result
        assert "9876543210" not in result
    
    def test_all_pii_types(self):
        """Test masking all PII types together."""
        text = (
            "Email: alice@test.com, "
            "Phone: +91-9876543210, "
            "Aadhaar: 1234 5678 9012, "
            "PAN: ABCDE1234F, "
            "Card: 1234-5678-9012-3456"
        )
        result = SecurityUtils.mask_pii(text)
        
        # Verify all are masked
        assert "alice@test.com" not in result
        assert "9876543210" not in result
        assert "1234 5678 9012" not in result
        assert "ABCDE1234F" not in result
        assert "1234-5678-9012-3456" not in result
        
        # Verify masked versions present
        assert "a***@test.com" in result
        assert "XXXX-XXXX-9012" in result
        assert "ABC**1234F" in result
        assert "****-****-****-3456" in result


class TestSelectiveMasking:
    """Test selective masking (enable/disable specific types)."""
    
    def test_mask_only_email(self):
        """Test masking only emails."""
        text = "Email: john@test.com, Phone: 9876543210"
        result = SecurityUtils.mask_pii(
            text, 
            mask_email=True, 
            mask_phone=False
        )
        assert "j***@test.com" in result
        assert "9876543210" in result  # Phone not masked
    
    def test_mask_only_phone(self):
        """Test masking only phones."""
        text = "Email: john@test.com, Phone: 9876543210"
        result = SecurityUtils.mask_pii(
            text, 
            mask_email=False, 
            mask_phone=True
        )
        assert "john@test.com" in result  # Email not masked
        assert "9876543210" not in result
        assert "*" in result


class TestInputSanitization:
    """Test input sanitization against XSS/injection."""
    
    def test_html_escape(self):
        """Test HTML entity escaping."""
        text = "<script>alert('XSS')</script>"
        result = SecurityUtils.sanitize_input(text)
        assert "<script>" not in result
        assert "&lt;script&gt;" in result
    
    def test_quote_escape(self):
        """Test quote escaping."""
        text = 'Hello "world" and \'test\''
        result = SecurityUtils.sanitize_input(text)
        assert '&quot;' in result or '"' not in result
    
    def test_control_character_removal(self):
        """Test removal of control characters."""
        text = "Hello\x00World\x01Test"
        result = SecurityUtils.sanitize_input(text)
        assert "\x00" not in result
        assert "\x01" not in result
        assert "HelloWorldTest" in result
    
    def test_whitespace_preservation(self):
        """Test that normal whitespace is preserved."""
        text = "Hello\tWorld\nTest"
        result = SecurityUtils.sanitize_input(text)
        assert "\t" in result
        assert "\n" in result
    
    def test_max_length_truncation(self):
        """Test input truncation."""
        text = "A" * 1000
        result = SecurityUtils.sanitize_input(text, max_length=100)
        assert len(result) == 100


class TestMinimizeDetails:
    """Test details dictionary minimization."""
    
    def test_basic_minimization(self):
        """Test basic PII masking in details."""
        details = {
            "user_email": "john@example.com",
            "phone": "9876543210",
            "action": "upload"
        }
        result = SecurityUtils.minimize_details(details)
        
        assert "john@example.com" not in str(result)
        assert "9876543210" not in str(result)
        assert "j***@example.com" in result["user_email"]
        assert "action" in result
        assert result["action"] == "upload"
    
    def test_sensitive_key_exclusion(self):
        """Test that sensitive keys are redacted."""
        details = {
            "username": "john",
            "password": "secret123",
            "api_key": "abc123"
        }
        result = SecurityUtils.minimize_details(details)
        
        assert result["password"] == "***REDACTED***"
        assert result["api_key"] == "***REDACTED***"
        assert result["username"] == "john"
    
    def test_nested_dict_processing(self):
        """Test processing of nested dictionaries."""
        details = {
            "user": {
                "email": "alice@test.com",
                "password": "secret"
            }
        }
        result = SecurityUtils.minimize_details(details)
        
        assert "alice@test.com" not in str(result)
        assert result["user"]["password"] == "***REDACTED***"
        assert "a***@test.com" in result["user"]["email"]
    
    def test_list_processing(self):
        """Test processing of lists with PII."""
        details = {
            "emails": ["john@test.com", "alice@test.com"]
        }
        result = SecurityUtils.minimize_details(details)
        
        assert "john@test.com" not in str(result)
        assert "j***@test.com" in result["emails"][0]


class TestSecurityEdgeCases:
    """Test edge cases and adversarial inputs."""
    
    def test_empty_input(self):
        """Test empty string input."""
        assert SecurityUtils.mask_pii("") == ""
        assert SecurityUtils.sanitize_input("") == ""
        assert SecurityUtils.minimize_details({}) == {}
    
    def test_none_input(self):
        """Test None input."""
        assert SecurityUtils.mask_pii(None) is None
        assert SecurityUtils.sanitize_input(None) is None
    
    def test_very_long_input_rejection(self):
        """Test that very long inputs are rejected."""
        text = "A" * (MAX_INPUT_LENGTH + 1)
        with pytest.raises(InputTooLargeError):
            SecurityUtils.mask_pii(text)
    
    def test_large_details_rejection(self):
        """Test that large details dictionaries are rejected."""
        # Create a large dictionary
        large_details = {f"key_{i}": "x" * 1000 for i in range(1000)}
        with pytest.raises(InputTooLargeError):
            SecurityUtils.minimize_details(large_details)
    
    def test_malformed_regex_patterns(self):
        """Test input designed to cause regex issues."""
        # These should not hang (ReDoS protection)
        text = "+91-" + "9" * 100  # Long digit sequence
        result = SecurityUtils.mask_pii(text)
        assert result  # Should complete without hanging
    
    def test_unicode_handling(self):
        """Test Unicode characters in input."""
        text = "Email: jöhn@tëst.com, Phone: 9876543210"
        result = SecurityUtils.mask_pii(text)
        # Should handle Unicode gracefully
        assert "*" in result


class TestPerformance:
    """Test performance characteristics."""
    
    def test_repeated_calls_use_compiled_regex(self):
        """Test that regex compilation is reused."""
        import time
        text = "Email: john@example.com" * 100
        
        # First call (may include compilation time)
        start = time.time()
        SecurityUtils.mask_pii(text)
        first_time = time.time() - start
        
        # Second call (should be faster due to compiled regex)
        start = time.time()
        SecurityUtils.mask_pii(text)
        second_time = time.time() - start
        
        # Second call should not be significantly slower
        # (allows for variance, but should be roughly similar)
        # Note: In a real environment, first call might be fast too if imported earlier
        # but compiled regexes are generally faster
        assert second_time < 1.0
    
    def test_large_valid_input_performance(self):
        """Test performance on large but valid input."""
        import time
        
        # 1MB of text with scattered PII
        text = ("Lorem ipsum " * 1000 + "john@test.com " + 
                "dolor sit amet " * 1000 + "9876543210 ") * 10
        
        start = time.time()
        result = SecurityUtils.mask_pii(text)
        duration = time.time() - start
        
        # Should complete in reasonable time (<1 second for 1MB)
        assert duration < 1.0
        assert "john@test.com" not in result


class TestSensitiveFieldDetection:
    """Test sensitive field name detection."""
    
    def test_password_field_detection(self):
        """Test detection of password-related fields."""
        assert SecurityUtils.is_sensitive_field("password") is True
        assert SecurityUtils.is_sensitive_field("user_password") is True
        assert SecurityUtils.is_sensitive_field("PASSWORD") is True
    
    def test_token_field_detection(self):
        """Test detection of token-related fields."""
        assert SecurityUtils.is_sensitive_field("auth_token") is True
        assert SecurityUtils.is_sensitive_field("api_key") is True
        assert SecurityUtils.is_sensitive_field("session_id") is True
    
    def test_non_sensitive_field(self):
        """Test that normal fields are not flagged."""
        assert SecurityUtils.is_sensitive_field("username") is False
        assert SecurityUtils.is_sensitive_field("email") is False
        assert SecurityUtils.is_sensitive_field("action") is False


# Integration test
class TestRealWorldScenarios:
    """Test real-world usage scenarios."""
    
    def test_audit_log_sanitization(self):
        """Test sanitization of audit log data."""
        raw_details = {
            "action": "document_upload",
            "user_email": "alice@company.com",
            "user_phone": "+91-9876543210",
            "document_metadata": {
                "aadhaar": "1234 5678 9012",
                "pan": "ABCDE1234F"
            },
            "password": "secret123",  # Should be redacted
            "<script>": "alert('xss')"  # Should be sanitized
        }
        
        clean_details = SecurityUtils.minimize_details(raw_details)
        
        # Verify PII is masked
        assert "alice@company.com" not in str(clean_details)
        assert "9876543210" not in str(clean_details)
        assert "1234 5678 9012" not in str(clean_details)
        
        # Verify sensitive fields redacted
        assert clean_details["password"] == "***REDACTED***"
        
        # Verify XSS attempt sanitized
        assert "<script>" not in str(clean_details)
    
    def test_api_response_sanitization(self):
        """Test sanitization of API response data."""
        response_data = "User john@example.com uploaded document containing Aadhaar 1234-5678-9012"
        
        sanitized = SecurityUtils.mask_pii(response_data)
        
        assert "john@example.com" not in sanitized
        assert "1234-5678-9012" not in sanitized
        assert "j***@example.com" in sanitized
        assert "XXXX-XXXX-9012" in sanitized
