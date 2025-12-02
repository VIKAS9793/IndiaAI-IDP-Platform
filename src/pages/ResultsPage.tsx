import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, CheckCircle2, Clock, Download, AlertCircle, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api, { type JobResultsResponse, type TextBlock, type RawOCRData } from '../lib/api';
import { DocumentViewer } from '../components/DocumentViewer';

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
                // First check job status
                const statusData = await api.getJobStatus(jobId);

                if (statusData.status === 'completed' || statusData.status === 'ocr_complete') {
                    // If complete, fetch the full results
                    const data = await api.getJobResults(jobId);
                    setResults(data);
                    setLoading(false);
                    if (pollInterval) clearInterval(pollInterval);
                } else if (statusData.status === 'failed') {
                    setError('Job processing failed.');
                    setLoading(false);
                    if (pollInterval) clearInterval(pollInterval);
                } else {
                    // Still processing, keep polling
                    // Optional: Update a progress indicator here if we had one
                }
            } catch (err) {
                console.error('Error polling job status:', err);
                // Don't set error immediately on poll failure, retry a few times? 
                // For now, let's just stop polling on hard error to avoid infinite loops
                setError('Failed to track job status. Please refresh.');
                setLoading(false);
                if (pollInterval) clearInterval(pollInterval);
            }
        };

        // Initial check
        checkStatusAndFetchResults();

        // Start polling every 2 seconds
        pollInterval = setInterval(checkStatusAndFetchResults, 2000);

        return () => {
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [jobId]);

    // Parse raw_data to extract bounding boxes
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

    // Close dropdown when clicking outside
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


        // Highlight the corresponding text in the extracted text display
        if (textDisplayRef.current) {
            const textElement = textDisplayRef.current;
            const textContent = textElement.textContent || '';
            const blockText = block.text;

            // Find text position and scroll to it
            const index = textContent.indexOf(blockText);
            if (index !== -1) {
                // Create a temporary range to scroll to
                const range = document.createRange();
                const textNode = textElement.firstChild;
                if (textNode) {
                    range.setStart(textNode, Math.max(0, index));
                    range.setEnd(textNode, Math.min(textContent.length, index + blockText.length));

                    const selection = window.getSelection();
                    selection?.removeAllRanges();
                    selection?.addRange(range);

                    // Scroll into view
                    const span = document.createElement('span');
                    range.surroundContents(span);
                    span.scrollIntoView({ behavior: 'smooth', block: 'center' });

                    // Clean up
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
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
        );
    }

    if (error || !results) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Results</h2>
                <p className="text-gray-600 mb-6">{error || 'Job not found'}</p>
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
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/upload')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Processing Results</h1>
                        <p className="text-gray-500 text-sm">Job ID: {job.id}</p>
                    </div>
                </div>
                <div className="flex gap-3 relative">
                    {(job.review_status === 'needs_review' || (job.confidence_score && job.confidence_score < 90)) && (
                        <Button
                            variant="destructive"
                            onClick={() => navigate('/review')}
                            className="animate-pulse"
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Review Required
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => window.print()}>
                        Print
                    </Button>
                    <div className="relative download-dropdown-container">
                        <Button
                            variant="primary"
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                            <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>

                        {showDownloadMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                <button
                                    onClick={downloadAsText}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    Download as Text (.txt)
                                </button>
                                <button
                                    onClick={downloadAsJSON}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download as JSON (.json)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Document Info & Stats */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="font-semibold text-gray-900 mb-4">Document Details</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm text-gray-500">Filename</p>
                                    <p className="font-medium">{job.filename}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <p className="font-medium capitalize">{job.status}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-purple-600" />
                                <div>
                                    <p className="text-sm text-gray-500">Processed At</p>
                                    <p className="font-medium">
                                        {job.completed_at
                                            ? new Date(job.completed_at.endsWith('Z') ? job.completed_at : job.completed_at + 'Z').toLocaleString()
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-semibold text-gray-900 mb-4">Analysis Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-600 mb-1">Confidence</p>
                                <p className="text-2xl font-bold text-blue-900">
                                    {avgConfidence.toFixed(1)}%
                                </p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600 mb-1">Pages</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {ocr_results.length}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Document Viewer & Extracted Text */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Document Viewer with Bounding Boxes */}
                    {textBlocks.length > 0 && (
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-4">Document with Detected Text Regions</h3>
                            <DocumentViewer
                                fileUrl={`http://localhost:8000/data/uploads/${job.file_key}`}
                                fileType={job.file_type || ''}
                                textBlocks={textBlocks}
                                onBlockClick={handleBlockClick}
                            />
                        </Card>
                    )}

                    {/* Extracted Text */}
                    <Card className="min-h-[400px]">
                        <div className="flex items-center justify-between mb-4 border-b pb-4">
                            <h3 className="font-semibold text-gray-900">Extracted Text</h3>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                {job.detected_language || 'English'}
                            </span>
                        </div>
                        <div className="prose max-w-none">
                            <pre
                                ref={textDisplayRef}
                                className="whitespace-pre-wrap font-sans text-gray-700 text-base leading-relaxed"
                            >
                                {fullText || 'No text detected.'}
                            </pre>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
