import React from 'react';

/**
 * UX4G Alert Component
 * Compliant with Government of India Design System v2.0.8
 * 
 * Reference: https://doc.ux4g.gov.in/components/alerts.php
 */

interface AlertProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
    dismissible?: boolean;
    onDismiss?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
    children,
    className = '',
    variant = 'primary',
    dismissible = false,
    onDismiss,
}) => {
    const classes = [
        'alert',
        `alert-${variant}`,
        dismissible ? 'alert-dismissible fade show' : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} role="alert">
            {children}
            {dismissible && (
                <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={onDismiss}
                />
            )}
        </div>
    );
};

interface AlertTitleProps {
    children: React.ReactNode;
    className?: string;
}

export const AlertTitle: React.FC<AlertTitleProps> = ({ children, className = '' }) => {
    return (
        <h5 className={`alert-heading ${className}`}>
            {children}
        </h5>
    );
};

interface AlertDescriptionProps {
    children: React.ReactNode;
    className?: string;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ children, className = '' }) => {
    return (
        <p className={`mb-0 ${className}`}>
            {children}
        </p>
    );
};

export default Alert;
