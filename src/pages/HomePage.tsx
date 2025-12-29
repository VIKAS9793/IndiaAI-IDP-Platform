import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';

/**
 * UX4G HomePage Component
 * Compliant with Government of India Design System v2.0.8
 */
export const HomePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="container py-5">
            {/* Hero Section */}
            <section className="text-center mb-5">
                <h1 className="display-4 fw-bold mb-4">
                    Intelligent Document Processing Platform
                </h1>
                <p className="lead text-muted mx-auto mb-4" style={{ maxWidth: '800px' }}>
                    A secure, AI-powered prototype for extracting text and data from documents.
                    Designed for Indian languages and government use cases.
                </p>

                {/* CTA Buttons */}
                <div className="row justify-content-center g-3 mb-4">
                    <div className="col-auto">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/upload')}
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
                                className="me-2"
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" x2="12" y1="3" y2="15" />
                            </svg>
                            Start Processing Documents
                        </Button>
                    </div>
                    <div className="col-auto">
                        <Button
                            variant="outline-primary"
                            size="lg"
                            onClick={() => navigate('/about')}
                        >
                            Learn More
                        </Button>
                    </div>
                </div>

                {/* Prototype Notice */}
                <div className="d-inline-flex align-items-center gap-2 px-4 py-2 bg-warning bg-opacity-10 text-warning-emphasis rounded-pill small fw-medium border border-warning border-opacity-25">
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
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Prototype Mode: Data is processed locally and not stored permanently.
                </div>
            </section>

            {/* Features Grid */}
            <section className="row g-4 mb-5">
                {/* Feature 1: Multi-Format Support */}
                <div className="col-md-4">
                    <Card className="h-100 text-center">
                        <CardBody className="p-4">
                            <div
                                className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: '64px', height: '64px' }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
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
                            </div>
                            <h5 className="card-title fw-semibold mb-2">Multi-Format Support</h5>
                            <p className="card-text text-muted">
                                Process PDF, PNG, JPEG, and TIFF files with high accuracy.
                            </p>
                        </CardBody>
                    </Card>
                </div>

                {/* Feature 2: Fast & Accurate */}
                <div className="col-md-4">
                    <Card className="h-100 text-center">
                        <CardBody className="p-4">
                            <div
                                className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: '64px', height: '64px' }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-success"
                                >
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <h5 className="card-title fw-semibold mb-2">Fast & Accurate</h5>
                            <p className="card-text text-muted">
                                Powered by advanced OCR models optimized for English and Indian languages.
                            </p>
                        </CardBody>
                    </Card>
                </div>

                {/* Feature 3: Secure by Design */}
                <div className="col-md-4">
                    <Card className="h-100 text-center">
                        <CardBody className="p-4">
                            <div
                                className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: '64px', height: '64px' }}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="28"
                                    height="28"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-info"
                                >
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h5 className="card-title fw-semibold mb-2">Secure by Design</h5>
                            <p className="card-text text-muted">
                                Built with privacy in mind. No data leaves your secure environment.
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </section>

            {/* Legal Disclaimer Section */}
            <section className="alert alert-light border text-center p-4">
                <h5 className="alert-heading fw-semibold mb-3">Important Legal Disclaimer</h5>
                <p className="mb-0 small">
                    This platform is a <strong>technical prototype</strong> created solely for demonstration and educational purposes.
                    It is <strong>NOT</strong> an official platform of the Government of India or the IndiaAI initiative.
                    No official services are provided. The creators assume no liability for any misuse of this demonstration.
                    Do not upload sensitive personal data (PII) or classified government documents.
                </p>
            </section>
        </div>
    );
};

export default HomePage;
