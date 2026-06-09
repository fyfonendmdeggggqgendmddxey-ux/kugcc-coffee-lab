import unifiedData from './unified_grinders.json';
import handMillsData from './hand_grinders.json';

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
    // Multiplier for settings that use dial numbers instead of raw clicks
    settingMultiplier?: number;
}

export const GRINDERS: Record<string, GrinderInfo> = {
    // Hand Mills
    "C40_MK4": { id: "C40_MK4", name: "Comandante C40 MK4", type: "hand", data: handMillsData["Comandante C40 MK4"]?.table, finesRatio: { medium: 25, coarse: 18 } },
    "C40_MK4_REDCLIX": { id: "C40_MK4_REDCLIX", name: "Comandante C40 MK4 (Red Clix)", type: "hand", data: handMillsData["Comandante C40 MK4 (Red Clix)"]?.table, finesRatio: { medium: 25, coarse: 18 } },
    "K_ULTRA": { id: "K_ULTRA", name: "1Zpresso K-Ultra", type: "hand", data: handMillsData["1Zpresso K-Ultra"]?.table, finesRatio: { medium: 24, coarse: 20 } },
    "K6": { id: "K6", name: "KINGrinder K6", type: "hand", data: handMillsData["KINGrinder K6"]?.table, finesRatio: { medium: 22, coarse: 22 } },
    "TIMEMORE_C2": { id: "TIMEMORE_C2", name: "Timemore C2", type: "hand", data: handMillsData["Timemore C2"]?.table, finesRatio: { medium: 26, coarse: 25 } }, 
    "TIMEMORE_C3": { id: "TIMEMORE_C3", name: "Timemore C3", type: "hand", data: handMillsData["Timemore C3"]?.table, finesRatio: { medium: 26, coarse: 25 } }, 
    "X_LITE": { id: "X_LITE", name: "Timemore Xlite", type: "hand", data: handMillsData["Timemore Chestnut X"]?.table, finesRatio: { medium: 25, coarse: 18 } }, 
    "S3": { id: "S3", name: "Timemore S3", type: "hand", data: handMillsData["Timemore S3"]?.table, finesRatio: { medium: 27, coarse: 24 } },
    "EPEIOS_GO": { id: "EPEIOS_GO", name: "Epeios Go", type: "hand", data: handMillsData["Epeios Essense Go"]?.table, finesRatio: { medium: 28, coarse: 26 } },

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
        let val = parseNumber(settingStr);
        if (val === null) return null;
        if (grinder.settingMultiplier) val = val * grinder.settingMultiplier;
        return val * grinder.micronsPerClick;
    }

    if (grinder.data && grinder.data.length > 0) {
        // Try to find exact match in label first
        const exact = grinder.data.find(d => d.label === settingStr);
        if (exact) return exact.microns;

        // If it's a number-like string (e.g. "1.2"), parse it
        const val = parseNumber(settingStr);
        if (val === null) return null;

        const numericEntries = grinder.data
            .map(d => ({ val: parseNumber(d.label), microns: d.microns }))
            .filter(d => d.val !== null) as Array<{ val: number; microns: number }>;
            
        if (numericEntries.length === 0) return null;
        if (numericEntries.length === 1) return numericEntries[0].microns;
        
        numericEntries.sort((a, b) => a.val - b.val);
        
        if (val <= numericEntries[0].val) return numericEntries[0].microns;
        if (val >= numericEntries[numericEntries.length - 1].val) return numericEntries[numericEntries.length - 1].microns;
        
        for (let i = 0; i < numericEntries.length - 1; i++) {
            const p1 = numericEntries[i];
            const p2 = numericEntries[i + 1];
            if (val >= p1.val && val <= p2.val) {
                const ratio = (val - p1.val) / (p2.val - p1.val);
                return p1.microns + ratio * (p2.microns - p1.microns);
            }
        }
        return numericEntries[0].microns; // fallback
    }

    return null;
}

export function convertMicronsToSettingStr(modelId: string, microns: number): string | null {
    if (microns <= 0) return null;
    const grinder = GRINDERS[modelId];
    if (!grinder) return null;

    if (grinder.micronsPerClick) {
        let clicks = Math.round(microns / grinder.micronsPerClick);
        if (grinder.settingMultiplier) {
            return String(Number((clicks / grinder.settingMultiplier).toFixed(1)));
        }
        return String(clicks);
    }

    if (grinder.data && grinder.data.length > 0) {
        const numericEntries = grinder.data
            .map(d => ({ val: parseNumber(d.label), microns: d.microns }))
            .filter(d => d.val !== null) as Array<{ val: number; microns: number }>;
            
        if (numericEntries.length === 0) return null;
        if (numericEntries.length === 1) return String(numericEntries[0].val);
        
        numericEntries.sort((a, b) => a.microns - b.microns);
        
        if (microns <= numericEntries[0].microns) return String(numericEntries[0].val);
        if (microns >= numericEntries[numericEntries.length - 1].microns) return String(numericEntries[numericEntries.length - 1].val);
        
        for (let i = 0; i < numericEntries.length - 1; i++) {
            const p1 = numericEntries[i];
            const p2 = numericEntries[i + 1];
            if (microns >= p1.microns && microns <= p2.microns) {
                if (p2.microns === p1.microns) return String(p1.val);
                const ratio = (microns - p1.microns) / (p2.microns - p1.microns);
                const interpolatedVal = p1.val + ratio * (p2.val - p1.val);
                return String(Number(interpolatedVal.toFixed(1)));
            }
        }
        
        // Exact label match fallback
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
