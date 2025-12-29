import React, { useState, useEffect } from 'react';
import { fetchNeedsReviewJobs, submitJobReview, getJobResults } from '../lib/api';
import type { Job, OCRResult } from '../lib/api';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Document, Page, pdfjs } from 'react-pdf';

/**
 * UX4G Review Page Component
 * Human-in-the-loop verification of low-confidence OCR results
 * 
 * Compliant with Government of India Design System v2.0.8
 */

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ReviewPage: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
    const [currentText, setCurrentText] = useState<string>('');
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingResults, setLoadingResults] = useState(false);

    useEffect(() => {
        loadJobs();
    }, []);

    useEffect(() => {
        if (selectedJob) {
            loadJobResults(selectedJob.id);
            setPageNumber(1);
        } else {
            setOcrResults([]);
            setCurrentText('');
        }
    }, [selectedJob]);

    useEffect(() => {
        if (ocrResults.length > 0) {
            const pageResult = ocrResults.find(r => r.page_number === pageNumber);
            if (pageResult) {
                setCurrentText(pageResult.full_text);
            } else {
                setCurrentText('');
            }
        }
    }, [pageNumber, ocrResults]);

    const loadJobs = async () => {
        try {
            setLoading(true);
            const data = await fetchNeedsReviewJobs();
            setJobs(data);
            if (data.length > 0) {
                setSelectedJob(data[0]);
            }
        } catch (err) {
            setError('Failed to load jobs needing review');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadJobResults = async (jobId: string) => {
        try {
            setLoadingResults(true);
            const data = await getJobResults(jobId);
            setOcrResults(data.ocr_results);
        } catch (err) {
            console.error('Failed to load results:', err);
        } finally {
            setLoadingResults(false);
        }
    };

    const handleReview = async (action: 'approve' | 'reject') => {
        if (!selectedJob) return;

        try {
            await submitJobReview(selectedJob.id, action, {
                corrections: {
                    full_text: currentText,
                    page: pageNumber
                }
            });

            const updatedJobs = jobs.filter(j => j.id !== selectedJob.id);
            setJobs(updatedJobs);
            setSelectedJob(updatedJobs.length > 0 ? updatedJobs[0] : null);
            setPageNumber(1);
        } catch (err) {
            setError('Failed to submit review');
            console.error(err);
        }
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const getFileUrl = (fileKey: string) => {
        return `http://localhost:8000/data/uploads/${fileKey}`;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="container py-5">
                <Card>
                    <CardHeader>
                        <CardTitle>Review Queue</CardTitle>
                    </CardHeader>
                    <CardBody className="text-center py-5">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-success mx-auto mb-3"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                        <h3 className="h5 fw-semibold mb-2">All Caught Up!</h3>
                        <p className="text-muted mb-0">No documents pending review.</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="container py-4" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="h4 fw-bold mb-0">Document Review Queue ({jobs.length})</h1>
                <small className="text-muted">
                    Reviewing: <span className="fw-semibold">{selectedJob?.filename}</span>
                </small>
            </div>

            {error && (
                <Alert variant="danger" className="mb-4" dismissible onDismiss={() => setError(null)}>
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="row g-4" style={{ height: 'calc(100% - 60px)' }}>
                {/* Left: Document Viewer */}
                <div className="col-md-6">
                    <Card className="h-100 d-flex flex-column">
                        <CardHeader className="d-flex justify-content-between align-items-center">
                            <CardTitle as="h6" className="mb-0">Original Document</CardTitle>
                            <div className="d-flex align-items-center gap-2">
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    disabled={pageNumber <= 1}
                                    onClick={() => setPageNumber(p => p - 1)}
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
                                    >
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                </Button>
                                <small>Page {pageNumber} of {numPages || '--'}</small>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    disabled={numPages === null || pageNumber >= numPages}
                                    onClick={() => setPageNumber(p => p + 1)}
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
                                    >
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardBody className="flex-grow-1 bg-light overflow-auto d-flex justify-content-center p-0">
                            {selectedJob ? (
                                <Document
                                    file={getFileUrl(selectedJob.file_key)}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    className="mw-100"
                                    loading={
                                        <div className="d-flex align-items-center justify-content-center" style={{ height: '300px' }}>
                                            <div className="spinner-border text-secondary" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        </div>
                                    }
                                    error={
                                        <div className="d-flex align-items-center justify-content-center text-danger" style={{ height: '300px' }}>
                                            Failed to load PDF
                                        </div>
                                    }
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        width={500}
                                        className="shadow my-3"
                                    />
                                </Document>
                            ) : (
                                <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                    Select a job to view
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Right: Extraction Results & Actions */}
                <div className="col-md-6">
                    <Card className="h-100 d-flex flex-column">
                        <CardHeader>
                            <CardTitle as="h6" className="mb-0">Extracted Data & Actions</CardTitle>
                        </CardHeader>
                        <CardBody className="flex-grow-1 d-flex flex-column overflow-hidden">
                            {selectedJob && (
                                <>
                                    <div className="row g-3 mb-3">
                                        <div className="col-6">
                                            <div className="bg-light p-3 rounded">
                                                <small className="text-muted text-uppercase fw-medium d-block">Confidence</small>
                                                <span className={`h4 fw-bold mb-0 ${(selectedJob.confidence_score || 0) < 90 ? 'text-danger' : 'text-success'}`}>
                                                    {selectedJob.confidence_score}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="bg-light p-3 rounded">
                                                <small className="text-muted text-uppercase fw-medium d-block">Language</small>
                                                <span className="h5 fw-medium mb-0">{selectedJob.detected_language || 'Unknown'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-grow-1 d-flex flex-column mb-3" style={{ minHeight: 0 }}>
                                        <label className="form-label small fw-medium d-flex align-items-center gap-2">
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
                                            >
                                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" x2="8" y1="13" y2="13" />
                                                <line x1="16" x2="8" y1="17" y2="17" />
                                            </svg>
                                            Extracted Text (Editable)
                                        </label>
                                        {loadingResults ? (
                                            <div className="flex-grow-1 d-flex align-items-center justify-content-center border rounded bg-light">
                                                <div className="spinner-border spinner-border-sm text-secondary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <textarea
                                                className="form-control flex-grow-1 font-monospace small"
                                                value={currentText}
                                                onChange={(e) => setCurrentText(e.target.value)}
                                                placeholder="Extracted text will appear here..."
                                                style={{ resize: 'none' }}
                                            />
                                        )}
                                    </div>

                                    <div className="border-top pt-3 mt-auto">
                                        <div className="row g-2">
                                            <div className="col">
                                                <Button
                                                    variant="success"
                                                    onClick={() => handleReview('approve')}
                                                    className="w-100"
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
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path d="m9 12 2 2 4-4" />
                                                    </svg>
                                                    Approve & Save
                                                </Button>
                                            </div>
                                            <div className="col">
                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleReview('reject')}
                                                    className="w-100"
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
                                                        <circle cx="12" cy="12" r="10" />
                                                        <path d="m15 9-6 6" />
                                                        <path d="m9 9 6 6" />
                                                    </svg>
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-muted text-center small mt-2 mb-0">
                                            Approving will save any edits made to the text.
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ReviewPage;
