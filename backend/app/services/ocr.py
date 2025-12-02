"""
OCR service abstraction layer
Supports: PaddleOCR (primary), EasyOCR (fallback), Ollama (future)
Follows: SOLID principles - easily swappable implementation
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pathlib import Path
from dataclasses import dataclass
from app.core.config import settings


@dataclass
class BoundingBox:
    """Bounding box for detected text"""
    x: float
    y: float
    width: float
    height: float


class OCRServiceError(Exception):
    """Custom exception for OCR service issues."""
    pass

def validate_file_input(file_input: Any) -> Path:
    """
    Ensure OCR service receives a valid file path.
    
    Raises:
        OCRServiceError: If input is invalid or file doesn't exist.
    """
    if isinstance(file_input, bytes):
        raise OCRServiceError(
            "OCR service requires file path, not raw bytes. "
            "Save bytes to temp file first."
        )
    
    path = Path(file_input)
    if not path.exists():
        raise OCRServiceError(f"File not found: {path}")
    
    if not path.is_file():
        raise OCRServiceError(f"Path is not a file: {path}")
    
    return path.resolve()


@dataclass
class TextBlock:
    """Single text block with location and confidence"""
    text: str
    confidence: float
    bbox: BoundingBox
    

@dataclass
class OCRResult:
    """Complete OCR result for a page"""
    full_text: str
    blocks: List[TextBlock]
    average_confidence: float
    language: str
    processing_time: float  # seconds


class OCRService(ABC):
    """Abstract base class for OCR backends"""
    
    @abstractmethod
    async def extract_text(self, image_path: str, language: str = "auto") -> OCRResult:
        """Extract text from image"""
        pass
    
    @abstractmethod
    def get_supported_languages(self) -> List[str]:
        """Get list of supported languages"""
        pass


class PaddleOCRService(OCRService):
    """
    PaddleOCR implementation - Fast, CPU-optimized
    Use for: Production, Intel CPUs, low-latency requirements
    """
    
    def __init__(self):
        # Lazy import to avoid loading if not used
        try:
            from paddleocr import PaddleOCR
        except ImportError:
            raise ImportError(
                "PaddleOCR is required. Install with: pip install paddlepaddle paddleocr"
            )
        
        # Initialize PaddleOCR with English as default
        # Models will be downloaded on first use (~30MB)
        self.ocr = PaddleOCR(
            use_angle_cls=True,  # Enable text angle detection
            lang='en'            # Default language
        )
        
        # Language code mapping
        self.lang_map = {
            'auto': 'en',
            'en': 'en',
            'english': 'en',
            'hi': 'hi',
            'hindi': 'hi',
            'ta': 'ta',
            'tamil': 'ta',
            'te': 'te',
            'telugu': 'te',
        }
    
    async def extract_text(self, image_path: str, language: str = "auto") -> OCRResult:
        """
        Extract text from image using PaddleOCR
        
        Args:
            image_path: Path to image file
            language: Language code (en, hi, ta, te, or auto)
        
        Returns:
            OCRResult with text, blocks, and metadata
        """
        import time
        from paddleocr import PaddleOCR
        
        start_time = time.time()
        
        # Map language code
        lang_code = self.lang_map.get(language.lower(), 'en')
        
        # Reinitialize if language changed
        if lang_code != 'en':
            self.ocr = PaddleOCR(
                use_angle_cls=True,
                lang=lang_code
            )
        
        # Run OCR
        try:
            print(f"PaddleOCR processing: {image_path}")
            result = self.ocr.ocr(str(image_path))
            print(f"PaddleOCR raw result: {result}")
            
        except ValueError as ve:
            # Specific catch for unpacking error
            err_msg = f"PaddleOCR ValueError (Unpacking): {ve}"
            print(err_msg)
            # Return empty result instead of crashing
            processing_time = time.time() - start_time
            return OCRResult(
                full_text='',
                blocks=[],
                average_confidence=0.0,
                language=lang_code,
                processing_time=processing_time
            )
        except Exception as e:
            print(f"PaddleOCR CRASH: {e}")
            raise e
        
        # Process results
        blocks = []
        full_text_parts = []
        total_confidence = 0.0
        
        # Handle the actual PaddleOCR format: list containing dictionaries
        if isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict):
            print("PaddleOCR returned new format (list of dicts)")
            
            # Extract the first page/result
            page_result = result[0]
            
            # Get the arrays (note: plural keys!)
            texts = page_result.get('rec_texts', [])
            if not texts:
                 # Fallback to singular keys if plural not found
                 texts = page_result.get('rec_text', [])
                 
            scores = page_result.get('rec_scores', [])
            if not scores:
                 scores = page_result.get('rec_score', [])
                 
            boxes = page_result.get('rec_polys', []) or page_result.get('dt_polys', []) or page_result.get('rec_boxes', [])
            
            print(f"Found {len(texts)} text blocks: {texts}")
            
            for i, text in enumerate(texts):
                score = scores[i] if i < len(scores) else 0.0
                box = boxes[i] if i < len(boxes) else None
                
                # Calculate bbox from points
                x, y, w, h = 0, 0, 0, 0
                if box is not None and len(box) > 0:
                    try:
                        import numpy as np
                        if isinstance(box, np.ndarray):
                            box = box.tolist()
                        
                        # box is array of points [[x1,y1], [x2,y2], ...]
                        # Flatten if needed
                        flat_box = []
                        if isinstance(box[0], (list, tuple)):
                            for p in box:
                                flat_box.extend(p)
                        else:
                            flat_box = box
                            
                        xs = flat_box[0::2]
                        ys = flat_box[1::2]
                        
                        if xs and ys:
                            x, y = min(xs), min(ys)
                            w, h = max(xs) - x, max(ys) - y
                    except Exception as e:
                        print(f"Error parsing box {i}: {e}")
                
                bbox = BoundingBox(x=float(x), y=float(y), width=float(w), height=float(h))
                
                blocks.append(TextBlock(text=text, confidence=float(score), bbox=bbox))
                full_text_parts.append(text)
                total_confidence += float(score)

        # Handle old list format (keep for compatibility)
        elif isinstance(result, list) and len(result) > 0:
            # Check if it's a list of lists (old standard format)
            if result[0] is None:
                print("PaddleOCR returned empty result")
            else:
                # Standard format: [[[[x1,y1]..], ("text", conf)], ...]
                detections = result
                if len(result) == 1 and isinstance(result[0], list):
                    detections = result[0]
                
                for line in detections:
                    try:
                        if not isinstance(line, (list, tuple)) or len(line) < 2:
                            continue
                            
                        bbox_points = line[0]
                        text_element = line[1]
                        
                        text = ""
                        confidence = 0.0
                        
                        if isinstance(text_element, (list, tuple)) and len(text_element) >= 2:
                            text = text_element[0]
                            confidence = text_element[1]
                        
                        # Extract bounding box
                        x_coords = [p[0] for p in bbox_points]
                        y_coords = [p[1] for p in bbox_points]
                        
                        bbox = BoundingBox(
                            x=min(x_coords),
                            y=min(y_coords),
                            width=max(x_coords) - min(x_coords),
                            height=max(y_coords) - min(y_coords)
                        )
                        
                        blocks.append(TextBlock(text=text, confidence=confidence, bbox=bbox))
                        full_text_parts.append(text)
                        total_confidence += confidence
                    except Exception as e:
                        print(f"Error parsing list item: {e}")
                        continue
                        
        processing_time = time.time() - start_time
        
        return OCRResult(
            full_text=' '.join(full_text_parts),
            blocks=blocks,
            average_confidence=total_confidence / len(blocks) if blocks else 0.0,
            language=lang_code,
            processing_time=processing_time
        )
    
    def get_supported_languages(self) -> List[str]:
        """PaddleOCR supported languages"""
        return [
            'en', 'english',
            'hi', 'hindi', 
            'ta', 'tamil',
            'te', 'telugu',
            # PaddleOCR supports 80+ languages
            # Add more as needed
        ]


class EasyOCRService(OCRService):
    """
    EasyOCR implementation - Good accuracy, slower
    Use for: High accuracy requirements, fallback option
    """
    
    def __init__(self):
        # Lazy import
        try:
            import easyocr
        except ImportError:
            raise ImportError(
                "EasyOCR is required. Install with: pip install easyocr"
            )
        
        # Initialize with common Indian languages
        self.reader = easyocr.Reader(['en', 'hi'])
    
    async def extract_text(self, image_path: str, language: str = "auto") -> OCRResult:
        """Extract text using EasyOCR"""
        import time
        
        start_time = time.time()
        
        # Run OCR
        result = self.reader.readtext(str(image_path))
        
        # Process results
        blocks = []
        full_text_parts = []
        total_confidence = 0.0
        
        for bbox_points, text, confidence in result:
            blocks.append(TextBlock(
                text=text,
                confidence=confidence,
                bbox=BoundingBox(
                    x=min([p[0] for p in bbox_points]),
                    y=min([p[1] for p in bbox_points]),
                    width=max([p[0] for p in bbox_points]) - min([p[0] for p in bbox_points]),
                    height=max([p[1] for p in bbox_points]) - min([p[1] for p in bbox_points])
                )
            ))
            full_text_parts.append(text)
            total_confidence += confidence
        
        processing_time = time.time() - start_time
        
        return OCRResult(
            full_text=' '.join(full_text_parts),
            blocks=blocks,
            average_confidence=total_confidence / len(blocks) if blocks else 0.0,
            language=language,
            processing_time=processing_time
        )
    
    def get_supported_languages(self) -> List[str]:
        """EasyOCR supported languages"""
        return ['en', 'hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa']


# Factory function - returns appropriate OCR service
def get_ocr_service() -> OCRService:
    """
    Factory pattern: Return OCR service based on configuration
    Enables: Zero-code-change backend swapping
    """
    ocr_backend = getattr(settings, 'OCR_BACKEND', 'paddle').lower()
    
    if ocr_backend == "paddle" or ocr_backend == "paddleocr":
        return PaddleOCRService()
    elif ocr_backend == "easyocr" or ocr_backend == "easy":
        return EasyOCRService()
    else:
        # Default to PaddleOCR
        return PaddleOCRService()
