import React from 'react';
import { AlertTriangle, XCircle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/**
 * Disclaimer Page - Comprehensive legal disclaimer
 */
export const DisclaimerPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Legal Disclaimer
            </h1>
            <p className="text-gray-600 mb-8">
                Please read this disclaimer carefully before using this platform.
            </p>

            {/* Critical Disclaimer */}
            <div className="bg-red-600 text-white p-6 rounded-lg mb-8">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="h-8 w-8 flex-shrink-0" />
                    <div>
                        <h2 className="text-2xl font-bold mb-3">
                            PROTOTYPE DEMONSTRATION ONLY
                        </h2>
                        <p className="text-lg">
                            This website is a technical prototype created for demonstration purposes only.
                            It is NOT an official government platform and has NO affiliation with any government entity.
                        </p>
                    </div>
                </div>
            </div>

            {/* No Affiliation */}
            <Card className="mb-6 border-red-200">
                <div className="flex items-start gap-3 mb-4">
                    <XCircle className="h-6 w-6 text-red-600" />
                    <h2 className="text-2xl font-bold text-red-900">No Government Affiliation</h2>
                </div>
                <div className="space-y-3 text-gray-700">
                    <p className="font-semibold">
                        This platform is NOT:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Affiliated with, endorsed by, or connected to the Government of India</li>
                        <li>Part of the official IndiaAI initiative or any government program</li>
                        <li>Authorized to represent any government agency or department</li>
                        <li>Approved or sanctioned by any official authority</li>
                        <li>Connected to any government infrastructure or systems</li>
                    </ul>
                </div>
            </Card>

            {/* No Services Provided */}
            <Card className="mb-6">
                <h2 className="text-2xl font-bold mb-4">No Services Provided</h2>
                <div className="space-y-3 text-gray-700">
                    <p>
                        This platform does NOT:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Process actual documents or data</li>
                        <li>Provide any official government services</li>
                        <li>Store, transmit, or retain any user information</li>
                        <li>Connect to any backend servers or databases</li>
                        <li>Have any functional document processing capabilities</li>
                    </ul>
                    <p className="font-semibold text-red-600 mt-4">
                        This is a front-end demonstration only. All "functionality" is for UI/UX demonstration purposes.
                    </p>
                </div>
            </Card>

            {/* DO NOT UPLOAD */}
            <Card className="mb-6 bg-red-50 border-red-200">
                <div className="flex items-start gap-3 mb-4">
                    <Shield className="h-6 w-6 text-red-600" />
                    <h2 className="text-2xl font-bold text-red-900">DO NOT UPLOAD REAL DOCUMENTS</h2>
                </div>
                <div className="space-y-3 text-red-800">
                    <p className="font-semibold">
                        NEVER upload the following:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Real government-issued documents (Aadhaar, PAN Card, Passport, etc.)</li>
                        <li>Personal identifying information (PII)</li>
                        <li>Sensitive or confidential data</li>
                        <li>Proprietary or copyrighted materials</li>
                        <li>Any document you would not share publicly</li>
                    </ul>
                    <p className="font-semibold mt-4">
                        This platform is for demonstration only. Do not upload any real documents under any circumstances.
                    </p>
                </div>
            </Card>

            {/* No Liability */}
            <Card className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
                <div className="space-y-3 text-gray-700 text-sm">
                    <p>
                        The creator of this demonstration:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Makes no warranties or guarantees of any kind</li>
                        <li>Assumes NO liability for any use or misuse of this demonstration</li>
                        <li>Is NOT responsible for any consequences arising from interaction with this platform</li>
                        <li>Does not guarantee accuracy, completeness, or fitness for any purpose</li>
                    </ul>
                    <p className="font-semibold mt-4">
                        USE AT YOUR OWN RISK. This is provided "AS IS" without any warranty.
                    </p>
                </div>
            </Card>

            {/* Purpose */}
            <Card className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Purpose of This Demonstration</h2>
                <div className="space-y-3 text-gray-700">
                    <p>
                        This prototype was created solely for:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>Educational purposes</li>
                        <li>Technical demonstration of web development skills</li>
                        <li>Portfolio/showcase purposes</li>
                        <li>Illustrating potential UI/UX concepts</li>
                    </ul>
                    <p className="mt-4">
                        It is NOT intended for production use, real document processing, or any official purposes.
                    </p>
                </div>
            </Card>

            {/* Intellectual Property */}
            <Card className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
                <div className="space-y-3 text-gray-700 text-sm">
                    <p>
                        No claim is made to any government trademarks, emblems, or official materials.
                        References to "IndiaAI" or "Government of India" are purely for demonstrative context.
                    </p>
                    <p>
                        All government trademarks and official insignia are property of their respective owners.
                    </p>
                </div>
            </Card>

            {/* Changes to Disclaimer */}
            <Card>
                <h2 className="text-2xl font-bold mb-4">Changes to This Disclaimer</h2>
                <div className="space-y-3 text-gray-700 text-sm">
                    <p>
                        This disclaimer may be updated at any time without notice. Continued use of this
                        demonstration constitutes acceptance of the current disclaimer.
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                        Last updated: November 2025
                    </p>
                </div>
            </Card>

            {/* Official Resources */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">For Official Information:</h3>
                <p className="text-sm text-blue-800">
                    To access official IndiaAI resources, please visit{' '}
                    <a
                        href="https://indiaai.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline"
                    >
                        indiaai.gov.in
                    </a>
                </p>
            </div>
        </div>
    );
};
