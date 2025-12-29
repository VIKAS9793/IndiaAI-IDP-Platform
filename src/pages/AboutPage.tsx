import React from 'react';
import { Card, CardBody } from '../components/ui/Card';

/**
 * UX4G About Page Component
 * Full disclosure about the prototype
 * 
 * Compliant with Government of India Design System v2.0.8
 */
export const AboutPage: React.FC = () => {
    return (
        <div className="container py-5">
            <h1 className="display-5 fw-bold mb-4">About This Prototype</h1>

            {/* Critical Warning */}
            <div className="alert alert-danger border-start border-danger border-4 mb-4">
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
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                    </svg>
                    <div>
                        <h2 className="h5 fw-bold mb-2">
                            ⚠️ CRITICAL: This is NOT an Official Platform
                        </h2>
                        <p className="mb-0">
                            This website is a technical demonstration/prototype only. It is NOT affiliated with, endorsed by,
                            or connected to the Government of India, IndiaAI, or any official government entity.
                        </p>
                    </div>
                </div>
            </div>

            {/* What This Is */}
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
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                        </svg>
                        <h2 className="h4 fw-bold mb-0">What This Is</h2>
                    </div>
                    <p>
                        This is a <strong>technical prototype</strong> created for demonstration and educational purposes.
                        It showcases potential design and functionality concepts for an Intelligent Document Processing (IDP) platform.
                    </p>
                    <ul>
                        <li>A non-functional mockup/demonstration</li>
                        <li>Created as a portfolio/showcase project</li>
                        <li>For learning and demonstration purposes only</li>
                        <li>Does NOT actually process any documents</li>
                        <li>Does NOT store or transmit any data</li>
                    </ul>
                </CardBody>
            </Card>

            {/* What This is NOT */}
            <Card className="mb-4 border-danger bg-danger bg-opacity-10">
                <CardBody>
                    <h2 className="h4 fw-bold text-danger mb-3">What This is NOT</h2>
                    <ul className="text-danger">
                        <li><strong>NOT</strong> an official government platform or service</li>
                        <li><strong>NOT</strong> affiliated with IndiaAI or the Government of India</li>
                        <li><strong>NOT</strong> endorsed, approved, or sanctioned by any government entity</li>
                        <li><strong>NOT</strong> authorized to handle real, sensitive, or personal documents</li>
                        <li><strong>NOT</strong> providing any official governmental services</li>
                        <li><strong>NOT</strong> connected to any actual government infrastructure</li>
                    </ul>
                </CardBody>
            </Card>

            {/* Purpose */}
            <Card className="mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">Purpose of This Demonstration</h2>
                    <p>This prototype was created to:</p>
                    <ol>
                        <li>Demonstrate modern web development capabilities</li>
                        <li>Showcase UI/UX design skills for government-themed applications</li>
                        <li>Illustrate potential features of an IDP system</li>
                        <li>Serve as a portfolio project for educational purposes</li>
                    </ol>
                </CardBody>
            </Card>

            {/* Technical Stack */}
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
                            <polyline points="16 18 22 12 16 6" />
                            <polyline points="8 6 2 12 8 18" />
                        </svg>
                        <h2 className="h4 fw-bold mb-0">Technology Stack</h2>
                    </div>
                    <div className="row">
                        <div className="col-md-6">
                            <h3 className="h6 fw-semibold mb-2">Frontend</h3>
                            <ul className="small">
                                <li>React 19 + TypeScript</li>
                                <li>Vite Build Tool</li>
                                <li>UX4G Design System v2.0.8</li>
                                <li>React Router</li>
                                <li>Inline SVG Icons</li>
                            </ul>
                        </div>
                        <div className="col-md-6">
                            <h3 className="h6 fw-semibold mb-2">Features</h3>
                            <ul className="small">
                                <li>Responsive Design</li>
                                <li>Drag-and-Drop Upload</li>
                                <li>File Validation</li>
                                <li>Multi-language Support</li>
                                <li>Government Theme (UX4G)</li>
                            </ul>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Legal Notice */}
            <Card className="border-warning bg-warning bg-opacity-10 mb-4">
                <CardBody>
                    <h2 className="h4 fw-bold mb-3">Legal Notice</h2>
                    <div className="small">
                        <p>
                            <strong>No Liability:</strong> The creator of this demonstration assumes no liability for any misuse,
                            misunderstanding, or consequences arising from interaction with this prototype.
                        </p>
                        <p>
                            <strong>No Services Provided:</strong> This platform does not provide any real services,
                            does not process actual documents, and does not store or transmit any user data.
                        </p>
                        <p className="mb-0">
                            <strong>Educational Purpose Only:</strong> This is purely a technical demonstration created
                            for educational and portfolio purposes.
                        </p>
                    </div>
                </CardBody>
            </Card>

            {/* Contact Disclaimer */}
            <div className="text-center small text-muted mt-5">
                <p>
                    For official IndiaAI information, please visit{' '}
                    <a
                        href="https://indiaai.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                    >
                        indiaai.gov.in
                    </a>
                </p>
                <p className="mb-0">
                    This prototype is not associated with the official website in any way.
                </p>
            </div>
        </div>
    );
};

export default AboutPage;
