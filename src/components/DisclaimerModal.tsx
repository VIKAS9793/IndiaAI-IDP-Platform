import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * First-visit disclaimer modal that requires user acknowledgment
 * Uses localStorage to track if user has acknowledged
 * This is a CRITICAL legal component
 */
export const DisclaimerModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasAcknowledged, setHasAcknowledged] = useState(false);

    useEffect(() => {
        // Check if user has already acknowledged
        const acknowledged = localStorage.getItem('prototype-disclaimer-acknowledged');
        if (!acknowledged) {
            setIsOpen(true);
        }
    }, []);

    const handleAcknowledge = () => {
        if (hasAcknowledged) {
            localStorage.setItem('prototype-disclaimer-acknowledged', 'true');
            setIsOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-red-600 text-white p-4 flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6" />
                    <h2 className="text-xl font-bold">IMPORTANT LEGAL DISCLAIMER</h2>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <p className="font-bold text-lg text-gray-900">
                            THIS IS A PROTOTYPE DEMONSTRATION ONLY
                        </p>
                    </div>

                    <div className="space-y-3 text-gray-700">
                        <p className="font-semibold text-red-600">
                            ⚠️ This platform is NOT affiliated with any official government entity
                        </p>

                        <div className="space-y-2">
                            <p><strong>What this is:</strong></p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>A technical prototype for demonstration purposes</li>
                                <li>An illustration of potential IDP (Intelligent Document Processing) capabilities</li>
                                <li>A non-functional mockup for educational/portfolio purposes</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <p><strong className="text-red-600">What this is NOT:</strong></p>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                                <li>NOT an official IndiaAI government platform</li>
                                <li>NOT endorsed by, affiliated with, or approved by any government entity</li>
                                <li>NOT authorized to process real, sensitive, or personal documents</li>
                                <li>NOT providing any official government services</li>
                            </ul>
                        </div>

                        <div className="bg-red-50 border border-red-200 p-4 rounded">
                            <p className="font-semibold text-red-800">
                                DO NOT UPLOAD:
                            </p>
                            <ul className="list-disc list-inside space-y-1 ml-2 text-red-700">
                                <li>Real government documents (Aadhaar, PAN, Passport, etc.)</li>
                                <li>Personal or sensitive information</li>
                                <li>Confidential or proprietary data</li>
                                <li>Any document you would not share publicly</li>
                            </ul>
                        </div>

                        <p className="text-sm text-gray-600 border-t pt-3 mt-4">
                            By clicking "I Understand and Acknowledge", you confirm that you understand this is a
                            prototype demonstration only and agree not to upload any real, sensitive, or personal documents.
                        </p>
                    </div>

                    <div className="flex items-start gap-3 pt-2">
                        <input
                            type="checkbox"
                            id="acknowledge-checkbox"
                            checked={hasAcknowledged}
                            onChange={(e) => setHasAcknowledged(e.target.checked)}
                            className="mt-1 h-4 w-4"
                        />
                        <label htmlFor="acknowledge-checkbox" className="text-sm font-medium text-gray-900 cursor-pointer">
                            I understand this is a prototype demonstration only and is NOT an official government platform.
                            I will not upload any real, sensitive, or personal documents.
                        </label>
                    </div>

                    <button
                        onClick={handleAcknowledge}
                        disabled={!hasAcknowledged}
                        className={`w-full py-3 px-4 rounded-md font-semibold transition-colors ${hasAcknowledged
                                ? 'bg-blue-700 text-white hover:bg-blue-600 cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        I Understand and Acknowledge
                    </button>
                </div>
            </div>
        </div>
    );
};
