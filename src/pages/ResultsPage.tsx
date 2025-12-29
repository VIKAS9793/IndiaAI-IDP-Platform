import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import api, { type JobResultsResponse, type TextBlock, type RawOCRData } from '../lib/api';
import { DocumentViewer } from '../components/DocumentViewer';

/**
 * UX4G Results Page Component
 * Displays OCR processing results with document viewer
 * 
 * Compliant with Government of India Design System v2.0.8
 */
export const ResultsPage: React.FC = () => {
    const { jobId } = useParams<{ jobId: string }>();
    const navigate = useNavigate();
    const [results, setResults] = useState<JobResultsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    const [textBlocks, setTextBlocks] = useState<TextBlock[]>([]);
    const textDisplayRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        let pollInterval: ReturnType<typeof setInterval>;

        const checkStatusAndFetchResults = async () => {
            if (!jobId) return;
            try {
                const statusData = await api.getJobStatus(jobId);

                if (statusData.status === 'completed' || statusData.status === 'ocr_complete') {
                    const data = await api.getJobResults(jobId);
                    setResults(data);
                    setLoading(false);
                    if (pollInterval) clearInterval(pollInterval);
                } else if (statusData.status === 'failed') {
                    setError('Job processing failed.');
                    setLoading(false);
                    if (pollInterval) clearInterval(pollInterval);
                }
            } catch (err) {
                console.error('Error polling job status:', err);
                setError('Failed to track job status. Please refresh.');
                setLoading(false);
                if (pollInterval) clearInterval(pollInterval);
            }
        };

        checkStatusAndFetchResults();
        pollInterval = setInterval(checkStatusAndFetchResults, 2000);

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [jobId]);

    useEffect(() => {
        if (!results || !results.ocr_results.length) return;

        const firstResult = results.ocr_results[0];
        if (firstResult.raw_data) {
            try {
                const rawData: RawOCRData = JSON.parse(firstResult.raw_data);
                setTextBlocks(rawData.blocks || []);
            } catch (e) {
                console.error('Failed to parse raw_data:', e);
            }
        }
    }, [results]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (showDownloadMenu && !target.closest('.download-dropdown-container')) {
                setShowDownloadMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDownloadMenu]);

    const downloadAsText = () => {
        if (!results) return;

        const fullText = results.ocr_results.map(r => r.full_text).join('\n\n');
        const blob = new Blob([fullText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${results.job.filename.replace(/\.[^/.]+$/, '')}_extracted.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowDownloadMenu(false);
    };

    const downloadAsJSON = () => {
        if (!results) return;

        const exportData = {
            job: {
                id: results.job.id,
                filename: results.job.filename,
                status: results.job.status,
                detected_language: results.job.detected_language,
                completed_at: results.job.completed_at,
            },
            ocr_results: results.ocr_results.map(r => ({
                page: r.id,
                full_text: r.full_text,
                confidence: r.confidence,
                processing_time: r.processing_time,
            })),
            metadata: {
                total_pages: results.ocr_results.length,
                average_confidence: results.ocr_results.length > 0
                    ? (results.ocr_results.reduce((acc, r) => acc + (r.confidence || 0), 0) / results.ocr_results.length)
                    : 0,
                extracted_at: new Date().toISOString(),
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${results.job.filename.replace(/\.[^/.]+$/, '')}_data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowDownloadMenu(false);
    };

    const handleBlockClick = (block: TextBlock) => {
        if (textDisplayRef.current) {
            const textElement = textDisplayRef.current;
            const textContent = textElement.textContent || '';
            const blockText = block.text;

            const index = textContent.indexOf(blockText);
            if (index !== -1) {
                const range = document.createRange();
                const textNode = textElement.firstChild;
                if (textNode) {
                    range.setStart(textNode, Math.max(0, index));
                    range.setEnd(textNode, Math.min(textContent.length, index + blockText.length));

                    const selection = window.getSelection();
                    selection?.removeAllRanges();
                    selection?.addRange(range);

                    const span = document.createElement('span');
                    range.surroundContents(span);
                    span.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    setTimeout(() => {
                        const parent = span.parentNode;
                        while (span.firstChild) {
                            parent?.insertBefore(span.firstChild, span);
                        }
                        parent?.removeChild(span);
                    }, 2000);
                }
            }
        }
    };

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error || !results) {
        return (
            <div className="container py-5 text-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-danger mx-auto mb-4"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                </svg>
                <h2 className="h3 fw-bold mb-2">Error Loading Results</h2>
                <p className="text-muted mb-4">{error || 'Job not found'}</p>
                <Button variant="primary" onClick={() => navigate('/upload')}>
                    Back to Upload
                </Button>
            </div>
        );
    }

    const { job, ocr_results } = results;
    const fullText = ocr_results.map(r => r.full_text).join('\n\n');
    const avgConfidence = ocr_results.length > 0
        ? (ocr_results.reduce((acc, r) => acc + (r.confidence || 0), 0) / ocr_results.length) * 100
        : 0;

    return (
        <div className="container py-5">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                    <button
                        onClick={() => navigate('/upload')}
                        className="btn btn-outline-secondary btn-sm"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m12 19-7-7 7-7" />
                            <path d="M19 12H5" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="h4 fw-bold mb-0">Processing Results</h1>
                        <small className="text-muted">Job ID: {job.id}</small>
                    </div>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    {(job.review_status === 'needs_review' || (job.confidence_score && job.confidence_score < 90)) && (
                        <Button variant="danger" onClick={() => navigate('/review')}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="me-2"
                            >
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                            </svg>
                            Review Required
                        </Button>
                    )}
                    <Button variant="outline-primary" onClick={() => window.print()}>
                        Print
                    </Button>
                    <div className="dropdown download-dropdown-container">
                        <Button
                            variant="primary"
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="me-2"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" x2="12" y1="15" y2="3" />
                            </svg>
                            Download
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="ms-2"
                            >
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </Button>

                        {showDownloadMenu && (
                            <ul className="dropdown-menu show" style={{ position: 'absolute', right: 0 }}>
                                <li>
                                    <button className="dropdown-item" onClick={downloadAsText}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="me-2"
                                        >
                                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" x2="8" y1="13" y2="13" />
                                            <line x1="16" x2="8" y1="17" y2="17" />
                                            <line x1="10" x2="8" y1="9" y2="9" />
                                        </svg>
                                        Download as Text (.txt)
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" onClick={downloadAsJSON}>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="me-2"
                                        >
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="7 10 12 15 17 10" />
                                            <line x1="12" x2="12" y1="15" y2="3" />
                                        </svg>
                                        Download as JSON (.json)
                                    </button>
                                </li>
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Left Column: Document Info & Stats */}
                <div className="col-lg-4">
                    <Card className="mb-4">
                        <CardBody>
                            <h3 className="h6 fw-semibold mb-3">Document Details</h3>
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-primary"
                                >
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                <div>
                                    <small className="text-muted d-block">Filename</small>
                                    <span className="fw-medium">{job.filename}</span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-success"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                                <div>
                                    <small className="text-muted d-block">Status</small>
                                    <span className="fw-medium text-capitalize">{job.status}</span>
                                </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-info"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <div>
                                    <small className="text-muted d-block">Processed At</small>
                                    <span className="fw-medium">
                                        {job.completed_at
                                            ? new Date(job.completed_at.endsWith('Z') ? job.completed_at : job.completed_at + 'Z').toLocaleString()
                                            : '-'}
                                    </span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody>
                            <h3 className="h6 fw-semibold mb-3">Analysis Stats</h3>
                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="p-3 bg-primary bg-opacity-10 rounded">
                                        <small className="text-primary d-block mb-1">Confidence</small>
                                        <span className="h4 fw-bold text-primary mb-0">
                                            {avgConfidence.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-3 bg-success bg-opacity-10 rounded">
                                        <small className="text-success d-block mb-1">Pages</small>
                                        <span className="h4 fw-bold text-success mb-0">
                                            {ocr_results.length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column: Document Viewer & Extracted Text */}
                <div className="col-lg-8">
                    {/* Document Viewer with Bounding Boxes */}
                    {textBlocks.length > 0 && (
                        <Card className="mb-4">
                            <CardBody>
                                <h3 className="h6 fw-semibold mb-3">Document with Detected Text Regions</h3>
                                <DocumentViewer
                                    fileUrl={`http://localhost:8000/data/uploads/${job.file_key}`}
                                    fileType={job.file_type || ''}
                                    textBlocks={textBlocks}
                                    onBlockClick={handleBlockClick}
                                />
                            </CardBody>
                        </Card>
                    )}

                    {/* Extracted Text */}
                    <Card style={{ minHeight: '400px' }}>
                        <CardBody>
                            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                                <h3 className="h6 fw-semibold mb-0">Extracted Text</h3>
                                <span className="badge bg-secondary">
                                    {job.detected_language || 'English'}
                                </span>
                            </div>
                            <pre
                                ref={textDisplayRef}
                                className="mb-0"
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    fontFamily: 'inherit',
                                    fontSize: '1rem',
                                    lineHeight: '1.6',
                                }}
                            >
                                {fullText || 'No text detected.'}
                            </pre>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;
