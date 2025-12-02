# 3. Async Worker Pattern for Background Processing

Date: 2025-11-29

## Status

Accepted

## Context

Document processing (OCR) is a CPU-intensive and time-consuming operation (seconds to minutes).
Running this synchronously in the HTTP request-response cycle would:
1.  Block the API server, making it unresponsive to other requests.
2.  Cause timeouts for the client (browsers often timeout after 30-60s).
3.  Lead to poor user experience.

## Decision

We will implement an **Asynchronous Worker Pattern** using a producer-consumer model.

### Architecture
1.  **Producer (API):** Accepts the upload, saves the file to storage, pushes a task message to a `QueueService`, and returns a `job_id` immediately (HTTP 202 Accepted).
2.  **Queue:** Holds the tasks. In development, this is an in-memory asyncio queue. In production, this is Redis.
3.  **Consumer (Worker):** A background process (or coroutine) that continuously polls the queue, picks up tasks, performs the OCR, and updates the database with results.

## Consequences

### Positive
*   **Scalability:** We can scale the number of workers independently of the API servers.
*   **Responsiveness:** API remains fast and responsive.
*   **Reliability:** If a worker crashes, the task can be retried (if using a persistent queue like Redis).

### Negative
*   **Complexity:** Requires managing a separate worker process/task.
*   **State Management:** The client needs to poll for status updates, adding complexity to the frontend.
*   **Debugging:** Debugging distributed systems is harder than monolithic synchronous code (as seen with the log file issues).
