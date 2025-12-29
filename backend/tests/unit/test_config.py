"""
Unit tests for configuration settings
"""
import pytest
from pydantic import ValidationError
from app.core.config import Settings


class TestConfigSettings:
    """Tests for application configuration"""
    
    def test_debug_defaults_to_false(self):
        """Test that DEBUG defaults to False for production safety"""
        settings = Settings()
        assert settings.DEBUG is False
        
    def test_safe_extensions_present(self):
        """Test that SAFE_EXTENSIONS whitelist exists"""
        settings = Settings()
        
        assert hasattr(settings, 'SAFE_EXTENSIONS')
        assert isinstance(settings.SAFE_EXTENSIONS, set)
        assert 'pdf' in settings.SAFE_EXTENSIONS
        assert 'png' in settings.SAFE_EXTENSIONS
        assert 'jpg' in settings.SAFE_EXTENSIONS
        assert 'jpeg' in settings.SAFE_EXTENSIONS
        assert 'tiff' in settings.SAFE_EXTENSIONS
        
    def test_version_is_3_0_0(self):
        """Test that version is updated to 3.0.0"""
        settings = Settings()
        assert settings.APP_VERSION == "3.0.0"
        
    def test_allowed_file_types_present(self):
        """Test that ALLOWED_FILE_TYPES is defined"""
        settings = Settings()
        
        assert hasattr(settings, 'ALLOWED_FILE_TYPES')
        assert isinstance(settings.ALLOWED_FILE_TYPES, list)
        assert 'application/pdf' in settings.ALLOWED_FILE_TYPES
        assert 'image/png' in settings.ALLOWED_FILE_TYPES
        
    def test_max_file_size_is_reasonable(self):
        """Test that MAX_FILE_SIZE is set"""
        settings = Settings()
        
        assert hasattr(settings, 'MAX_FILE_SIZE')
        assert settings.MAX_FILE_SIZE == 25 * 1024 * 1024  # 25MB
        
    def test_database_url_sqlite_default(self):
        """Test that SQLite is default database"""
        settings = Settings()
        
        assert settings.DATABASE_TYPE == "sqlite"
        db_url = settings.database_url
        assert "sqlite:///" in db_url
        assert ".db" in db_url
