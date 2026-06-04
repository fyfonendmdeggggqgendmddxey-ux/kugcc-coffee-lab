import React, { ReactNode } from 'react';

interface TooltipProps {
    children: ReactNode;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

export default function Tooltip({ children, content, position = 'top' }: TooltipProps) {
    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    return (
        <div className="relative flex items-center group">
            {children}
            <div className={`absolute z-50 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-gray-200 text-[9px] font-sans px-2 py-1.5 rounded shadow-lg border border-gray-700 w-max max-w-[200px] whitespace-normal pointer-events-none ${positionClasses[position]}`}>
                {content}
            </div>
        </div>
    );
}
