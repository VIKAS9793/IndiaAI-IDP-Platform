import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Non-dismissible disclaimer banner that appears at the top of all pages
 * This is a CRITICAL legal component
 */
export const DisclaimerBanner: React.FC = () => {
    return (
        <div className="bg-yellow-50 border-b-2 border-yellow-400 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                    <p className="font-semibold text-yellow-900">
                        ⚠️ PROTOTYPE DEMONSTRATION ONLY - NOT AN OFFICIAL GOVERNMENT PLATFORM
                    </p>
                    <p className="text-yellow-800 mt-1">
                        This is a technical prototype for demonstration purposes only. This is NOT affiliated with, endorsed by,
                        or representative of any official government entity or the IndiaAI initiative. No real data should be uploaded.
                        No official services are provided.
                    </p>
                </div>
            </div>
        </div>
    );
};
