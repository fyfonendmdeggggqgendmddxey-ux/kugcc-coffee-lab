const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 }, fileName: filename,
    });
    module._compile(outputText, filename);
};
const { simulateBrew, measuredExtractionYield, parseMeasurements, recipeContactWater } = require('../utils/brew-simulation.ts');
const { COFFEE_REFERENCES, rankReferences, matchReference, buildReferenceRecipe, brewerFamily, processTags } = require('../utils/coffee-references.ts');
const { getGrindEstimate } = require('../utils/grinder-logic.ts');
const bean = { id: 'test', name: 'Test coffee', roaster: 'DAK', roastLevel: 'Light', process: 'Washed', roastDate: '2026-10-20' };
const recipe = { beanWeight: 15, ratio: 16, temperature: 93, dripper: 'V60', grinderModel: 'S3', grindSize: '6', steps: [{ id: '1', name: 'Pour', waterPercentage: 100, duration: 160 }] };
const find = id => COFFEE_REFERENCES.find(r => r.id === id);

test('concentration scenario obeys mass balance but has no trained prediction or interval', () => {
    const result = simulateBrew(recipe, { extractionYieldPercent: 19, retainedWaterGPerDoseG: 2 });
    assert.equal(result.beverageMassG, 210);
    assert.equal(result.tdsPercent, 19 * 15 / 210);
    assert.equal(result.status, 'assumption-simulation');
    assert.equal(result.interval80, undefined);
    const halfWater = { ...recipe, steps: [{ ...recipe.steps[0], waterPercentage: 50 }] };
    assert.equal(recipeContactWater(halfWater), 120);
    assert.equal(simulateBrew(halfWater, { extractionYieldPercent: 19, retainedWaterGPerDoseG: 2 }).beverageMassG, 90);
    assert.equal(simulateBrew({ ...recipe, temperature: 80, grindSize: '8' }, { extractionYieldPercent: 19, retainedWaterGPerDoseG: 2 }).tdsPercent, result.tdsPercent);
});
test('invalid scenarios never return infinities, negative water or fabricated zero', () => {
    for (const settings of [
        { extractionYieldPercent: NaN, retainedWaterGPerDoseG: 2 },
        { extractionYieldPercent: 19, retainedWaterGPerDoseG: 16 },
        { extractionYieldPercent: 0, retainedWaterGPerDoseG: 2 },
        { extractionYieldPercent: 19, retainedWaterGPerDoseG: -1 },
    ]) assert.equal(simulateBrew(recipe, settings), null);
    assert.equal(simulateBrew({ ...recipe, beanWeight: 0 }, { extractionYieldPercent: 19, retainedWaterGPerDoseG: 2 }), null);
});
test('measurements are optional; EY requires measured TDS, mass and dose in percent units', () => {
    const empty = { tds: '', mass: '', time: '', method: '' };
    assert.deepEqual(parseMeasurements(empty, 15), {});
    assert.ok(Math.abs(measuredExtractionYield(1.38, 210, 15) - 19.32) < 1e-10);
    assert.equal(parseMeasurements({ ...empty, tds: '1.38' }, 15).value.extractionYieldPercent, undefined);
    assert.ok(Math.abs(parseMeasurements({ ...empty, tds: '1.38', mass: '210' }, 15).value.extractionYieldPercent - 19.32) < 1e-10);
    assert.ok(parseMeasurements({ ...empty, tds: '-1' }, 15).error);
    assert.ok(parseMeasurements({ ...empty, tds: '10', mass: '500' }, 15).error);
    assert.equal(measuredExtractionYield(undefined, 210, 15), undefined);
});
test('source snapshots contain 39 unique references and keep all review holds', () => {
    assert.equal(COFFEE_REFERENCES.length, 39);
    assert.equal(new Set(COFFEE_REFERENCES.map(r => r.id)).size, 39);
    for (const id of ['patrik-coffeewerk-april', 'liza-switch-natural-2022', 'carlos-wbrc-2023', 'matt-natural-fivepour-interview', 'jibbi-wac-2022-organizer', 'tq_dak_darling']) {
        assert.equal(find(id).canSuggest, false);
        assert.equal(buildReferenceRecipe(bean, recipe, find(id)), null);
    }
    for (const ref of COFFEE_REFERENCES) {
        for (const source of ref.sources) assert.ok(source.url.startsWith('https://'));
    }
});
test('DAK process templates stay scoped; unknown, different roaster, roast, decaf or density cannot auto-match', () => {
    assert.equal(rankReferences(bean, recipe)[0].reference.id, 'dak_default');
    assert.equal(matchReference(bean, recipe, find('dak_default')).eligible, true);
    assert.equal(matchReference({ ...bean, process: 'Natural' }, { ...recipe, beanWeight: 16.5 }, find('dak_natural_fermented')).eligible, true);
    for (const b of [{ ...bean, process: '' }, { ...bean, process: 'Honey' }, { ...bean, roaster: 'Other' }, { ...bean, roastLevel: '' }, { ...bean, process: 'Decaf Washed' }]) {
        assert.equal(matchReference(b, recipe, find('dak_default')).eligible, false, JSON.stringify(b));
    }
    assert.equal(matchReference(bean, recipe, find('dak_dense')).eligible, false);
    assert.equal(matchReference({ ...bean, variety: 'Gesha', origin: 'Kenya' }, recipe, find('wonderstate_kamavindi')).eligible, false);
});
test('device missing, incompatible, or far-away dose never enables an adapter', () => {
    assert.equal(brewerFamily('HARIO Switch V60'), 'switch');
    assert.equal(rankReferences(bean, { ...recipe, dripper: undefined }).length, 0);
    assert.equal(buildReferenceRecipe(bean, { ...recipe, dripper: 'AeroPress' }, find('dak_default')), null);
    assert.equal(buildReferenceRecipe(bean, { ...recipe, beanWeight: 40 }, find('dak_default')), null);
    assert.deepEqual(processTags('Anaerobic Washed'), { base: 'washed', fermented: true, decaf: false });
    assert.equal(processTags('honey').base, 'honey');
});
test('reviewed adapter preserves raw dose and water, splits known pour/wait, keeps user grind and provenance', () => {
    const before = JSON.stringify({ bean, recipe, reference: find('dak_default') });
    const result = buildReferenceRecipe(bean, recipe, find('dak_default'));
    assert.equal(result.beanWeight, 15);
    assert.ok(Math.abs(result.beanWeight * result.ratio - 250) < 1e-10);
    assert.ok(Math.abs(result.steps.reduce((n, s) => n + s.waterPercentage, 0) - 100) < 1e-10);
    assert.equal(result.steps.reduce((n, s) => n + s.duration, 0), 150);
    assert.equal(result.steps[0].duration, 6.25);
    assert.equal(result.steps[1].kind, 'wait');
    assert.equal(result.grindSize, '6');
    assert.equal(result.reference.id, 'dak_default');
    assert.ok(result.reference.adaptations.some(t => t.includes('未校正')));
    assert.equal(before, JSON.stringify({ bean, recipe, reference: find('dak_default') }));
    assert.deepEqual(JSON.parse(JSON.stringify(result)).reference, result.reference);
});
test('all five adapters conserve water and time; unknown duration is not invented', () => {
    for (const [id, b, r] of [
        ['kurasu-v60-12g', { ...bean, roaster: 'Kurasu' }, recipe],
        ['dak_default', bean, recipe], ['dak_natural_fermented', { ...bean, process: 'Natural' }, recipe],
        ['20grams_washed', { ...bean, roaster: '20grams' }, { ...recipe, dripper: 'April', beanWeight: 12.5 }],
        ['20grams_natural', { ...bean, roaster: '20grams', process: 'Natural' }, { ...recipe, dripper: 'April', beanWeight: 12.5 }],
    ]) {
        const result = buildReferenceRecipe(b, r, find(id));
        assert.ok(result, id);
        assert.ok(Math.abs(recipeContactWater(result) - find(id).waterValue) < 1e-8);
        assert.ok(result.steps.every(s => s.duration > 0));
        if (id.includes('kurasu')) assert.ok(result.steps.every(s => s.pouringDurationSec === undefined));
    }
});
test('grind metadata distinguishes supplied medians, interpolation, virtual scales and out-of-range settings', () => {
    assert.equal(getGrindEstimate('S3', '6').valueMicrons, 710);
    assert.equal(getGrindEstimate('S3', '8.5').valueOrigin, 'interpolated');
    assert.equal(getGrindEstimate('S3', '99'), null);
    assert.equal(getGrindEstimate('S3', 'Medium-Fine'), null);
    assert.equal(getGrindEstimate('C40_MK4', '25').metric, 'virtual-gap');
    assert.equal(getGrindEstimate('S3', '6').measurementConditionsVerified, false);
});
