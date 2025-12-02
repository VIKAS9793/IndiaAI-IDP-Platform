import React from 'react';

/**
 * Prototype watermark component that overlays on the page
 * Provides constant visual reminder that this is a prototype
 */
export const PrototypeWatermark: React.FC = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center">
            <div className="text-9xl font-bold text-gray-200 opacity-10 rotate-[-45deg] select-none">
                PROTOTYPE
            </div>
        </div>
    );
};
