import React from 'react';
import RadarChart from './RadarChart';

interface ComparisonModalProps {
    log1: any;
    log2: any;
    onClose: () => void;
}

export default function ComparisonModal({ log1, log2, onClose }: ComparisonModalProps) {
    if (!log1 || !log2) return null;

    const isDifferent = (val1: any, val2: any) => val1 !== val2;

    const renderRow = (label: string, val1: any, val2: any, formatFn?: (v: any) => React.ReactNode) => {
        const diff = isDifferent(val1, val2);
        const display1 = formatFn ? formatFn(val1) : (val1 || '-');
        const display2 = formatFn ? formatFn(val2) : (val2 || '-');

        return (
            <div className="grid grid-cols-[80px_1fr_1fr] sm:grid-cols-[100px_1fr_1fr] gap-4 items-center border-t border-gray-900/50 pt-3 pb-3 transition-colors hover:bg-gray-950/50">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">{label}</div>
                <div className={`text-sm text-center font-bold px-2 py-1 rounded-sm transition-colors ${diff ? 'text-orange-400 bg-orange-950/30' : 'text-gray-600'}`}>
                    {display1}
                </div>
                <div className={`text-sm text-center font-bold px-2 py-1 rounded-sm transition-colors ${diff ? 'text-blue-400 bg-blue-950/30' : 'text-gray-600'}`}>
                    {display2}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center p-4 sm:p-8 pt-12 pb-24 font-mono overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-4xl relative bg-black border border-gray-800 p-6 sm:p-10 mt-auto mb-auto animate-fade-in">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-[10px] text-gray-500 hover:text-white border border-gray-800 hover:border-white px-3 py-1 uppercase tracking-widest bg-black z-10 transition-colors"
                >
                    ✕ CLOSE
                </button>

                <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-8 text-gray-500 border-b border-gray-900 pb-2">
                    Extraction Analysis
                </h2>

                <div className="flex flex-col md:flex-row gap-8 sm:gap-12 items-start">
                    {/* Radar Chart Overlay */}
                    <div className="w-full md:w-1/2 flex flex-col items-center p-8 border border-gray-900 bg-gray-950/50">
                        <RadarChart 
                            size={280}
                            acidity={log1.acidity}
                            sweetness={log1.sweetness}
                            body={log1.body}
                            bitterness={log1.bitterness}
                            aroma={log1.aroma}
                            compareAcidity={log2.acidity}
                            compareSweetness={log2.sweetness}
                            compareBody={log2.body}
                            compareBitterness={log2.bitterness}
                            compareAroma={log2.aroma}
                        />
                        <div className="flex gap-8 mt-8 border-t border-gray-900 pt-6 w-full justify-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-500"></div>
                                <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{log1.date ? log1.date.split('T')[0] : 'UNKNOWN'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500"></div>
                                <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">{log2.date ? log2.date.split('T')[0] : 'UNKNOWN'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Data Comparison Table */}
                    <div className="w-full md:w-1/2 flex flex-col gap-2">
                        {/* Header Row */}
                        <div className="grid grid-cols-[80px_1fr_1fr] sm:grid-cols-[100px_1fr_1fr] gap-4 mb-4 pb-2 border-b border-gray-900">
                            <div></div>
                            <div className="text-center flex flex-col items-center w-full">
                                <div className="text-orange-500 font-bold uppercase text-[10px] tracking-widest mb-1 border-b border-orange-500/30 pb-2 w-full flex flex-col">
                                    <span>{log1.date ? log1.date.split('T')[0] : 'UNKNOWN'}</span>
                                    <span className="text-orange-700 text-[8px] mt-0.5">RECIPE A</span>
                                </div>
                                <div className="text-xs text-white truncate max-w-[120px] mt-2">{log1.recipe?.name || 'Unnamed'}</div>
                            </div>
                            <div className="text-center flex flex-col items-center w-full">
                                <div className="text-blue-500 font-bold uppercase text-[10px] tracking-widest mb-1 border-b border-blue-500/30 pb-2 w-full flex flex-col">
                                    <span>{log2.date ? log2.date.split('T')[0] : 'UNKNOWN'}</span>
                                    <span className="text-blue-700 text-[8px] mt-0.5">RECIPE B</span>
                                </div>
                                <div className="text-xs text-white truncate max-w-[120px] mt-2">{log2.recipe?.name || 'Unnamed'}</div>
                            </div>
                        </div>

                        {renderRow('Score', log1.rating, log2.rating, (v) => v ? v.toFixed(1) : '-')}
                        {renderRow('Dripper', log1.recipe?.dripper, log2.recipe?.dripper)}
                        {renderRow('Temp', log1.recipe?.temperature, log2.recipe?.temperature, (v) => v ? `${v}°C` : '-')}
                        {renderRow('Grind', log1.recipe?.grindSize, log2.recipe?.grindSize)}
                        {renderRow('Ratio', log1.recipe?.ratio, log2.recipe?.ratio)}
                        
                        {/* Notes (Redesigned for better readability) */}
                        <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-gray-900">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Tasting Notes</div>
                            
                            <div className="flex flex-col gap-6">
                                <div className="border border-orange-900/50 bg-orange-950/10 p-5 relative rounded-sm">
                                    <span className="absolute -top-2.5 left-4 bg-black px-2 text-[10px] font-bold tracking-widest uppercase text-orange-500">Recipe A</span>
                                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                                        {log1.notes || <span className="text-gray-700 italic font-mono text-[10px]">No notes recorded</span>}
                                    </p>
                                </div>
                                
                                <div className="border border-blue-900/50 bg-blue-950/10 p-5 relative rounded-sm">
                                    <span className="absolute -top-2.5 left-4 bg-black px-2 text-[10px] font-bold tracking-widest uppercase text-blue-500">Recipe B</span>
                                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                                        {log2.notes || <span className="text-gray-700 italic font-mono text-[10px]">No notes recorded</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-900 flex justify-center">
                    <button 
                        onClick={onClose}
                        className="text-[10px] text-gray-500 hover:text-white border border-gray-800 hover:border-white px-8 py-3 uppercase tracking-widest bg-black transition-colors flex items-center gap-2"
                    >
                        <span>←</span> BACK TO LOGS
                    </button>
                </div>
            </div>
        </div>
    );
}
