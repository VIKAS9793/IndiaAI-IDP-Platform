import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import api from '../lib/api';
import { useDropzone } from 'react-dropzone';

/** 
 * UX4G Document Upload Page
 * Features: Drag-and-drop, file validation, progress indicator, real backend integration
 * DPDP Compliance: Purpose selection and Consent verification
 * 
 * Compliant with Government of India Design System v2.0.8
 */

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const UploadPage: React.FC = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
    const [ocrEngine] = useState<string>('chandra');
    const [purpose, setPurpose] = useState<string>('VERIFICATION');
    const [consent, setConsent] = useState<boolean>(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/png': ['.png'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/tiff': ['.tiff', '.tif']
        },
        maxFiles: 1,
        maxSize: MAX_FILE_SIZE
    });

    const removeFile = () => {
        setFile(null);
        setError(null);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const handleUpload = async () => {
        if (!file) return;

        if (!consent) {
            setError("User consent is required for data processing under DPDP Act.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);
        setError(null);

        try {
            // Simulate progress for better UX
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 500);

            console.log('[UploadPage] Starting upload...');
            const response = await api.uploadDocument(file, selectedLanguage, ocrEngine, purpose, consent);
            console.log('[UploadPage] Upload response:', response);

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Navigate to results page
            setTimeout(() => {
                navigate(`/results/${response.job_id}`);
            }, 500);

        } catch (err: unknown) {
            console.error("[UploadPage] Upload failed:", err);

            let errorMessage = "Upload failed. Please try again.";
            if (err && typeof err === 'object' && 'response' in err) {
                const errWithResponse = err as { response?: { data?: { detail?: unknown } } };
                if (errWithResponse.response?.data?.detail) {
                    const detail = errWithResponse.response.data.detail;
                    if (typeof detail === 'string') {
                        errorMessage = detail;
                    } else if (Array.isArray(detail)) {
                        errorMessage = detail.map((e: { msg?: string }) => e.msg || '').join(', ');
                    } else if (typeof detail === 'object') {
                        errorMessage = JSON.stringify(detail);
                    }
                }
            }

            setError(errorMessage);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="container py-5">
            <h1 className="display-6 fw-bold mb-2">Upload Documents for Processing</h1>
            <p className="text-muted mb-4">
                Upload your documents for intelligent processing. This is a demo interface - please do not upload real documents.
            </p>

            {/* Language Selector */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h5 fw-semibold mb-3">Select Processing Language</h2>
                    <div className="row g-3">
                        {[
                            { value: 'auto', label: 'Auto Detect' },
                            { value: 'en', label: 'English' },
                            { value: 'hi', label: 'हिंदी (Hindi)' },
                            { value: 'ta', label: 'தமிழ் (Tamil)' },
                        ].map(lang => (
                            <div className="col-6 col-md-3" key={lang.value}>
                                <button
                                    onClick={() => setSelectedLanguage(lang.value)}
                                    className={`btn w-100 ${selectedLanguage === lang.value
                                        ? 'btn-primary'
                                        : 'btn-outline-secondary'
                                        }`}
                                >
                                    {lang.label}
                                </button>
                            </div>
                        ))}
                    </div>
                </CardBody>
            </Card>

            {/* DPDP Compliance Section */}
            <Card className="mb-4 border-start border-primary border-4">
                <CardBody>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                        <h2 className="h5 fw-semibold mb-0">Governance & Compliance (DPDP Act)</h2>
                    </div>

                    <div className="row g-4">
                        <div className="col-md-6">
                            <label className="form-label fw-medium">Purpose of Processing</label>
                            <select
                                value={purpose}
                                onChange={(e) => setPurpose(e.target.value)}
                                className="form-select"
                            >
                                <option value="VERIFICATION">Identity Verification</option>
                                <option value="KYC">Know Your Customer (KYC)</option>
                                <option value="BENEFIT_DISTRIBUTION">Benefit Distribution</option>
                                <option value="EMPLOYMENT">Employment Verification</option>
                                <option value="TEST">System Testing</option>
                                <option value="OTHER">Other Legal Purpose</option>
                            </select>
                            <div className="form-text">
                                Specify the lawful purpose for processing this personal data.
                            </div>
                        </div>

                        <div className="col-md-6 d-flex align-items-start pt-md-4">
                            <div className="form-check">
                                <input
                                    id="consent"
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                    className="form-check-input"
                                />
                                <label htmlFor="consent" className="form-check-label">
                                    <span className="fw-medium">User Consent Verified</span>
                                    <br />
                                    <small className="text-muted">
                                        I confirm that explicit consent has been obtained from the data principal for processing this document for the specified purpose.
                                    </small>
                                </label>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Upload Area */}
            <Card className="mb-4">
                <CardBody>
                    {!file ? (
                        <div
                            {...getRootProps()}
                            className={`border border-2 border-dashed rounded p-5 text-center ${isDragActive
                                ? 'border-primary bg-primary bg-opacity-10'
                                : 'border-secondary'
                                }`}
                            style={{ cursor: 'pointer' }}
                        >
                            <input {...getInputProps()} />
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="64"
                                height="64"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-muted mx-auto mb-3"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" x2="12" y1="3" y2="15" />
                            </svg>
                            <p className="h5 fw-semibold mb-2">Drag and drop files here</p>
                            <p className="text-muted mb-3">or click to browse</p>
                            <Button variant="primary">Select Files</Button>
                            <div className="mt-4 small text-muted">
                                <p className="mb-1">Supported formats: PDF, PNG, JPEG, TIFF</p>
                                <p className="mb-0">Maximum file size: 25MB</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="h5 fw-semibold mb-3">Selected File</h3>
                            <div className="d-flex align-items-center justify-content-between p-3 rounded border border-primary bg-primary bg-opacity-10">
                                <div className="d-flex align-items-center gap-3 flex-grow-1">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="32"
                                        height="32"
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
                                        <line x1="16" x2="8" y1="13" y2="13" />
                                        <line x1="16" x2="8" y1="17" y2="17" />
                                        <line x1="10" x2="8" y1="9" y2="9" />
                                    </svg>
                                    <div className="flex-grow-1">
                                        <p className="fw-medium mb-0">{file.name}</p>
                                        <small className="text-muted">{formatFileSize(file.size)}</small>
                                    </div>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
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
                                    <button
                                        onClick={removeFile}
                                        className="btn btn-link text-danger p-0"
                                        disabled={isUploading}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="alert alert-danger d-flex align-items-center gap-2 mt-3">
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
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" x2="12" y1="8" y2="12" />
                                        <line x1="12" x2="12.01" y1="16" y2="16" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {isUploading && (
                                <div className="mt-4">
                                    <div className="d-flex justify-content-between small mb-1">
                                        <span className="fw-medium text-primary">Uploading & Processing...</span>
                                        <span className="text-primary">{Math.round(uploadProgress)}%</span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                        <div
                                            className="progress-bar progress-bar-striped progress-bar-animated"
                                            role="progressbar"
                                            style={{ width: `${uploadProgress}%` }}
                                            aria-valuenow={uploadProgress}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Process Button */}
                            <div className="d-flex justify-content-end mt-4">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleUpload}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Process Document'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Instructions */}
            <div className="alert alert-info border-start border-info border-4">
                <strong>Prototype Mode</strong>
                <p className="mb-0 small">
                    Documents are processed locally using PaddleOCR. Results are saved to the local database.
                </p>
            </div>
        </div>
    );
};

export default UploadPage;
