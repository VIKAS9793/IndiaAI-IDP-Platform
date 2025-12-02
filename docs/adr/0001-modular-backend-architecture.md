# 1. Modular Backend Architecture

Date: 2025-11-29

## Status

Accepted

## Context

The IndiaAI IDP Platform needs to run in diverse environments:
1.  **Local Development:** Developers need to run the full stack on their laptops without complex infrastructure (Redis, S3, PostgreSQL).
2.  **Production:** The system needs to scale using robust cloud-native services (Cloud Storage, Managed Queues, Managed DB).

We need an architecture that supports both without requiring code changes or conditional logic scattered throughout the codebase.

## Decision

We will implement a **Modular Service Architecture** using the Strategy Pattern. Key infrastructure components will be defined as abstract base classes (interfaces) with multiple implementations.

### Components
1.  **Storage:** `StorageService` interface.
    *   `LocalStorageService`: Saves files to the local filesystem.
    *   `R2StorageService`: Saves files to Cloudflare R2 (S3-compatible).
2.  **Queue:** `QueueService` interface.
    *   `MemoryQueueService`: Uses Python's `asyncio.Queue` for in-process queuing.
    *   `RedisQueueService`: Uses Redis for distributed queuing.
3.  **OCR:** `OCRService` interface.
    *   `PaddleOCRService`: Uses PaddleOCR.
    *   `EasyOCRService`: Uses EasyOCR (future/alternative).

### Configuration
The active implementation will be selected at runtime based on environment variables (e.g., `STORAGE_TYPE=local` vs `STORAGE_TYPE=s3`) using a factory pattern in `app/core/config.py` or service getters.

## Consequences

### Positive
*   **Zero-Setup Dev Environment:** Developers can `git clone` and `run` without installing Redis or MinIO.
*   **Testability:** Easy to mock services for unit testing.
*   **Vendor Lock-in Avoidance:** Switching from R2 to AWS S3 or Azure Blob Storage only requires adding a new `StorageService` implementation.

### Negative
*   **Complexity:** Adds a layer of abstraction. Simple direct calls (e.g., `open()`) are replaced by service calls (`storage.upload()`).
*   **Feature Intersection:** The "lowest common denominator" of features must be supported by all implementations, or specific features ( like S3 presigned URLs) might not be available in the Local implementation.
