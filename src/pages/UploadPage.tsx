import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import api from '../lib/api';
import { useDropzone } from 'react-dropzone';

/** 
 * Document Upload Page
 * Features: Drag-and-drop, file validation, progress indicator, real backend integration
 * DPDP Compliance: Purpose selection and Consent verification
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

        } catch (err: any) {
            console.error("[UploadPage] Upload failed:", err);
            console.error("[UploadPage] Error response:", err.response);

            let errorMessage = "Upload failed. Please try again.";
            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (typeof detail === 'string') {
                    errorMessage = detail;
                } else if (Array.isArray(detail)) {
                    // Handle Pydantic validation errors
                    errorMessage = detail.map((e: any) => e.msg).join(', ');
                } else if (typeof detail === 'object') {
                    errorMessage = JSON.stringify(detail);
                }
            }

            setError(errorMessage);
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Upload Documents for Processing
            </h1>
            <p className="text-gray-600 mb-8">
                Upload your documents for intelligent processing. This is a demo interface - please do not upload real documents.
            </p>

            {/* Language Selector */}
            <Card className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Select Processing Language</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { value: 'auto', label: 'Auto Detect' },
                        { value: 'en', label: 'English' },
                        { value: 'hi', label: 'हिंदी (Hindi)' },
                        { value: 'ta', label: 'தமிழ் (Tamil)' },
                    ].map(lang => (
                        <button
                            key={lang.value}
                            onClick={() => setSelectedLanguage(lang.value)}
                            className={`p-3 border-2 rounded-md transition-all ${selectedLanguage === lang.value
                                ? 'border-blue-700 bg-blue-50 text-blue-900'
                                : 'border-gray-300 hover:border-blue-400'
                                }`}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>
            </Card>

            {/* DPDP Compliance Section */}
            <Card className="mb-6 border-l-4 border-l-indigo-500">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-6 w-6 text-indigo-600" />
                    <h2 className="text-lg font-semibold">Governance & Compliance (DPDP Act)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Purpose of Processing
                        </label>
                        <select
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="VERIFICATION">Identity Verification</option>
                            <option value="KYC">Know Your Customer (KYC)</option>
                            <option value="BENEFIT_DISTRIBUTION">Benefit Distribution</option>
                            <option value="EMPLOYMENT">Employment Verification</option>
                            <option value="TEST">System Testing</option>
                            <option value="OTHER">Other Legal Purpose</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Specify the lawful purpose for processing this personal data.
                        </p>
                    </div>

                    <div className="flex items-start pt-6">
                        <div className="flex items-center h-5">
                            <input
                                id="consent"
                                type="checkbox"
                                checked={consent}
                                onChange={(e) => setConsent(e.target.checked)}
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label htmlFor="consent" className="font-medium text-gray-700">
                                User Consent Verified
                            </label>
                            <p className="text-gray-500">
                                I confirm that explicit consent has been obtained from the data principal for processing this document for the specified purpose.
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Upload Area */}
            <Card>
                {!file ? (
                    <div
                        {...getRootProps()}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${isDragActive
                            ? 'border-blue-700 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-400'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                            Drag and drop files here
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            or click to browse
                        </p>
                        <Button type="button" variant="primary" className="inline-block">
                            Select Files
                        </Button>
                        <div className="mt-6 text-xs text-gray-500">
                            <p>Supported formats: PDF, PNG, JPEG, TIFF</p>
                            <p>Maximum file size: 25MB</p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6">
                        <h3 className="font-semibold text-lg mb-4">Selected File</h3>
                        <div className="flex items-center justify-between p-4 rounded-lg border border-blue-200 bg-blue-50">
                            <div className="flex items-center gap-3 flex-1">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {file.name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <button
                                    onClick={removeFile}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    disabled={isUploading}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                                <AlertCircle className="h-5 w-5" />
                                <p className="text-sm">{error}</p>
                            </div>
                        )}

                        {/* Progress Bar */}
                        {isUploading && (
                            <div className="mt-6">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-blue-700">
                                        Uploading & Processing...
                                    </span>
                                    <span className="text-blue-700">{Math.round(uploadProgress)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Process Button */}
                        <div className="mt-6 flex justify-end">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleUpload}
                                disabled={isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    'Process Document'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Instructions */}
            <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="font-semibold text-blue-900 mb-2">Prototype Mode</p>
                <p className="text-sm text-blue-800">
                    Documents are processed locally using PaddleOCR. Results are saved to the local database.
                </p>
            </div>
        </div>
    );
};
