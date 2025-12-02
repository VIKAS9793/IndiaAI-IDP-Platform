"""
Storage service abstraction layer
Supports: Local filesystem (dev/MVP) or Cloudflare R2 (production)
Follows: SOLID principles - easily swappable implementation
"""
from abc import ABC, abstractmethod
from typing import BinaryIO, Optional
from pathlib import Path
from app.core.config import settings

# Note: boto3 imported conditionally in R2StorageService to avoid dependency for MVP


class StorageService(ABC):
    """Abstract base class for storage backends"""
    
    @abstractmethod
    async def upload(self, file_key: str, file_data: bytes, content_type: str) -> str:
        """Upload file and return storage URL"""
        pass
    
    @abstractmethod
    async def download(self, file_key: str) -> bytes:
        """Download file data"""
        pass
    
    @abstractmethod
    async def get_url(self, file_key: str, expires_in: int = 3600) -> str:
        """Get signed URL for file access"""
        pass
    
    @abstractmethod
    async def delete(self, file_key: str) -> bool:
        """Delete file"""
        pass


class LocalStorageService(StorageService):
    """
    Local filesystem storage
    Use for: Development, MVP, local testing
    """
    
    def __init__(self):
        self.storage_path = settings.storage_path
    
    async def upload(self, file_key: str, file_data: bytes, content_type: str) -> str:
        """Save file to local filesystem"""
        file_path = self.storage_path / file_key
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'wb') as f:
            f.write(file_data)
        
        return str(file_path)
    
    async def download(self, file_key: str) -> bytes:
        """Read file from local filesystem"""
        file_path = self.storage_path / file_key
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_key}")
        
        with open(file_path, 'rb') as f:
            return f.read()
    
    async def get_url(self, file_key: str, expires_in: int = 3600) -> str:
        """Return local file path (no signing needed for local)"""
        file_path = self.storage_path / file_key
        return f"file://{file_path.absolute()}"
    
    async def delete(self, file_key: str) -> bool:
        """Delete file from local filesystem"""
        file_path = self.storage_path / file_key
        
        if file_path.exists():
            file_path.unlink()
            return True
        return False


class R2StorageService(StorageService):
    """
    Cloudflare R2 storage (S3-compatible)
    Use for: Production scaling, distributed systems
    """
    
    def __init__(self):
        # Lazy import - only load boto3 when R2 storage is actually used
        try:
            import boto3
        except ImportError:
            raise ImportError(
                "boto3 is required for R2 storage. Install with: pip install boto3"
            )
        
        if not settings.R2_ACCOUNT_ID or not settings.R2_ACCESS_KEY_ID:
            raise ValueError("R2 credentials not configured")
        
        self.s3_client = boto3.client(
            's3',
            endpoint_url=settings.r2_endpoint_url,
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        )
        self.bucket_name = settings.R2_BUCKET_NAME
    
    async def upload(self, file_key: str, file_data: bytes, content_type: str) -> str:
        """Upload file to R2"""
        self.s3_client.put_object(
            Bucket=self.bucket_name,
            Key=file_key,
            Body=file_data,
            ContentType=content_type
        )
        return f"{settings.r2_endpoint_url}/{self.bucket_name}/{file_key}"
    
    async def download(self, file_key: str) -> bytes:
        """Download file from R2"""
        response = self.s3_client.get_object(
            Bucket=self.bucket_name,
            Key=file_key
        )
        return response['Body'].read()
    
    async def get_url(self, file_key: str, expires_in: int = 3600) -> str:
        """Generate signed URL for R2 file"""
        url = self.s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': self.bucket_name,
                'Key': file_key
            },
            ExpiresIn=expires_in
        )
        return url
    
    async def delete(self, file_key: str) -> bool:
        """Delete file from R2"""
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            return True
        except Exception:
            return False


# Factory function - returns appropriate storage service
def get_storage_service() -> StorageService:
    """
    Factory pattern: Return storage service based on configuration
    Enables: Zero-code-change backend swapping
    """
    if settings.STORAGE_TYPE == "local":
        return LocalStorageService()
    elif settings.STORAGE_TYPE == "r2":
        return R2StorageService()
    else:
        raise ValueError(f"Invalid STORAGE_TYPE: {settings.STORAGE_TYPE}")
