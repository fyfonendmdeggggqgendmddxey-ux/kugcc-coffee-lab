import unifiedData from './unified_grinders.json';

export type GrinderType = 'hand' | 'electric';

export interface GrinderInfo {
    id: string;
    name: string;
    type: GrinderType;
    // For linear mills (mostly hand mills)
    micronsPerClick?: number;
    // Base clicks to calculate from (for hand mills, setting * micronsPerClick = absolute microns)
    // For table-based mills
    data?: Array<{ label: string; microns: number }>;
    // Default fines profile
    finesRatio: { medium: number; coarse: number };
}

export const GRINDERS: Record<string, GrinderInfo> = {
    // Hand Mills (from existing system)
    "C40_MK4": { id: "C40_MK4", name: "Comandante C40 MK4", type: "hand", micronsPerClick: 30, finesRatio: { medium: 25, coarse: 18 } },
    "C40_MK4_REDCLIX": { id: "C40_MK4_REDCLIX", name: "Comandante C40 MK4 (Red Clix)", type: "hand", micronsPerClick: 15, finesRatio: { medium: 25, coarse: 18 } },
    "K_ULTRA": { id: "K_ULTRA", name: "1Zpresso K-Ultra", type: "hand", micronsPerClick: 22, finesRatio: { medium: 24, coarse: 20 } },
    "K6": { id: "K6", name: "KINGrinder K6", type: "hand", micronsPerClick: 16, finesRatio: { medium: 22, coarse: 22 } },
    "TIMEMORE_C2": { id: "TIMEMORE_C2", name: "Timemore C2", type: "hand", micronsPerClick: 29, finesRatio: { medium: 26, coarse: 25 } }, 
    "TIMEMORE_C3": { id: "TIMEMORE_C3", name: "Timemore C3", type: "hand", micronsPerClick: 29, finesRatio: { medium: 26, coarse: 25 } }, 
    "X_LITE": { id: "X_LITE", name: "Timemore Xlite", type: "hand", micronsPerClick: 15, finesRatio: { medium: 25, coarse: 18 } }, 
    "S3": { id: "S3", name: "Timemore S3", type: "hand", micronsPerClick: 15, finesRatio: { medium: 27, coarse: 24 } },
    "EPEIOS_GO": { id: "EPEIOS_GO", name: "Epeios Go", type: "hand", micronsPerClick: 20, finesRatio: { medium: 28, coarse: 26 } },

    // Electric Mills / Added from Excel
    "LAGOM_CASA": { id: "LAGOM_CASA", name: "Option-O Lagom casa", type: "electric", data: unifiedData["Lagom casa"].table, finesRatio: { medium: 20, coarse: 15 } },
    "EK43": { id: "EK43", name: "Mahlkönig EK43", type: "electric", data: unifiedData["Mahlkönig EK43"].table, finesRatio: { medium: 18, coarse: 12 } },
    "XBLOOM": { id: "XBLOOM", name: "XBLOOM Studio FW-02C", type: "electric", data: unifiedData["XBLOOM FW-02C"].table, finesRatio: { medium: 22, coarse: 18 } },
    "LAGOM_P64": { id: "LAGOM_P64", name: "Option-O Lagom P64", type: "electric", data: unifiedData["Lagom P64"].table, finesRatio: { medium: 19, coarse: 14 } },
    "ODE_GEN2": { id: "ODE_GEN2", name: "Fellow Ode Gen 2", type: "electric", data: unifiedData["Fellow Ode Gen 2"].table, finesRatio: { medium: 24, coarse: 20 } },
    "MINI_MILL": { id: "MINI_MILL", name: "Hario Mini Mill Slim", type: "hand", data: unifiedData["Hario Mini Mill Slim"].table, finesRatio: { medium: 35, coarse: 30 } }
};

export const GRINDER_LIST = Object.values(GRINDERS);

function parseNumber(str: string): number | null {
    // Extract first valid float/int from string
    const match = str.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
}

export function parseSettingToMicrons(modelId: string, settingStr: string): number | null {
    if (!settingStr) return null;
    const grinder = GRINDERS[modelId];
    if (!grinder) return null;

    if (grinder.micronsPerClick) {
        const val = parseNumber(settingStr);
        if (val === null) return null;
        return val * grinder.micronsPerClick;
    }

    if (grinder.data && grinder.data.length > 0) {
        // Try to find exact match in label first
        const exact = grinder.data.find(d => d.label === settingStr);
        if (exact) return exact.microns;

        // If it's a number-like string (e.g. "1.2"), parse it
        const val = parseNumber(settingStr);
        if (val === null) return null;

        // Try to match the numerical part with the numerical part of the label
        // This is a naive heuristic but works for most basic entries
        for (const entry of grinder.data) {
            const entryVal = parseNumber(entry.label);
            if (entryVal !== null && Math.abs(entryVal - val) < 0.01) {
                return entry.microns;
            }
        }

        // Interpolate if it's numerical and falls between values
        // For simplicity, we just find the closest numerical label
        let closest = grinder.data[0];
        let minDiff = Infinity;
        for (const entry of grinder.data) {
            const entryVal = parseNumber(entry.label);
            if (entryVal !== null) {
                const diff = Math.abs(entryVal - val);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = entry;
                }
            }
        }
        return closest.microns;
    }

    return null;
}

export function convertMicronsToSettingStr(modelId: string, microns: number): string | null {
    if (microns <= 0) return null;
    const grinder = GRINDERS[modelId];
    if (!grinder) return null;

    if (grinder.micronsPerClick) {
        const clicks = Math.round(microns / grinder.micronsPerClick);
        return String(clicks);
    }

    if (grinder.data && grinder.data.length > 0) {
        let closest = grinder.data[0];
        let minDiff = Infinity;
        for (const entry of grinder.data) {
            const diff = Math.abs(entry.microns - microns);
            if (diff < minDiff) {
                minDiff = diff;
                closest = entry;
            }
        }
        return closest.label;
    }

    return null;
}
