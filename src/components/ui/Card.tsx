import React from 'react';

/**
 * UX4G Card Component
 * Compliant with Government of India Design System v2.0.8
 * 
 * Reference: https://doc.ux4g.gov.in/components/card.php
 */

interface CardProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style }) => {
    return (
        <div className={`card ${className}`} style={style}>
            {children}
        </div>
    );
};

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`card-header ${className}`}>
            {children}
        </div>
    );
};

interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle: React.FC<CardTitleProps> = ({
    children,
    className = '',
    as: Tag = 'h5',
}) => {
    return (
        <Tag className={`card-title ${className}`}>
            {children}
        </Tag>
    );
};

export const CardBody: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`card-body ${className}`}>
            {children}
        </div>
    );
};

// Alias for backward compatibility
export const CardContent = CardBody;

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => {
    return (
        <div className={`card-footer ${className}`}>
            {children}
        </div>
    );
};

export const CardImg: React.FC<{
    src: string;
    alt: string;
    position?: 'top' | 'bottom';
    className?: string;
}> = ({ src, alt, position = 'top', className = '' }) => {
    return (
        <img
            src={src}
            alt={alt}
            className={`card-img-${position} ${className}`}
        />
    );
};

export default Card;
