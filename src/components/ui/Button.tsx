import React from 'react';
import { cn } from '../../lib/utils';

/**
 * Government-styled button component
 */
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    className,
    children,
    ...props
}) => {
    const baseStyles = 'font-medium rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-blue-700 text-white hover:bg-blue-600',
        secondary: 'bg-gray-600 text-white hover:bg-gray-500',
        outline: 'border-2 border-blue-700 text-blue-700 hover:bg-blue-50',
        destructive: 'bg-red-600 text-white hover:bg-red-700',
    };

    const sizes = {
        sm: 'px-4 py-1.5 text-sm',
        md: 'px-6 py-2.5 text-base',
        lg: 'px-8 py-3 text-lg',
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
};


