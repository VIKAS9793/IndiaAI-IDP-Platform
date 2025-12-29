import React from 'react';

/**
 * UX4G Prototype Watermark Component
 * Provides constant visual reminder that this is a prototype
 * 
 * Compliant with Government of India Design System v2.0.8
 */
export const PrototypeWatermark: React.FC = () => {
    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{
                pointerEvents: 'none',
                zIndex: 40,
            }}
        >
            <div
                className="text-secondary user-select-none"
                style={{
                    fontSize: '10rem',
                    fontWeight: 'bold',
                    opacity: 0.05,
                    transform: 'rotate(-45deg)',
                }}
            >
                PROTOTYPE
            </div>
        </div>
    );
};

export default PrototypeWatermark;
