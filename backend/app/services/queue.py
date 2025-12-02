"""
Queue service abstraction layer
Supports: In-memory (dev/MVP) or Redis (production)
Follows: SOLID principles - easily swappable implementation
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from queue import Queue
import json
import uuid
from datetime import datetime
try:
    import redis
except ImportError:
    redis = None

from app.core.config import settings


class QueueService(ABC):
    """Abstract base class for queue backends"""
    
    @abstractmethod
    async def enqueue(self, task_name: str, task_data: Dict[str, Any]) -> str:
        """Add task to queue, return task ID"""
        pass
    
    @abstractmethod
    async def dequeue(self) -> Optional[Dict[str, Any]]:
        """Get next task from queue"""
        pass
    
    @abstractmethod
    async def get_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status"""
        pass
    
    @abstractmethod
    async def update_status(self, task_id: str, status: str, data: Dict[str, Any] = None) -> bool:
        """Update task status"""
        pass


class InMemoryQueueService(QueueService):
    """
    In-memory queue service
    Use for: Development, MVP, single-instance deployment
    Note: Tasks lost on restart - acceptable for prototype
    """
    
    def __init__(self):
        self.queue = Queue()
        self.tasks = {}  # task_id -> task_data
    
    async def enqueue(self, task_name: str, task_data: Dict[str, Any]) -> str:
        """Add task to in-memory queue"""
        task_id = str(uuid.uuid4())
        task = {
            'id': task_id,
            'name': task_name,
            'data': task_data,
            'status': 'queued',
            'created_at': datetime.utcnow().isoformat(),
        }
        
        self.tasks[task_id] = task
        self.queue.put(task)
        
        return task_id
    
    async def dequeue(self) -> Optional[Dict[str, Any]]:
        """Get next task from queue"""
        if self.queue.empty():
            return None
        
        task = self.queue.get()
        task['status'] = 'processing'
        return task
    
    async def get_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status"""
        return self.tasks.get(task_id)
    
    async def update_status(self, task_id: str, status: str, data: Dict[str, Any] = None) -> bool:
        """Update task status"""
        if task_id not in self.tasks:
            return False
        
        self.tasks[task_id]['status'] = status
        self.tasks[task_id]['updated_at'] = datetime.utcnow().isoformat()
        
        if data:
            self.tasks[task_id]['data'].update(data)
        
        return True


class RedisQueueService(QueueService):
    """
    Redis queue service
    Use for: Production scaling, distributed systems
    Benefits: Persistent, shared across workers, supports priority
    """
    
    def __init__(self):
        if not settings.REDIS_URL:
            raise ValueError("REDIS_URL not configured")
        
        if redis is None:
            raise ImportError("redis package not installed. Run: pip install redis")
        
        self.redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        self.queue_key = "indiaai:queue"
        self.task_prefix = "indiaai:task:"
    
    async def enqueue(self, task_name: str, task_data: Dict[str, Any]) -> str:
        """Add task to Redis queue"""
        task_id = str(uuid.uuid4())
        task = {
            'id': task_id,
            'name': task_name,
            'data': task_data,
            'status': 'queued',
            'created_at': datetime.utcnow().isoformat(),
        }
        
        # Store task data
        self.redis_client.set(
            f"{self.task_prefix}{task_id}",
            json.dumps(task),
            ex=86400  # Expire after 24 hours
        )
        
        # Add to queue
        self.redis_client.rpush(self.queue_key, task_id)
        
        return task_id
    
    async def dequeue(self) -> Optional[Dict[str, Any]]:
        """Get next task from Redis queue"""
        task_id = self.redis_client.lpop(self.queue_key)
        
        if not task_id:
            return None
        
        task_data = self.redis_client.get(f"{self.task_prefix}{task_id}")
        
        if not task_data:
            return None
        
        task = json.loads(task_data)
        task['status'] = 'processing'
        
        # Update in Redis
        self.redis_client.set(
            f"{self.task_prefix}{task_id}",
            json.dumps(task),
            ex=86400
        )
        
        return task
    
    async def get_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task status from Redis"""
        task_data = self.redis_client.get(f"{self.task_prefix}{task_id}")
        
        if not task_data:
            return None
        
        return json.loads(task_data)
    
    async def update_status(self, task_id: str, status: str, data: Dict[str, Any] = None) -> bool:
        """Update task status in Redis"""
        task_data = self.redis_client.get(f"{self.task_prefix}{task_id}")
        
        if not task_data:
            return False
        
        task = json.loads(task_data)
        task['status'] = status
        task['updated_at'] = datetime.utcnow().isoformat()
        
        if data:
            task['data'].update(data)
        
        self.redis_client.set(
            f"{self.task_prefix}{task_id}",
            json.dumps(task),
            ex=86400
        )
        
        return True


# Global singleton for in-memory queue
_memory_queue_instance = None

# Factory function - returns appropriate queue service
def get_queue_service() -> QueueService:
    """
    Factory pattern: Return queue service based on configuration
    Enables: Zero-code-change backend swapping
    """
    global _memory_queue_instance
    
    if settings.QUEUE_TYPE == "memory":
        if _memory_queue_instance is None:
            _memory_queue_instance = InMemoryQueueService()
        return _memory_queue_instance
    elif settings.QUEUE_TYPE == "redis":
        return RedisQueueService()
    else:
        raise ValueError(f"Invalid QUEUE_TYPE: {settings.QUEUE_TYPE}")
