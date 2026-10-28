"use client";

import { useEffect, useState } from 'react';
import type { Bean, Recipe } from '@/utils/types';
import { buildReferenceRecipe, COFFEE_REFERENCES, hasTimerAdapter, rankReferences, scopedGuidance } from '@/utils/coffee-references';
import { DEFAULT_ASSUMPTIONS, optionalNumber, recipeContactWater, simulateBrew } from '@/utils/brew-simulation';

const SETTING_KEY = 'kugcc_simulation_v1';
const SETTING_EVENT = 'kugcc_simulation_updated';
const inputClass = 'mt-1 w-full min-w-0 bg-black border border-gray-700 p-2 text-xs text-white focus:border-white focus:outline-none';

function useAssumptions() {
    const [fields, setFields] = useState({ ey: String(DEFAULT_ASSUMPTIONS.extractionYieldPercent), retention: String(DEFAULT_ASSUMPTIONS.retainedWaterGPerDoseG) });
    const [ready, setReady] = useState(false);
    const [storageError, setStorageError] = useState(false);
    useEffect(() => {
        const load = () => {
            try {
                const raw = localStorage.getItem(SETTING_KEY);
                if (raw) {
                    const saved = JSON.parse(raw);
                    if (saved.version === 1 && typeof saved.ey === 'string' && typeof saved.retention === 'string') setFields({ ey: saved.ey, retention: saved.retention });
                }
            } catch { setStorageError(true); }
            setReady(true);
        };
        load();
        window.addEventListener(SETTING_EVENT, load);
        window.addEventListener('storage', load);
        return () => { window.removeEventListener(SETTING_EVENT, load); window.removeEventListener('storage', load); };
    }, []);
    const update = (next: typeof fields) => {
        setFields(next);
        try {
            localStorage.setItem(SETTING_KEY, JSON.stringify({ version: 1, ...next }));
            window.dispatchEvent(new Event(SETTING_EVENT));
        } catch { setStorageError(true); }
    };
    return { fields, update, ready, storageError };
}

export default function BrewReferenceCoach({ bean, recipe, onLoadRecipe }: { bean: Bean; recipe: Recipe; onLoadRecipe?: (recipe: Recipe) => void }) {
    const { fields, update, ready, storageError } = useAssumptions();
    const matches = rankReferences(bean, recipe);
    const [selectedId, setSelectedId] = useState('');
    const match = matches.find(m => m.reference.id === selectedId) || matches[0];
    const ref = match?.reference;
    const candidate = ref ? buildReferenceRecipe(bean, recipe, ref) : null;
    const ey = optionalNumber(fields.ey), retention = optionalNumber(fields.retention);
    const simulation = ey !== undefined && retention !== undefined ? simulateBrew(recipe, { extractionYieldPercent: ey, retainedWaterGPerDoseG: retention }) : null;
    const water = recipeContactWater(recipe);
    const guidance = scopedGuidance(bean);

    return <div className="space-y-6 min-w-0" data-testid="brew-reference-coach">
        <section className="border border-gray-800 bg-gray-950/50 p-4 min-w-0">
            <h3 className="text-[10px] text-gray-400 uppercase tracking-widest mb-3">Starting Recipe / 最初の候補</h3>
            <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">{bean.process || '精製未設定'} / {bean.roastLevel || '焙煎未設定'} / {recipe.dripper || '器具未設定'}</p>
            {ref && match ? <>
                <label className="text-[10px] text-gray-400 block">参考レシピ
                    <select aria-label="参考レシピ" value={ref.id} onChange={e => setSelectedId(e.target.value)} className={inputClass}>
                        {matches.map(m => <option key={m.reference.id} value={m.reference.id}>{m.eligible ? '候補' : '比較用'} · {m.reference.author} / {m.reference.name}</option>)}
                    </select>
                </label>
                <p className="text-[10px] text-gray-400 mt-3">{match.eligible ? (match.level === 'roaster' ? '同じロースターの出発点' : match.level === 'lot' ? '同じロットの参考条件' : '同じ器具の一般的な出発点') : '原条件の比較用。現在の豆への初回候補にはしません。'}</p>
                <p className="text-sm text-white font-bold mt-3 break-words">{ref.author}</p>
                <p className="text-[11px] text-gray-300 mt-2">{ref.doseG}g / {ref.waterValue}{ref.waterUnit}投入 / {ref.temperatureLabel}</p>
                <p className="text-[10px] text-gray-400 mt-1">原挽き目: {ref.grindLabel || '記載なし'}</p>
                <div className="mt-4 border-l border-gray-600 pl-3 space-y-3">
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Source Intent / 出典が説明する狙い</p>
                    {ref.claims.length ? ref.claims.map((claim, i) => <div key={`${ref.id}-${i}`}>
                        <p className="text-[9px] text-gray-500">{claim.classification.startsWith('author_') ? '作者の説明' : claim.classification.startsWith('editorial_') ? '編集上の解釈' : '掲載元の説明'} / {claim.scope}</p>
                        <p className="text-xs text-gray-300 font-sans leading-relaxed mt-1">{claim.text}</p>
                        <a href={claim.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] underline text-gray-400 hover:text-white">この説明の出典 ↗</a>
                    </div>) : <p className="text-[11px] text-gray-400">狙いの明示なし。数値条件から味の意図は断定しません。</p>}
                </div>
                <details className="mt-4 border-t border-gray-800 pt-3 text-[11px] text-gray-400">
                    <summary className="cursor-pointer focus-visible:outline focus-visible:outline-white">選定理由・条件差・出典</summary>
                    <ul className="list-disc pl-4 mt-3 space-y-2">{match.reasons.map(t => <li key={t} className="text-gray-300">{t}</li>)}{match.differences.map(t => <li key={t}>{t}</li>)}</ul>
                    <p className="mt-3 leading-relaxed">{ref.scope}</p>
                    {ref.notes.map(t => <p className="mt-2 leading-relaxed" key={t}>{t}</p>)}
                    <div className="mt-3 space-y-2">{ref.sources.map(s => <p key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-white break-words">{s.title} ↗</a><span className="block text-[9px] mt-1">資料確認: {s.verifiedOn}</span></p>)}</div>
                    <p className="mt-3 text-[10px]">水・ペーパー・器具の個体差は未検証。精製から微粉率や抽出率を固定で算出していません。</p>
                </details>
                <details className="mt-3 border-t border-gray-800 pt-3 text-[11px] text-gray-400">
                    <summary className="cursor-pointer focus-visible:outline focus-visible:outline-white">現在の設定と原条件を比較</summary>
                    <p className="text-[10px] my-3 leading-relaxed">公開された原条件での比較。豆・粉量を揃えた抽出結果の予測ではありません。</p>
                    <table className="w-full table-fixed text-[10px] break-words">
                        <thead><tr><th className="w-1/4 text-left font-normal">条件</th><th className="text-orange-400 font-normal">現在 A</th><th className="text-blue-400 font-normal">原典 B</th></tr></thead>
                        <tbody>{[
                            ['器具', recipe.dripper || '未設定', ref.brewer],
                            ['粉量', `${recipe.beanWeight}g`, `${ref.doseG}g`],
                            ['接触水', water === null ? '不明' : `${Math.round(water)}g`, `${ref.waterValue}${ref.waterUnit}`],
                            ['湯温', `${recipe.temperature}°C`, ref.temperatureLabel],
                            ['挽き目', `${recipe.grinderModel || ''} ${recipe.grindSize}`, ref.grindLabel || '不明'],
                            ['TDS / EY', '計画値のみ', '実測データなし'],
                        ].map(([label, a, b]) => <tr key={label} className="border-t border-gray-800"><th className="font-normal py-3 text-left">{label}</th><td className="p-1 text-center text-orange-300">{a}</td><td className="p-1 text-center text-blue-300">{b}</td></tr>)}</tbody>
                    </table>
                    {ref.bypassLabel && <p className="mt-3 leading-relaxed">後入れ水（接触水とは別）: {ref.bypassLabel}</p>}
                    {ref.timeRangeS && <p className="mt-3">原典の総時間: {ref.timeRangeS.join('–')}秒 / {ref.timeSemantics?.includes('recommended') || ref.timeSemantics?.includes('target') ? '目標・推奨値' : '掲載例。実測か目標かは断定しない'}</p>}
                    <ol className="mt-3 space-y-2 list-decimal pl-4">{ref.schedule.map((s, i) => <li key={i}>{s.startS === null ? (s.trigger || '開始時点は未指定') : `${s.startS}秒`}: {s.waterIncrement === null ? s.action : `+${s.waterIncrement}${s.waterUnit}`}{s.flowGPerS !== null ? ` / 原注湯流量${s.flowGPerS}g/s` : ''}{s.pourDurationSec !== null ? ` / 注湯${s.pourDurationSec}秒` : ''}</li>)}</ol>
                </details>
                {candidate ? <details className="mt-4 border-t border-gray-800 pt-3">
                    <summary className="text-[11px] text-white cursor-pointer focus-visible:outline focus-visible:outline-white">この候補を使う：変更内容を確認</summary>
                    <ul className="mt-3 text-[11px] text-gray-300 list-disc pl-4 space-y-2">{candidate.reference?.adaptations.map(t => <li key={t}>{t}</li>)}</ul>
                    <p className="text-[10px] text-gray-400 mt-3">現在のタイマーを自分用コピーに切り替えます。元の保存レシピは保持されます。</p>
                    <button type="button" disabled={!onLoadRecipe} onClick={() => onLoadRecipe?.({ ...candidate, id: crypto.randomUUID() })} className="w-full mt-3 border border-white bg-white text-black text-[11px] py-3 font-bold disabled:opacity-40">この設定で試す</button>
                </details> : <p className="text-[10px] text-gray-500 mt-4">{hasTimerAdapter(ref.id) ? '条件が合わないためタイマーへの適用は保留。' : 'この資料は手順変換が未確認のため、参照・比較のみ。'}</p>}
            </> : <p className="text-xs text-gray-400 leading-relaxed">{recipe.dripper ? 'この器具に対応する資料はまだありません。現在の設定で試算できます。' : 'レシピ設定で使用器具を選ぶと、その器具の参考候補を表示します。'}</p>}
            {guidance.length > 0 && <details className="border-t border-gray-800 mt-4 pt-3 text-[11px] text-gray-400"><summary className="cursor-pointer">このロースターの調整方針</summary>{guidance.map((g, i) => <p className="mt-3 leading-relaxed" key={i}>{g.text} {g.reason}<a href={g.source.url} target="_blank" rel="noopener noreferrer" className="underline ml-1">出典 ↗</a></p>)}<p className="mt-3">作者の経験則として参照。設定の自動補正には使いません。</p></details>}
            <p className="text-[9px] text-gray-500 mt-4">{COFFEE_REFERENCES.length}件の参照資料 / {matches.filter(m => m.eligible).length}件が現在の候補条件に該当。実験件数ではありません。</p>
        </section>

        <section className="border border-gray-800 p-4" data-testid="brew-simulation">
            <h3 className="text-[10px] text-gray-400 uppercase tracking-widest">Strength Scenario / 仮定による試算</h3>
            <p className="text-2xl text-white mt-3" aria-live="polite">{ready && simulation ? `約 ${simulation.tdsPercent.toFixed(2)}%` : '—'} <span className="text-[10px] text-gray-400">TDS</span></p>
            <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">EYを{fields.ey || '未設定'}%と仮定した場合の濃度。豆・粒度・湯温から学習した予測ではありません。</p>
            <details className="mt-4 border-t border-gray-800 pt-3">
                <summary className="cursor-pointer text-[11px] text-gray-300 focus-visible:outline focus-visible:outline-white">詳細設定：試算の仮定</summary>
                <div className="grid grid-cols-2 gap-3 mt-3">
                    <label className="text-[10px] text-gray-400">仮定のEY (%)<input aria-label="仮定のEY (%)" type="number" min="0.01" max="100" step="0.1" disabled={!ready} value={fields.ey} onChange={e => update({ ...fields, ey: e.target.value })} className={inputClass} /></label>
                    <label className="text-[10px] text-gray-400">保水量 (g/g)<input aria-label="保水量 (g/g)" type="number" min="0" step="0.1" disabled={!ready} value={fields.retention} onChange={e => update({ ...fields, retention: e.target.value })} className={inputClass} /></label>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">初期値19%・2g/gは計算例の仮定です。研究で校正した推奨値ではありません。投入水 − 粉量 × 保水量で液量を近似し、TDS = EY × 粉量 ÷ 液量で計算します。蒸発・器具残留・後入れ水は含みません。</p>
                <p className="text-[10px] text-gray-400 mt-2">仮定の液量: {simulation ? `${simulation.beverageMassG.toFixed(1)}g` : '—'} / 実測値とは別扱い</p>
                {ready && !simulation && <p className="text-[11px] text-amber-400 mt-2" role="status">正のEY・粉量・湯量と、湯量を超えない保水量を設定してください。</p>}
                {storageError && <p className="text-[10px] text-gray-400 mt-2">この環境では仮定の保存ができません。画面内の試算には反映します。</p>}
            </details>
        </section>
    </div>;
}
