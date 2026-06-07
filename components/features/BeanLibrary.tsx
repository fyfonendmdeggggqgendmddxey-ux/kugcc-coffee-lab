"use client";

import { useState, useEffect } from 'react';
import { Bean, DEFAULT_RECIPE } from '@/utils/types';
import { toast } from '@/components/ui/Toast';
import BeanEntryModal from './BeanEntryModal';
import BatchReviewModal from './BatchReviewModal';
import { getFlavorColor } from '@/utils/flavor-wheel';
import { analyzeCoffeeBagImage } from '@/utils/gemini';
import Tooltip from '../common/Tooltip';

interface BeanLibraryProps {
    onSelect?: (id: string) => void;
    selectedId?: string | null;
}

export default function BeanLibrary({ onSelect, selectedId }: BeanLibraryProps) {
    const [beans, setBeans] = useState<Bean[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [editingBean, setEditingBean] = useState<Bean | undefined>(undefined);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState("");
    const [quickFilters, setQuickFilters] = useState<string[]>(['Light', 'Dark', 'Washed', 'Natural']);
    const [sortBy, setSortBy] = useState<string>('added_desc');
    const [scannedBatch, setScannedBatch] = useState<Bean[] | null>(null);

    const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const apiKey = localStorage.getItem('kugcc_gemini_api_key') || '';

        setIsBatchProcessing(true);
        let newlyAddedCount = 0;
        let failedFiles: string[] = [];
        let tempBatch: Bean[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setBatchProgress(`Analyzing ${i + 1} / ${files.length}...`);
            
            try {
                const { resizeImageToBase64 } = await import('@/utils/imageResizer');
                const base64Data = await resizeImageToBase64(file);

                const extracted = await analyzeCoffeeBagImage(base64Data.data, base64Data.mime, apiKey);

                let finalRoastDate = '';
                if (extracted.roastDate) {
                    finalRoastDate = extracted.roastDate;
                } else if (extracted.roaster) {
                    const savedDefaults = localStorage.getItem('kugcc_roaster_defaults');
                    if (savedDefaults) {
                        try {
                            const defaults = JSON.parse(savedDefaults);
                            const days = defaults[extracted.roaster];
                            if (typeof days === 'number') {
                                const d = new Date();
                                d.setDate(d.getDate() - days);
                                finalRoastDate = d.toISOString().split('T')[0];
                            }
                        } catch(e) {}
                    }
                }

                const newBean: Bean = {
                    id: (Date.now() + i).toString(),
                    name: extracted.name || 'Unnamed Coffee',
                    roaster: extracted.roaster || 'Unknown Roaster',
                    origin: extracted.origin || '',
                    variety: extracted.variety || '',
                    process: extracted.process || '',
                    roastLevel: extracted.roastLevel || '',
                    flavorTags: extracted.flavorTags || [],
                    roastDate: finalRoastDate ? new Date(finalRoastDate).toISOString() : '',
                    recipeOverride: DEFAULT_RECIPE,
                };
                tempBatch.push(newBean);
                newlyAddedCount++;
            } catch (err) {
                console.error("Batch extraction failed for image", file.name, err);
                failedFiles.push(file.name);
            }

            // Rate limiting: Delay to prevent Gemini API "429 Quota Exceeded" (15 RPM limit = 1 req / 4s)
            // Using 6.5 seconds to comfortably stay under 15 RPM even with network jitter
            if (i < files.length - 1) {
                setBatchProgress(`Waiting to prevent API limits... (${i + 1}/${files.length})`);
                await new Promise(r => setTimeout(r, 6500));
            }
        }

        setIsBatchProcessing(false);
        setBatchProgress("");
        e.target.value = "";

        if (failedFiles.length > 0) {
            toast(`Analyzed ${newlyAddedCount} beans. Failed: ${failedFiles.length} images.`, 'error');
        }
        
        if (tempBatch.length > 0) {
            setScannedBatch(tempBatch);
        }
    };

    const handleSaveBatch = (reviewedBeans: Bean[]) => {
        const updatedBeans = [...beans, ...reviewedBeans];
        setBeans(updatedBeans);
        localStorage.setItem('kugcc_beans', JSON.stringify(updatedBeans));
        setScannedBatch(null);
        toast(`Successfully added ${reviewedBeans.length} beans!`);
    };

    // Load from LocalStorage
    useEffect(() => {
        const saved = localStorage.getItem('kugcc_beans');
        if (saved) {
            setBeans(JSON.parse(saved));
        } else {
            // Default seeds
            setBeans([
                { id: '1', name: 'Ethiopia Yirgacheffe', roaster: 'Kurasu', origin: 'Ethiopia', roastLevel: 'Light', process: 'Washed', roastDate: new Date().toISOString(), recipeOverride: DEFAULT_RECIPE },
                { id: '2', name: 'Colombia Huila', roaster: 'Onibus', origin: 'Colombia', roastLevel: 'Medium', process: 'Honey', roastDate: new Date().toISOString(), recipeOverride: DEFAULT_RECIPE },
                { id: '3', name: 'Kenya AA', roaster: 'Glitch', origin: 'Kenya', roastLevel: 'Light', process: 'Washed', roastDate: new Date().toISOString(), recipeOverride: DEFAULT_RECIPE },
            ]);
        }

        const savedQuickFilters = localStorage.getItem('kugcc_quick_filters');
        if (savedQuickFilters) {
            setQuickFilters(JSON.parse(savedQuickFilters));
        }

        setIsLoaded(true);
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('kugcc_beans', JSON.stringify(beans));
        }
    }, [beans, isLoaded]);

    const handleSaveBean = (bean: Bean) => {
        // Check if the bean already exists in current list to update it
        const exists = bean.id && beans.some(b => b.id === bean.id);
        if (exists) {
            setBeans(beans.map(b => b.id === bean.id ? bean : b));
        } else {
            // Generate a valid ID if cloning / new
            const newBean = { ...bean, id: bean.id || Date.now().toString() };
            setBeans([...beans, newBean]);
        }
        setShowModal(false);
        setEditingBean(undefined);
    };

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteConfirmId(id);
    }

    const executeDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setBeans(beans.filter(b => b.id !== id));
        setDeleteConfirmId(null);
    }

    const cancelDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteConfirmId(null);
    }

    const openEdit = (e: React.MouseEvent, bean: Bean) => {
        e.stopPropagation();
        setEditingBean(bean);
        setShowModal(true);
    }

    const openClone = (e: React.MouseEvent, bean: Bean) => {
        e.stopPropagation();
        // Clone the bean data but replace the ID and suffix copy to name
        const clonedBean: Bean = {
            ...bean,
            id: '', // Leave empty to let handleSaveBean generate a new ID
            name: `${bean.name} (Copy)`,
            roastDate: new Date().toISOString()
        };
        setEditingBean(clonedBean);
        setShowModal(true);
    };

    // Load custom roasters, processes, roast levels & varieties lists from LocalStorage on mount/modal changes
    const [customRoasters, setCustomRoasters] = useState<string[]>([]);
    const [customOrigins, setCustomOrigins] = useState<string[]>([]);
    const [customProcesses, setCustomProcesses] = useState<string[]>([]);
    const [customRoastLevels, setCustomRoastLevels] = useState<string[]>([]);
    const [customVarieties, setCustomVarieties] = useState<string[]>([]);

    useEffect(() => {
        if (showModal) {
            const savedCR = localStorage.getItem('kugcc_custom_roasters');
            if (savedCR) setCustomRoasters(JSON.parse(savedCR));

            const savedCO = localStorage.getItem('kugcc_custom_origins');
            if (savedCO) setCustomOrigins(JSON.parse(savedCO));

            const savedCP = localStorage.getItem('kugcc_custom_processes');
            if (savedCP) setCustomProcesses(JSON.parse(savedCP));

            const savedCRL = localStorage.getItem('kugcc_custom_roast_levels');
            if (savedCRL) setCustomRoastLevels(JSON.parse(savedCRL));

            const savedCV = localStorage.getItem('kugcc_custom_varieties');
            if (savedCV) setCustomVarieties(JSON.parse(savedCV));
        }
    }, [showModal]);

    // Get unique roasters, origins, and processes for autocomplete lists
    const uniqueRoasters = Array.from(new Set([
        ...beans.map(b => b.roaster),
        ...customRoasters
    ].filter((r): r is string => !!r)));
    
    const uniqueOrigins = Array.from(new Set([
        ...beans.map(b => b.origin),
        ...customOrigins
    ].filter((o): o is string => !!o)));
    
    const uniqueProcesses = customProcesses.length > 0 
        ? customProcesses 
        : ['Washed', 'Natural', 'Honey', 'Anaerobic', 'Experimental'];

    const uniqueRoastLevels = customRoastLevels.length > 0
        ? customRoastLevels
        : ['Light', 'Medium', 'Dark', 'Italian', 'French', 'City'];

    const uniqueVarieties = Array.from(new Set([
        ...beans.map(b => b.variety),
        ...customVarieties
    ].filter((v): v is string => !!v)));


    const getAgingBadge = (bean: Bean) => {
        if (!bean.roastDate) return null;
        try {
            const roast = new Date(bean.roastDate);
            if (isNaN(roast.getTime())) return null;
            
            const roastDateOnly = new Date(roast.getFullYear(), roast.getMonth(), roast.getDate());
            const now = new Date();
            const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const diffTime = todayDateOnly.getTime() - roastDateOnly.getTime();
            const physicalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (isNaN(physicalDays)) return null;

            // Compute effective aging days based on storage and roast level
            let multiplier = 1.0;
            if (bean.roastLevel === 'Light') multiplier *= 0.8;
            else if (bean.roastLevel === 'Dark') multiplier *= 1.2;

            if (bean.storageLocation === 'HighTemp') multiplier *= 1.5;
            else if (bean.storageLocation === 'Fridge') multiplier *= 0.2;
            else if (bean.storageLocation === 'Freezer') multiplier *= 0.05;

            const effectiveDays = physicalDays * multiplier;
            const isModified = multiplier !== 1.0;
            const displayDays = isModified ? effectiveDays.toFixed(1) : physicalDays.toString();

            const diffDays = effectiveDays;

            const degasEnd = bean.shopRecommendedDays ?? bean.idealAgingDays ?? 4;
            const peakEnd = degasEnd + 10;
            const goodEnd = peakEnd + 16;

            const tooltipTitle = isModified 
                ? `Physical: ${physicalDays}d, Multiplier: x${multiplier.toFixed(2)}`
                : '';

            if (diffDays < 0) {
                return (
                    <span title={tooltipTitle} className="ml-2 px-1.5 py-0.5 text-[8px] tracking-wider uppercase border border-purple-900 bg-purple-950/20 text-purple-400 font-bold rounded-sm">
                        Future
                    </span>
                );
            }
            if (diffDays <= degasEnd) {
                return (
                    <span title={tooltipTitle} className="ml-2 px-1.5 py-0.5 text-[8px] tracking-wider uppercase border border-amber-900 bg-amber-950/20 text-amber-500 font-bold rounded-sm">
                        Degas ({displayDays}d)
                    </span>
                );
            }
            if (diffDays <= peakEnd) {
                return (
                    <span title={tooltipTitle} className="ml-2 px-1.5 py-0.5 text-[8px] tracking-wider uppercase border border-emerald-900 bg-emerald-950/20 text-emerald-400 font-bold rounded-sm animate-pulse">
                        Peak ({displayDays}d)
                    </span>
                );
            }
            if (diffDays <= goodEnd) {
                return (
                    <span title={tooltipTitle} className="ml-2 px-1.5 py-0.5 text-[8px] tracking-wider uppercase border border-sky-900 bg-sky-950/20 text-sky-400 font-bold rounded-sm">
                        Good ({displayDays}d)
                    </span>
                );
            }
            return (
                <span title={tooltipTitle} className="ml-2 px-1.5 py-0.5 text-[8px] tracking-wider uppercase border border-gray-800 bg-gray-900/40 text-gray-500 rounded-sm">
                    Aged ({displayDays}d)
                </span>
            );
        } catch (e) {
            return null;
        }
    };

    // Filter Logic
    const filteredBeans = beans.filter(bean => {
        const matchesSearch = bean.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bean.roaster.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (bean.origin || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (bean.variety || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter
            ? [bean.roaster, bean.origin, bean.process, bean.roastLevel, bean.variety]
                .some(field => (field || '').toLowerCase().includes(activeFilter.toLowerCase()))
            : true;

        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        if (sortBy === 'added_desc' || sortBy === 'added_asc') {
            const getTimestamp = (id: string) => {
                const num = Number(id);
                // Fix for the old batch upload bug that appended '0' making the string 14+ digits
                if (!isNaN(num) && (id?.length || 0) > 13) {
                    return Number(id.substring(0, 13));
                }
                return isNaN(num) ? 0 : num;
            };
            const numA = getTimestamp(a.id || '');
            const numB = getTimestamp(b.id || '');
            
            if (numA === numB) {
                const strCmp = String(b.id || '').localeCompare(String(a.id || ''));
                return sortBy === 'added_desc' ? strCmp : -strCmp;
            }
            return sortBy === 'added_desc' ? numB - numA : numA - numB;
        } else if (sortBy === 'roast_desc') {
            const timeA = a.roastDate ? new Date(a.roastDate).getTime() : 0;
            const timeB = b.roastDate ? new Date(b.roastDate).getTime() : 0;
            const dateA = isNaN(timeA) ? 0 : timeA;
            const dateB = isNaN(timeB) ? 0 : timeB;
            return dateB - dateA;
        } else if (sortBy === 'name_asc') {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        } else if (sortBy === 'roaster_asc') {
            const roasterA = a.roaster || '';
            const roasterB = b.roaster || '';
            return roasterA.localeCompare(roasterB);
        }
        return 0;
    });

    if (!isLoaded) return <div className="p-6 text-xs text-gray-600">Loading Library...</div>;

    return (
        <div className="h-full flex flex-col px-3 py-4 md:p-6 font-mono relative">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-6 text-gray-500 border-b border-gray-900 pb-2 flex justify-between items-center">
                <span>Bean Library</span>
                <span className="text-gray-700">{filteredBeans.length} / {beans.length}</span>
            </h2>

            {/* Search, Sort & Filter */}
            <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Search Origin / Roaster..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-gray-900/50 border-none text-xs p-2 text-white placeholder-gray-600 focus:ring-1 focus:ring-gray-700 rounded-sm"
                    />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-900/50 border-none text-xs p-2 text-gray-400 focus:ring-1 focus:ring-gray-700 rounded-sm outline-none cursor-pointer"
                    >
                        <option value="added_desc">Newest Added</option>
                        <option value="added_asc">Oldest Added</option>
                        <option value="roast_desc">Freshest Roast</option>
                        <option value="name_asc">Name (A-Z)</option>
                        <option value="roaster_asc">Roaster (A-Z)</option>
                    </select>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {quickFilters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                            className={`px-2 py-1 text-[10px] uppercase tracking-wider border transition-all whitespace-nowrap ${activeFilter === filter
                                ? 'bg-white text-black border-white'
                                : 'text-gray-600 border-gray-800 hover:border-gray-600'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 pr-2 custom-scrollbar">
                {filteredBeans.map((bean) => (
                    <div
                        key={bean.id}
                        className={`group cursor-pointer relative py-2.5 px-3 border-l transition-all duration-300 ${selectedId === bean.id
                            ? 'border-white bg-gray-900'
                            : 'border-transparent hover:border-gray-500 hover:bg-gray-900/30'
                            }`}
                        onClick={() => onSelect?.(bean.id)}
                    >
                        <h3 className={`text-sm font-medium transition-colors tracking-wide leading-snug ${selectedId === bean.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                            {bean.name}
                        </h3>
                        <p className="text-[10px] text-gray-500 mb-1 leading-normal">{bean.roaster}</p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                                {bean.roastLevel === 'Light' ? '浅煎り' : bean.roastLevel === 'Medium' ? '中煎り' : '深煎り'}
                            </span>
                            <span className="text-[10px] text-gray-700">/</span>
                            <span className="text-[10px] text-gray-600 uppercase tracking-widest">
                                {bean.process === 'Washed' ? 'ウォッシュト' : bean.process === 'Natural' ? 'ナチュラル' : bean.process}
                            </span>
                        </div>
                        <Tooltip content="エイジング（焙煎からの日数）。ピーク（飲み頃）は自動計算されます。" position="top">
                            <div className="mt-2 text-[10px] text-gray-500 font-mono flex items-center cursor-help w-fit">
                                <span>Roast: {bean.roastDate ? bean.roastDate.split('T')[0] : 'N/A'}</span>
                                {getAgingBadge(bean)}
                            </div>
                        </Tooltip>
                        {bean.storageLocation && (
                            <div className="mt-1.5 text-[9px] text-gray-600 font-mono flex items-center gap-1 border border-gray-900/50 w-fit px-1 bg-gray-950/30">
                                <span className="uppercase tracking-widest">Loc:</span> <span className="text-gray-400">{bean.storageLocation}</span>
                            </div>
                        )}
                        {(bean.idealAgingDays !== undefined || bean.shopRecommendedDays !== undefined) && (
                            <div className="mt-0.5 text-[9px] text-gray-600 font-mono flex items-center gap-1">
                                <span className="uppercase tracking-widest">Peak starts:</span>
                                <span className="text-gray-400">{bean.shopRecommendedDays ?? bean.idealAgingDays}d</span>
                            </div>
                        )}
                        {bean.flavorTags && bean.flavorTags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {bean.flavorTags.map(tag => (
                                    <span key={tag} className={`px-1.5 py-0.5 text-[8px] font-bold tracking-wider rounded-sm border ${getFlavorColor(tag)}`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {selectedId === bean.id && (
                            <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end gap-2 animate-fade-in">
                                <button
                                    onClick={(e) => openClone(e, bean)}
                                    className="text-[10px] uppercase tracking-widest border border-gray-700 hover:border-white text-gray-400 hover:text-white bg-black px-3 py-1.5 rounded-sm transition-all"
                                >
                                    CLONE
                                </button>
                                <button
                                    onClick={(e) => openEdit(e, bean)}
                                    className="text-[10px] uppercase tracking-widest border border-gray-700 hover:border-white text-gray-400 hover:text-white bg-black px-3 py-1.5 rounded-sm transition-all"
                                >
                                    EDIT
                                </button>
                                
                                {deleteConfirmId === bean.id ? (
                                    <div className="flex border border-red-900 bg-black rounded-sm overflow-hidden">
                                        <button onClick={(e) => executeDelete(e, bean.id)} className="text-red-500 hover:bg-red-500 hover:text-white text-[10px] font-bold px-3 py-1.5 transition-colors">YES</button>
                                        <button onClick={cancelDelete} className="text-gray-500 hover:text-white text-[10px] px-3 py-1.5 border-l border-red-950 transition-colors">NO</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={(e) => confirmDelete(e, bean.id)}
                                        className="text-[10px] uppercase tracking-widest border border-gray-800 hover:border-red-500 text-gray-500 hover:text-red-500 bg-black px-3 py-1.5 rounded-sm transition-all"
                                    >
                                        DEL
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="pt-3 border-t border-gray-900 mt-3 flex gap-2">
                <button
                    onClick={() => { setEditingBean(undefined); setShowModal(true); }}
                    disabled={isBatchProcessing}
                    className="flex-1 py-2.5 border border-gray-800 text-xs text-gray-400 hover:bg-white hover:text-black hover:border-white transition-all duration-300 uppercase tracking-[0.2em] disabled:opacity-50 disabled:pointer-events-none"
                >
                    + Add Entry
                </button>
                <Tooltip content="一括登録：複数の写真を選択すると、AIがまとめて解析してくれます！" position="top">
                    <label className={`h-full w-12 border border-gray-800 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black transition-all cursor-pointer ${isBatchProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="text-sm">📸</span>
                        <input type="file" multiple accept="image/jpeg, image/png, image/webp" className="hidden" onChange={handleBatchImageUpload} disabled={isBatchProcessing} />
                    </label>
                </Tooltip>
            </div>
            
            {isBatchProcessing && (
                <div className="mt-2 text-center text-[10px] text-amber-500 font-bold uppercase tracking-widest animate-pulse">
                    {batchProgress}
                </div>
            )}

            {showModal && (
                <BeanEntryModal
                    onSave={handleSaveBean}
                    onCancel={() => { setShowModal(false); setEditingBean(undefined); }}
                    initialBean={editingBean}
                    roasters={uniqueRoasters}
                    origins={uniqueOrigins}
                    processes={uniqueProcesses}
                    roastLevels={uniqueRoastLevels}
                    varieties={uniqueVarieties}
                />
            )}
            {/* Background Batch Processing Indicator */}
            {isBatchProcessing && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-sm shadow-2xl z-50 text-[10px] tracking-widest uppercase flex items-center gap-3">
                    <span className="animate-spin text-sm">↻</span>
                    {batchProgress}
                </div>
            )}

            {/* Batch Review Modal */}
            {scannedBatch && (
                <BatchReviewModal 
                    scannedBeans={scannedBatch}
                    onSaveAll={handleSaveBatch}
                    onCancel={() => setScannedBatch(null)}
                />
            )}
        </div>
    );
}
