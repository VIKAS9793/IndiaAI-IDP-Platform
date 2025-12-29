import React, { useState, useEffect } from 'react';

/**
 * UX4G Disclaimer Modal Component
 * First-visit disclaimer modal requiring user acknowledgment
 * Uses localStorage to track acknowledgment
 * 
 * CRITICAL: Legal component - must be shown on first visit
 * 
 * Reference: https://doc.ux4g.gov.in/components/modal.php
 */
export const DisclaimerModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasAcknowledged, setHasAcknowledged] = useState(false);

    useEffect(() => {
        // Check if user has already acknowledged
        const acknowledged = localStorage.getItem('prototype-disclaimer-acknowledged');
        if (!acknowledged) {
            setIsOpen(true);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const handleAcknowledge = () => {
        if (hasAcknowledged) {
            localStorage.setItem('prototype-disclaimer-acknowledged', 'true');
            setIsOpen(false);
            document.body.style.overflow = 'unset';
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="modal-backdrop fade show" />

            {/* Modal */}
            <div
                className="modal fade show d-block"
                tabIndex={-1}
                role="dialog"
                aria-labelledby="disclaimerModalTitle"
                aria-modal="true"
            >
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        {/* Header */}
                        <div className="modal-header bg-danger text-white">
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
                                >
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                    <path d="M12 9v4" />
                                    <path d="M12 17h.01" />
                                </svg>
                                <h5 className="modal-title mb-0" id="disclaimerModalTitle">
                                    IMPORTANT LEGAL DISCLAIMER
                                </h5>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            {/* Main Warning */}
                            <div className="alert alert-warning border-start border-warning border-4 mb-4">
                                <strong className="fs-5">THIS IS A PROTOTYPE DEMONSTRATION ONLY</strong>
                            </div>

                            {/* Not Affiliated Warning */}
                            <p className="fw-semibold text-danger mb-3">
                                ⚠️ This platform is NOT affiliated with any official government entity
                            </p>

                            {/* What This Is */}
                            <div className="mb-3">
                                <p className="fw-bold mb-2">What this is:</p>
                                <ul className="mb-0">
                                    <li>A technical prototype for demonstration purposes</li>
                                    <li>An illustration of potential IDP (Intelligent Document Processing) capabilities</li>
                                    <li>A non-functional mockup for educational/portfolio purposes</li>
                                </ul>
                            </div>

                            {/* What This Is NOT */}
                            <div className="mb-3">
                                <p className="fw-bold text-danger mb-2">What this is NOT:</p>
                                <ul className="mb-0">
                                    <li>NOT an official IndiaAI government platform</li>
                                    <li>NOT endorsed by, affiliated with, or approved by any government entity</li>
                                    <li>NOT authorized to process real, sensitive, or personal documents</li>
                                    <li>NOT providing any official government services</li>
                                </ul>
                            </div>

                            {/* Do Not Upload Warning */}
                            <div className="alert alert-danger mb-4">
                                <p className="fw-bold mb-2">DO NOT UPLOAD:</p>
                                <ul className="mb-0">
                                    <li>Real government documents (Aadhaar, PAN, Passport, etc.)</li>
                                    <li>Personal or sensitive information</li>
                                    <li>Confidential or proprietary data</li>
                                    <li>Any document you would not share publicly</li>
                                </ul>
                            </div>

                            {/* Acknowledgment Notice */}
                            <p className="small text-muted border-top pt-3">
                                By clicking "I Understand and Acknowledge", you confirm that you understand this is a
                                prototype demonstration only and agree not to upload any real, sensitive, or personal documents.
                            </p>

                            {/* Checkbox */}
                            <div className="form-check mt-3">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="acknowledgeCheckbox"
                                    checked={hasAcknowledged}
                                    onChange={(e) => setHasAcknowledged(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="acknowledgeCheckbox">
                                    I understand this is a prototype demonstration only and is NOT an official government platform.
                                    I will not upload any real, sensitive, or personal documents.
                                </label>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className={`btn btn-lg w-100 ${hasAcknowledged ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={handleAcknowledge}
                                disabled={!hasAcknowledged}
                            >
                                I Understand and Acknowledge
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DisclaimerModal;
