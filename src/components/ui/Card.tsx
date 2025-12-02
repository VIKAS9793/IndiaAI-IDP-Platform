import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={cn('bg-white rounded-lg shadow-md border border-gray-200', className)}>
            {children}
        </div>
    );
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={cn('p-6 border-b border-gray-100', className)}>
            {children}
        </div>
    );
};

export const CardTitle: React.FC<CardProps> = ({ children, className }) => {
    return (
        <h3 className={cn('text-xl font-bold text-gray-900', className)}>
            {children}
        </h3>
    );
};

export const CardContent: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={cn('p-6', className)}>
            {children}
        </div>
    );
};
