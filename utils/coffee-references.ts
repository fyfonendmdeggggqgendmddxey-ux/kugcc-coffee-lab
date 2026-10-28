import knowledge from '../data/coffee/references.json';
import type { Bean, Recipe, RecipeStep } from './types';

export type CoffeeReference = {
    id: string; collection: string; name: string; author: string; brewer: string;
    doseG: number; waterValue: number; waterUnit: string;
    temperatureC: number | null; temperatureRangeC: number[] | null; temperatureLabel: string;
    grindLabel: string | null; bean: Record<string, unknown> | null;
    applicability: Record<string, unknown> | null; context: string; scope: string; paper: string | null;
    timeRangeS: number[] | null; timeSemantics: string | null;
    claims: { text: string; classification: string; scope: string; sourceUrl: string }[];
    sources: { title: string; url: string; verifiedOn: string }[];
    canSuggest: boolean; holdReason: string | null; notes: string[];
    bypassLabel: string | null;
    schedule: { startS: number | null; waterIncrement: number | null; waterUnit: string; action: string;
        trigger: string | null; pourDurationSec: number | null; flowGPerS: number | null }[];
};

export const KNOWLEDGE_VERSION = knowledge.version;
export const COFFEE_REFERENCES: readonly CoffeeReference[] = knowledge.references;
const norm = (value?: string | null) => (value || '').normalize('NFKC').toLowerCase().replace(/[^a-z0-9\u00c0-\u024f\u3040-\u30ff\u3400-\u9fff]/g, '');
const includesKnown = (value: string, expected: string) => Boolean(norm(value) && norm(expected) && norm(value).includes(norm(expected)));

// Fermentation, decaffeination and base process stay separate.
export function processTags(value?: string) {
    const s = (value || '').toLowerCase();
    const base = /washed|ウォッシュ|水洗/.test(s) ? 'washed' : /natural|ナチュラル/.test(s) ? 'natural' : /honey|ハニー/.test(s) ? 'honey' : null;
    return { base, fermented: /anaerobic|carbonic|ferment|アナエロ|嫌気|カーボニック|発酵/.test(s), decaf: /decaf|デカフェ|カフェインレス/.test(s) };
}

export function brewerFamily(value?: string): string | null {
    const s = norm(value);
    if (/switch|スイッチ|clever|クレバー/.test(s)) return /switch|スイッチ/.test(s) ? 'switch' : 'clever';
    if (/aeropress|エアロプレス/.test(s)) return 'aeropress';
    if (/origami|オリガミ/.test(s)) return 'origami';
    if (/april|エイプリル/.test(s)) return 'april';
    if (/orea|オレア/.test(s)) return 'orea';
    if (/gina/.test(s)) return 'gina';
    if (/v60/.test(s)) return 'v60';
    if (/kalita|カリタ/.test(s)) return 'kalita';
    return null;
}

export type ReferenceMatch = {
    reference: CoffeeReference;
    eligible: boolean;
    level: 'roaster' | 'lot' | 'general' | 'comparison';
    reasons: string[];
    differences: string[];
};

export function matchReference(bean: Bean, recipe: Recipe, ref: CoffeeReference): ReferenceMatch {
    const reasons: string[] = [], differences: string[] = [];
    const device = brewerFamily(recipe.dripper), sourceDevice = brewerFamily(ref.brewer);
    const sameDevice = device !== null && device === sourceDevice;
    if (sameDevice) reasons.push(`器具の系統: ${recipe.dripper}`);
    else differences.push(device ? `器具が異なる: ${ref.brewer}` : '使用器具が未設定');
    if (sameDevice && norm(recipe.dripper) !== norm(ref.brewer)) differences.push(`原器具: ${ref.brewer}（材質・サイズ・構成は要確認）`);
    const doseNear = Number.isFinite(recipe.beanWeight) && recipe.beanWeight > 0 && Math.abs(ref.doseG / recipe.beanWeight - 1) <= 0.25;
    if (doseNear) reasons.push('粉量が近い（±25%以内の検索条件）');
    else differences.push(`原粉量 ${ref.doseG}g。分量を自動比例換算しない`);
    const conditions = ref.applicability;
    const sourceRoaster = typeof conditions?.roaster === 'string' ? conditions.roaster :
        typeof ref.bean?.roaster === 'string' ? ref.bean.roaster : ref.author;
    const sameRoaster = Boolean(norm(bean.roaster) && norm(bean.roaster) === norm(sourceRoaster));
    if (sameRoaster) reasons.push(`ロースター: ${bean.roaster}`);
    else differences.push(`異なる、または未確認のロースター: ${sourceRoaster}`);
    const inputProcess = processTags(bean.process);
    const preferred = conditions?.processing_preferred;
    const sourceProcess = processTags(String(ref.bean?.processing_base_normalized || ref.bean?.processing || ref.bean?.processing_label || ''));
    let processOK = true;
    if (Array.isArray(preferred)) {
        processOK = (inputProcess.base !== null && preferred.includes(inputProcess.base)) ||
            (conditions?.other_fermented_processes_in_scope === true && inputProcess.fermented);
        if (processOK) reasons.push(`出典の精製条件: ${bean.process}`);
        else differences.push('出典の精製条件と不一致、または精製が不明');
    } else if (sourceProcess.base) {
        processOK = inputProcess.base === sourceProcess.base && inputProcess.fermented === sourceProcess.fermented;
        if (processOK) reasons.push(`精製の基礎分類: ${sourceProcess.base}`);
        else differences.push(`原精製: ${String(ref.bean?.processing || ref.bean?.processing_label)}`);
    } else differences.push('原資料は精製条件を特定していない');
    const roast = String(conditions?.roast_level || ref.bean?.roast_level || '');
    const lightRequired = /light|浅煎/i.test(roast);
    const roastOK = !lightRequired || /light|浅煎/i.test(bean.roastLevel);
    if (lightRequired && roastOK) reasons.push('出典の浅煎り条件');
    if (!roastOK) differences.push('浅煎り向け資料。現在の焙煎条件では候補にしない');
    if (!roast) differences.push('原資料の焙煎度は不明');
    const lot = typeof ref.bean?.lot === 'string' ? ref.bean.lot : '';
    const sameLot = Boolean(lot && includesKnown(bean.name, lot));
    if (sameLot) reasons.push(`ロット名: ${lot}`);
    else if (lot) differences.push(`使用豆の例: ${lot}。同一ロットは未確認`);
    if (ref.paper) differences.push(`指定ペーパー: ${ref.paper}（現在の設定では未確認）`);
    const template = ref.context === 'roaster_scoped_template';
    const scopedProfile = ref.collection === 'bean_condition' && !template;
    const scopeOK = template ? sameRoaster && processOK && roastOK && !conditions?.density_context_required :
        scopedProfile ? sameRoaster && sameLot && processOK && roastOK : !lot && processOK && roastOK;
    if (conditions?.density_context_required) differences.push('高密度という適用条件を確認できない');
    if (inputProcess.decaf) differences.push('この収録資料ではデカフェの適用条件を確認できない');
    if (!ref.canSuggest) differences.push(ref.holdReason || '精査で初回候補への使用を保留');
    if (ref.context.includes('competition')) differences.push('大会用の条件。日常用と区別して参照');
    return { reference: ref, eligible: ref.canSuggest && sameDevice && doseNear && scopeOK && !inputProcess.decaf && !ref.context.includes('competition'),
        level: scopeOK && sameLot ? 'lot' : scopeOK && sameRoaster ? 'roaster' : scopeOK ? 'general' : 'comparison', reasons, differences };
}

export function rankReferences(bean: Bean, recipe: Recipe): ReferenceMatch[] {
    const device = brewerFamily(recipe.dripper);
    // Device-unknown recipes never acquire an assumed V60 device.
    const matches = COFFEE_REFERENCES.filter(ref => device !== null && brewerFamily(ref.brewer) === device)
        .map(ref => matchReference(bean, recipe, ref));
    const order = { lot: 0, roaster: 1, general: 2, comparison: 3 };
    return matches.sort((a, b) => Number(b.eligible) - Number(a.eligible) || order[a.level] - order[b.level] ||
        Math.abs(a.reference.doseG - recipe.beanWeight) - Math.abs(b.reference.doseG - recipe.beanWeight) || a.reference.id.localeCompare(b.reference.id));
}

export function scopedGuidance(bean: Bean) {
    const tags = processTags(bean.process);
    return knowledge.guidance.filter(g => {
        const applies = g.applies_to as Record<string, unknown>;
        if (typeof applies.roaster !== 'string' || norm(applies.roaster) !== norm(bean.roaster)) return false;
        if (applies.roast_level === 'light' && !/light|浅煎/i.test(bean.roastLevel)) return false;
        const processing = applies.processing;
        return !Array.isArray(processing) || processing.some(p => processTags(String(p)).base === tags.base && tags.base !== null);
    }).map(g => ({ text: g.adjustment_ja, reason: g.reason_ja, source: g.source }));
}

// Explicitly reviewed adapters only. Source review never automatically enables a timer.
// Each tuple: pour start, incremental grams, stated pour duration (null = unknown).
const ADAPTERS: Record<string, { dose: number; water: number; temperature: [number, number]; end: number; pours: [number, number, number | null][]; note: string }> = {
    'kurasu-v60-12g': { dose: 12, water: 200, temperature: [92, 96], end: 120, pours: [[0, 25, null], [30, 85, null], [60, 90, null]], note: '最後の注湯後に軽く攪拌。区間時間は注湯と待機の合計。' },
    dak_default: { dose: 15, water: 250, temperature: [95, 95], end: 150, pours: [[0, 50, 6.25], [30, 50, 6.25], [60, 150, 30]], note: '原典の注湯流量8 / 8 / 5g/sから注湯時間を換算。総時間の掲載範囲150–180秒の下限で通知。落ち切りは観察。' },
    dak_natural_fermented: { dose: 16.5, water: 250, temperature: [92, 92], end: 120, pours: [[0, 50, 6.25], [30, 70, 8.75], [60, 70, 8.75], [90, 60, 12]], note: '原典の流量8 / 8 / 8 / 5g/sから注湯時間を換算。総時間120–150秒の下限で通知。落ち切りは観察。' },
    '20grams_washed': { dose: 12.5, water: 200, temperature: [92, 95], end: 150, pours: [[0, 50, 10], [30, 150, 10]], note: 'April plastic + Kalita paper。初回は円、2投目は円50g→中心100g。総時間150–160秒の下限で通知。' },
    '20grams_natural': { dose: 12.5, water: 200, temperature: [90, 93], end: 150, pours: [[0, 50, 10], [30, 50, 10], [60, 50, 10], [90, 50, 10]], note: 'April plastic + Kalita paper。初回は円、2・3投目は低攪拌の円、4投目は低攪拌で中心。総時間150–160秒の下限で通知。' },
};

export function hasTimerAdapter(id: string) { return Object.hasOwn(ADAPTERS, id); }

export function buildReferenceRecipe(bean: Bean, current: Recipe, ref: CoffeeReference): Recipe | null {
    const adapter = ADAPTERS[ref.id];
    if (!adapter || !matchReference(bean, current, ref).eligible) return null;
    const temperature = current.temperature >= adapter.temperature[0] && current.temperature <= adapter.temperature[1] ? current.temperature : adapter.temperature[0];
    const adaptations = [`原粉量${adapter.dose}g・投入水${adapter.water}gを使用。比例換算なし。`,
        `湯温${temperature}°Cを採用（掲載範囲${adapter.temperature.join('–')}°C）。`,
        'ミル・挽き目は現在の設定を維持。原典の挽き目とは未校正。', adapter.note];
    const steps: RecipeStep[] = [];
    adapter.pours.forEach(([start, grams, pourDuration], i) => {
        const next = adapter.pours[i + 1]?.[0] ?? adapter.end;
        const interval = next - start;
        if (pourDuration !== null) {
            const pattern = ref.id === '20grams_washed' ? (i === 0 ? '円状に注ぐ' : '円50g→中心100g') :
                ref.id === '20grams_natural' ? (i === 0 ? '円状に注ぐ' : i === 3 ? '低攪拌で中心に注ぐ' : '低攪拌で円状に注ぐ') : `${Number((grams / pourDuration).toFixed(2))}g/s`;
            steps.push({ id: `${ref.id}-${i}-pour`, name: `${i + 1}投目`, duration: pourDuration,
                waterPercentage: grams / adapter.water * 100, kind: 'pour', pouringDurationSec: pourDuration,
                state: `${grams}g / ${pourDuration}秒 / ${pattern}` });
            if (interval > pourDuration) steps.push({ id: `${ref.id}-${i}-wait`, name: '待機・落ち切りを観察', duration: interval - pourDuration, waterPercentage: 0, kind: 'wait' });
        } else steps.push({ id: `${ref.id}-${i}`, name: `${i + 1}投目 + 待機`, duration: interval,
            waterPercentage: grams / adapter.water * 100, kind: 'pour', state: `${grams}g注湯。${i === adapter.pours.length - 1 ? '注湯後に軽く攪拌し、落ち切りを観察。' : '次の開始まで待機。'}` });
    });
    return { name: `${ref.author} / ${ref.name}（自分用）`, beanWeight: adapter.dose, ratio: adapter.water / adapter.dose,
        temperature, dripper: current.dripper, grinderModel: current.grinderModel, grindSize: current.grindSize, steps,
        notes: adaptations.join('\n'), reference: { id: ref.id, knowledgeVersion: KNOWLEDGE_VERSION, adapterVersion: 'timer-adapters-v1',
            sourceUrls: ref.sources.map(s => s.url), sourceAuthor: ref.author, adaptations } };
}
