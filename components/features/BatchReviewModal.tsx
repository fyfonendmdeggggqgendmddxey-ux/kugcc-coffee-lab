import { useState } from 'react';
import { Bean } from '@/utils/types';

interface BatchReviewModalProps {
    scannedBeans: Bean[];
    onSaveAll: (beans: Bean[]) => void;
    onCancel: () => void;
}

export default function BatchReviewModal({ scannedBeans, onSaveAll, onCancel }: BatchReviewModalProps) {
    const [beans, setBeans] = useState<Bean[]>(scannedBeans);

    const handleChange = (index: number, field: keyof Bean, value: string) => {
        setBeans(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleRemove = (index: number) => {
        setBeans(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] sm:p-4 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-black border border-gray-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl p-5 sm:p-8 relative flex flex-col font-mono animate-fade-in-up" onClick={e => e.stopPropagation()}>
                
                <div className="flex justify-between items-center mb-6 border-b border-gray-900 pb-4">
                    <div>
                        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-white flex items-center gap-2">
                            <span>📝</span> Review Extracted Beans
                        </h2>
                        <p className="text-[10px] text-gray-500 mt-1">Review and correct the AI-extracted data before saving.</p>
                    </div>
                    <button onClick={onCancel} className="text-gray-500 hover:text-white p-2">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {beans.map((bean, idx) => (
                        <div key={bean.id} className="bg-gray-950 border border-gray-800 p-4 rounded-sm relative group">
                            <button 
                                onClick={() => handleRemove(idx)}
                                className="absolute top-2 right-2 text-gray-600 hover:text-red-500 text-xs px-2 py-1 transition-colors"
                            >
                                Remove
                            </button>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase text-gray-500 tracking-wider">Name</label>
                                    <input 
                                        value={bean.name}
                                        onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                        className="bg-transparent border-b border-gray-800 text-white p-1 text-sm focus:border-white focus:outline-none transition-colors w-full"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase text-gray-500 tracking-wider">Roaster</label>
                                    <input 
                                        value={bean.roaster}
                                        onChange={(e) => handleChange(idx, 'roaster', e.target.value)}
                                        className="bg-transparent border-b border-gray-800 text-white p-1 text-sm focus:border-white focus:outline-none transition-colors w-full"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase text-gray-500 tracking-wider">Origin</label>
                                    <input 
                                        value={bean.origin || ''}
                                        onChange={(e) => handleChange(idx, 'origin', e.target.value)}
                                        className="bg-transparent border-b border-gray-800 text-white p-1 text-sm focus:border-white focus:outline-none transition-colors w-full"
                                    />
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-[9px] uppercase text-gray-500 tracking-wider">Roast Level</label>
                                    <select 
                                        value={bean.roastLevel || ''}
                                        onChange={(e) => handleChange(idx, 'roastLevel', e.target.value)}
                                        className="bg-transparent border-b border-gray-800 text-white p-1 text-sm focus:border-white focus:outline-none transition-colors w-full cursor-pointer appearance-none"
                                    >
                                        <option value="" className="bg-gray-900">Unknown</option>
                                        <option value="Light" className="bg-gray-900">Light</option>
                                        <option value="Medium" className="bg-gray-900">Medium</option>
                                        <option value="Dark" className="bg-gray-900">Dark</option>
                                        <option value="City" className="bg-gray-900">City</option>
                                        <option value="French" className="bg-gray-900">French</option>
                                        <option value="Italian" className="bg-gray-900">Italian</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}

                    {beans.length === 0 && (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            No beans left to save.
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-900 flex justify-end gap-4 shrink-0">
                    <button 
                        onClick={onCancel}
                        className="px-6 py-2 text-xs font-bold tracking-widest uppercase text-gray-500 hover:text-white transition-colors"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={() => onSaveAll(beans)}
                        disabled={beans.length === 0}
                        className="px-6 py-2 text-xs font-bold tracking-widest uppercase bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save All ({beans.length})
                    </button>
                </div>
            </div>
        </div>
    );
}
