import React, { useState, useEffect } from 'react';
import { fetchNeedsReviewJobs, submitJobReview, getJobResults } from '../lib/api';
import type { Job, OCRResult } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Loader2, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF worker
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

    // Update text when page changes
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
            // Don't block UI, just show empty text
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

            // Remove from list and select next
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
        // Construct URL to backend static file serving
        return `http://localhost:8000/data/uploads/${fileKey}`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Review Queue</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-12">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                        <p className="text-gray-500">No documents pending review.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 h-[calc(100vh-4rem)] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Document Review Queue ({jobs.length})</h1>
                <div className="text-sm text-gray-500">
                    Reviewing: <span className="font-semibold text-gray-900">{selectedJob?.filename}</span>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden">
                {/* Left: Document Viewer */}
                <Card className="h-full flex flex-col overflow-hidden">
                    <CardHeader className="py-3 px-4 border-b bg-gray-50 flex flex-row justify-between items-center">
                        <CardTitle className="text-base">Original Document</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={pageNumber <= 1}
                                onClick={() => setPageNumber(p => p - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                                Page {pageNumber} of {numPages || '--'}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={numPages === null || pageNumber >= numPages}
                                onClick={() => setPageNumber(p => p + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 bg-gray-200 p-0 overflow-auto flex justify-center relative">
                        {selectedJob ? (
                            <Document
                                file={getFileUrl(selectedJob.file_key)}
                                onLoadSuccess={onDocumentLoadSuccess}
                                className="max-w-full"
                                loading={
                                    <div className="flex items-center justify-center h-64">
                                        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                                    </div>
                                }
                                error={
                                    <div className="flex items-center justify-center h-64 text-red-500">
                                        Failed to load PDF
                                    </div>
                                }
                            >
                                <Page
                                    pageNumber={pageNumber}
                                    renderTextLayer={true}
                                    renderAnnotationLayer={true}
                                    width={600}
                                    className="shadow-lg my-4"
                                />
                            </Document>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Select a job to view
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right: Extraction Results & Actions */}
                <Card className="h-full flex flex-col overflow-hidden">
                    <CardHeader className="py-3 px-4 border-b bg-gray-50">
                        <CardTitle className="text-base">Extracted Data & Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden flex flex-col p-4">
                        {selectedJob && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <label className="text-xs font-medium text-gray-500 uppercase">Confidence</label>
                                        <p className={`text-xl font-bold ${(selectedJob.confidence_score || 0) < 90 ? 'text-red-500' : 'text-green-500'
                                            }`}>
                                            {selectedJob.confidence_score}%
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <label className="text-xs font-medium text-gray-500 uppercase">Language</label>
                                        <p className="text-lg font-medium">{selectedJob.detected_language || 'Unknown'}</p>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col min-h-0 mb-4">
                                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Extracted Text (Editable)
                                    </label>
                                    {loadingResults ? (
                                        <div className="flex-1 flex items-center justify-center border rounded-md bg-gray-50">
                                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                                        </div>
                                    ) : (
                                        <textarea
                                            className="flex-1 w-full p-4 border rounded-md font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={currentText}
                                            onChange={(e) => setCurrentText(e.target.value)}
                                            placeholder="Extracted text will appear here..."
                                        />
                                    )}
                                </div>

                                <div className="border-t pt-4 mt-auto">
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleReview('approve')}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Approve & Save
                                        </Button>
                                        <Button
                                            onClick={() => handleReview('reject')}
                                            variant="destructive"
                                            className="flex-1"
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Reject
                                        </Button>
                                    </div>
                                    <p className="text-xs text-gray-400 text-center mt-2">
                                        Approving will save any edits made to the text.
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReviewPage;
