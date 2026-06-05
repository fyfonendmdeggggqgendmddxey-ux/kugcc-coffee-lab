"use client";
import { useState, useEffect } from 'react';

export const toast = (message: string, type: 'success' | 'error' = 'success') => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }));
    }
};

export function ToastContainer() {
    const [toasts, setToasts] = useState<{id: number, message: string, type: 'success'|'error'}[]>([]);

    useEffect(() => {
        const handler = (e: Event) => {
            const customEvent = e as CustomEvent;
            const newToast = { 
                id: Date.now() + Math.random(), 
                message: customEvent.detail.message, 
                type: customEvent.detail.type 
            };
            setToasts(prev => [...prev, newToast]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== newToast.id));
            }, 4000);
        };
        window.addEventListener('show-toast', handler);
        return () => window.removeEventListener('show-toast', handler);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none w-[90%] max-w-md">
            {toasts.map(t => (
                <div 
                    key={t.id} 
                    className={`px-4 py-3 rounded-sm shadow-2xl text-xs font-bold tracking-widest uppercase transition-all duration-300 text-center flex items-center justify-center gap-2 ${
                        t.type === 'error' 
                        ? 'bg-red-950/95 text-white border border-red-500/50' 
                        : 'bg-white/95 text-black border border-gray-200'
                    }`}
                    style={{ animation: 'toastSlideIn 0.3s ease-out forwards' }}
                >
                    {t.type === 'error' ? '⚠️ ' : '✨ '}
                    {t.message}
                </div>
            ))}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes toastSlideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}} />
        </div>
    );
}
