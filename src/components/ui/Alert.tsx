import React from 'react';
import { cn } from '../../lib/utils';

interface AlertProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'default' | 'destructive';
}

export const Alert: React.FC<AlertProps> = ({ children, className, variant = 'default' }) => {
    return (
        <div className={cn(
            'p-4 rounded-md border flex items-start gap-3',
            variant === 'destructive' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800',
            className
        )}>
            {children}
        </div>
    );
};

export const AlertTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
    return (
        <h5 className={cn('font-medium leading-none tracking-tight mb-1', className)}>
            {children}
        </h5>
    );
};

export const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
    return (
        <div className={cn('text-sm opacity-90', className)}>
            {children}
        </div>
    );
};
