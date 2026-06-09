"use client";

import { useState, useEffect } from 'react';
import { Recipe, RecipeStep } from '@/utils/types';
import { GRINDER_TABLE } from '@/utils/grinder-table';
import { analyzeRecipeImage } from '@/utils/gemini';
import { toast } from '@/components/ui/Toast';

interface RecipeEditorProps {
    initialRecipe: Recipe;
    onSave: (recipe: Recipe, scope: 'bean' | 'global') => void;
    onCancel: () => void;
}

export default function RecipeEditor({ initialRecipe, onSave, onCancel }: RecipeEditorProps) {
    const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
    const totalWater = (recipe.beanWeight || 0) * (recipe.ratio || 0);
    const [drippers, setDrippers] = useState<string[]>([]);
    const [availableAccessories, setAvailableAccessories] = useState<string[]>([]);
    
    // Determine default save scope. 
    // If the recipe is entirely new (no ID) and we clicked Add Global Recipe, it will just start with 'global'. 
    // But since RecipeEditor doesn't know if it came from Add Global Recipe, we can just default to 'bean', 
    // and let the user select 'global' if they want. Actually, we should add saveScope state.
    const [saveScope, setSaveScope] = useState<'bean' | 'global'>('bean');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

    const toggleStepAdvanced = (id: string) => {
        setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }));
    };

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
            const { resizeImageToBase64 } = await import('@/utils/imageResizer');
            const base64Data = await resizeImageToBase64(file);

            const result = await analyzeRecipeImage(base64Data.data, base64Data.mime, apiKey);
            
            setRecipe(prev => {
                const newData = { ...prev };
                if (result.name) newData.name = result.name;
                if (result.dripper) newData.dripper = result.dripper;
                if (result.beanWeight) newData.beanWeight = result.beanWeight;
                if (result.temperature) newData.temperature = result.temperature;
                if (result.grindSize) newData.grindSize = result.grindSize;
                
                // Calculate ratio if totalWater is provided
                let computedTotalWater = 0;
                if (result.totalWater && result.beanWeight) {
                    newData.ratio = Math.round((result.totalWater / result.beanWeight) * 10) / 10;
                    computedTotalWater = result.totalWater;
                } else if (result.ratio) {
                    newData.ratio = result.ratio;
                    computedTotalWater = (result.beanWeight || prev.beanWeight || 15) * result.ratio;
                }

                // Handle steps
                if (result.steps && result.steps.length > 0) {
                    // If no explicit totalWater was given, calculate it from the sum of steps
                    if (computedTotalWater === 0) {
                        computedTotalWater = result.steps.reduce((sum, s) => sum + (s.waterAdded || 0), 0);
                        if (computedTotalWater > 0 && newData.beanWeight) {
                            newData.ratio = Math.round((computedTotalWater / newData.beanWeight) * 10) / 10;
                        }
                    }

                    if (computedTotalWater > 0) {
                        newData.steps = result.steps.map((s, idx) => {
                            const waterAdded = s.waterAdded || 0;
                            const percentage = (waterAdded / computedTotalWater) * 100;
                            return {
                                id: Date.now().toString() + idx,
                                name: s.name || `Step ${idx + 1}`,
                                waterPercentage: percentage,
                                duration: s.duration || 30,
                                temperature: s.temperature,
                                state: s.state
                            };
                        });
                    }
                }

                return newData;
            });
            
            toast('Recipe parsed successfully!');
        } catch (error: any) {
            console.error('Auto-fill error:', error);
            const msg = error instanceof Error ? error.message : error.toString();
            toast('Failed to parse recipe: ' + msg, 'error');
        } finally {
            setIsAnalyzing(false);
            e.target.value = '';
        }
    };

    useEffect(() => {
        const savedDrippers = localStorage.getItem('kugcc_custom_drippers');
        if (savedDrippers) {
            setDrippers(JSON.parse(savedDrippers));
        } else {
            setDrippers(['Hario V60', 'Kalita Wave', 'Origami', 'Hario Switch', 'Aeropress', 'Chemex', 'French Press']);
        }

        const savedAccessories = localStorage.getItem('kugcc_custom_accessories');
        if (savedAccessories) {
            setAvailableAccessories(JSON.parse(savedAccessories));
        } else {
            setAvailableAccessories(['Paragon', 'Melodrip', 'Sifter', 'WDT Tool', 'Paper Filter (Bottom)', 'LilyDrip']);
        }
    }, []);

    const toggleAccessory = (acc: string) => {
        setRecipe(prev => {
            const current = prev.accessories || [];
            if (current.includes(acc)) {
                return { ...prev, accessories: current.filter(a => a !== acc) };
            } else {
                return { ...prev, accessories: [...current, acc] };
            }
        });
    };

    // Auto-scaling logic happens naturally by deriving state, 
    // but if we needed to adjust step percentages to maintain volumes, 
    // we would do it here. For now, percentages stay fixed, so water volume scales automatically.

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                onSave(recipe, saveScope);
            }
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [recipe, onSave, onCancel]);

    const updateStep = (id: string, field: keyof RecipeStep, value: string | number | undefined) => {
        setRecipe(prev => ({
            ...prev,
            steps: prev.steps.map(s => s.id === id ? { ...s, [field]: value } : s)
        }));
    };

    const addStep = () => {
        const newStep: RecipeStep = {
            id: Date.now().toString(),
            name: 'New Step',
            waterPercentage: 0,
            duration: 30
        };
        setRecipe(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
    };

    const removeStep = (id: string) => {
        setRecipe(prev => ({ ...prev, steps: prev.steps.filter(s => s.id !== id) }));
    };

    const currentTotalMl = recipe.steps.reduce((sum, s) => sum + (totalWater * (Number(s.waterPercentage) / 100)), 0);
    const isValid = Math.abs(currentTotalMl - totalWater) < 0.5;

    return (
        <div id="recipe-editor-export" className="flex flex-col items-center w-full h-full p-6 md:p-12 bg-black font-mono relative overflow-y-auto block-swipe">
            <h2 className="text-white uppercase tracking-[0.3em] mb-8 md:mb-12 border-b border-gray-800 pb-4 w-full flex justify-between items-center text-sm md:text-base">
                <span>Recipe Configuration</span>
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

            {/* Recipe Name & Shop Recipe Toggle */}
            <div className="w-full max-w-4xl mb-6 md:mb-8 -mt-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col flex-1">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Recipe Name (Optional)</label>
                    <input
                        type="text"
                        value={recipe.name || ""}
                        onChange={(e) => setRecipe({ ...recipe, name: e.target.value })}
                        placeholder={initialRecipe.name || "e.g. My Favorite V60"}
                        className="bg-transparent border-b border-gray-800 text-white font-mono focus:outline-none focus:border-white transition-colors w-full text-sm py-2"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="shopRecipe" 
                        checked={recipe.isShopRecipe || false}
                        onChange={(e) => setRecipe({...recipe, isShopRecipe: e.target.checked})}
                        className="accent-yellow-600 w-4 h-4"
                    />
                    <label htmlFor="shopRecipe" className="text-[10px] uppercase tracking-widest text-yellow-600 font-bold cursor-pointer select-none">
                        Mark as Shop/Model Recipe (お手本)
                    </label>
                </div>
            </div>

            {/* Core Variables (Bidirectional Calculator) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 w-full max-w-4xl mb-6 md:mb-12">
                <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Bean (g)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={recipe.beanWeight || ''}
                        onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            setRecipe(prev => ({ ...prev, beanWeight: val }));
                        }}
                        className="bg-transparent text-2xl md:text-3xl font-light text-white border-b border-gray-800 focus:border-white focus:outline-none transition-colors py-2"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Ratio (1:x)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={recipe.ratio || ''}
                        onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            setRecipe(prev => ({ ...prev, ratio: val }));
                        }}
                        className="bg-transparent text-2xl md:text-3xl font-light text-white border-b border-gray-800 focus:border-white focus:outline-none transition-colors py-2"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Temp (°C)</label>
                    <input
                        type="number"
                        value={recipe.temperature || ''}
                        onChange={(e) => {
                            const val = e.target.value === '' ? 0 : Number(e.target.value);
                            setRecipe(prev => ({ ...prev, temperature: val }));
                        }}
                        className="bg-transparent text-2xl md:text-3xl font-light text-white border-b border-gray-800 focus:border-white focus:outline-none transition-colors py-2"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Total (ml)</label>
                    <input
                        type="number"
                        value={totalWater ? Math.round(totalWater) : ''}
                        onChange={(e) => {
                            const targetWater = Number(e.target.value);
                            if (recipe.beanWeight > 0) {
                                // Calculate ratio to 2 decimal places to prevent totalWater rounding jumps
                                const newRatio = Math.round((targetWater / recipe.beanWeight) * 100) / 100;
                                setRecipe(prev => ({ ...prev, ratio: newRatio }));
                            }
                        }}
                        className="bg-transparent text-2xl md:text-3xl font-light text-white border-b border-gray-800 focus:border-white focus:outline-none transition-colors py-2"
                    />
                </div>
            </div>

            {/* Grind Settings */}
            <div className="grid grid-cols-2 gap-6 md:gap-12 w-full max-w-4xl mb-6 md:mb-12">
                <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Dripper</label>
                    <div className="relative">
                        <input
                            list="dripper-options"
                            value={recipe.dripper || ""}
                            onChange={(e) => setRecipe({ ...recipe, dripper: e.target.value })}
                            placeholder="e.g. V60"
                            className="bg-black border-b border-gray-800 text-white font-mono focus:outline-none focus:border-white transition-colors w-full text-xs py-2"
                        />
                        <datalist id="dripper-options">
                            {drippers.map(d => <option key={d} value={d} />)}
                        </datalist>
                    </div>
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Grinder Model</label>
                    <select
                        value={recipe.grinderModel || "S3"}
                        onChange={(e) => setRecipe({ ...recipe, grinderModel: e.target.value })}
                        className="bg-black border-b border-gray-800 text-white font-mono focus:outline-none focus:border-white transition-colors w-full text-xs py-2 appearance-none"
                    >
                        {Object.keys(GRINDER_TABLE.models).map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Clicks / Setting</label>
                    <input
                        type="text"
                        value={recipe.grindSize || ''}
                        onChange={(e) => setRecipe({ ...recipe, grindSize: e.target.value })}
                        className="bg-transparent border-b border-gray-800 text-white font-mono focus:outline-none focus:border-white transition-colors w-full text-xs py-2"
                    />
                </div>
            </div>

            {/* Accessories Selection */}
            <div className="w-full max-w-4xl mb-6 md:mb-12">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block">Accessories (Optional)</label>
                <div className="flex flex-wrap gap-2">
                    {availableAccessories.map(acc => {
                        const isSelected = (recipe.accessories || []).includes(acc);
                        return (
                            <button
                                key={acc}
                                onClick={() => toggleAccessory(acc)}
                                className={`px-3 py-1.5 text-[10px] uppercase tracking-widest transition-all rounded-sm border ${
                                    isSelected 
                                        ? 'bg-white text-black border-white font-bold shadow-[0_0_10px_rgba(255,255,255,0.3)]' 
                                        : 'bg-transparent text-gray-400 border-gray-800 hover:border-gray-500'
                                }`}
                            >
                                {acc}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Steps Table */}
            <div className="w-full max-w-4xl mb-6">
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-xs text-gray-500 uppercase tracking-widest">Steps Partitioning</h3>
                    <span className={`text-xs ${isValid ? 'text-gray-500' : 'text-red-500'}`}>
                        Total: {Math.round(currentTotalMl)} / {Math.round(totalWater)} ml
                    </span>
                </div>

                <div className="w-full border-t border-gray-800">
                    {recipe.steps.map((step, idx) => (
                        <div key={step.id} className="flex flex-col border-b border-gray-900 group">
                            <div className="flex items-center gap-2 md:gap-4 py-2 md:py-3">
                                <span className="text-gray-600 w-4 md:w-6 text-xs">{idx + 1}</span>
                                <input
                                    value={step.name}
                                    onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                                    className="bg-transparent text-white text-sm focus:outline-none flex-1 min-w-[60px]"
                                    placeholder="Step Name"
                                />
                                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                                    <input
                                        type="number"
                                        value={step.waterPercentage === 0 ? '' : Math.round(totalWater * (step.waterPercentage / 100))}
                                        onChange={(e) => {
                                            const ml = e.target.value === '' ? 0 : Number(e.target.value);
                                            const pct = totalWater > 0 ? (ml / totalWater) * 100 : 0;
                                            updateStep(step.id, 'waterPercentage', pct);
                                        }}
                                        className="bg-transparent text-white text-sm text-right w-10 md:w-12 focus:outline-none border-b border-transparent focus:border-gray-700"
                                        placeholder="0"
                                    />
                                    <span className="text-gray-600 text-xs">ml</span>
                                </div>
                                <div className="hidden md:flex items-center gap-2 shrink-0">
                                    <span className="text-gray-500 text-sm tabular-nums w-12 text-right">
                                        {step.waterPercentage.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2 shrink-0">
                                    <input
                                        type="number"
                                        value={step.duration === 0 ? '' : step.duration}
                                        onChange={(e) => updateStep(step.id, 'duration', e.target.value === '' ? 0 : Number(e.target.value))}
                                        className="bg-transparent text-white text-sm text-right w-10 md:w-12 focus:outline-none border-b border-transparent focus:border-gray-700"
                                        placeholder="0"
                                    />
                                    <span className="text-gray-600 text-xs">s</span>
                                </div>
                                <button
                                    onClick={() => toggleStepAdvanced(step.id)}
                                    className={`text-xs px-1 md:px-2 shrink-0 transition-colors ${expandedSteps[step.id] || step.temperature || step.state ? 'text-[#3b82f6]' : 'text-gray-600 hover:text-gray-300'}`}
                                    title="Advanced Options"
                                >
                                    ⚙️
                                </button>
                                <button
                                    onClick={() => removeStep(step.id)}
                                    className="text-gray-600 hover:text-red-500 transition-all text-xs px-1 md:px-2 md:opacity-0 md:group-hover:opacity-100 shrink-0"
                                >
                                    [x]
                                </button>
                            </div>
                            
                            {/* Advanced Options Row */}
                            {expandedSteps[step.id] && (
                                <div className="pl-6 md:pl-10 pr-2 pb-3 flex flex-col md:flex-row gap-4 items-start md:items-center bg-gray-900/20">
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest w-12 md:w-auto">Temp</label>
                                        <input
                                            type="number"
                                            value={step.temperature || ''}
                                            onChange={(e) => updateStep(step.id, 'temperature', e.target.value === '' ? undefined : Number(e.target.value))}
                                            placeholder={recipe.temperature ? `${recipe.temperature}` : 'Global'}
                                            className="bg-transparent text-white text-sm text-right w-16 focus:outline-none border-b border-gray-800 focus:border-gray-500"
                                        />
                                        <span className="text-gray-600 text-xs">℃</span>
                                    </div>
                                    <div className="flex items-center gap-2 w-full md:flex-1">
                                        <label className="text-[10px] text-gray-500 uppercase tracking-widest w-12 md:w-auto">State</label>
                                        <input
                                            type="text"
                                            value={step.state || ''}
                                            onChange={(e) => updateStep(step.id, 'state', e.target.value)}
                                            placeholder="e.g. Switch Close, Stir"
                                            className="bg-transparent text-white text-sm focus:outline-none flex-1 border-b border-gray-800 focus:border-gray-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <button
                    onClick={addStep}
                    className="text-xs uppercase tracking-widest text-gray-400 hover:text-white transition-colors flex items-center gap-2 py-2 md:py-4"
                >
                    <span>+ Add Phase</span>
                </button>
            </div>

            {/* Notes Field */}
            <div className="w-full max-w-4xl mb-6 md:mb-12">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 block">Recipe Notes</label>
                <textarea
                    value={recipe.notes || ''}
                    onChange={(e) => setRecipe({ ...recipe, notes: e.target.value })}
                    placeholder="Enter any notes, special techniques, or flavor intentions..."
                    className="w-full bg-black border border-gray-800 text-gray-300 font-mono text-xs p-4 focus:outline-none focus:border-white transition-colors min-h-[100px] resize-y"
                />
            </div>

            {/* Save Target & Actions */}
            <div className="w-full max-w-4xl mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-6 pb-20">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-widest text-gray-500">Save Destination</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input 
                                type="radio" 
                                name="saveScope" 
                                value="bean" 
                                checked={saveScope === 'bean'} 
                                onChange={() => setSaveScope('bean')}
                                className="accent-white"
                            />
                            <span className={saveScope === 'bean' ? 'text-white font-bold' : 'text-gray-500'}>Current Bean</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                            <input 
                                type="radio" 
                                name="saveScope" 
                                value="global" 
                                checked={saveScope === 'global'} 
                                onChange={() => setSaveScope('global')}
                                className="accent-white"
                            />
                            <span className={saveScope === 'global' ? 'text-white font-bold' : 'text-gray-500'}>Global Library</span>
                        </label>
                    </div>
                </div>

                <div className="flex gap-4 w-full md:w-auto mt-4 md:mt-0">
                    <button
                        onClick={onCancel}
                        className="flex-1 md:flex-none px-6 py-3 text-xs uppercase tracking-widest text-gray-500 hover:text-white border border-gray-800 hover:border-gray-500 transition-all"
                    >
                        Cancel
                    </button>
                    {recipe.id && (
                        <button
                            onClick={() => onSave({ ...recipe, id: '' }, saveScope)}
                            disabled={!isValid}
                            className="flex-1 md:flex-none px-6 py-3 text-xs uppercase tracking-widest text-white border border-gray-600 hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Save as a new copy"
                        >
                            Save as New
                        </button>
                    )}
                    <button
                        onClick={() => onSave(recipe, saveScope)}
                        disabled={!isValid}
                        className="flex-1 md:flex-none px-8 py-3 text-xs uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
