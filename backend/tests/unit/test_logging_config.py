"""
Unit tests for logging configuration
"""
import pytest
import logging
from pathlib import Path
from app.core.logging_config import setup_logging, get_logger


class TestLoggingSetup:
    """Tests for logging configuration"""
    
    def test_setup_logging_development_mode(self):
        """Test that pretty logging is enabled in development"""
        logger = setup_logging(level="INFO", json_logs=False)
        
        assert logger is not None
        assert logger.level == logging.INFO
        assert len(logger.handlers) > 0
        
    def test_setup_logging_production_mode(self):
        """Test that JSON logging is enabled in production"""
        logger = setup_logging(level="WARNING", json_logs=True)
        
        assert logger is not None
        assert logger.level == logging.WARNING
        assert len(logger.handlers) > 0
        
    def test_get_logger_returns_logger(self):
        """Test that get_logger returns a logger instance"""
        logger = get_logger(__name__)
        
        assert logger is not None
        assert isinstance(logger, logging.Logger)
        assert logger.name == __name__
        
    def test_logging_message(self, caplog):
        """Test that logging messages are captured"""
        logger = get_logger("test_module")
        
        with caplog.at_level(logging.INFO):
            logger.info("Test message", extra={"test_key": "test_value"})
            
        assert "Test message" in caplog.text
