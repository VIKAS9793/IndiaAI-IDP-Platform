import React from 'react';
import { Link } from 'react-router-dom';

/**
 * UX4G Footer Component
 * Compliant with Government of India Design System v2.0.8
 * 
 * CRITICAL: Maintains comprehensive legal disclaimers (bilingual)
 * 
 * Reference: https://www.ux4g.gov.in/templates/template-1/footer-template-1/footer-template.php
 */
export const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto">
            {/* Legal Disclaimer Banner - CRITICAL */}
            <div className="alert alert-danger rounded-0 mb-0 border-0" role="alert">
                <div className="container">
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
                            <strong className="d-block mb-2">LEGAL DISCLAIMER - PROTOTYPE ONLY</strong>
                            <p className="mb-0 small">
                                This website is a technical demonstration/prototype created for educational and portfolio purposes only.
                                It is NOT an official government platform and is NOT affiliated with, endorsed by, or connected to
                                IndiaAI, the Government of India, or any government entity. This platform does NOT provide any official
                                services. DO NOT upload real documents, personal information, or sensitive data. The creator assumes
                                no liability for any misuse of this demonstration.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <div className="bg-dark text-light py-5">
                <div className="container">
                    <div className="row g-4">
                        {/* About Section */}
                        <div className="col-md-4">
                            <h5 className="text-white mb-3">
                                About This Prototype
                                <small className="d-block text-secondary small mt-1">इस प्रोटोटाइप के बारे में</small>
                            </h5>
                            <p className="text-secondary small">
                                A demonstration of Intelligent Document Processing capabilities.
                                This is a non-functional prototype for technical showcase purposes only.
                            </p>
                            <p className="text-secondary small">
                                बुद्धिमान दस्तावेज़ प्रसंस्करण क्षमताओं का प्रदर्शन। यह केवल तकनीकी प्रदर्शन उद्देश्यों के लिए एक गैर-कार्यात्मक प्रोटोटाइप है।
                            </p>
                            <div className="mt-3">
                                <span className="badge-prototype me-2">PROTOTYPE / प्रोटोटाइप</span>
                                <span className="badge-not-official">NOT OFFICIAL / आधिकारिक नहीं</span>
                            </div>
                        </div>

                        {/* Important Links */}
                        <div className="col-md-4">
                            <h5 className="text-white mb-3">
                                Important Links
                                <small className="d-block text-secondary small mt-1">महत्वपूर्ण लिंक</small>
                            </h5>
                            <ul className="list-unstyled">
                                <li className="mb-2">
                                    <Link to="/disclaimer" className="text-secondary text-decoration-none">
                                        Full Disclaimer / पूर्ण अस्वीकरण
                                    </Link>
                                </li>
                                <li className="mb-2">
                                    <Link to="/privacy" className="text-secondary text-decoration-none">
                                        Privacy Policy / गोपनीयता नीति
                                    </Link>
                                </li>
                                <li className="mb-2">
                                    <Link to="/about" className="text-secondary text-decoration-none">
                                        About This Demo / इस डेमो के बारे में
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Legal Notice */}
                        <div className="col-md-4">
                            <h5 className="text-white mb-3">
                                Legal Notice
                                <small className="d-block text-secondary small mt-1">कानूनी सूचना</small>
                            </h5>
                            <ul className="list-unstyled text-secondary small">
                                <li className="mb-2">✗ Not an official platform / आधिकारिक मंच नहीं</li>
                                <li className="mb-2">✗ No government affiliation / कोई सरकारी संबद्धता नहीं</li>
                                <li className="mb-2">✗ No real services provided / कोई वास्तविक सेवाएं प्रदान नहीं की गईं</li>
                                <li className="mb-2">✗ Do not upload real documents / वास्तविक दस्तावेज़ अपलोड न करें</li>
                            </ul>
                        </div>
                    </div>

                    {/* Footer Bottom */}
                    <div className="border-top border-secondary mt-4 pt-4 text-center">
                        <p className="text-secondary small mb-0">
                            © {currentYear} - Technical Prototype for Demonstration Only |
                            NOT affiliated with any government entity |
                            Created for educational purposes
                        </p>
                    </div>
                </div>
            </div>

            {/* Tricolor Bar at Bottom */}
            <div className="tricolor-bar" />
        </footer>
    );
};

export default Footer;
