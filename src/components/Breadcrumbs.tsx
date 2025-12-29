import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * UX4G Breadcrumb Component
 * Compliant with Government of India Design System v2.0.8
 * 
 * Reference: https://doc.ux4g.gov.in/components/breadcrumb.php
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
        <nav aria-label="breadcrumb" className="bg-light border-bottom py-2">
            <div className="container">
                <ol className="breadcrumb mb-0">
                    {/* Home link */}
                    <li className="breadcrumb-item">
                        <Link to="/" className="text-decoration-none">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="me-1"
                                style={{ verticalAlign: 'text-bottom' }}
                            >
                                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            Home
                        </Link>
                    </li>

                    {/* Breadcrumb segments */}
                    {pathnames.map((segment, index) => {
                        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                        const isLast = index === pathnames.length - 1;

                        return (
                            <li
                                key={to}
                                className={`breadcrumb-item ${isLast ? 'active' : ''}`}
                                aria-current={isLast ? 'page' : undefined}
                            >
                                {isLast ? (
                                    getLabel(segment)
                                ) : (
                                    <Link to={to} className="text-decoration-none">
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

export default Breadcrumbs;
