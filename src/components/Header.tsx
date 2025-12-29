import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * UX4G Navbar Header Component
 * Compliant with Government of India Design System v2.0.8
 * 
 * CRITICAL: Maintains PROTOTYPE and NOT OFFICIAL badges for legal compliance
 * 
 * Reference: https://doc.ux4g.gov.in/components/navbar.php
 */
export const Header: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <header>
            {/* Tricolor Bar - Government Identity */}
            <div className="tricolor-bar" />

            {/* Main Navbar */}
            <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
                <div className="container">
                    {/* Brand Section */}
                    <Link to="/" className="navbar-brand d-flex align-items-center gap-3">
                        {/* National Emblem Placeholder (PROTOTYPE) */}
                        <div
                            className="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                            style={{ width: '56px', height: '56px', fontSize: '0.65rem', fontWeight: 'bold' }}
                            title="National Emblem placeholder - PROTOTYPE ONLY"
                        >
                            EMBLEM
                        </div>

                        {/* App Title with Badges */}
                        <div>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="fw-bold fs-5">IndiaAI IDP Platform</span>
                                <span className="badge-prototype">PROTOTYPE</span>
                                <span className="badge-not-official">NOT OFFICIAL</span>
                            </div>
                            <small className="text-muted d-block">
                                Intelligent Document Processing - Demo Only
                            </small>
                        </div>
                    </Link>

                    {/* Mobile Toggle */}
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#mainNavbar"
                        aria-controls="mainNavbar"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon" />
                    </button>

                    {/* Navigation Links */}
                    <div className="collapse navbar-collapse" id="mainNavbar">
                        <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                            <li className="nav-item">
                                <Link
                                    to="/"
                                    className={`nav-link ${isActive('/') ? 'active' : ''}`}
                                >
                                    Home
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    to="/upload"
                                    className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
                                >
                                    Upload
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    to="/about"
                                    className={`nav-link ${isActive('/about') ? 'active' : ''}`}
                                >
                                    About
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    to="/disclaimer"
                                    className={`nav-link ${isActive('/disclaimer') ? 'active' : ''}`}
                                >
                                    Disclaimer
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Header;
