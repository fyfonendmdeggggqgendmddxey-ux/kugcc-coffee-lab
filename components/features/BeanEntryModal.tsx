"use client";

import { useState, useMemo } from 'react';
import { Bean, DEFAULT_RECIPE } from '@/utils/types';
import { FLAVOR_WHEEL, getFlavorColor, FlavorCategory, CATEGORY_COLORS } from '@/utils/flavor-wheel';
import { analyzeCoffeeBagImage } from '@/utils/gemini';
import { toast } from '@/components/ui/Toast';

interface BeanEntryModalProps {
    onSave: (bean: Bean) => void;
    onCancel: () => void;
    initialBean?: Bean;
    roasters?: string[];
    origins?: string[];
    processes?: string[];
    roastLevels?: string[];
    varieties?: string[];
}

export default function BeanEntryModal({
    onSave,
    onCancel,
    initialBean,
    roasters = [],
    origins = [],
    processes = [],
    roastLevels = [],
    varieties = []
}: BeanEntryModalProps) {
    const [flavorSearch, setFlavorSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<FlavorCategory | 'All'>('All');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [formData, setFormData] = useState({
        name: initialBean?.name || '',
        englishName: initialBean?.englishName || '',
        roaster: initialBean?.roaster || '',
        origin: initialBean?.origin || '',
        variety: initialBean?.variety || '',
        roastLevel: initialBean?.roastLevel || 'Light',
        process: initialBean?.process || 'Washed',
        roastDate: (initialBean && initialBean.roastDate) ? initialBean.roastDate.split('T')[0] : '',
        idealAgingDays: initialBean?.idealAgingDays?.toString() || '',
        shopRecommendedDays: initialBean?.shopRecommendedDays?.toString() || '',
        storageLocation: initialBean?.storageLocation || '',
        flavorTags: initialBean?.flavorTags || [] as string[]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let val = e.target.value;
        if (e.target.type === 'number') {
            if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                val = val.replace(/^0+/, '');
            }
        }
        setFormData({ ...formData, [e.target.name]: val });
    };

    const handleSave = () => {
        let finalName = formData.name.trim();
        let finalRoaster = formData.roaster.trim();

        if (!finalName) {
            if (formData.origin.trim()) {
                finalName = `${formData.origin.trim()} Blend`;
            } else if (finalRoaster) {
                finalName = `${finalRoaster} Coffee`;
            } else {
                const today = new Date();
                finalName = `名もなき豆 (${today.getMonth() + 1}/${today.getDate()})`;
            }
        }

        if (!finalRoaster) {
            finalRoaster = 'Unknown Roaster';
        }

        const newBean: Bean = {
            id: initialBean?.id || Date.now().toString(),
            name: finalName,
            englishName: formData.englishName,
            roaster: finalRoaster,
            origin: formData.origin,
            variety: formData.variety,
            roastLevel: formData.roastLevel,
            process: formData.process,
            roastDate: formData.roastDate ? new Date(formData.roastDate).toISOString() : '',
            recipeOverride: initialBean?.recipeOverride || DEFAULT_RECIPE,
            idealAgingDays: formData.idealAgingDays ? parseInt(formData.idealAgingDays, 10) : undefined,
            shopRecommendedDays: formData.shopRecommendedDays ? parseInt(formData.shopRecommendedDays, 10) : undefined,
            storageLocation: formData.storageLocation || undefined,
            flavorTags: formData.flavorTags
        };
        onSave(newBean);
    };

    const toggleFlavorTag = (tag: string) => {
        setFormData(prev => {
            const tags = prev.flavorTags.includes(tag)
                ? prev.flavorTags.filter(t => t !== tag)
                : [...prev.flavorTags, tag];
            return { ...prev, flavorTags: tags };
        });
    };

    const handleFlavorKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && flavorSearch.trim()) {
            e.preventDefault();
            const newTag = flavorSearch.trim();
            if (!formData.flavorTags.includes(newTag)) {
                toggleFlavorTag(newTag);
            }
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const apiKey = localStorage.getItem('kugcc_gemini_api_key');
        if (!apiKey) {
            toast('Please configure your Gemini API Key in the Settings tab first!', 'error');
            return;
        }

        setIsAnalyzing(true);
        
        try {
            // Resize and compress the image before sending to Gemini API to prevent payload too large errors
            const { resizeImageToBase64 } = await import('@/utils/imageResizer');
            const base64Data = await resizeImageToBase64(file);

            const result = await analyzeCoffeeBagImage(base64Data.data, base64Data.mime, apiKey);
            
            // Merge extracted data into formData
            setFormData(prev => {
                const newData = { ...prev };
                if (result.name) newData.name = result.name;
                if (result.roaster) newData.roaster = result.roaster;
                if (result.origin) newData.origin = result.origin;
                if (result.variety) newData.variety = result.variety;
                if (result.roastLevel) {
                    const levelStr = result.roastLevel.toLowerCase();
                    if (levelStr.includes('浅') || levelStr.includes('light') || levelStr.includes('ライト')) {
                        newData.roastLevel = 'Light';
                    } else if (levelStr.includes('中') || levelStr.includes('medium') || levelStr.includes('ミディアム')) {
                        newData.roastLevel = 'Medium';
                    } else if (levelStr.includes('深') || levelStr.includes('dark') || levelStr.includes('ダーク') || levelStr.includes('french') || levelStr.includes('italian')) {
                        newData.roastLevel = 'Dark';
                    } else {
                        newData.roastLevel = result.roastLevel;
                    }
                }
                if (result.process) {
                    const validProcesses = ['Washed', 'Natural', 'Honey', 'Anaerobic', 'Experimental', 'Wet Hulled'];
                    const matched = validProcesses.find(p => result.process?.toLowerCase().includes(p.toLowerCase()));
                    newData.process = matched || result.process;
                }
                if (result.flavorTags && result.flavorTags.length > 0) {
                    // Capitalize first letters and add to tags
                    const cleanedTags = result.flavorTags.map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
                    const uniqueTags = Array.from(new Set([...prev.flavorTags, ...cleanedTags]));
                    newData.flavorTags = uniqueTags;
                }

                if (result.roastDate) {
                    newData.roastDate = result.roastDate;
                } else if (result.roaster) {
                    const savedDefaults = localStorage.getItem('kugcc_roaster_defaults');
                    if (savedDefaults) {
                        try {
                            const defaults = JSON.parse(savedDefaults);
                            const days = defaults[result.roaster];
                            if (typeof days === 'number') {
                                const d = new Date();
                                d.setDate(d.getDate() - days);
                                newData.roastDate = d.toISOString().split('T')[0];
                            }
                        } catch (e) {}
                    }
                }

                return newData;
            });
            
            toast('Image analyzed successfully!');
        } catch (error: any) {
            console.error('Auto-fill error:', error);
            const msg = error instanceof Error ? error.message : 
                        (error.type === 'error' ? 'Failed to load image (possibly unsupported format like HEIC in Chrome). Please try a JPEG/PNG.' : 
                        error.toString());
            toast('Failed to analyze image: ' + msg, 'error');
        } finally {
            setIsAnalyzing(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] sm:p-4" onClick={() => onCancel()}>
            <div className="bg-black border border-gray-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md p-5 sm:p-8 relative flex flex-col font-mono" onClick={e => e.stopPropagation()}>
                <h2 className="text-sm font-bold tracking-[0.2em] uppercase mb-4 sm:mb-8 text-white border-b border-gray-900 pb-4 shrink-0 mt-8 sm:mt-0 flex justify-between items-center">
                    <span>{initialBean ? 'Edit Bean Entry' : 'New Bean Entry'}</span>
                    <label className="relative cursor-pointer flex items-center justify-center bg-gray-900 hover:bg-gray-800 text-gray-300 transition-colors px-3 py-1.5 rounded-sm border border-gray-800">
                        {isAnalyzing ? (
                            <span className="text-[10px] uppercase tracking-widest flex items-center gap-2">
                                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Analyzing...
                            </span>
                        ) : (
                            <span className="text-[10px] uppercase tracking-widest flex items-center gap-1.5 text-blue-300">
                                <span>📸</span> Auto-fill
                            </span>
                        )}
                        <input type="file" accept="image/jpeg, image/png, image/webp" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} disabled={isAnalyzing} />
                    </label>
                </h2>

                <div className="space-y-6 overflow-y-auto flex-1 pr-2 sm:pr-4 custom-scrollbar">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase text-gray-500 tracking-widest">Name</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Ethiopia Yirgacheffe"
                            className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="flex flex-col mb-6">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 ml-2">English Name (Optional)</label>
                        <input
                            type="text"
                            name="englishName"
                            value={formData.englishName}
                            onChange={handleChange}
                            placeholder="e.g. Ethiopia Yirgacheffe G1"
                            className="w-full bg-black border-b-2 border-gray-800 p-2 text-sm text-gray-300 font-mono focus:outline-none focus:border-white transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Roaster</label>
                            <input
                                list="roasters-list"
                                name="roaster"
                                value={formData.roaster}
                                onChange={handleChange}
                                placeholder="e.g. Kurasu"
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                            <datalist id="roasters-list">
                                {roasters.map(r => <option key={r} value={r} />)}
                            </datalist>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Origin</label>
                            <input
                                list="origins-list"
                                name="origin"
                                value={formData.origin}
                                onChange={handleChange}
                                placeholder="e.g. Ethiopia"
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                            <datalist id="origins-list">
                                {origins.map(o => <option key={o} value={o} />)}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Roast Level</label>
                            <input
                                list="roast-levels"
                                name="roastLevel"
                                value={formData.roastLevel}
                                onChange={handleChange}
                                placeholder="Select or type..."
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                            <datalist id="roast-levels">
                                {roastLevels.map(rl => <option key={rl} value={rl} />)}
                            </datalist>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Process</label>
                            <input
                                list="process-types"
                                name="process"
                                value={formData.process}
                                onChange={handleChange}
                                placeholder="Select or type..."
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                            <datalist id="process-types">
                                {processes.map(p => <option key={p} value={p} />)}
                            </datalist>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase text-gray-500 tracking-widest">Roast Date</label>
                        <input
                            type="date"
                            name="roastDate"
                            value={formData.roastDate}
                            onChange={handleChange}
                            className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none block w-full"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase text-gray-500 tracking-widest">Variety (Optional)</label>
                        <input
                            list="varieties-list"
                            name="variety"
                            value={formData.variety}
                            onChange={handleChange}
                            placeholder="e.g. Geisha, Bourbon"
                            className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                        />
                        <datalist id="varieties-list">
                            {varieties.map(v => <option key={v} value={v} />)}
                        </datalist>
                    </div>

                    <div className="pt-4 border-t border-gray-900 mt-2">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[10px] text-gray-500 uppercase tracking-widest">Flavor Profile</h3>
                            <span className="text-[10px] text-gray-600 font-mono">{formData.flavorTags.length} tags</span>
                        </div>
                        
                        <div className="bg-gray-950/50 border border-gray-800 p-4 rounded-md">
                            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2 border-b border-gray-800/50">
                                {['All', 'Fruity', 'Floral', 'Sweet', 'Nutty/Cocoa', 'Roasted', 'Spices', 'Sour/Fermented', 'Green/Vegetative', 'Other'].map(cat => {
                                    const isSelected = selectedCategory === cat;
                                    const baseColor = cat !== 'All' ? CATEGORY_COLORS[cat as FlavorCategory] : 'bg-gray-800/60 text-gray-200 border-gray-600/80';
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat as any)}
                                            className={`whitespace-nowrap px-3 py-1 text-[9px] uppercase tracking-wider rounded-full border transition-all ${
                                                isSelected 
                                                    ? `${baseColor} opacity-100 font-bold ring-1 ring-white/60 shadow-[0_0_10px_rgba(255,255,255,0.15)]` 
                                                    : `${baseColor} opacity-70 hover:opacity-100`
                                            }`}
                                        >
                                            {cat.replace('/', ' / ')}
                                        </button>
                                    );
                                })}
                            </div>
                            <input
                                type="text"
                                value={flavorSearch}
                                onChange={(e) => setFlavorSearch(e.target.value)}
                                onKeyDown={handleFlavorKeyDown}
                                placeholder="Type to search or add custom flavor... (Press Enter)"
                                className="w-full bg-transparent border-b border-gray-700 text-white p-2 mb-4 text-xs focus:border-white focus:outline-none transition-colors"
                            />
                            
                            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto no-scrollbar">
                                {formData.flavorTags.map(tag => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() => toggleFlavorTag(tag)}
                                        className={`px-2.5 py-1 text-[10px] rounded-full border ${getFlavorColor(tag)} opacity-100 font-bold tracking-wider hover:opacity-80 transition-all flex items-center gap-1 ring-1 ring-white/50 shadow-[0_0_8px_rgba(255,255,255,0.2)]`}
                                    >
                                        {tag} <span className="text-[8px] opacity-80 font-normal">✕</span>
                                    </button>
                                ))}
                                
                                {filteredFlavors.filter(f => !formData.flavorTags.includes(f.name)).map(f => (
                                    <button
                                        key={f.name}
                                        type="button"
                                        onClick={() => toggleFlavorTag(f.name)}
                                        className={`px-2.5 py-1 text-[10px] rounded-full border ${f.colorClasses} opacity-80 hover:opacity-100 transition-all`}
                                    >
                                        + {f.name}
                                    </button>
                                ))}
                                
                                {flavorSearch.trim() && !filteredFlavors.some(f => f.name.toLowerCase() === flavorSearch.toLowerCase()) && !formData.flavorTags.includes(flavorSearch.trim()) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toggleFlavorTag(flavorSearch.trim());
                                            setFlavorSearch('');
                                        }}
                                        className="px-2.5 py-1 text-[10px] rounded-full border border-gray-600 bg-gray-800 text-gray-300 opacity-80 hover:opacity-100 transition-opacity"
                                    >
                                        + Add "{flavorSearch.trim()}"
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-900 mt-2">
                        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Aging Records (Optional)</h3>
                        <div className="grid grid-cols-2 gap-6 mb-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] uppercase text-gray-500 tracking-widest" title="Theoretical ideal days until peak">Ideal Peak (Days)</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="idealAgingDays"
                                    value={formData.idealAgingDays}
                                    onChange={handleChange}
                                    placeholder="e.g. 14"
                                    className="w-full bg-black border-b-2 border-gray-800 p-2 text-xl font-bold text-white focus:outline-none focus:border-white transition-colors"
                                />
                            </div>

                            <div className="flex flex-col relative">
                                <label className="text-[10px] uppercase text-gray-500 tracking-widest" title="Shop recommended days until peak">Shop Rec (Days)</label>
                                <input
                                    type="number"
                                    min="0"
                                    name="shopRecommendedDays"
                                    value={formData.shopRecommendedDays}
                                    onChange={handleChange}
                                    placeholder="e.g. 7"
                                    className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] uppercase text-gray-500 tracking-widest">Storage Location</label>
                            <input
                                type="text"
                                name="storageLocation"
                                value={formData.storageLocation}
                                onChange={handleChange}
                                placeholder="e.g. Freezer, Wine Cellar, Room Temp"
                                className="bg-transparent border-b border-gray-800 text-white p-2 focus:border-white focus:outline-none transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6 sm:mt-10 shrink-0 pb-12 sm:pb-0 pt-4 bg-black">
                    <button
                        onClick={onCancel}
                        className="text-xs uppercase tracking-widest text-gray-500 hover:text-white px-4 py-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="text-xs uppercase tracking-widest bg-white text-black px-6 py-2 hover:bg-gray-200 transition-colors"
                    >
                        Save Entry
                    </button>
                </div>
            </div>
        </div>
    );
}
