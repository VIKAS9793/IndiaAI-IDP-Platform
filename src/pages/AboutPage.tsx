import React from 'react';
import { AlertTriangle, Info, Code } from 'lucide-react';
import { Card } from '@/components/ui/Card';

/**
 * About Page - Full disclosure about the prototype
 */
export const AboutPage: React.FC = () => {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
                About This Prototype
            </h1>

            {/* Critical Warning */}
            <div className="bg-red-50 border-l-4 border-red-600 p-6 mb-8">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h2 className="text-xl font-bold text-red-900 mb-2">
                            ⚠️ CRITICAL: This is NOT an Official Platform
                        </h2>
                        <p className="text-red-800">
                            This website is a technical demonstration/prototype only. It is NOT affiliated with, endorsed by,
                            or connected to the Government of India, IndiaAI, or any official government entity.
                        </p>
                    </div>
                </div>
            </div>

            {/* What This Is */}
            <Card className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <Info className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold">What This Is</h2>
                </div>
                <div className="space-y-3 text-gray-700">
                    <p>
                        This is a <strong>technical prototype</strong> created for demonstration and educational purposes.
                        It showcases potential design and functionality concepts for an Intelligent Document Processing (IDP) platform.
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>A non-functional mockup/demonstration</li>
                        <li>Created as a portfolio/showcase project</li>
                        <li>For learning and demonstration purposes only</li>
                        <li>Does NOT actually process any documents</li>
                        <li>Does NOT store or transmit any data</li>
                    </ul>
                </div>
            </Card>

            {/* What This is NOT */}
            <Card className="mb-6 border-red-200 bg-red-50">
                <h2 className="text-2xl font-bold text-red-900 mb-4">What This is NOT</h2>
                <div className="space-y-3 text-red-800">
                    <ul className="list-disc list-inside space-y-2 ml-4">
                        <li><strong>NOT</strong> an official government platform or service</li>
                        <li><strong>NOT</strong> affiliated with IndiaAI or the Government of India</li>
                        <li><strong>NOT</strong> endorsed, approved, or sanctioned by any government entity</li>
                        <li><strong>NOT</strong> authorized to handle real, sensitive, or personal documents</li>
                        <li><strong>NOT</strong> providing any official governmental services</li>
                        <li><strong>NOT</strong> connected to any actual government infrastructure</li>
                    </ul>
                </div>
            </Card>

            {/* Purpose */}
            <Card className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Purpose of This Demonstration</h2>
                <div className="space-y-3 text-gray-700">
                    <p>
                        This prototype was created to:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li>Demonstrate modern web development capabilities</li>
                        <li>Showcase UI/UX design skills for government-themed applications</li>
                        <li>Illustrate potential features of an IDP system</li>
                        <li>Serve as a portfolio project for educational purposes</li>
                    </ol>
                </div>
            </Card>

            {/* Technical Stack */}
            <Card className="mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <Code className="h-6 w-6 text-blue-600" />
                    <h2 className="text-2xl font-bold">Technology Stack</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                    <div>
                        <h3 className="font-semibold mb-2">Frontend</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>React 19 + TypeScript</li>
                            <li>Vite Build Tool</li>
                            <li>Tailwind CSS v4</li>
                            <li>React Router</li>
                            <li>Lucide Icons</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Features</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Responsive Design</li>
                            <li>Drag-and-Drop Upload</li>
                            <li>File Validation</li>
                            <li>Multi-language Support</li>
                            <li>Government Theme</li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Legal Notice */}
            <Card className="border-yellow-200 bg-yellow-50">
                <h2 className="text-2xl font-bold text-yellow-900 mb-4">Legal Notice</h2>
                <div className="space-y-3 text-yellow-800 text-sm">
                    <p>
                        <strong>No Liability:</strong> The creator of this demonstration assumes no liability for any misuse,
                        misunderstanding, or consequences arising from interaction with this prototype.
                    </p>
                    <p>
                        <strong>No Services Provided:</strong> This platform does not provide any real services,
                        does not process actual documents, and does not store or transmit any user data.
                    </p>
                    <p>
                        <strong>Educational Purpose Only:</strong> This is purely a technical demonstration created
                        for educational and portfolio purposes.
                    </p>
                </div>
            </Card>

            {/* Contact Disclaimer */}
            <div className="mt-8 text-center text-sm text-gray-600">
                <p>
                    For official IndiaAI information, please visit{' '}
                    <a
                        href="https://indiaai.gov.in"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                    >
                        indiaai.gov.in
                    </a>
                </p>
                <p className="mt-2">
                    This prototype is not associated with the official website in any way.
                </p>
            </div>
        </div>
    );
};
