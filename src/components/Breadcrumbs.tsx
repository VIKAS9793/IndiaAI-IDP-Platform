import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb navigation component
 * Government-styled breadcrumbs for navigation hierarchy
 */
export const Breadcrumbs: React.FC = () => {
    const location = useLocation();

    // Parse pathname into breadcrumb segments
    const pathnames = location.pathname.split('/').filter((x) => x);

    // If on homepage, don't show breadcrumbs
    if (pathnames.length === 0) {
        return null;
    }

    // Convert path segment to readable label
    const getLabel = (segment: string): string => {
        return segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <nav className="bg-white border-b border-gray-200 py-3">
            <div className="max-w-7xl mx-auto px-4">
                <ol className="flex items-center space-x-2 text-sm">
                    {/* Home link */}
                    <li className="flex items-center">
                        <Link
                            to="/"
                            className="text-blue-700 hover:text-blue-900 flex items-center gap-1"
                        >
                            <Home className="h-4 w-4" />
                            <span>Home</span>
                        </Link>
                    </li>

                    {/* Breadcrumb segments */}
                    {pathnames.map((segment, index) => {
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                        const isLast = index === pathnames.length - 1;

                        return (
                            <li key={to} className="flex items-center">
                                <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />
                                {isLast ? (
                                    <span className="text-gray-900 font-medium">{getLabel(segment)}</span>
                                ) : (
                                    <Link to={to} className="text-blue-700 hover:text-blue-900">
                                        {getLabel(segment)}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </div>
        </nav>
    );
};
