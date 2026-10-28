import type { BrewMeasurements, Recipe } from './types';

export const SIMULATION_VERSION = 'mass-balance-assumptions-v1';
export const DEFAULT_ASSUMPTIONS = { extractionYieldPercent: 19, retainedWaterGPerDoseG: 2 };
export type SimulationAssumptions = typeof DEFAULT_ASSUMPTIONS;

// Empty is unknown, never zero. Bounds reject impossible values rather than clamping.
export function optionalNumber(raw: string): number | undefined {
    if (!raw.trim()) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
}

export function recipeContactWater(recipe: Recipe): number | null {
    if (!Number.isFinite(recipe.beanWeight) || recipe.beanWeight <= 0 ||
        !Number.isFinite(recipe.ratio) || recipe.ratio <= 0 || !recipe.steps?.length ||
        recipe.steps.some(s => !Number.isFinite(s.waterPercentage) || s.waterPercentage < 0)) return null;
    const water = recipe.beanWeight * recipe.ratio * recipe.steps.reduce((sum, s) => sum + s.waterPercentage, 0) / 100;
    return Number.isFinite(water) && water > 0 ? water : null;
}

export function simulateBrew(recipe: Recipe, assumptions: SimulationAssumptions) {
    const water = recipeContactWater(recipe);
    const { extractionYieldPercent: ey, retainedWaterGPerDoseG: retained } = assumptions;
    if (water === null || !Number.isFinite(ey) || ey <= 0 || ey > 100 ||
        !Number.isFinite(retained) || retained < 0) return null;
    const beverageMassG = water - retained * recipe.beanWeight;
    const dissolvedMassG = recipe.beanWeight * ey / 100;
    if (beverageMassG <= 0 || dissolvedMassG > beverageMassG) return null;
    return {
        status: 'assumption-simulation' as const,
        version: SIMULATION_VERSION,
        tdsPercent: ey * recipe.beanWeight / beverageMassG,
        beverageMassG,
        assumedExtractionYieldPercent: ey,
    };
}

export function measuredExtractionYield(tds: number | undefined, mass: number | undefined, dose: number | undefined): number | undefined {
    if (tds === undefined || mass === undefined || dose === undefined ||
        ![tds, mass, dose].every(Number.isFinite) || tds <= 0 || tds > 100 || mass <= 0 || dose <= 0) return undefined;
    const ey = tds * mass / dose;
    return ey > 0 && ey <= 100 ? ey : undefined;
}

export function parseMeasurements(fields: { tds: string; mass: string; time: string; method: string }, dose?: number):
    { value?: BrewMeasurements; error?: string } {
    const tds = optionalNumber(fields.tds), mass = optionalNumber(fields.mass), time = optionalNumber(fields.time);
    if ((fields.tds.trim() && (tds === undefined || tds <= 0 || tds > 100)) ||
        (fields.mass.trim() && (mass === undefined || mass <= 0)) ||
        (fields.time.trim() && (time === undefined || time <= 0))) return { error: '実測値は正の数で入力してください。TDSの単位は%です。' };
    const ey = measuredExtractionYield(tds, mass, dose);
    if (tds !== undefined && mass !== undefined && dose && ey === undefined) return { error: '抽出率が100%を超えています。粉量・TDS・実液量の単位を確認してください。' };
    if (tds === undefined && mass === undefined && time === undefined && !fields.method.trim()) return {};
    return { value: { tdsPercent: tds, beverageMassG: mass, actualTotalTimeSec: time, extractionYieldPercent: ey, method: fields.method.trim() || undefined } };
}
