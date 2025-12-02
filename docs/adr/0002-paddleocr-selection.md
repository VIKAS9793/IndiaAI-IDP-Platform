# 2. PaddleOCR for Text Extraction

Date: 2025-11-29

## Status

Accepted

## Context

The platform requires an Optical Character Recognition (OCR) engine to extract text from uploaded documents (images and PDFs).
Requirements:
1.  **Accuracy:** High accuracy for English and Indian languages (Hindi, Tamil, etc.).
2.  **Open Source:** Must be open-source and free to use.
3.  **Local Execution:** Must run locally on the server (no external API calls for data privacy).
4.  **Layout Analysis:** Ability to detect text blocks and layout is preferred.

## Decision

We selected **PaddleOCR** (specifically the `en_PP-OCRv3` and multilingual models) as the primary OCR engine.

## Alternatives Considered

### 1. Tesseract OCR
*   **Pros:** Standard open-source choice, widely available.
*   **Cons:** Lower accuracy on complex layouts, requires separate installation of binary (tesseract-ocr), harder to configure for deep learning based layout analysis.

### 2. EasyOCR
*   **Pros:** PyTorch-based, easy to install, supports many languages.
*   **Cons:** Slower than PaddleOCR on CPU, slightly lower accuracy for English scene text compared to PP-OCRv3.

### 3. Google Cloud Vision / Azure Computer Vision
*   **Pros:** Best-in-class accuracy.
*   **Cons:** Paid services, data leaves the premise (privacy concern), requires internet connectivity.

## Consequences

### Positive
*   **High Performance:** PaddleOCR offers state-of-the-art accuracy for lightweight models.
*   **Language Support:** Excellent support for 80+ languages including Indian languages.
*   **Deployment:** Can be installed via `pip` (though `paddlepaddle` dependency can be tricky).

### Negative
*   **Dependency Size:** Requires `paddlepaddle` which is a large library.
*   **Output Format Changes:** As experienced during development, PaddleOCR's API output format can vary between versions (list of lists vs list of dicts), requiring robust parsing logic.
