"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Recipe, DEFAULT_RECIPE } from '@/utils/types';
import CircularTimer from './CircularTimer';
import { usePrecisionTimer } from '@/hooks/usePrecisionTimer';
import { getGrinderClicks } from '@/utils/grinder-table';
import { audioEngine } from '@/utils/audio';

interface TimerProps {
  recipe?: Recipe;
  beanName?: string;
  beanRecipes?: Recipe[];
  globalRecipes?: Recipe[];
  onLoadRecipe?: (recipe: Recipe) => void;
  onEdit?: () => void;
}

export default function Timer({ 
    recipe = DEFAULT_RECIPE, 
    beanName, 
    beanRecipes = [], 
    globalRecipes = [], 
    onLoadRecipe, 
    onEdit 
}: TimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const lastTickRef = useRef(-1);

  // Derived Values
  const totalWater = recipe.beanWeight * recipe.ratio;

  // Calculate cumulative time thresholds for each step
  const stepThresholds = useMemo(() => {
    let acc = 0;
    return recipe.steps.map(step => {
      acc += step.duration;
      return acc;
    });
  }, [recipe.steps]);

  // Precision Timer Hook
  const { elapsedTime, reset } = usePrecisionTimer(isRunning);
  const elapsedSeconds = elapsedTime / 1000;

  // Global state class for swipe prevention
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isRunning) document.body.classList.add('timer-running');
      else document.body.classList.remove('timer-running');
    }
    return () => {
      if (typeof document !== 'undefined') document.body.classList.remove('timer-running');
    };
  }, [isRunning]);

  // Auto-Advance Logic
  useEffect(() => {
    if (!isRunning || isFinished) return;

    const currentIntSec = Math.floor(elapsedSeconds);

    // Find current step based on elapsed time vs thresholds
    // If elapsedSeconds > totalDuration, we are finished
    if (elapsedSeconds >= stepThresholds[stepThresholds.length - 1]) {
      if (!isFinished) audioEngine?.playComplete();
      setIsFinished(true);
      setIsRunning(false);
      setCurrentStepIndex(recipe.steps.length - 1);
      return;
    }

    // Determine current step index
    const newIndex = stepThresholds.findIndex(threshold => elapsedSeconds < threshold);
    if (newIndex !== -1 && newIndex !== currentStepIndex) {
      setCurrentStepIndex(newIndex);
      audioEngine?.playStart();
    }

    // Play countdown ticks (3, 2, 1) before the next step
    if (currentIntSec !== lastTickRef.current && newIndex !== -1) {
        const threshold = stepThresholds[newIndex];
        const intDiff = Math.ceil(threshold) - currentIntSec;
        if (intDiff === 1 || intDiff === 2 || intDiff === 3) {
            audioEngine?.playTick();
        }
        lastTickRef.current = currentIntSec;
    }
  }, [elapsedSeconds, stepThresholds, isRunning, isFinished, currentStepIndex, recipe.steps.length]);


  // Current Context Calculation
  const currentStep = recipe.steps[currentStepIndex];

  // Progress within current step
  const previousThreshold = currentStepIndex > 0 ? stepThresholds[currentStepIndex - 1] : 0;
  const currentStepDuration = currentStep.duration;
  const timeInStep = Math.max(0, elapsedSeconds - previousThreshold);
  const stepProgress = Math.min(timeInStep / currentStepDuration, 1);
  // Ensure we consistently show 100% when finished or past this step in other contexts


  // Cumulative Target Volume Logic
  const cumulativeTargetVolume = useMemo(() => {
    return recipe.steps
      .slice(0, currentStepIndex + 1)
      .reduce((acc, step) => acc + (totalWater * (step.waterPercentage / 100)), 0);
  }, [recipe.steps, currentStepIndex, totalWater]);


  // Keyboard Interaction
  // Reset timer when recipe changes significantly (e.g. different bean)
  // We use a ref to track the last recipe ID to avoid resetting on minor re-renders if the object reference changes but it's the same recipe
  const lastRecipeId = useRef(recipe.steps.map(s => s.id).join(','));

  useEffect(() => {
    const currentRecipeId = recipe.steps.map(s => s.id).join(',');
    if (currentRecipeId !== lastRecipeId.current) {
      setIsRunning(false);
      setIsFinished(false);
      setCurrentStepIndex(0);
      reset();
      lastRecipeId.current = currentRecipeId;
    }
  }, [recipe, reset]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (isFinished) return;
      setIsRunning(prev => !prev);
    }
    if (e.code === 'Escape' || e.key === 'Escape') {
      setIsRunning(false);
      setIsFinished(false);
      reset();
      setCurrentStepIndex(0);
    }
  }, [isFinished, reset]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col items-center justify-center w-full relative h-full px-4 py-6 md:py-12 select-none">
      {/* Top Header Row (Bean/Equipment & Actions) */}
      <div className="absolute top-6 left-0 w-full px-4 md:px-10 md:top-10 z-20 flex justify-between items-start pointer-events-none">
        
        {/* Left Info */}
        <div className="flex flex-col gap-4 pointer-events-auto max-w-[50%] md:max-w-[60%]">
          {beanName && (
            <div>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1">Brewing</span>
              <span className="text-sm md:text-base text-white font-bold tracking-wider leading-tight line-clamp-2">{beanName}</span>
            </div>
          )}
          <div className="opacity-60">
            <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Equipment</div>
            <div className="text-[10px] md:text-xs text-white border-l-2 border-white pl-2 flex flex-col gap-0.5 md:gap-1">
              <span className="line-clamp-1">{recipe.dripper || "Unknown Dripper"}</span>
              <span className="text-gray-400 text-[9px] md:text-[10px] line-clamp-1">{recipe.grinderModel || "Generic"} • {recipe.grindSize}</span>
              {recipe.accessories && recipe.accessories.length > 0 && (
                <span className="text-gray-400 text-[9px] md:text-[10px] mt-0.5 line-clamp-1">
                  + {recipe.accessories.join(', ')}
                </span>
              )}
            </div>
          </div>
          {recipe.notes && (
            <div className="opacity-60">
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Notes</div>
              <div className="text-[10px] md:text-xs text-gray-400 border-l-2 border-gray-600 pl-2 line-clamp-3 italic leading-relaxed whitespace-pre-wrap">
                {recipe.notes}
              </div>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto shrink-0">
          <button
            onClick={onEdit}
            className="text-[10px] uppercase tracking-widest text-gray-600 hover:text-white border border-transparent hover:border-gray-800 px-2 py-1 transition-all"
          >
            [Edit Recipe]
          </button>
          
          {/* Load Recipe Dropdown */}
          <div className="relative">
              <select
                  onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const allRecipes = [...beanRecipes, ...globalRecipes];
                      const selected = allRecipes.find(r => r.id === selectedId);
                      if (selected && onLoadRecipe) {
                          if (confirm(`Load recipe "${selected.name || 'Unnamed'}"?`)) {
                              onLoadRecipe(selected);
                          }
                      }
                      e.target.value = ''; // reset selection visually
                  }}
                  className="text-[9px] uppercase tracking-widest bg-black text-gray-500 border border-gray-800 px-2 py-1.5 outline-none focus:border-white transition-all appearance-none cursor-pointer hover:text-gray-300 max-w-[120px] md:max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap"
                  value=""
              >
                  <option value="" disabled>LOAD RECIPE ▾</option>
                  {beanRecipes.length > 0 && (
                      <optgroup label="Bean Recipes">
                          {beanRecipes.map(r => <option key={`b-${r.id}`} value={r.id}>{r.name || 'Unnamed'}</option>)}
                      </optgroup>
                  )}
                  {globalRecipes.length > 0 && (
                      <optgroup label="Global Recipes">
                          {globalRecipes.map(r => (
                              <option key={`g-${r.id}`} value={r.id}>
                                  {r.isShopRecipe ? '★ ' : ''}{r.name || 'Unnamed'}
                              </option>
                          ))}
                      </optgroup>
                  )}
              </select>
          </div>
        </div>
      </div>

      {/* Circular UI (Clickable Button) */}
      <button
        onClick={() => {
          if (!isFinished) setIsRunning(prev => !prev);
        }}
        className="relative z-10 mb-6 mt-16 md:mt-0 md:mb-10 scale-95 md:scale-110 focus:outline-none transition-transform active:scale-[0.93] duration-150 cursor-pointer"
        aria-label={isRunning ? "Pause Timer" : "Start Timer"}
      >
        <CircularTimer
          totalSeconds={elapsedSeconds}
          stepProgress={isFinished ? 1 : stepProgress}
          currentStepName={currentStep.name}
          currentStepVolume={cumulativeTargetVolume}
          stepAddedVolume={totalWater * (currentStep.waterPercentage / 100)}
          stepIndex={currentStepIndex}
          isFinished={isFinished}
          grinderSetting={recipe.grinderModel ? `(${recipe.grinderModel}: ${recipe.grindSize})` : undefined}
        />
      </button>



      {/* Steps Visualization (Mini Timeline) */}
      <div className="flex gap-1 w-full max-w-[400px] h-1 bg-gray-900 rounded-full overflow-hidden mb-6 md:mb-8">
        {recipe.steps.map((step, idx) => {
          const isPast = idx < currentStepIndex;
          const isFuture = idx > currentStepIndex;
          const isActive = idx === currentStepIndex;

          let width = '0%';
          if (isPast || isFinished) width = '100%';
          let stepPct = 0;
          if (isPast || isFinished) {
            width = '100%';
            stepPct = 100;
          }
          else if (isFuture) {
            width = '0%';
            stepPct = 0;
          }
          else if (isActive) {
            width = `${stepProgress * 100}%`;
            stepPct = stepProgress * 100;
          }

          return (
            <div key={step.id} className="h-full flex-1 bg-gray-800 relative">
              <div 
                className={`absolute left-0 top-0 h-full transition-all duration-300 ${isActive ? 'bg-gray-300' : 'bg-gray-700'}`}
                style={{ width: `${Math.min(100, Math.max(0, stepPct))}%` }}
              />
            </div>
          )
        })}
      </div>

      {/* Bottom Panel */}
      <div className="flex gap-12 text-sm uppercase tracking-widest text-gray-500 border-t border-gray-900 pt-4 md:pt-6">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-600 mb-1">Ratio</span>
          <span className="font-mono text-white">1:{recipe.ratio}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-600 mb-1">Total Water</span>
          <span className="font-mono text-white">{totalWater}ml</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-600 mb-1">Temp</span>
          <span className="font-mono text-white">{recipe.temperature}°C</span>
        </div>
      </div>

      {/* iPad / Touch Controls */}
      <div className="flex gap-6 mt-6 md:mt-10 items-center z-30">
        <button
          onClick={() => {
            setIsRunning(false);
            setIsFinished(false);
            reset();
            setCurrentStepIndex(0);
          }}
          className="h-14 px-8 text-xs uppercase tracking-widest text-gray-500 border border-gray-800 hover:border-red-500 hover:text-red-500 transition-all active:scale-95"
          aria-label="Reset Timer"
        >
          Reset
        </button>

        <button
          onClick={() => {
            if (!isFinished) {
                if (!isRunning) audioEngine?.playStart();
                setIsRunning(prev => !prev);
            }
          }}
          className={`h-16 px-10 text-sm uppercase tracking-widest font-bold border transition-all active:scale-95 ${isRunning
            ? "border-white text-white hover:bg-white/10"
            : "bg-white text-black border-white hover:bg-gray-200"
            }`}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
      </div>

      <div className="mt-4 md:mt-6 text-[9px] text-gray-800 uppercase tracking-widest opacity-50">
        Space / Enter: Toggle • Esc: Reset
      </div>

    </div>
  );
}
