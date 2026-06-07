"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BeanLibrary from '@/components/features/BeanLibrary';
import Timer from '@/components/features/Timer';
import RightPanel from '@/components/features/RightPanel';
import RecipeEditor from '@/components/features/RecipeEditor';
import { Bean, Recipe, DEFAULT_RECIPE } from '@/utils/types';

export default function Home() {
    const [activeTab, setActiveTab] = useState<'library' | 'timer' | 'recipes'>('timer');
    const [selectedBeanId, setSelectedBeanId] = useState<string | null>(null);
    const [beans, setBeans] = useState<Bean[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [customRecipe, setCustomRecipe] = useState<Recipe | null>(null);
    const [globalRecipes, setGlobalRecipes] = useState<Recipe[]>([]);

    // Sync with localStorage
    useEffect(() => {
        const saved = localStorage.getItem('kugcc_beans');
        if (saved) {
            setBeans(JSON.parse(saved));
        }
        const savedGlobal = localStorage.getItem('kugcc_recipes');
        if (savedGlobal) {
            setGlobalRecipes(JSON.parse(savedGlobal));
        }
    }, []);

    const selectedBean = beans.find(b => b.id === selectedBeanId);

    // Determine active recipe: Bean Override -> Custom Session Recipe -> Default
    const activeRecipe = selectedBean?.recipeOverride || customRecipe || DEFAULT_RECIPE;

    const handleRecipeSave = (newRecipe: Recipe, scope: 'default' | 'bean' | 'global') => {
        const recipeToSave = { ...newRecipe, id: newRecipe.id || Date.now().toString() };

        if (scope === 'bean' && selectedBeanId) {
            const updatedBeans = beans.map(b => {
                if (b.id === selectedBeanId) {
                    let updatedRecipes = b.recipes || [];

                    const existingIndex = updatedRecipes.findIndex(r => r.id && r.id === recipeToSave.id);
                    if (existingIndex >= 0) {
                        updatedRecipes = [
                            ...updatedRecipes.slice(0, existingIndex),
                            recipeToSave,
                            ...updatedRecipes.slice(existingIndex + 1)
                        ];
                    } else {
                        updatedRecipes = [...updatedRecipes, recipeToSave];
                    }

                    return {
                        ...b,
                        recipeOverride: recipeToSave,
                        recipes: updatedRecipes
                    };
                }
                return b;
            });
            setBeans(updatedBeans);
            localStorage.setItem('kugcc_beans', JSON.stringify(updatedBeans));
            // Also set custom recipe to null so we use the override
            setCustomRecipe(null);
        } else if (scope === 'global') {
            let updatedGlobal = [...globalRecipes];
            const existingIndex = updatedGlobal.findIndex(r => r.id && r.id === recipeToSave.id);
            if (existingIndex >= 0) {
                updatedGlobal[existingIndex] = recipeToSave;
            } else {
                updatedGlobal.push(recipeToSave);
            }
            setGlobalRecipes(updatedGlobal);
            localStorage.setItem('kugcc_recipes', JSON.stringify(updatedGlobal));
            
            setCustomRecipe(recipeToSave);
        } else {
            // "Save Default" behavior -> Just sets session custom recipe for now
            setCustomRecipe(recipeToSave);
        }
        setIsEditing(false);
    };

    const handleLoadRecipe = (recipe: Recipe) => {
        if (selectedBeanId) {
            // Set as active override for this bean
            const updatedBeans = beans.map(b => b.id === selectedBeanId ? { ...b, recipeOverride: recipe } : b);
            setBeans(updatedBeans);
            localStorage.setItem('kugcc_beans', JSON.stringify(updatedBeans));
        } else {
            setCustomRecipe(recipe);
        }
        setActiveTab('timer'); // Switch to timer to view/use the loaded recipe
    };

    const handleToggleRecipeStar = (recipe: Recipe) => {
        if (selectedBeanId) {
            const updatedBeans = beans.map(b => {
                if (b.id === selectedBeanId && b.recipes) {
                    // Toggle star for the matching recipe
                    const updatedRecipes = b.recipes.map(r => {
                        // Match by ID if present, otherwise by Name+GrindSize+Structure or simply reference if we are lucky (but we map, so ref lost usually)
                        // Since we are iterating the bean's own recipe list, we can rely on index matching? No, passed recipe might be from sorted list.
                        // Best effort match: ID > Name
                        if (r.id && r.id === recipe.id) return { ...r, isStarred: !r.isStarred };
                        if (!r.id && r.name && r.name === recipe.name) return { ...r, isStarred: !r.isStarred };
                        // Fallback for exactly matching object structure if needed, but Name should suffice for this scope
                        return r;
                    });
                    return { ...b, recipes: updatedRecipes };
                }
                return b;
            });
            setBeans(updatedBeans);
            localStorage.setItem('kugcc_beans', JSON.stringify(updatedBeans));
        }
    }

    const handleDeleteRecipe = (recipe: Recipe) => {
        console.log("[Delete Debug] Function Called", { recipeName: recipe.name, selectedBeanId });

        if (!selectedBeanId) {
            console.error("[Delete Debug] Aborting: No selectedBeanId");
            return;
        }

        // Move confirm after logging to ensure we track the attempt
        if (!confirm("Are you sure you want to delete this recipe?")) {
            return;
        }

        const updatedBeans = beans.map(b => {
            if (b.id === selectedBeanId && b.recipes) {
                const updatedRecipes = b.recipes.filter((r) => {
                    // Aggressive Matching Logic:
                    const isRefMatch = r === recipe;
                    const isIdMatch = !!(r.id && recipe.id && r.id === recipe.id);
                    const isNameMatch = !!(r.name && recipe.name && r.name === recipe.name);
                    // Legacy Fallback: Match if both are nameless/ID-less "ghosts"
                    const isGhostMatch = !r.id && !r.name && !recipe.id && !recipe.name;

                    if (isRefMatch || isIdMatch || isNameMatch || isGhostMatch) {
                        return false;
                    }
                    return true;
                });
                return { ...b, recipes: updatedRecipes };
            }
            return b;
        });
        setBeans(updatedBeans);
        localStorage.setItem('kugcc_beans', JSON.stringify(updatedBeans));
    };

    const handleAddGlobalRecipe = () => {
        setCustomRecipe({ ...DEFAULT_RECIPE, id: Date.now().toString(), name: 'New Global Recipe' });
        setIsEditing(true);
        setActiveTab('timer'); // Switch to center pane to show editor on mobile
    };

    const handleDeleteGlobalRecipe = (recipe: Recipe) => {
        if (!confirm("Are you sure you want to delete this global recipe?")) return;
        const updated = globalRecipes.filter(r => r.id !== recipe.id);
        setGlobalRecipes(updated);
        localStorage.setItem('kugcc_recipes', JSON.stringify(updated));
    };

    const handleToggleGlobalRecipeStar = (recipe: Recipe) => {
        const updated = globalRecipes.map(r => r.id === recipe.id ? { ...r, isStarred: !r.isStarred } : r);
        setGlobalRecipes(updated);
        localStorage.setItem('kugcc_recipes', JSON.stringify(updated));
    };

    return (
        <DashboardLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            left={
                <BeanLibrary
                    selectedId={selectedBeanId}
                    onSelect={(id) => setSelectedBeanId(id)}
                />
            }
            center={
                isEditing
                    ? <RecipeEditor
                        initialRecipe={activeRecipe}
                        onSave={handleRecipeSave}
                        onCancel={() => setIsEditing(false)}
                    />
                    : <Timer
                        recipe={activeRecipe}
                        beanName={selectedBean?.name}
                        beanRecipes={selectedBean?.recipes}
                        globalRecipes={globalRecipes}
                        onLoadRecipe={handleLoadRecipe}
                        onEdit={() => {
                            setIsEditing(true);
                            setActiveTab('timer');
                        }}
                        onSaveTestRecipe={(newRecipe) => {
                            setCustomRecipe(newRecipe);
                            setIsEditing(true);
                            setActiveTab('timer');
                        }}
                    />
            }
            right={
                <RightPanel 
                    bean={selectedBean} 
                    allBeans={beans}
                    recipe={activeRecipe} 
                    globalRecipes={globalRecipes}
                    onLoadRecipe={handleLoadRecipe} 
                    onToggleStar={handleToggleRecipeStar} 
                    onDeleteRecipe={handleDeleteRecipe}
                    onAddGlobalRecipe={handleAddGlobalRecipe}
                    onToggleGlobalStar={handleToggleGlobalRecipeStar}
                    onDeleteGlobalRecipe={handleDeleteGlobalRecipe}
                    onSwipeToTimer={() => setActiveTab('timer')}
                />
            }
        />
    );
}
