import React from 'react';

/**
 * UX4G Disclaimer Banner Component
 * Non-dismissible warning banner at top of all pages
 * 
 * CRITICAL: Legal component - must remain visible
 * 
 * Reference: https://doc.ux4g.gov.in/components/alerts.php
 */
export const DisclaimerBanner: React.FC = () => {
    return (
        <div className="alert alert-warning rounded-0 mb-0 border-start border-warning border-4" role="alert">
            <div className="container d-flex align-items-start gap-3">
                {/* Warning Icon */}
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
                    className="flex-shrink-0 mt-1"
                >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                </svg>

                <div className="flex-grow-1 small">
                    <p className="fw-bold mb-1">
                        ⚠️ PROTOTYPE DEMONSTRATION ONLY - NOT AN OFFICIAL GOVERNMENT PLATFORM
                    </p>
                    <p className="mb-0">
                        This is a technical prototype for demonstration purposes only. This is NOT affiliated with, endorsed by,
                        or representative of any official government entity or the IndiaAI initiative. No real data should be uploaded.
                        No official services are provided.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DisclaimerBanner;
