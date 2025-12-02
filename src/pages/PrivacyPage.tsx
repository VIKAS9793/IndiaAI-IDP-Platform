import React from 'react';
import { Shield, Eye, Database, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/**
 * Privacy Policy Page
 */
export const PrivacyPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Privacy Policy
            </h1>
            <p className="text-gray-600 mb-8">
                Understanding how this demonstration handles (or more accurately, doesn't handle) your information.
            </p>

            {/* Key Point */}
            <div className="bg-green-50 border-l-4 border-green-600 p-6 mb-8">
                <div className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h2 className="text-xl font-bold text-green-900 mb-2">
                            ✓ No Data Collection or Processing
                        </h2>
                        <p className="text-green-800">
                            This is a front-end demonstration only. We do NOT collect, store, process, or transmit ANY data.
                            There are no backend servers, databases, or analytics.
                        </p>
                    </div>
                </div>
            </div>

            {/* What We Don't Do */}
            <Card className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <Eye className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold">What We Don't Do</h2>
                </div>
                <div className="space-y-3 text-gray-700">
                    <p>
                        This demonstration does NOT:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Collect any personal information</li>
                        <li>Store any uploaded files</li>
                        <li>Transmit any data to servers</li>
                        <li>Use cookies for tracking</li>
                        <li>Employ analytics or monitoring tools</li>
                        <li>Share information with third parties</li>
                        <li>Process or retain any user data</li>
                    </ul>
                </div>
            </Card>

            {/* Local Storage */}
            <Card className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <Database className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold">Local Storage Usage</h2>
                </div>
                <div className="space-y-3 text-gray-700">
                    <p>
                        This demonstration uses browser local storage ONLY for:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Storing your acknowledgment of the disclaimer modal</li>
                    </ul>
                    <p className="mt-4">
                        This data:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Stays on YOUR device only</li>
                        <li>Is never transmitted anywhere</li>
                        <li>Can be cleared by clearing your browser data</li>
                        <li>Contains NO personal information</li>
                    </ul>
                </div>
            </Card>

            {/* File Upload */}
            <Card className="mb-6 bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-3 mb-4">
                    <Lock className="h-6 w-6 text-yellow-600" />
                    <h2 className="text-2xl font-bold text-yellow-900">File Upload Demo</h2>
                </div>
                <div className="space-y-3 text-yellow-800">
                    <p className="font-semibold">
                        Important: The file upload feature is for UI demonstration only.
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Files are NOT uploaded to any server</li>
                        <li>Files are NOT processed in any way</li>
                        <li>Files stay in your browser memory temporarily</li>
                        <li>Files are discarded when you refresh or leave the page</li>
                        <li>No file data leaves your device</li>
                    </ul>
                    <p className="font-semibold mt-4 text-red-700">
                        DO NOT upload real, sensitive, or personal documents under any circumstances.
                    </p>
                </div>
            </Card>

            {/* Third-Party Services */}
            <Card className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>
                <div className="space-y-3 text-gray-700">
                    <p>
                        This demonstration may load:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Google Fonts (for typography) - subject to Google's privacy policy</li>
                    </ul>
                    <p className="mt-4 text-sm">
                        No other third-party services, analytics, or tracking tools are employed.
                    </p>
                </div>
            </Card>

            {/* Not a Privacy Policy */}
            <Card className="mb-6 border-blue-200 bg-blue-50">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">This is Not a Real Privacy Policy</h2>
                <div className="space-y-3 text-blue-800 text-sm">
                    <p>
                        This "privacy policy" is provided for demonstration completeness only.
                    </p>
                    <p>
                        Since this is not a real service and collects no data, a traditional privacy policy
                        would not apply. This page exists to show what such a page might look like in a real application.
                    </p>
                    <p className="font-semibold">
                        Again: This demonstration does NOT collect, store, or process ANY user data.
                    </p>
                </div>
            </Card>

            {/* Your Rights */}
            <Card className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
                <div className="space-y-3 text-gray-700">
                    <p>
                        Since no data is collected:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>There is no data to access, modify, or delete</li>
                        <li>There are no privacy settings to configure</li>
                        <li>There is no data portability or right to be forgotten (because there's no data)</li>
                    </ul>
                    <p className="mt-4">
                        You can clear the disclaimer acknowledgment by clearing your browser's local storage for this site.
                    </p>
                </div>
            </Card>

            {/* Contact */}
            <Card>
                <h2 className="text-2xl font-bold mb-4">Questions?</h2>
                <div className="space-y-3 text-gray-700 text-sm">
                    <p>
                        If you have questions about this demonstration, please remember:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>This is NOT an official platform</li>
                        <li>This is for demonstration purposes only</li>
                        <li>No real service or data processing occurs</li>
                    </ul>
                    <p className="mt-4">
                        For official IndiaAI information, visit{' '}
                        <a
                            href="https://indiaai.gov.in"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-semibold"
                        >
                            indiaai.gov.in
                        </a>
                    </p>
                </div>
            </Card>

            <div className="mt-8 text-center text-xs text-gray-500">
                <p>Last updated: November 2025</p>
            </div>
        </div>
    );
};
