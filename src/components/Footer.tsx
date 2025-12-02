import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

/**
 * Footer with comprehensive legal disclaimer
 * Bilingual content (English + Hindi)
 * This is a CRITICAL legal component
 */
export const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-white mt-auto">
            {/* Legal Disclaimer Section */}
            <div className="bg-red-900 border-t-4 border-red-600">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold mb-2">LEGAL DISCLAIMER - PROTOTYPE ONLY</p>
                            <p className="text-red-100">
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

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="font-bold text-lg mb-4">
                            About This Prototype <span className="text-sm font-normal text-gray-400">/ इस प्रोटोटाइप के बारे में</span>
                        </h3>
                        <p className="text-gray-300 text-sm">
                            A demonstration of Intelligent Document Processing capabilities.
                            This is a non-functional prototype for technical showcase purposes only.
                        </p>
                        <p className="text-gray-400 text-sm mt-2">
                            बुद्धिमान दस्तावेज़ प्रसंस्करण क्षमताओं का प्रदर्शन। यह केवल तकनीकी प्रदर्शन उद्देश्यों के लिए एक गैर-कार्यात्मक प्रोटोटाइप है।
                        </p>
                        <div className="mt-4 space-y-2">
                            <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded inline-block">
                                PROTOTYPE / प्रोटोटाइप
                            </div>
                            <div className="bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded inline-block ml-2">
                                NOT OFFICIAL / आधिकारिक नहीं
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">
                            Important Links <span className="text-sm font-normal text-gray-400">/ महत्वपूर्ण लिंक</span>
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/disclaimer" className="text-gray-300 hover:text-white">
                                    Full Disclaimer / पूर्ण अस्वीकरण
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-300 hover:text-white">
                                    Privacy Policy / गोपनीयता नीति
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-300 hover:text-white">
                                    About This Demo / इस डेमो के बारे में
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-4">
                            Legal Notice <span className="text-sm font-normal text-gray-400">/ कानूनी सूचना</span>
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li>✗ Not an official platform / आधिकारिक मंच नहीं</li>
                            <li>✗ No government affiliation / कोई सरकारी संबद्धता नहीं</li>
                            <li>✗ No real services provided / कोई वास्तविक सेवाएं प्रदान नहीं की गईं</li>
                            <li>✗ Do not upload real documents / वास्तविक दस्तावेज़ अपलोड न करें</li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
                    <p>
                        © 2025 - Technical Prototype for Demonstration Only |
                        NOT affiliated with any government entity |
                        Created for educational purposes
                    </p>
                </div>
            </div>
        </footer>
    );
};
