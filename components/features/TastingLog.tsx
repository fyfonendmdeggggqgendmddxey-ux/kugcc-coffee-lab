"use client";

import { useState, useEffect } from 'react';
import { Bean } from '@/utils/types';

type TastingLog = {
    id: string;
    beanId?: string;
    rating: number; // 1-5
    notes: string;
    date: string;
    acidity?: number;
    bitterness?: number;
    sweetness?: number;
    body?: number;
    aroma?: number;
    image?: string; // Base64 compressed image
};

interface TastingLogProps {
    bean?: Bean;
}

// Client-side image compression and Base64 encoder helper
const compressAndEncodeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const MAX_HEIGHT = 500;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                // Compress as JPEG with 0.7 quality factor to keep sizes around ~20KB
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
        };
        reader.onerror = error => reject(error);
    });
};

const RadarChart = ({ 
    acidity = 3, 
    sweetness = 3, 
    body = 3, 
    bitterness = 3, 
    aroma = 3,
    size = 120
}: {
    acidity?: number;
    sweetness?: number;
    body?: number;
    bitterness?: number;
    aroma?: number;
    size?: number;
}) => {
    const center = 50;
    const maxRadius = 40;
    
    // Parameters order matching coordinates
    const props = [acidity, sweetness, body, bitterness, aroma];
    const labels = ["酸味", "甘味", "コク", "苦味", "香り"];
    
    // Coordinates generator (Starting from -90 deg for acidity)
    const getCoordinates = (index: number, value: number) => {
        const angle = (Math.PI * 2 / 5) * index - Math.PI / 2;
        const radius = (value / 5) * maxRadius;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return { x, y };
    };

    // Concentric pentagons guidelines
    const gridLevels = [1, 2, 3, 4, 5];
    const gridPolygons = gridLevels.map(level => {
        const points = [];
        for (let i = 0; i < 5; i++) {
            const { x, y } = getCoordinates(i, level);
            points.push(`${x},${y}`);
        }
        return points.join(" ");
    });

    // Outer limit endpoints for axis lines
    const dataPoints = props.map((val, idx) => {
        const { x, y } = getCoordinates(idx, val);
        return `${x},${y}`;
    }).join(" ");

    // Label coordinates
    const labelDistance = 47; 
    const labelPoints = labels.map((label, idx) => {
        const angle = (Math.PI * 2 / 5) * idx - Math.PI / 2;
        const x = center + labelDistance * Math.cos(angle);
        const y = center + labelDistance * Math.sin(angle);
        return { label, x, y };
    });

    return (
        <svg viewBox="0 0 100 100" width={size} height={size} className="overflow-visible select-none">
            {gridPolygons.map((points, idx) => (
                <polygon
                    key={idx}
                    points={points}
                    fill="none"
                    stroke="#1f2937"
                    strokeWidth="0.5"
                />
            ))}
            {[0, 1, 2, 3, 4].map(i => {
                const outer = getCoordinates(i, 5);
                return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={outer.x}
                        y2={outer.y}
                        stroke="#1f2937"
                        strokeWidth="0.5"
                    />
                );
            })}
            <polygon
                points={dataPoints}
                fill="rgba(255, 255, 255, 0.15)"
                stroke="#ffffff"
                strokeWidth="1.5"
                className="transition-all duration-300"
            />
            {labelPoints.map((lp, idx) => (
                <text
                    key={idx}
                    x={lp.x}
                    y={lp.y}
                    fill="#6b7280"
                    fontSize="5"
                    fontFamily="monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {lp.label}
                </text>
            ))}
        </svg>
    );
};

export default function TastingLog({ bean }: TastingLogProps) {
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(false);

    // Tasting matrix state (default to 3)
    const [acidity, setAcidity] = useState(3);
    const [bitterness, setBitterness] = useState(3);
    const [sweetness, setSweetness] = useState(3);
    const [body, setBody] = useState(3);
    const [aroma, setAroma] = useState(3);

    // Image upload states
    const [image, setImage] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string>('');
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    // Load logs on mount
    const [history, setHistory] = useState<TastingLog[]>([]);

    useEffect(() => {
        const savedLogs = localStorage.getItem('kugcc_logs');
        if (savedLogs) {
            setHistory(JSON.parse(savedLogs));
        }
    }, []);

    const filteredHistory = history.filter(log => !bean || log.beanId === bean.id);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressedBase64 = await compressAndEncodeImage(file);
            setImage(compressedBase64);
            setImagePreview(compressedBase64);
        } catch (err) {
            console.error("Image processing error:", err);
            alert("画像の読み込みに失敗しました。");
        }
    };

    const handleSave = () => {
        if (!bean) {
            alert("Select a bean to link this log.");
            return;
        }
        if (rating === 0) {
            alert("Please rate the brew.");
            return;
        }
        const newLog: TastingLog = {
            id: Date.now().toString(),
            beanId: bean.id,
            rating,
            notes,
            date: new Date().toISOString(),
            acidity,
            bitterness,
            sweetness,
            body,
            aroma,
            image // Add Base64 compressed image string
        };

        const updatedHistory = [newLog, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('kugcc_logs', JSON.stringify(updatedHistory));

        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            setRating(0);
            setNotes('');
            setAcidity(3);
            setBitterness(3);
            setSweetness(3);
            setBody(3);
            setAroma(3);
            setImage('');
            setImagePreview('');
        }, 2000);
    };

    return (
        <div className="h-full flex flex-col p-6 font-mono">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-8 text-gray-500 border-b border-gray-900 pb-2 flex justify-between">
                <span>Tasting Log</span>
                <span className="text-gray-700">{filteredHistory.length} ENTRIES</span>
            </h2>

            {!bean ? (
                <div className="text-xs text-gray-600 uppercase tracking-widest text-center mt-20">
                    AWAITING BEAN SELECTION
                    <br />
                    <span className="text-[10px] opacity-30">Select a bean to view or add logs</span>
                </div>
            ) : (
                <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {/* Input Area */}
                    <div className="border-b border-gray-800 pb-6 mb-6">
                        <div className="mb-6">
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">
                                Quality Index
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setRating(val)}
                                        className={`w-8 h-8 md:w-10 md:h-2 border transition-all duration-300 ${rating >= val
                                            ? 'bg-white border-white'
                                            : 'bg-black border-gray-800 hover:border-gray-500'
                                            }`}
                                    />
                                ))}
                            </div>
                            <p className="text-right text-[10px] text-gray-500 mt-1 h-4">
                                {rating > 0 ? `${rating} / 5` : ''}
                            </p>
                        </div>

                        {/* Tasting Matrix Sliders & Real-Time SVG Preview Chart */}
                        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center border border-gray-900 p-4 bg-gray-950/20">
                            <div className="space-y-3">
                                {[
                                    { label: '酸味 Acidity', val: acidity, set: setAcidity },
                                    { label: '甘味 Sweetness', val: sweetness, set: setSweetness },
                                    { label: 'コク Body', val: body, set: setBody },
                                    { label: '苦味 Bitterness', val: bitterness, set: setBitterness },
                                    { label: '香り Aroma', val: aroma, set: setAroma },
                                ].map((item) => (
                                    <div key={item.label} className="flex flex-col">
                                        <div className="flex justify-between text-[9px] text-gray-500 uppercase tracking-wider mb-1">
                                            <span>{item.label}</span>
                                            <span className="text-white font-bold">{item.val}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="1"
                                            value={item.val}
                                            onChange={(e) => item.set(Number(e.target.value))}
                                            className="w-full h-1 bg-gray-900 appearance-none cursor-pointer accent-white border-none rounded-none focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col items-center justify-center p-2 border-t border-gray-900/50 md:border-t-0 md:border-l md:border-gray-900">
                                <span className="text-[8px] uppercase tracking-widest text-gray-600 mb-2">Matrix Preview</span>
                                <RadarChart acidity={acidity} sweetness={sweetness} body={body} bitterness={bitterness} aroma={aroma} size={90} />
                            </div>
                        </div>

                        {/* Brew Photo Upload Section */}
                        <div className="mb-6 flex flex-col gap-2">
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest block">
                                Brew Photo (Optional)
                            </label>
                            <div className="flex gap-4 items-center">
                                <label className="cursor-pointer border border-dashed border-gray-800 hover:border-white transition-all p-2 flex flex-col items-center justify-center w-20 h-20 text-gray-600 bg-gray-950/20 text-center relative overflow-hidden rounded-sm group">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <>
                                            <span className="text-base mb-1 group-hover:text-white transition-colors">📷</span>
                                            <span className="text-[8px] tracking-wider uppercase font-bold group-hover:text-white transition-colors">Add Photo</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                                {imagePreview && (
                                    <button
                                        onClick={() => { setImage(''); setImagePreview(''); }}
                                        className="text-[9px] text-red-500 hover:text-red-400 border border-red-950/50 hover:border-red-500 px-2 py-1 transition-colors font-mono uppercase tracking-widest"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">
                                Field Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder={`Notes for ${bean.name}...`}
                                className="w-full h-20 bg-black border border-gray-800 p-3 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-white transition-colors resize-none"
                            />
                        </div>
                        <div className="pt-4 mt-4">
                            <button
                                onClick={handleSave}
                                disabled={saved}
                                className={`w-full py-3 border text-xs uppercase tracking-[0.2em] transition-all duration-500 ${saved
                                    ? 'bg-white text-black border-white'
                                    : 'border-gray-800 text-gray-400 hover:bg-white hover:text-black hover:border-white'
                                    }`}
                            >
                                {saved ? 'Recorded' : 'Commit Log'}
                            </button>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">
                            History: {bean.name}
                        </h3>
                        {filteredHistory.length === 0 && <p className="text-xs text-gray-700 italic">No logs recorded.</p>}
                        {filteredHistory.map(log => (
                            <div key={log.id} className="border-l border-gray-800 pl-4 py-2.5 hover:border-white transition-colors group relative flex justify-between items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] text-gray-500">{log.date ? log.date.split('T')[0] : 'N/A'}</span>
                                        <div className="flex gap-1 pr-6">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className={`w-1 h-1 rounded-full ${i < log.rating ? 'bg-white' : 'bg-gray-800'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-300 line-clamp-2 group-hover:text-white transition-colors pr-6">{log.notes || "No notes."}</p>
                                </div>
                                <div className="shrink-0 flex items-center gap-2">
                                    {log.image && (
                                        <div 
                                            onClick={() => setZoomImage(log.image || null)}
                                            className="w-11 h-11 bg-gray-900 border border-gray-800 overflow-hidden rounded-sm relative cursor-pointer active:scale-95 transition-transform"
                                            title="Click to zoom"
                                        >
                                            <img src={log.image} alt="Brew" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="shrink-0 flex items-center justify-center bg-gray-950/40 p-1 border border-gray-900/60 rounded-sm">
                                        <RadarChart 
                                            acidity={log.acidity ?? 3} 
                                            sweetness={log.sweetness ?? 3} 
                                            body={log.body ?? 3} 
                                            bitterness={log.bitterness ?? 3} 
                                            aroma={log.aroma ?? 3} 
                                            size={45} 
                                        />
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Delete this tasting log?")) {
                                            const updatedHistory = history.filter(h => h.id !== log.id);
                                            setHistory(updatedHistory);
                                            localStorage.setItem('kugcc_logs', JSON.stringify(updatedHistory));
                                        }
                                    }}
                                    className="absolute top-1 right-0 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-[10px] border border-gray-800 hover:border-red-500 px-1 bg-black"
                                    title="Delete Log"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Zoom Lightbox Modal */}
            {zoomImage && (
                <div 
                    onClick={() => setZoomImage(null)}
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center cursor-zoom-out p-4"
                >
                    <div className="relative max-w-full max-h-[85vh] flex items-center justify-center animate-fade-in">
                        <img 
                            src={zoomImage} 
                            alt="Brew Zoomed" 
                            className="max-w-full max-h-[80vh] object-contain border border-gray-800 rounded-sm shadow-2xl"
                        />
                        <button 
                            onClick={() => setZoomImage(null)}
                            className="absolute -top-10 right-0 text-white hover:text-gray-300 font-mono text-[10px] uppercase tracking-widest bg-black/50 border border-gray-800 px-3 py-1.5 rounded-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
