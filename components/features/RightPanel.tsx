"use client";

import { useState } from 'react';
import AICoach from './AICoach';
import TastingLog from './TastingLog';
import SettingsPanel from './SettingsPanel';
import HelpPanel from './HelpPanel';
import { Bean, Recipe } from '@/utils/types';

interface RightPanelProps {
    bean?: Bean;
    recipe?: Recipe;
    globalRecipes?: Recipe[];
    onLoadRecipe?: (recipe: Recipe) => void;
    onToggleStar?: (recipe: Recipe) => void;
    onDeleteRecipe?: (recipe: Recipe) => void;
    onAddGlobalRecipe?: () => void;
    onToggleGlobalStar?: (recipe: Recipe) => void;
    onDeleteGlobalRecipe?: (recipe: Recipe) => void;
}

export default function RightPanel({ 
    bean, recipe, globalRecipes = [], 
    onLoadRecipe, onToggleStar, onDeleteRecipe,
    onAddGlobalRecipe, onToggleGlobalStar, onDeleteGlobalRecipe
}: RightPanelProps) {
    const [activeTab, setActiveTab] = useState<'coach' | 'log' | 'recipes' | 'settings' | 'help'>('coach');

    // Sort recipes: Starred first
    const sortedBeanRecipes = bean?.recipes ? [...bean.recipes].sort((a, b) => {
        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;
        return 0;
    }) : [];

    const sortedGlobalRecipes = [...globalRecipes].sort((a, b) => {
        if (a.isStarred && !b.isStarred) return -1;
        if (!a.isStarred && b.isStarred) return 1;
        return 0;
    });

    const RecipeCard = ({ r, isGlobal }: { r: Recipe, isGlobal?: boolean }) => {
        const isShop = r.isShopRecipe;
        const toggleStar = isGlobal ? onToggleGlobalStar : onToggleStar;
        const deleteRecipe = isGlobal ? onDeleteGlobalRecipe : onDeleteRecipe;
        
        return (
            <div className="flex gap-2 group relative">
                <button
                    onClick={(e) => { e.stopPropagation(); toggleStar?.(r); }}
                    className={`mt-4 text-xl transition-colors ${r.isStarred ? 'text-yellow-400' : 'text-gray-800 hover:text-gray-500'}`}
                >
                    ★
                </button>
                <button
                    onClick={() => onLoadRecipe?.(r)}
                    className={`flex-1 text-left p-4 transition-colors group border ${
                        isShop 
                            ? 'border-yellow-600/50 hover:border-yellow-400 bg-yellow-900/10' 
                            : 'border-gray-800 hover:border-white bg-transparent'
                    }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-sm font-bold ${isShop ? 'text-yellow-500 group-hover:text-yellow-400' : 'text-white group-hover:text-white'}`}>
                            {r.name || `Recipe`}
                        </h3>
                        {isShop && <span className="text-[8px] uppercase tracking-widest text-yellow-600 border border-yellow-600/50 px-1 rounded-sm">Shop Recipe</span>}
                    </div>
                    <div className="text-[10px] text-gray-500 space-y-1">
                        <p>Ratio 1:{r.ratio} • {r.temperature}°C</p>
                        <p>{r.dripper ? `${r.dripper} • ` : ''}{r.grinderModel || "Generic"} • {r.grindSize}</p>
                        {r.accessories && r.accessories.length > 0 && (
                            <p className="italic">+ {r.accessories.join(', ')}</p>
                        )}
                    </div>
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); deleteRecipe?.(r); }}
                    className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xs border border-gray-800 hover:border-red-500 px-2 bg-black z-20"
                    title="Delete Recipe"
                >
                    ✕ DEL
                </button>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-black relative">
            {/* Touch-friendly Tab Switcher Header */}
            <div className="flex border-b border-gray-900 bg-black text-[10px] uppercase tracking-[0.12em] font-bold z-10 shrink-0 select-none overflow-x-auto no-scrollbar">
                <button
                    onClick={() => setActiveTab('coach')}
                    className={`px-4 py-4 text-center transition-all border-b-2 font-mono whitespace-nowrap ${
                        activeTab === 'coach' 
                            ? 'text-white border-white bg-gray-900/20' 
                            : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-gray-900/10'
                    }`}
                >
                    AI Coach
                </button>
                <button
                    onClick={() => setActiveTab('log')}
                    className={`px-4 py-4 text-center transition-all border-b-2 font-mono whitespace-nowrap ${
                        activeTab === 'log' 
                            ? 'text-white border-white bg-gray-900/20' 
                            : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-gray-900/10'
                    }`}
                >
                    Tasting Log
                </button>
                <button
                    onClick={() => setActiveTab('recipes')}
                    className={`px-4 py-4 text-center transition-all border-b-2 font-mono whitespace-nowrap ${
                        activeTab === 'recipes' 
                            ? 'text-white border-white bg-gray-900/20' 
                            : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-gray-900/10'
                    }`}
                >
                    Recipes
                </button>
                <div className="flex-1"></div>
                <button
                    onClick={() => setActiveTab('help')}
                    className={`px-4 py-4 text-center transition-all border-b-2 font-mono whitespace-nowrap ${
                        activeTab === 'help' 
                            ? 'text-white border-white bg-gray-900/20' 
                            : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-gray-900/10'
                    }`}
                    title="Guide"
                >
                    📖
                </button>
                <button
                    onClick={() => setActiveTab('coach')}
                    className={`px-4 py-4 text-center transition-all border-b-2 text-[10px] uppercase tracking-widest whitespace-nowrap ${
                        activeTab === 'coach' 
                            ? 'text-white border-white bg-gray-900/20' 
                            : 'text-gray-600 border-transparent hover:text-gray-300 hover:bg-gray-900/10'
                    }`}
                    title="AI Coach"
                >
                    AI
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-4 text-center transition-all border-b-2 text-xs whitespace-nowrap ${
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
                {activeTab === 'log' && <TastingLog bean={bean} activeRecipe={recipe} onLoadRecipe={onLoadRecipe} />}
                {activeTab === 'settings' && <SettingsPanel />}
                {activeTab === 'help' && <HelpPanel />}
                {activeTab === 'recipes' && (
                    <div className="h-full flex flex-col p-6 font-mono overflow-y-auto">
                        <div className="flex justify-between items-end mb-8 border-b border-gray-900 pb-2">
                            <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500">
                                Recipes
                            </h2>
                            <button
                                onClick={onAddGlobalRecipe}
                                className="text-[10px] uppercase tracking-widest border border-gray-800 hover:border-white text-gray-400 hover:text-white px-3 py-1 transition-all"
                            >
                                + Add Recipe
                            </button>
                        </div>

                        {sortedGlobalRecipes.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-[10px] uppercase tracking-widest text-gray-600 mb-4">Global Library</h3>
                                <div className="space-y-4">
                                    {sortedGlobalRecipes.map((r, idx) => <RecipeCard key={`global-${r.id || idx}`} r={r} isGlobal />)}
                                </div>
                            </div>
                        )}

                        {bean && (
                            <div className="mb-8">
                                <h3 className="text-[10px] uppercase tracking-widest text-gray-600 mb-4">Saved for {bean.name}</h3>
                                {sortedBeanRecipes.length > 0 ? (
                                    <div className="space-y-4">
                                        {sortedBeanRecipes.map((r, idx) => <RecipeCard key={`bean-${r.id || idx}`} r={r} />)}
                                    </div>
                                ) : (
                                    <div className="text-[10px] text-gray-700 italic">No recipes saved specifically for this bean.</div>
                                )}
                            </div>
                        )}

                        {sortedGlobalRecipes.length === 0 && (!bean || sortedBeanRecipes.length === 0) && (
                            <div className="text-xs text-gray-600 uppercase tracking-widest text-center mt-20">
                                NO SAVED RECIPES
                                <br />
                                <span className="text-[10px] opacity-30">Click + Add Recipe above</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
