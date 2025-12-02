"""
PII Detection Service using Microsoft Presidio
Identifies sensitive information in extracted text
"""
from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig
import logging

# Configure logging
logger = logging.getLogger(__name__)

class PIIService:
    def __init__(self):
        try:
            self.analyzer = AnalyzerEngine()
            self.anonymizer = AnonymizerEngine()
            self._add_custom_recognizers()
            logger.info("Presidio Analyzer initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Presidio: {e}")
            self.analyzer = None

    def _add_custom_recognizers(self):
        """Add custom recognizers for Indian context"""
        if not self.analyzer:
            return

        # Aadhaar Regex (Basic pattern: 4 digits space 4 digits space 4 digits)
        aadhaar_pattern = Pattern(name="aadhaar_pattern", regex=r"\b\d{4}\s\d{4}\s\d{4}\b", score=0.5)
        aadhaar_recognizer = PatternRecognizer(supported_entity="IN_AADHAAR", patterns=[aadhaar_pattern])
        self.analyzer.registry.add_recognizer(aadhaar_recognizer)

        # PAN Regex (5 letters, 4 digits, 1 letter)
        pan_pattern = Pattern(name="pan_pattern", regex=r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b", score=0.6)
        pan_recognizer = PatternRecognizer(supported_entity="IN_PAN", patterns=[pan_pattern])
        self.analyzer.registry.add_recognizer(pan_recognizer)

    def analyze_text(self, text: str, language: str = "en"):
        """
        Analyze text for PII entities
        Returns list of detected entities with scores
        """
        if not self.analyzer or not text:
            return []

        try:
            results = self.analyzer.analyze(text=text, language=language)
            return [
                {
                    "type": result.entity_type,
                    "start": result.start,
                    "end": result.end,
                    "score": result.score,
                    "text": text[result.start:result.end]
                }
                for result in results
            ]
        except Exception as e:
            logger.error(f"PII analysis failed: {e}")
            return []

    def anonymize_text(self, text: str, analyzer_results: list):
        """
        Redact detected PII in text
        """
        if not self.analyzer or not text:
            return text

        try:
            # Convert dict results back to Presidio objects if needed, 
            # but Anonymizer expects AnalyzerResult objects usually.
            # For simplicity, we'll re-analyze or assume results are passed correctly.
            # Here we'll re-analyze to be safe as we passed dicts back from analyze_text
            results = self.analyzer.analyze(text=text, language="en")
            
            anonymized = self.anonymizer.anonymize(
                text=text,
                analyzer_results=results,
                operators={"DEFAULT": OperatorConfig("replace", {"new_value": "<REDACTED>"})}
            )
            return anonymized.text
        except Exception as e:
            logger.error(f"Anonymization failed: {e}")
            return text
