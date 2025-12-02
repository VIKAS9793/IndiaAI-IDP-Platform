# ADR 0007: Zero-Mistake OCR Pipeline Architecture

## Status
Accepted (Scheduled for Phase 4 / Future Upgrade)

## Date
2025-12-01

## Context
The current OCR implementation uses PaddleOCR (PP-OCRv4) for text extraction. While fast (~2s/page) and effective (95-98% accuracy) for general text, high-stakes government documents (Aadhaar, PAN, Legal Contracts) may require near-perfect accuracy.

We evaluated a "Zero-Mistake" architecture combining:
1.  **Structure Extraction:** PP-StructureV3 for layout understanding.
2.  **Verification Loop:** Agentic re-checking of low-confidence fields.
3.  **Semantic Structuring:** LLM-based post-processing for typed schemas.

## Decision
We will **defer** the implementation of the full Zero-Mistake Pipeline to a future phase (Phase 4), maintaining the current PaddleOCR architecture for the MVP/Pilot.

**Rationale:**
1.  **MVP Priority:** Speed and simplicity are critical for the initial pilot. The current 95-98% accuracy is sufficient for user feedback.
2.  **Complexity Cost:** The Zero-Mistake pipeline increases complexity by ~150% (7 components vs 3) and introduces new failure modes (LLM hallucinations, dependency conflicts).
3.  **Performance:** Latency increases from ~2s to ~8s per page, which may degrade UX without GPU acceleration.
4.  **ROI:** The estimated 2-5% accuracy gain does not currently justify the 3-week development effort and ongoing maintenance burden.

We will instead adopt a **Phased Rollout Strategy**:
*   **Phase 1-3 (Now):** Ship basic PaddleOCR. Collect error data.
*   **Phase 4 (Future):** Implement Zero-Mistake pipeline as an optional "High-Accuracy Mode" toggle if error rates in critical documents (Aadhaar/PAN) prove costly.

## Architecture Blueprint (Phase 4 Design)

```python
class ZeroMistakePipeline:
    def process(image):
        # Step 1: Structure (PP-StructureV3)
        structured_doc = PPStructure(image)
        
        # Step 2: Verify (Agentic Loop)
        if structured_doc.confidence < 0.85:
            structured_doc = VerificationLoop.verify(structured_doc, image)
            
        # Step 3: Structure (LLM)
        if structured_doc.type == 'invoice':
            return LLMStructurer.extract(structured_doc, InvoiceSchema)
        else:
            return structured_doc
```

## Detailed Trade-off Analysis

### 1. Performance & Complexity

| Dimension | Current (Basic OCR) | Zero-Mistake Pipeline | Net Impact |
|-----------|--------------------|-----------------------|-----------|
| **Complexity** | ⭐⭐ (Simple) | ⭐⭐⭐⭐⭐ (High) | +150% complexity |
| **Speed** | ~2 sec/page | ~8 sec/page | 4x slower |
| **Accuracy** | 95-98% | 99.5-99.9% | +2-5% improvement |
| **Infrastructure** | PaddleOCR only | PaddleOCR + LLM + Storage | +3 components |
| **Maintainability** | Excellent | Moderate | Higher technical debt |

### 2. Resource Impact
*   **Current:** Runs on standard CPU (2GB RAM).
*   **Zero-Mistake:** Requires 8GB+ RAM and preferably GPU (4GB VRAM) for acceptable latency.

### 3. Debugging
*   **Current:** Single point of failure (OCR engine).
*   **Zero-Mistake:** Multiple failure points (Structure analysis, Verification crop, LLM hallucination, Schema validation).

## Strategic Roadmap

### Phase 1: Pilot (Current)
*   Ship with basic PaddleOCR.
*   Instrument error tracking (log low-confidence results).
*   **Goal:** Validate actual accuracy needs with real users.

### Phase 2: Hybrid Implementation (Future)
*   Implement `AdaptiveOCRService` that routes only critical document types (Aadhaar, PAN) to the enhanced pipeline.
*   Keep generic documents on the fast path.

### Phase 3: Full Rollout (Conditional)
*   Only if ROI is proven (Error Cost > Implementation Cost).

## Consequences

### Positive
*   **Future-Proofing:** We have a clear design for upgrading accuracy when needed.
*   **Focus:** Allows the team to focus on UX and Governance (HITL) now.
*   **Cost Efficiency:** Avoids premature optimization and infrastructure costs.

### Negative
*   **Technical Debt:** We accept a known 2-5% error rate for the pilot.
*   **Manual Review:** Users may need to manually correct more fields in the HITL interface initially.

## Mitigation
*   **HITL Interface (Phase 3.3):** We will build a robust "Review Page" to make manual corrections fast and easy, mitigating the impact of OCR errors.
