import { Bean, Recipe } from '@/utils/types';
import { getAgingAdjustments, analyzeExtractionDynamics } from '@/utils/coffee-math';
import { GRINDER_TABLE } from '@/utils/grinder-table';

interface AICoachProps {
    bean?: Bean;
    recipe?: Recipe;
    onUpdateBean?: (bean: Bean) => void;
}

export default function AICoach({ bean, recipe, onUpdateBean }: AICoachProps) {
    const adjustments = bean ? getAgingAdjustments(bean) : null;
    const dynamics = bean && recipe ? analyzeExtractionDynamics(bean, recipe) : null;

    const handleToggleFreeze = () => {
        if (!bean || !onUpdateBean) return;
        const updatedBean = { ...bean };
        updatedBean.isFrozen = !updatedBean.isFrozen;
        if (updatedBean.isFrozen) {
            updatedBean.frozenDate = new Date().toISOString();
        } else {
            updatedBean.frozenDate = undefined;
        }
        onUpdateBean(updatedBean);
    };

    const handleToggleOpen = () => {
        if (!bean || !onUpdateBean) return;
        const updatedBean = { ...bean };
        if (updatedBean.openedDate) {
            updatedBean.openedDate = undefined;
        } else {
            updatedBean.openedDate = new Date().toISOString();
        }
        onUpdateBean(updatedBean);
    };

    const peakDay = adjustments ? (adjustments.filterPeak[0] + adjustments.filterPeak[1]) / 2 : 14;
    const currentDay = adjustments ? adjustments.effectiveDays : 0;
    
    const maxDays = 40;
    let gasPoints = "";
    let flavorPoints = "";
    
    if (adjustments) {
        for (let d = 0; d <= maxDays; d++) {
            const x = (d / maxDays) * 400;
            const gasY = 100 - (100 * Math.exp(-0.1 * d));
            gasPoints += `${x},${gasY} `;
            const f = 100 * (d / peakDay) * Math.exp(1 - (d / peakDay));
            const flavorY = 100 - f;
            flavorPoints += `${x},${flavorY} `;
        }
    }
    const currentX = Math.min((currentDay / maxDays) * 400, 400);

    return (
        <div className="h-full flex flex-col p-6 font-mono border-l border-gray-900 overflow-y-auto">
            <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-8 text-gray-500 border-b border-gray-900 pb-2">
                AI Insights
            </h2>

            {bean && adjustments ? (
                <div className="space-y-8">
                    {/* Advanced Aging Dashboard */}
                    <div className="border border-gray-800 bg-gray-950/50 p-4 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10">
                            <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                                <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="1" />
                            </svg>
                        </div>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Aging Matrix</p>
                                <p className="text-sm text-white font-bold truncate max-w-[150px]">{bean.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Phase</p>
                                <p className={`text-xs font-bold uppercase tracking-wider ${
                                    adjustments.currentPhase === 'Peak' ? 'text-emerald-400 animate-pulse' : 
                                    adjustments.currentPhase === 'Degas' ? 'text-amber-500' : 
                                    adjustments.currentPhase === 'Aged' ? 'text-gray-500' : 'text-sky-400'
                                }`}>
                                    {adjustments.currentPhase}
                                </p>
                            </div>
                        </div>

                        {/* Visual Intersection Graph */}
                        <div className="mb-6 relative w-full h-32 border-b border-l border-gray-800">
                            <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                                {/* Grid lines */}
                                <line x1="0" y1="25" x2="400" y2="25" stroke="#1f2937" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="0" y1="50" x2="400" y2="50" stroke="#1f2937" strokeWidth="1" strokeDasharray="2 2" />
                                <line x1="0" y1="75" x2="400" y2="75" stroke="#1f2937" strokeWidth="1" strokeDasharray="2 2" />
                                
                                {/* Peak Area Highlight */}
                                <rect 
                                    x={(adjustments.filterPeak[0] / maxDays) * 400} 
                                    y="0" 
                                    width={((adjustments.filterPeak[1] - adjustments.filterPeak[0]) / maxDays) * 400} 
                                    height="100" 
                                    fill="rgba(16, 185, 129, 0.1)" 
                                />

                                {/* Gas Curve */}
                                <polyline
                                    points={gasPoints}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    opacity="0.7"
                                />

                                {/* Flavor Curve */}
                                <polyline
                                    points={flavorPoints}
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth="2"
                                />

                                {/* Current Day Marker */}
                                <line 
                                    x1={currentX} 
                                    y1="0" 
                                    x2={currentX} 
                                    y2="100" 
                                    stroke="#fff" 
                                    strokeWidth="2" 
                                    strokeDasharray="4 4" 
                                />
                                <circle cx={currentX} cy={100 - (100 * Math.exp(-0.1 * currentDay))} r="4" fill="#3b82f6" />
                                <circle cx={currentX} cy={100 - (100 * (currentDay / peakDay) * Math.exp(1 - (currentDay / peakDay)))} r="4" fill="#f59e0b" />
                            </svg>
                            
                            <div className="flex justify-between text-[8px] text-gray-500 font-bold tracking-widest mt-2 uppercase">
                                <span className="text-blue-400">■ CO2 Gas</span>
                                <span className="text-white">Current: Day {adjustments.effectiveDays.toFixed(1)}</span>
                                <span className="text-amber-500">■ Flavor Peak</span>
                            </div>
                        </div>

                        {/* Effective Days & Peak Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6 border-t border-gray-900 pt-4">
                            <div>
                                <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Effective Age</p>
                                <p className="text-lg text-white font-mono">{adjustments.effectiveDays.toFixed(1)} <span className="text-[10px] text-gray-500">Days</span></p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">Filter Peak</p>
                                <p className="text-sm text-emerald-400 font-mono mt-1">{adjustments.filterPeak[0]} - {adjustments.filterPeak[1]} <span className="text-[10px] text-gray-500">Days</span></p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 border-t border-gray-900 pt-4">
                            <button 
                                onClick={handleToggleOpen}
                                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                    bean.openedDate 
                                        ? 'border-amber-900 bg-amber-950/20 text-amber-500 hover:bg-amber-900/40' 
                                        : 'border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                                }`}
                            >
                                {bean.openedDate ? '✂️ Bag Opened' : 'Open Bag'}
                            </button>
                            <button 
                                onClick={handleToggleFreeze}
                                className={`flex-1 py-2 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                    bean.isFrozen 
                                        ? 'border-blue-900 bg-blue-950/20 text-blue-400 hover:bg-blue-900/40' 
                                        : 'border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                                }`}
                            >
                                {bean.isFrozen ? '❄️ In Freezer' : 'Put in Freezer'}
                            </button>
                        </div>
                    </div>

                    <div className="border-l border-white pl-4 py-1 relative">
                        <div className="absolute -left-[1px] top-0 w-[1px] h-4 bg-white"></div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Coach Advice</p>
                        <div className="mt-4 p-3 border border-gray-900 bg-gray-900/20 text-xs text-gray-300 leading-relaxed font-sans">
                            {adjustments.advice}
                        </div>
                    </div>

                    {dynamics && (
                        <div className="border-l border-[#3b82f6] pl-4 py-1 relative">
                            <div className="absolute -left-[1px] top-0 w-[1px] h-4 bg-[#3b82f6]"></div>
                            <p className="text-[10px] text-[#3b82f6] uppercase tracking-widest mb-2">Extraction Dynamics (4D Model)</p>
                            <p className="text-[10px] text-gray-500 mt-1">
                                SCORE: {dynamics.score > 0 ? '+' : ''}{dynamics.score.toFixed(1)} 
                                {dynamics.score > 18 ? ' [OVER-EXTRACTED]' : dynamics.score < -18 ? ' [UNDER-EXTRACTED]' : ' [SWEET SPOT]'}
                            </p>
                            <div className="mt-3 p-3 border border-[#3b82f6]/30 bg-[#3b82f6]/5 text-xs text-gray-300 leading-relaxed font-sans">
                                <span className="text-[#3b82f6] block mb-1 uppercase tracking-wider text-[10px] font-mono">[BARISTA ADVICE]</span>
                                {dynamics.advice}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-xs text-gray-600 uppercase tracking-widest text-center mt-20 mb-20">
                    AWAITING BEAN SELECTION
                    <br />
                    <span className="text-[10px] opacity-30">...</span>
                </div>
            )}

            {/* Grinder Conversion Table */}
            {recipe && recipe.grinderModel && recipe.grindSize && (
                <div className="mt-8 border-t border-gray-900 pt-8 pb-8">
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase mb-4 text-gray-500">
                        Universal Grind
                    </h2>
                    <div className="text-[10px] text-gray-400 mb-4 bg-gray-900/30 p-2 rounded">
                        Current: <span className="text-white font-bold">{recipe.grinderModel}</span> @ <span className="text-white font-bold">{recipe.grindSize}</span>
                    </div>

                    <div className="bg-gray-900/10 p-4 border-l border-gray-800">
                        {(() => {
                            const currentClicks = Number(recipe.grindSize);
                            if (isNaN(currentClicks)) return <div className="text-gray-600 text-xs">Invalid Clicks</div>;

                            const currentModelData = GRINDER_TABLE.models[recipe.grinderModel as keyof typeof GRINDER_TABLE.models];
                            if (!currentModelData) return <div className="text-gray-600 text-xs">Unknown Model Data</div>;

                            // Find closest index
                            let closestIndex = -1;
                            let minDiff = Infinity;
                            currentModelData.forEach((val, idx) => {
                                if (val === null) return;
                                const diff = Math.abs(val - currentClicks);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closestIndex = idx;
                                }
                            });

                            if (closestIndex === -1) return <div className="text-gray-600 text-xs">Out of Range</div>;

                            return (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {Object.entries(GRINDER_TABLE.models).map(([model, clicks]) => {
                                        if (model === recipe.grinderModel) return null;
                                        const val = clicks[closestIndex];
                                        return (
                                            <div key={model} className="flex justify-between items-center border-b border-gray-900/30 pb-1">
                                                <span className="text-[9px] text-gray-500 uppercase tracking-wider truncate mr-2">{model.replace(/_/g, ' ')}</span>
                                                <span className="text-xs text-white font-mono">{val !== null ? val : '-'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
