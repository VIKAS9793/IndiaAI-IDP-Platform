import React from 'react';
import { Card, CardBody } from '../components/ui/Card';

/**
 * UX4G Privacy Policy Page Component
 * 
 * Compliant with Government of India Design System v2.0.8
 */
export const PrivacyPage: React.FC = () => {
    return (
        <div className="container py-5">
            <h1 className="display-5 fw-bold mb-2">Privacy Policy</h1>
            <p className="text-muted mb-4">
                Understanding how this demonstration handles (or more accurately, doesn't handle) your information.
            </p>

            {/* Key Point */}
            <div className="alert alert-success border-start border-success border-4 mb-4">
                <div className="d-flex align-items-start gap-3">
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
                        className="flex-shrink-0 mt-1"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <div>
                        <h2 className="h5 fw-bold mb-2">
                            ✓ No Data Collection or Processing
                        </h2>
                        <p className="mb-0">
                            This is a front-end demonstration only. We do NOT collect, store, process, or transmit ANY data.
                            There are no backend servers, databases, or analytics.
                        </p>
                    </div>
                </div>
            </div>

            {/* What We Don't Do */}
            <Card className="mb-4">
                <CardBody>
                    <div className="d-flex align-items-start gap-3 mb-3">
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
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        <h2 className="h4 fw-bold mb-0">What We Don't Do</h2>
                    </div>
                    <p>This demonstration does NOT:</p>
                    <ul>
                        <li>Collect any personal information</li>
                        <li>Store any uploaded files</li>
                        <li>Transmit any data to servers</li>
                        <li>Use cookies for tracking</li>
                        <li>Employ analytics or monitoring tools</li>
                        <li>Share information with third parties</li>
                        <li>Process or retain any user data</li>
                    </ul>
                </CardBody>
            </Card>

            {/* Local Storage */}
            <Card className="mb-4">
                <CardBody>
                    <div className="d-flex align-items-start gap-3 mb-3">
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
                            <ellipse cx="12" cy="5" rx="9" ry="3" />
                            <path d="M3 5V19A9 3 0 0 0 21 19V5" />
                            <path d="M3 12A9 3 0 0 0 21 12" />
                        </svg>
                        <h2 className="h4 fw-bold mb-0">Local Storage Usage</h2>
                    </div>
                    <p>This demonstration uses browser local storage ONLY for:</p>
                    <ul>
                        <li>Storing your acknowledgment of the disclaimer modal</li>
                    </ul>
                    <p className="mt-3">This data:</p>
                    <ul>
                        <li>Stays on YOUR device only</li>
                        <li>Is never transmitted anywhere</li>
                        <li>Can be cleared by clearing your browser data</li>
                        <li>Contains NO personal information</li>
                    </ul>
                </CardBody>
            </Card>

            {/* File Upload */}
            <Card className="mb-4 bg-warning bg-opacity-10 border-warning">
                <CardBody>
                    <div className="d-flex align-items-start gap-3 mb-3">
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
                            className="text-warning"
                        >
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <h2 className="h4 fw-bold mb-0">File Upload Demo</h2>
                    </div>
                    <p className="fw-semibold">
                        Important: The file upload feature is for UI demonstration only.
                    </p>
                    <ul>
                        <li>Files are NOT uploaded to any server</li>
                        <li>Files are NOT processed in any way</li>
                        <li>Files stay in your browser memory temporarily</li>
                        <li>Files are discarded when you refresh or leave the page</li>
                        <li>No file data leaves your device</li>
                    </ul>
                    <p className="fw-semibold text-danger mt-3 mb-0">
                        DO NOT upload real, sensitive, or personal documents under any circumstances.
                    </p>
                </CardBody>
            </Card>

            {/* Third-Party Services */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">Third-Party Services</h2>
                    <p>This demonstration may load:</p>
                    <ul>
                        <li>Google Fonts (Noto Sans for UX4G typography) - subject to Google's privacy policy</li>
                        <li>UX4G CDN (Government of India Design System) - official government resource</li>
                    </ul>
                    <p className="small mt-3 mb-0">
                        No other third-party services, analytics, or tracking tools are employed.
                    </p>
                </CardBody>
            </Card>

            {/* Not a Privacy Policy */}
            <Card className="mb-4 bg-primary bg-opacity-10 border-primary">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">This is Not a Real Privacy Policy</h2>
                    <p className="small">
                        This "privacy policy" is provided for demonstration completeness only.
                    </p>
                    <p className="small">
                        Since this is not a real service and collects no data, a traditional privacy policy
                        would not apply. This page exists to show what such a page might look like in a real application.
                    </p>
                    <p className="fw-semibold small mb-0">
                        Again: This demonstration does NOT collect, store, or process ANY user data.
                    </p>
                </CardBody>
            </Card>

            {/* Your Rights */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">Your Rights</h2>
                    <p>Since no data is collected:</p>
                    <ul>
                        <li>There is no data to access, modify, or delete</li>
                        <li>There are no privacy settings to configure</li>
                        <li>There is no data portability or right to be forgotten (because there's no data)</li>
                    </ul>
                    <p className="mt-3 mb-0">
                        You can clear the disclaimer acknowledgment by clearing your browser's local storage for this site.
                    </p>
                </CardBody>
            </Card>

            {/* Contact */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">Questions?</h2>
                    <p className="small">
                        If you have questions about this demonstration, please remember:
                    </p>
                    <ul className="small">
                        <li>This is NOT an official platform</li>
                        <li>This is for demonstration purposes only</li>
                        <li>No real service or data processing occurs</li>
                    </ul>
                    <p className="small mt-3 mb-0">
                        For official IndiaAI information, visit{' '}
                        <a
                            href="https://indiaai.gov.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary fw-semibold"
                        >
                            indiaai.gov.in
                        </a>
                    </p>
                </CardBody>
            </Card>

            <div className="text-center small text-muted mt-5">
                <p className="mb-0">Last updated: December 2025</p>
            </div>
        </div>
    );
};

export default PrivacyPage;
