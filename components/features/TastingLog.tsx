"use client";

import { useState, useEffect, useMemo } from 'react';
import { Bean, Recipe } from '@/utils/types';
import { FLAVOR_WHEEL, getFlavorColor, FlavorCategory, CATEGORY_COLORS } from '@/utils/flavor-wheel';
import RadarChart from './RadarChart';
import ComparisonModal from './ComparisonModal';

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
    flavorTags?: string[];
    recipe?: Recipe;
};

interface TastingLogProps {
    bean?: Bean;
    allBeans?: Bean[];
    activeRecipe?: Recipe;
    onLoadRecipe?: (recipe: Recipe) => void;
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


export default function TastingLog({ bean, allBeans, activeRecipe, onLoadRecipe }: TastingLogProps) {
    const [rating, setRating] = useState(3);
    const [notes, setNotes] = useState('');
    const [saved, setSaved] = useState(false);
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    // Tasting matrix state (default to 3)
    const [acidity, setAcidity] = useState(3);
    const [bitterness, setBitterness] = useState(3);
    const [sweetness, setSweetness] = useState(3);
    const [body, setBody] = useState(3);
    const [aroma, setAroma] = useState(3);

    // Flavor Tags state
    const [flavorTags, setFlavorTags] = useState<string[]>([]);
    const [flavorSearch, setFlavorSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<FlavorCategory | 'All'>('All');

    // Image upload states
    const [image, setImage] = useState<string>('');
    const [imagePreview, setImagePreview] = useState<string>('');
    const [zoomImage, setZoomImage] = useState<string | null>(null);

    // Compare Mode states
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [showCompareModal, setShowCompareModal] = useState(false);

    // Sort state
    const [logSortBy, setLogSortBy] = useState<string>('date_desc');

    // Load logs on mount
    const [history, setHistory] = useState<TastingLog[]>([]);

    useEffect(() => {
        const savedLogs = localStorage.getItem('kugcc_logs');
        if (savedLogs) {
            setHistory(JSON.parse(savedLogs));
        }
    }, []);

    // Reset flavor tags when bean changes
    useEffect(() => {
        if (bean) {
            setFlavorTags(bean.flavorTags || []);
        }
    }, [bean]);

    const filteredHistory = history.filter(log => !bean || log.beanId === bean.id);

    // Flavor logic
    const toggleFlavorTag = (tag: string) => {
        setFlavorTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleFlavorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && flavorSearch.trim()) {
            e.preventDefault();
            const newTag = flavorSearch.trim();
            if (!flavorTags.includes(newTag)) toggleFlavorTag(newTag);
            setFlavorSearch('');
        }
    };

    const filteredFlavors = useMemo(() => {
        let flavors = FLAVOR_WHEEL;
        if (selectedCategory !== 'All') {
            flavors = flavors.filter(f => f.category === selectedCategory);
        }
        if (flavorSearch.trim()) {
            flavors = flavors.filter(f => f.name.toLowerCase().includes(flavorSearch.toLowerCase()));
        }
        return flavors;
    }, [flavorSearch, selectedCategory]);

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
            image, // Add Base64 compressed image string
            flavorTags,
            recipe: activeRecipe
        };

        const updatedHistory = [newLog, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('kugcc_logs', JSON.stringify(updatedHistory));

        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            setRating(3);
            setNotes('');
            setAcidity(3);
            setBitterness(3);
            setSweetness(3);
            setBody(3);
            setAroma(3);
            setImage('');
            setImagePreview('');
            setFlavorTags(bean?.flavorTags || []);
            setFlavorSearch('');
        }, 2000);
    };

    const sweetSpotData = useMemo(() => {
        if (!bean || !bean.roastDate) return null;
        const highRatedLogs = filteredHistory.filter(log => log.rating >= 4);
        if (highRatedLogs.length < 2) return null;

        const roastDate = new Date(bean.roastDate).getTime();
        const days = highRatedLogs.map(log => {
            const logDate = new Date(log.date).getTime();
            return Math.floor((logDate - roastDate) / (1000 * 60 * 60 * 24));
        }).filter(d => d >= 0);

        if (days.length === 0) return null;

        const minDays = Math.min(...days);
        const maxDays = Math.max(...days);

        const bestLog = [...highRatedLogs].sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            const timeA = new Date(a.date || 0).getTime();
            const timeB = new Date(b.date || 0).getTime();
            const dateA = isNaN(timeA) ? 0 : timeA;
            const dateB = isNaN(timeB) ? 0 : timeB;
            return dateB - dateA;
        })[0];

        return {
            minDays,
            maxDays,
            bestRecipe: bestLog.recipe,
            bestRating: bestLog.rating,
            count: highRatedLogs.length
        };
    }, [filteredHistory, bean]);

    const sortedHistory = useMemo(() => {
        const baseHistory = bean ? filteredHistory : history;
        return [...baseHistory].sort((a, b) => {
            const timeA = new Date(a.date || 0).getTime();
            const timeB = new Date(b.date || 0).getTime();
            const dateA = isNaN(timeA) ? 0 : timeA;
            const dateB = isNaN(timeB) ? 0 : timeB;

            if (logSortBy === 'date_desc') {
                return dateA === dateB ? String(b.id || '').localeCompare(String(a.id || '')) : dateB - dateA;
            } else if (logSortBy === 'date_asc') {
                return dateA === dateB ? String(a.id || '').localeCompare(String(b.id || '')) : dateA - dateB;
            } else if (logSortBy === 'rating_desc') {
                const ratA = a.rating || 0;
                const ratB = b.rating || 0;
                if (ratA === ratB) return dateB - dateA;
                return ratB - ratA;
            }
            return 0;
        });
    }, [history, bean, filteredHistory, logSortBy]);

    const displayHistory = sortedHistory;

    return (
        <div className="h-full flex flex-col p-6 font-mono">
            {sweetSpotData && (
                <div className="mb-8 p-4 bg-blue-900/10 border border-blue-900/30 rounded-lg">
                    <h3 className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span>🎯 Sweet Spot Analyzer</span>
                    </h3>
                    <p className="text-[10px] text-gray-400 mb-4 leading-relaxed">
                        Based on your {sweetSpotData.count} high-rated logs (★4+), here is the optimal extraction profile for this bean.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-black/50 p-3 rounded border border-gray-800 text-center">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Peak Aging</div>
                            <div className="text-white font-bold text-lg">
                                {sweetSpotData.minDays === sweetSpotData.maxDays 
                                    ? `Day ${sweetSpotData.minDays}` 
                                    : `Days ${sweetSpotData.minDays}-${sweetSpotData.maxDays}`}
                            </div>
                        </div>
                        <div className="bg-black/50 p-3 rounded border border-gray-800 text-center">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Best Recipe (★{sweetSpotData.bestRating})</div>
                            <div className="text-white font-bold">
                                {sweetSpotData.bestRecipe ? (
                                    <span>
                                        {sweetSpotData.bestRecipe.temperature}°C / {sweetSpotData.bestRecipe.grindSize} / {sweetSpotData.bestRecipe.dripper || 'V60'}
                                    </span>
                                ) : (
                                    <span className="text-gray-600">No recipe linked</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-4 text-gray-500 border-b border-gray-900 pb-2 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2">
                <span>Tasting Log {bean ? '' : 'History'}</span>
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    <select
                        value={logSortBy}
                        onChange={(e) => setLogSortBy(e.target.value)}
                        className="bg-transparent border border-gray-800 text-[9px] uppercase tracking-widest p-1 text-gray-500 focus:ring-1 focus:ring-gray-700 rounded-sm outline-none cursor-pointer hover:text-white hover:border-gray-500 transition-colors"
                    >
                        <option value="date_desc">Newest First</option>
                        <option value="date_asc">Oldest First</option>
                        <option value="rating_desc">Highest Rated</option>
                    </select>
                    <button 
                        onClick={() => {
                            setIsCompareMode(!isCompareMode);
                            setSelectedForCompare([]);
                            setExpandedLogId(null);
                        }}
                        className={`text-[9px] px-2 py-1 rounded-sm transition-all ${isCompareMode ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'text-gray-500 border border-gray-800 hover:text-white'}`}
                    >
                        {isCompareMode ? 'CANCEL COMPARE' : 'COMPARE MODE'}
                    </button>
                    <span className="text-gray-700">{displayHistory.length} ENTRIES</span>
                </div>
            </h2>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-32 flex flex-col relative transition-all">
                {!bean ? (
                    <div className="mb-4 shrink-0">
                        <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">All Tasting Logs</h3>
                    </div>
                ) : (
                    <div className="space-y-6 shrink-0 mb-6">
                        {/* Target Bean Context Banner */}
                        <div className="p-4 border border-gray-800 bg-gray-950/60 flex items-center justify-between relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gray-700 group-hover:bg-white transition-colors"></div>
                        <div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Target Bean</p>
                            <p className="text-sm text-white font-bold tracking-wider">{bean.name}</p>
                            <p className="text-[10px] text-gray-400 mt-1.5 flex gap-2">
                                <span>{bean.roaster}</span>
                                <span className="text-gray-700">•</span>
                                <span>{bean.origin || 'Unknown Origin'}</span>
                                <span className="text-gray-700">•</span>
                                <span>{bean.process || 'Unknown Process'}</span>
                                {bean.roastDate && (
                                    <>
                                        <span className="text-gray-700">•</span>
                                        <span>Roast: {bean.roastDate.split('T')[0]}</span>
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="text-[9px] uppercase tracking-widest px-2 py-1 bg-white/10 text-white rounded-sm border border-white/20 shrink-0">
                            {bean.roastLevel}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="border-b border-gray-800 pb-6 mb-6">
                        <div className="mb-6">
                            <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                                <span>Quality Index</span>
                                <span className="text-white font-bold">{rating > 0 ? rating.toFixed(1) : '-'} / 5.0</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="0.5"
                                value={rating}
                                onChange={(e) => setRating(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-900 appearance-none cursor-pointer accent-white border-none rounded-none focus:outline-none"
                            />
                        </div>

                        {/* Tasting Matrix Sliders & Real-Time SVG Preview Chart */}
                        <div className="mb-6 flex flex-col gap-6 items-center border border-gray-900 p-6 bg-gray-950/20">
                            <div className="flex flex-col items-center justify-center w-full pb-6 border-b border-gray-900/50">
                                <span className="text-[8px] uppercase tracking-widest text-gray-600 mb-4">Matrix Preview</span>
                                <div className="flex justify-center">
                                    <RadarChart acidity={acidity} sweetness={sweetness} body={body} bitterness={bitterness} aroma={aroma} size={160} />
                                </div>
                            </div>
                            <div className="space-y-4 w-full">
                                {[
                                    { label: '酸味 Acidity', val: acidity, set: setAcidity },
                                    { label: '甘味 Sweetness', val: sweetness, set: setSweetness },
                                    { label: 'コク Body', val: body, set: setBody },
                                    { label: '苦味 Bitterness', val: bitterness, set: setBitterness },
                                    { label: '香り Aroma', val: aroma, set: setAroma },
                                ].map((item) => (
                                    <div key={item.label} className="flex flex-col">
                                        <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider mb-2">
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
                                            className="w-full h-1.5 bg-gray-900 appearance-none cursor-pointer accent-white border-none rounded-none focus:outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Flavor Profile Selector */}
                        <div className="mb-6 p-4 border border-gray-900 bg-gray-950/20">
                            <div className="flex justify-between items-end mb-4 border-b border-gray-900 pb-2">
                                <div>
                                    <h3 className="text-[10px] text-gray-500 uppercase tracking-widest">Flavor Profile</h3>
                                    <span className="text-[10px] text-gray-600 font-mono">{flavorTags.length} tags</span>
                                </div>
                                <button 
                                    onClick={() => setFlavorTags(bean.flavorTags || [])}
                                    className="text-[9px] uppercase tracking-widest px-2 py-1 bg-gray-900 text-gray-400 hover:text-white border border-gray-800 rounded-sm"
                                >
                                    Use Bean's Original Tags
                                </button>
                            </div>

                            {/* Category Filter */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {['All', ...Object.keys(CATEGORY_COLORS)].map(cat => {
                                    const baseColor = cat !== 'All' ? CATEGORY_COLORS[cat as FlavorCategory] : 'bg-gray-800/60 text-gray-200 border-gray-600/80';
                                    const isSelected = selectedCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat as any)}
                                            className={`px-2 py-1 text-[9px] font-bold tracking-wider rounded-sm border transition-all ${
                                                isSelected ? `${baseColor} ring-1 ring-white/30` : 'bg-transparent text-gray-500 border-gray-800 hover:text-gray-300 hover:border-gray-600'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    value={flavorSearch}
                                    onChange={(e) => setFlavorSearch(e.target.value)}
                                    onKeyDown={handleFlavorKeyDown}
                                    placeholder="Type to search or add custom flavor... (Press Enter)"
                                    className="w-full bg-black border border-gray-800 text-[10px] text-white p-2.5 focus:border-white focus:outline-none transition-colors rounded-sm font-sans"
                                />
                            </div>

                            {flavorTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-6 p-3 border border-dashed border-gray-800/60 bg-black/40 min-h-[44px] rounded-sm">
                                    {flavorTags.map(tag => (
                                        <span
                                            key={tag}
                                            onClick={() => toggleFlavorTag(tag)}
                                            className={`px-2.5 py-1 text-[10px] rounded-sm border ${getFlavorColor(tag)} cursor-pointer opacity-100 font-bold tracking-wider hover:opacity-80 transition-all flex items-center gap-1 ring-1 ring-white/50`}
                                        >
                                            {tag} ✕
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="h-[120px] overflow-y-auto custom-scrollbar border border-gray-900 p-2 bg-black/40 rounded-sm">
                                <div className="flex flex-wrap gap-1.5">
                                    {filteredFlavors.filter(f => !flavorTags.includes(f.name)).map(f => (
                                        <button
                                            key={f.name}
                                            onClick={() => toggleFlavorTag(f.name)}
                                            className={`px-2 py-1 text-[9px] rounded-sm border ${CATEGORY_COLORS[f.category]} opacity-60 hover:opacity-100 transition-all font-bold tracking-wider`}
                                        >
                                            + {f.name}
                                        </button>
                                    ))}
                                    {flavorSearch.trim() && !filteredFlavors.some(f => f.name.toLowerCase() === flavorSearch.toLowerCase()) && !flavorTags.includes(flavorSearch.trim()) && (
                                        <button
                                            onClick={() => {
                                                toggleFlavorTag(flavorSearch.trim());
                                                setFlavorSearch('');
                                            }}
                                            className="px-2 py-1 text-[9px] rounded-sm border bg-gray-800/80 text-white border-gray-600 hover:bg-gray-700 transition-all font-bold tracking-wider"
                                        >
                                            + Add "{flavorSearch.trim()}"
                                        </button>
                                    )}
                                </div>
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
                                        accept="image/jpeg, image/png, image/webp"
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
                    <div className="space-y-4 pb-2">
                        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">
                            History: {bean.name}
                        </h3>
                    </div>
                </div>
            )}
            {/* Render Display History (Global or Filtered) */}
            {(bean || history.length > 0) && (
                <div className="space-y-4 shrink-0">
                    {displayHistory.length === 0 && bean && <p className="text-xs text-gray-700 italic">No logs recorded for this bean.</p>}
                    {displayHistory.length === 0 && !bean && <p className="text-xs text-gray-700 italic">No tasting logs across all beans.</p>}
                    {displayHistory.map(log => {
                        const isExpanded = expandedLogId === log.id;
                        const logBean = allBeans?.find(b => b.id === log.beanId);
                        
                        return (
                            <div 
                                key={log.id} 
                                id={`log-card-${log.id}`} 
                                onClick={() => {
                                    if (isCompareMode) {
                                        if (selectedForCompare.includes(log.id)) {
                                            setSelectedForCompare(prev => prev.filter(id => id !== log.id));
                                        } else if (selectedForCompare.length < 2) {
                                            setSelectedForCompare(prev => [...prev, log.id]);
                                        }
                                    } else {
                                        setExpandedLogId(isExpanded ? null : log.id);
                                    }
                                }}
                                className={`border-l pl-4 py-2.5 transition-all group relative cursor-pointer ${
                                    isExpanded ? 'border-white pb-6 my-4 bg-black' : 'hover:border-gray-500 flex justify-between items-center gap-4 bg-black'
                                } ${
                                    isCompareMode 
                                        ? selectedForCompare.includes(log.id)
                                            ? 'border-orange-500 border-l-[3px] bg-gray-950'
                                            : 'border-gray-800'
                                        : 'border-gray-800'
                                }`}
                            >
                                {/* ---- COMPACT VIEW ---- */}
                                {!isExpanded && (
                                    <>
                                        {isCompareMode && (
                                            <div className={`w-4 h-4 shrink-0 rounded-sm border flex items-center justify-center mr-2 transition-colors ${
                                                selectedForCompare.includes(log.id) ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-600'
                                            }`}>
                                                {selectedForCompare.includes(log.id) && <span className="text-[10px]">✓</span>}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-500">{log.date ? log.date.split('T')[0] : 'N/A'}</span>
                                                    {!bean && logBean && (
                                                        <span className="text-xs text-white font-bold tracking-widest mt-0.5 truncate max-w-[200px]">{logBean.name}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 pr-6 mt-1">
                                                    {[...Array(5)].map((_, i) => {
                                                        const isFull = log.rating >= i + 1;
                                                        const isHalf = log.rating > i && log.rating < i + 1;
                                                        return (
                                                            <div 
                                                                key={i} 
                                                                className="w-1.5 h-1.5 rounded-full border border-gray-600" 
                                                                style={{ background: isFull ? 'white' : isHalf ? 'linear-gradient(to right, white 50%, transparent 50%)' : 'transparent' }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            {log.notes && (
                                                <p className="text-xs text-gray-300 line-clamp-2 group-hover:text-white transition-colors pr-6 mb-2">
                                                    {log.notes}
                                                </p>
                                            )}
                                            
                                            {log.flavorTags && log.flavorTags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 pr-6 mb-2">
                                                    {log.flavorTags.map(tag => (
                                                        <span key={tag} className={`px-1.5 py-0.5 text-[8px] font-bold tracking-wider rounded-sm border ${getFlavorColor(tag)}`}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {log.recipe && (
                                                <p className="text-[9px] text-gray-600 truncate pr-6">
                                                    Recipe: {log.recipe.name || 'Unnamed'}
                                                </p>
                                            )}
                                        </div>
                                        <div className="shrink-0 flex flex-col items-center gap-2">
                                            {log.image && (
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); setZoomImage(log.image || null); }}
                                                    className="w-11 h-11 bg-gray-900 border border-gray-800 overflow-hidden rounded-sm relative active:scale-95 transition-transform"
                                                    title="Click to zoom"
                                                >
                                                    <img src={log.image} alt="Brew" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="shrink-0 flex items-center justify-center bg-gray-950/40 p-1 border border-gray-900/60 rounded-sm">
                                                <RadarChart 
                                                    acidity={log.acidity ?? 3} sweetness={log.sweetness ?? 3} body={log.body ?? 3} 
                                                    bitterness={log.bitterness ?? 3} aroma={log.aroma ?? 3} size={45} 
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* ---- EXPANDED VIEW ---- */}
                                {isExpanded && (
                                    <div className="flex flex-col gap-6 animate-fade-in pr-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-white font-bold tracking-widest">{log.date ? log.date.split('T')[0] : 'N/A'}</span>
                                                {!bean && logBean && (
                                                    <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-widest">{logBean.name}</span>
                                                )}
                                            </div>
                                            <div className="flex gap-2 items-center">
                                                <span className="text-[10px] text-gray-500 font-mono mr-1">{log.rating.toFixed(1)} / 5.0</span>
                                                {[...Array(5)].map((_, i) => {
                                                    const isFull = log.rating >= i + 1;
                                                    const isHalf = log.rating > i && log.rating < i + 1;
                                                    return (
                                                        <div 
                                                            key={i} 
                                                            className="w-2.5 h-2.5 rounded-full border border-gray-600 shadow-sm" 
                                                            style={{ background: isFull ? 'white' : isHalf ? 'linear-gradient(to right, white 50%, transparent 50%)' : 'transparent' }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            {log.image && (
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); setZoomImage(log.image || null); }}
                                                    className="w-full h-48 sm:h-64 bg-gray-900 border border-gray-700 overflow-hidden rounded-sm relative active:scale-[0.98] transition-transform"
                                                    title="Click to zoom"
                                                >
                                                    <img src={log.image} alt="Brew" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-center w-full bg-gray-950/60 p-6 border border-gray-800 rounded-sm">
                                                <RadarChart 
                                                    acidity={log.acidity ?? 3} sweetness={log.sweetness ?? 3} body={log.body ?? 3} 
                                                    bitterness={log.bitterness ?? 3} aroma={log.aroma ?? 3} size={180} 
                                                />
                                            </div>
                                        </div>

                                        {log.flavorTags && log.flavorTags.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {log.flavorTags.map(tag => (
                                                    <span key={tag} className={`px-3 py-1.5 text-[11px] font-bold tracking-wider rounded-sm border ${getFlavorColor(tag)}`}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {log.notes && (
                                            <p className="text-base text-white bg-gray-900/40 p-4 border border-gray-700 rounded-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                                                {log.notes}
                                            </p>
                                        )}

                                        {log.recipe && (
                                            <div className="mt-2 border-t border-gray-800 pt-4">
                                                <p className="text-xs text-gray-400 mb-3 font-mono leading-relaxed">
                                                    RECIPE: <span className="text-white text-sm font-bold">{log.recipe.name || 'Unnamed'}</span><br/>
                                                    <span className="inline-block mt-1 bg-gray-900 px-2 py-1 rounded-sm border border-gray-800">
                                                        {log.recipe.ratio}ratio • {log.recipe.temperature}°C • {log.recipe.dripper || 'Unknown'}
                                                    </span>
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("現在のタイマー設定をこの過去のレシピで上書きしてよろしいですか？")) {
                                                            onLoadRecipe?.(log.recipe!);
                                                        }
                                                    }}
                                                    className="text-[10px] sm:text-xs uppercase tracking-widest bg-gray-100 text-black hover:bg-white px-4 py-3 transition-all rounded-sm w-full text-center font-bold"
                                                >
                                                    🔄 LOAD THIS RECIPE TO TIMER
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions Container */}
                                <div className="absolute top-1 right-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Delete this tasting log?")) {
                                                const updatedHistory = history.filter(h => h.id !== log.id);
                                                setHistory(updatedHistory);
                                                localStorage.setItem('kugcc_logs', JSON.stringify(updatedHistory));
                                            }
                                        }}
                                        className="text-gray-600 hover:text-red-500 text-[10px] border border-gray-800 hover:border-red-500 px-2 py-1 bg-black z-10"
                                        title="Delete Log"
                                    >
                                        ✕ DEL
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}
            </div>

            {/* Brutalist Bottom Action Bar */}
            {isCompareMode && (
                <div className="absolute bottom-0 left-0 w-full bg-black border-t border-gray-800 z-40">
                    <div className="w-full p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2">
                            {selectedForCompare.length === 0 && <span>Select 2 logs</span>}
                            {selectedForCompare.length === 1 && <span className="text-orange-400">Select 1 more</span>}
                            {selectedForCompare.length === 2 && <span className="text-orange-500">Ready!</span>}
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <button 
                                onClick={() => {
                                    setIsCompareMode(false);
                                    setSelectedForCompare([]);
                                }}
                                className="flex-1 sm:flex-none text-[10px] text-gray-500 hover:text-white border border-gray-800 hover:border-gray-500 px-6 py-3 uppercase tracking-widest bg-black transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => setShowCompareModal(true)}
                                disabled={selectedForCompare.length !== 2}
                                className={`flex-1 sm:flex-none text-[10px] px-8 py-3 uppercase tracking-widest font-bold transition-colors ${
                                    selectedForCompare.length === 2 
                                        ? 'bg-orange-600 text-white border border-orange-500 hover:bg-orange-500' 
                                        : 'bg-gray-900 text-gray-600 border border-gray-800 cursor-not-allowed'
                                }`}
                            >
                                Compare
                            </button>
                        </div>
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
            {/* Comparison Modal */}
            {showCompareModal && selectedForCompare.length === 2 && (
                <ComparisonModal 
                    log1={history.find(h => h.id === selectedForCompare[0])}
                    log2={history.find(h => h.id === selectedForCompare[1])}
                    onClose={() => setShowCompareModal(false)}
                    onUpdateLog={(id, newNotes) => {
                        const updatedHistory = history.map(h => h.id === id ? { ...h, notes: newNotes } : h);
                        setHistory(updatedHistory);
                        localStorage.setItem('kugcc_logs', JSON.stringify(updatedHistory));
                    }}
                />
            )}
        </div>
    );
}
