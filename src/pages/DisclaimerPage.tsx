import React from 'react';
import { Card, CardBody } from '../components/ui/Card';

/**
 * UX4G Disclaimer Page Component
 * Comprehensive legal disclaimer
 * 
 * Compliant with Government of India Design System v2.0.8
 */
export const DisclaimerPage: React.FC = () => {
    return (
        <div className="container py-5">
            <h1 className="display-5 fw-bold mb-2">Legal Disclaimer</h1>
            <p className="text-muted mb-4">
                Please read this disclaimer carefully before using this platform.
            </p>

            {/* Critical Disclaimer */}
            <div className="alert alert-danger p-4 mb-4">
                <div className="d-flex align-items-start gap-3">
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
                        className="flex-shrink-0"
                    >
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                    </svg>
                    <div>
                        <h2 className="h4 fw-bold mb-2">PROTOTYPE DEMONSTRATION ONLY</h2>
                        <p className="mb-0 fs-5">
                            This website is a technical prototype created for demonstration purposes only.
                            It is NOT an official government platform and has NO affiliation with any government entity.
                        </p>
                    </div>
                </div>
            </div>

            {/* No Affiliation */}
            <Card className="mb-4 border-danger">
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
                            className="text-danger"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="m15 9-6 6" />
                            <path d="m9 9 6 6" />
                        </svg>
                        <h2 className="h4 fw-bold text-danger mb-0">No Government Affiliation</h2>
                    </div>
                    <p className="fw-semibold">This platform is NOT:</p>
                    <ul>
                        <li>Affiliated with, endorsed by, or connected to the Government of India</li>
                        <li>Part of the official IndiaAI initiative or any government program</li>
                        <li>Authorized to represent any government agency or department</li>
                        <li>Approved or sanctioned by any official authority</li>
                        <li>Connected to any government infrastructure or systems</li>
                    </ul>
                </CardBody>
            </Card>

            {/* No Services Provided */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">No Services Provided</h2>
                    <p>This platform does NOT:</p>
                    <ul>
                        <li>Process actual documents or data</li>
                        <li>Provide any official government services</li>
                        <li>Store, transmit, or retain any user information</li>
                        <li>Connect to any backend servers or databases</li>
                        <li>Have any functional document processing capabilities</li>
                    </ul>
                    <p className="fw-semibold text-danger mt-3 mb-0">
                        This is a front-end demonstration only. All "functionality" is for UI/UX demonstration purposes.
                    </p>
                </CardBody>
            </Card>

            {/* DO NOT UPLOAD */}
            <Card className="mb-4 bg-danger bg-opacity-10 border-danger">
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
                            className="text-danger"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <h2 className="h4 fw-bold text-danger mb-0">DO NOT UPLOAD REAL DOCUMENTS</h2>
                    </div>
                    <p className="fw-semibold text-danger">NEVER upload the following:</p>
                    <ul className="text-danger">
                        <li>Real government-issued documents (Aadhaar, PAN Card, Passport, etc.)</li>
                        <li>Personal identifying information (PII)</li>
                        <li>Sensitive or confidential data</li>
                        <li>Proprietary or copyrighted materials</li>
                        <li>Any document you would not share publicly</li>
                    </ul>
                    <p className="fw-semibold text-danger mt-3 mb-0">
                        This platform is for demonstration only. Do not upload any real documents under any circumstances.
                    </p>
                </CardBody>
            </Card>

            {/* No Liability */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">Limitation of Liability</h2>
                    <p>The creator of this demonstration:</p>
                    <ul className="small">
                        <li>Makes no warranties or guarantees of any kind</li>
                        <li>Assumes NO liability for any use or misuse of this demonstration</li>
                        <li>Is NOT responsible for any consequences arising from interaction with this platform</li>
                        <li>Does not guarantee accuracy, completeness, or fitness for any purpose</li>
                    </ul>
                    <p className="fw-semibold mt-3 mb-0">
                        USE AT YOUR OWN RISK. This is provided "AS IS" without any warranty.
                    </p>
                </CardBody>
            </Card>

            {/* Purpose */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">Purpose of This Demonstration</h2>
                    <p>This prototype was created solely for:</p>
                    <ul>
                        <li>Educational purposes</li>
                        <li>Technical demonstration of web development skills</li>
                        <li>Portfolio/showcase purposes</li>
                        <li>Illustrating potential UI/UX concepts</li>
                    </ul>
                    <p className="mt-3 mb-0">
                        It is NOT intended for production use, real document processing, or any official purposes.
                    </p>
                </CardBody>
            </Card>

            {/* Intellectual Property */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">Intellectual Property</h2>
                    <p className="small">
                        No claim is made to any government trademarks, emblems, or official materials.
                        References to "IndiaAI" or "Government of India" are purely for demonstrative context.
                    </p>
                    <p className="small mb-0">
                        All government trademarks and official insignia are property of their respective owners.
                    </p>
                </CardBody>
            </Card>

            {/* Changes to Disclaimer */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">Changes to This Disclaimer</h2>
                    <p className="small">
                        This disclaimer may be updated at any time without notice. Continued use of this
                        demonstration constitutes acceptance of the current disclaimer.
                    </p>
                    <p className="small text-muted mb-0">
                        Last updated: December 2025
                    </p>
                </CardBody>
            </Card>

            {/* Official Resources */}
            <div className="alert alert-info">
                <h5 className="alert-heading fw-semibold">For Official Information:</h5>
                <p className="mb-0 small">
                    To access official IndiaAI resources, please visit{' '}
                    <a
                        href="https://indiaai.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="alert-link"
                    >
                        indiaai.gov.in
                    </a>
                </p>
            </div>
        </div>
    );
};

export default DisclaimerPage;
