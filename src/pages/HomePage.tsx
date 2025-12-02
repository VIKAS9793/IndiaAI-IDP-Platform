import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const HomePage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="max-w-6xl mx-auto px-4 py-12">
            {/* Hero Section */}
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                    Intelligent Document Processing Platform
                </h1>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                    A secure, AI-powered prototype for extracting text and data from documents.
                    Designed for Indian languages and government use cases.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    <Button
                        variant="primary"
                        size="lg"
                        className="text-lg px-8 py-4 h-auto w-full justify-center"
                        onClick={() => navigate('/upload')}
                    >
                        <Upload className="mr-2 h-6 w-6" />
                        Start Processing Documents
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="text-lg px-8 py-4 h-auto w-full justify-center"
                        onClick={() => navigate('/about')}
                    >
                        Learn More
                    </Button>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-800 rounded-full text-sm font-medium border border-yellow-200">
                    <Shield className="h-4 w-4" />
                    Prototype Mode: Data is processed locally and not stored permanently.
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Multi-Format Support</h3>
                    <p className="text-gray-600">
                        Process PDF, PNG, JPEG, and TIFF files with high accuracy.
                    </p>
                </Card>

                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                    <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Fast & Accurate</h3>
                    <p className="text-gray-600">
                        Powered by advanced OCR models optimized for English and Indian languages.
                    </p>
                </Card>

                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                    <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Secure by Design</h3>
                    <p className="text-gray-600">
                        Built with privacy in mind. No data leaves your secure environment.
                    </p>
                </Card>
            </div>

            {/* Legal Disclaimer Section (Moved to bottom but still prominent) */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Legal Disclaimer</h2>
                <p className="text-gray-600 max-w-4xl mx-auto text-sm leading-relaxed">
                    This platform is a <strong>technical prototype</strong> created solely for demonstration and educational purposes.
                    It is <strong>NOT</strong> an official platform of the Government of India or the IndiaAI initiative.
                    No official services are provided. The creators assume no liability for any misuse of this demonstration.
                    Do not upload sensitive personal data (PII) or classified government documents.
                </p>
            </div>
        </div>
    );
};
