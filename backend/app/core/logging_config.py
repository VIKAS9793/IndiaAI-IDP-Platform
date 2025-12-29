"""
Centralized logging configuration for the IndiaAI IDP Platform
Provides structured JSON logging for production and pretty logging for development
"""
import logging
import sys
from typing import Optional
from pythonjsonlogger import jsonlogger
from pathlib import Path


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """
    Custom JSON formatter that adds standard fields to all log records
    """
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        
        # Add standard fields
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        log_record['module'] = record.module
        log_record['function'] = record.funcName
        log_record['line'] = record.lineno
        
        # Add process/thread info for debugging
        log_record['process'] = record.process
        log_record['thread'] = record.thread


def setup_logging(
    level: str = "INFO",
    json_logs: bool = True,
    log_file: Optional[Path] = None
) -> logging.Logger:
    """
    Setup centralized logging configuration
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: If True, use JSON formatting (production). If False, use pretty printing (dev)
        log_file: Optional path to log file
    
    Returns:
        Configured root logger
    """
    # Get root logger
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, level.upper()))
    
    # Remove existing handlers
    logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper()))
    
    if json_logs:
        # Production: JSON formatting
        formatter = CustomJsonFormatter(
            '%(asctime)s %(level)s %(name)s %(message)s',
            datefmt='%Y-%m-%dT%H:%M:%S'
        )
    else:
        # Development: Pretty formatting
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s [%(filename)s:%(lineno)d]',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # Optional file handler
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(getattr(logging, level.upper()))
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a specific module
    
    Args:
        name: Logger name (typically __name__ of the module)
    
    Returns:
        Logger instance
    
    Usage:
        logger = get_logger(__name__)
        logger.info("Processing document", extra={"job_id": job_id})
    """
    return logging.getLogger(name)


# Initialize logging on module import
# This will be configured properly in main.py based on environment
_default_logger = logging.getLogger()
if not _default_logger.handlers:
    setup_logging(level="INFO", json_logs=False)
