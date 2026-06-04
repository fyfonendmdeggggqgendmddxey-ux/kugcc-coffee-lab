"use client";

import { useState, useEffect } from 'react';
import { Recipe, RecipeStep } from '@/utils/types';
import { GRINDER_TABLE } from '@/utils/grinder-table';

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

    const updateStep = (id: string, field: keyof RecipeStep, value: string | number) => {
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

    const totalPercentage = recipe.steps.reduce((sum, s) => sum + Number(s.waterPercentage), 0);
    const isValid = totalPercentage === 100;

    return (
        <div className="flex flex-col items-center w-full h-full p-6 md:p-12 bg-black font-mono relative overflow-y-auto">
            <h2 className="text-white uppercase tracking-[0.3em] mb-8 md:mb-12 border-b border-gray-800 pb-4 w-full text-center text-sm md:text-base">
                Recipe Configuration
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
                                const newRatio = Math.round((targetWater / recipe.beanWeight) * 10) / 10;
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
                        type="number"
                        value={recipe.grindSize}
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
                        Total: {totalPercentage}%
                    </span>
                </div>

                <div className="w-full border-t border-gray-800">
                    {recipe.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-4 py-2 md:py-3 border-b border-gray-900 group">
                            <span className="text-gray-600 w-6 text-xs">{idx + 1}</span>
                            <input
                                value={step.name}
                                onChange={(e) => updateStep(step.id, 'name', e.target.value)}
                                className="bg-transparent text-white text-sm focus:outline-none flex-1"
                                placeholder="Step Name"
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={step.waterPercentage}
                                    onChange={(e) => updateStep(step.id, 'waterPercentage', Number(e.target.value))}
                                    className="bg-transparent text-white text-sm text-right w-12 focus:outline-none border-b border-transparent focus:border-gray-700"
                                />
                                <span className="text-gray-600 text-xs">%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-sm tabular-nums w-12 text-right">
                                    {(totalWater * (step.waterPercentage / 100)).toFixed(0)}ml
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={step.duration}
                                    onChange={(e) => updateStep(step.id, 'duration', Number(e.target.value))}
                                    className="bg-transparent text-white text-sm text-right w-12 focus:outline-none border-b border-transparent focus:border-gray-700"
                                />
                                <span className="text-gray-600 text-xs">s</span>
                            </div>
                            <button
                                onClick={() => removeStep(step.id)}
                                className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-500 transition-all text-xs px-2"
                            >
                                [x]
                            </button>
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

                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={onCancel}
                        className="flex-1 md:flex-none px-8 py-3 text-xs uppercase tracking-widest text-gray-500 hover:text-white border border-gray-800 hover:border-gray-500 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(recipe, saveScope)}
                        disabled={!isValid}
                        className="flex-1 md:flex-none px-8 py-3 text-xs uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    >
                        Save Recipe
                    </button>
                </div>
            </div>
        </div>
    );
}
