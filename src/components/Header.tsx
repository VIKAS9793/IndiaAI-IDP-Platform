import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Government-themed header with prominent PROTOTYPE badges
 * This is a CRITICAL legal component
 */
export const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* Placeholder for government emblem */}
                        <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            EMBLEM
                        </div>

                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">
                                    IndiaAI IDP Platform
                                </h1>
                                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">
                                    PROTOTYPE
                                </span>
                                <span className="bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded">
                                    NOT OFFICIAL
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Intelligent Document Processing - Demo Only
                            </p>
                        </div>
                    </div>

                    <nav className="flex gap-6">
                        <Link to="/" className="text-gray-900 hover:text-blue-700 font-medium">
                            Home
                        </Link>
                        <Link to="/upload" className="text-gray-900 hover:text-blue-700 font-medium">
                            Upload
                        </Link>
                        <Link to="/about" className="text-gray-900 hover:text-blue-700 font-medium">
                            About
                        </Link>
                        <Link to="/disclaimer" className="text-gray-900 hover:text-blue-700 font-medium">
                            Disclaimer
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
};
