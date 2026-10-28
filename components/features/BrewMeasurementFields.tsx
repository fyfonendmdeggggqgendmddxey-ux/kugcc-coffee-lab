import type { Recipe } from '@/utils/types';
import { parseMeasurements } from '@/utils/brew-simulation';

export const EMPTY_MEASUREMENTS = { tds: '', mass: '', time: '', method: '' };
export type MeasurementFields = typeof EMPTY_MEASUREMENTS;

export default function BrewMeasurementFields({ fields, onChange, recipe }: {
    fields: MeasurementFields; onChange: (fields: MeasurementFields) => void; recipe?: Recipe;
}) {
    const parsed = parseMeasurements(fields, recipe?.beanWeight);
    return <details className="mt-6 border border-gray-800 p-3" data-testid="brew-measurements">
        <summary className="text-[11px] text-gray-400 cursor-pointer focus-visible:outline focus-visible:outline-white">詳細設定：実測値（任意）</summary>
        <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">測定した項目だけ入力できます。機材がなければ空欄で保存できます。後入れ水がある場合は、混合後のTDSと全液量を対応させてください。</p>
        <div className="grid grid-cols-2 gap-3 mt-3">{([
            ['tds', '実測TDS (%)', '0.01'], ['mass', '実液量 (g)', '0.1'], ['time', '実抽出時間 (秒)', '1'],
        ] as const).map(([key, label, step]) => <label className="text-[10px] text-gray-400" key={key}>{label}<input type="number" aria-label={label} value={fields[key]} min="0.01" max={key === 'tds' ? 100 : undefined} step={step} onChange={e => onChange({ ...fields, [key]: e.target.value })} className="w-full min-w-0 mt-1 p-2 bg-black border border-gray-700 text-white text-xs focus:outline-none focus:border-white" /></label>)}</div>
        <label className="block mt-3 text-[10px] text-gray-400">測定方法・機材（任意）<input value={fields.method} aria-label="測定方法・機材（任意）" onChange={e => onChange({ ...fields, method: e.target.value })} className="w-full mt-1 p-2 bg-black border border-gray-700 text-white text-xs focus:outline-none focus:border-white" /></label>
        <p className="mt-3 text-[11px] text-gray-300" aria-live="polite">実測から計算したEY: {parsed.value?.extractionYieldPercent === undefined ? '—' : `${parsed.value.extractionYieldPercent.toFixed(2)}%`}</p>
        <p className="mt-2 text-[10px] text-gray-400">{recipe ? `粉量${recipe.beanWeight}gで計算。実際に使った設定か確認して保存してください。` : '粉量のあるレシピを選ぶとEYを計算できます。'}</p>
        {parsed.error && <p className="mt-2 text-[11px] text-amber-400" role="alert">{parsed.error}</p>}
    </details>;
}
