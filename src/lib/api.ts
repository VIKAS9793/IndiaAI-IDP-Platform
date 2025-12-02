import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Types based on backend schemas
export interface Job {
    id: string;
    filename: string;
    file_size?: number;
    file_key: string;
    file_type?: string;
    status: 'queued' | 'processing' | 'ocr_complete' | 'completed' | 'failed';
    progress: number;
    current_step?: string;
    total_pages?: number;
    processed_pages?: number;
    confidence_score?: number;
    detected_language?: string;
    error_message?: string;
    created_at: string;
    completed_at?: string;
    review_status?: 'needs_review' | 'approved' | 'rejected';
    // DPDP Fields
    purpose_code?: string;
    consent_verified?: boolean;
    data_retention_policy?: string;
    // Governance Fields
    contains_pii?: boolean;
    pii_types?: string;
}

// Bounding box data structures
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface TextBlock {
    text: string;
    confidence: number;
    bbox: BoundingBox;
}

export interface RawOCRData {
    blocks: TextBlock[];
    language: string;
    full_text: string;
}

export interface OCRResult {
    id: string;
    job_id: string;
    page_number: number;
    full_text: string;
    confidence?: number;
    language?: string;
    word_count?: number;
    char_count?: number;
    processing_time?: number;
    raw_data?: string;  // JSON string, parse to get RawOCRData
    created_at: string;
}

export interface UploadResponse {
    job_id: string;
    filename: string;
    status: string;
    message: string;
}

export interface JobResultsResponse {
    job: Job;
    ocr_results: OCRResult[];
}

// API Methods
export const uploadDocument = async (
    file: File,
    language: string = 'auto',
    ocrEngine: string = 'chandra',
    purpose: string = 'VERIFICATION',
    consent: boolean = true
): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);
    formData.append('ocr_engine', ocrEngine);
    formData.append('purpose', purpose);
    formData.append('consent', String(consent));

    const response = await api.post<UploadResponse>('/upload', formData);
    return response.data;
};

export const getJobStatus = async (jobId: string): Promise<Job> => {
    const response = await api.get<Job>(`/jobs/${jobId}`);
    return response.data;
};

export const getJobResults = async (jobId: string): Promise<JobResultsResponse> => {
    const response = await api.get<JobResultsResponse>(`/jobs/${jobId}/results`);
    return response.data;
};

export const fetchNeedsReviewJobs = async (): Promise<Job[]> => {
    const response = await api.get<Job[]>('/jobs/needs-review');
    return response.data;
};

export const submitJobReview = async (jobId: string, action: 'approve' | 'reject', data?: any): Promise<Job> => {
    const response = await api.patch<Job>(`/jobs/${jobId}/review`, {
        action,
        ...data
    });
    return response.data;
};

export default {
    uploadDocument,
    getJobStatus,
    getJobResults,
    fetchNeedsReviewJobs,
    submitJobReview,
};
