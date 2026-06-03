"use client";

import { useState } from 'react';
import AICoach from './AICoach';
import TastingLog from './TastingLog';
import SettingsPanel from './SettingsPanel';
import { Bean, Recipe } from '@/utils/types';

interface RightPanelProps {
    bean?: Bean;
    recipe?: Recipe;
    onLoadRecipe?: (recipe: Recipe) => void;
    onToggleStar?: (recipe: Recipe) => void;
    onDeleteRecipe?: (recipe: Recipe) => void;
}

export default function RightPanel({ bean, recipe, onLoadRecipe, onToggleStar, onDeleteRecipe }: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<'coach' | 'log' | 'recipes' | 'settings'>('coach');

    // Sort recipes: Starred first
    const sortedRecipes = bean?.recipes ? [...bean.recipes].sort((a, b) => {
        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;
        return 0;
    }) : [];

    return (
        <div className="h-full flex flex-col bg-black relative">
            {/* Touch-friendly Tab Switcher Header */}
            <div className="flex border-b border-gray-900 bg-black text-[10px] uppercase tracking-[0.12em] font-bold z-10 shrink-0 select-none">
                <button
                    onClick={() => setActiveTab('coach')}
                    className={`flex-1 py-4 text-center transition-all border-b-2 font-mono ${
                        activeTab === 'coach' 
                            ? 'text-white border-white bg-gray-900/20' 
                            : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-gray-900/10'
                    }`}
                >
                    AI Coach
                </button>
                <button
                    onClick={() => setActiveTab('log')}
                    className={`flex-1 py-4 text-center transition-all border-b-2 font-mono ${
                        activeTab === 'log' 
                            ? 'text-white border-white bg-gray-900/20' 
                            : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-gray-900/10'
                    }`}
                >
                    Tasting Log
                </button>
                <button
                    onClick={() => setActiveTab('recipes')}
                    className={`flex-1 py-4 text-center transition-all border-b-2 font-mono ${
                        activeTab === 'recipes' 
                            ? 'text-white border-white bg-gray-900/20' 
                            : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-gray-900/10'
                    }`}
                >
                    Recipes
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-5 py-4 text-center transition-all border-b-2 text-xs ${
                        activeTab === 'settings' 
                            ? 'text-white border-white bg-gray-900/20' 
                            : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-gray-900/10'
                    }`}
                    title="Settings"
                >
                    ⚙️
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 relative">
                {activeTab === 'coach' && <AICoach bean={bean} recipe={recipe} />}
                {activeTab === 'log' && <TastingLog bean={bean} />}
                {activeTab === 'settings' && <SettingsPanel />}
                {activeTab === 'recipes' && (
                    <div className="h-full flex flex-col p-6 font-mono overflow-y-auto">
                        <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-8 text-gray-500 border-b border-gray-900 pb-2">
                            Saved Recipes
                        </h2>
                        {sortedRecipes.length > 0 ? (
                            <div className="space-y-4">
                                {sortedRecipes.map((r, idx) => (
                                    <div key={idx} className="flex gap-2 group relative">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onToggleStar?.(r); }}
                                            className={`mt-4 text-xl transition-colors ${r.isStarred ? 'text-yellow-400' : 'text-gray-800 hover:text-gray-500'}`}
                                        >
                                            ★
                                        </button>
                                        <button
                                            onClick={() => onLoadRecipe?.(r)}
                                            className="flex-1 text-left p-4 border border-gray-800 hover:border-white transition-colors group"
                                        >
                                            <h3 className="text-sm text-white group-hover:text-white font-bold mb-1">
                                                {r.name || `Recipe #${idx + 1}`}
                                            </h3>
                                            <div className="text-[10px] text-gray-500 space-y-1">
                                                <p>Ratio 1:{r.ratio} • {r.temperature}°C</p>
                                                <p>{r.dripper ? `${r.dripper} • ` : ''}{r.grinderModel || "Generic"} • {r.grindSize}</p>
                                            </div>
                                        </button>

                                        {/* Delete Button (Visible on Hover in Group) */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteRecipe?.(r); }}
                                            className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xs border border-gray-800 hover:border-red-500 px-2 bg-black z-20"
                                            title="Delete Recipe"
                                        >
                                            ✕ DEL
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs text-gray-600 uppercase tracking-widest text-center mt-20">
                                NO SAVED RECIPES
                                <br />
                                <span className="text-[10px] opacity-30">Save a recipe via Editor</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
