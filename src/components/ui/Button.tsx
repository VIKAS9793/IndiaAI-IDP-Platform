import React from 'react';

/**
 * UX4G Button Component
 * Compliant with Government of India Design System v2.0.8
 * 
 * Reference: https://doc.ux4g.gov.in/components/buttons.php
 */

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline-primary' | 'danger' | 'warning' | 'success';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    disabled,
    ...props
}) => {
    // UX4G button class mapping
    const variantClasses: Record<string, string> = {
        'primary': 'btn-primary',
        'secondary': 'btn-secondary',
        'outline-primary': 'btn-outline-primary',
        'danger': 'btn-danger',
        'warning': 'btn-warning',
        'success': 'btn-success',
    };

    const sizeClasses: Record<string, string> = {
        'sm': 'btn-sm',
        'md': '',
        'lg': 'btn-lg',
    };

    const classes = [
        'btn',
        variantClasses[variant],
        sizeClasses[size],
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classes}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
