const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');

// Test the actual TypeScript modules using the existing compiler dependency.
// This loader is isolated to this test process, not the application runtime.
require.extensions['.ts'] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
        fileName: filename,
    });
    module._compile(outputText, filename);
};
const { analyzeExtractionDynamics } = require('../utils/coffee-math.ts');
const { parseSettingToMicrons, convertMicronsToSettingStr } = require('../utils/grinder-logic.ts');

const bean = { id: 'test', name: 'Test', roaster: '', roastDate: '', roastLevel: 'Medium', process: '' };
const recipe = {
    beanWeight: 15, ratio: 16, temperature: 90, grinderModel: 'S3', grindSize: '6',
    steps: [
        { id: '1', name: 'Bloom', waterPercentage: 20, duration: 40 },
        { id: '2', name: 'Pour', waterPercentage: 40, duration: 60 },
        { id: '3', name: 'Pour', waterPercentage: 40, duration: 80 },
    ],
};
const analyze = (patch = {}) => analyzeExtractionDynamics(bean, { ...recipe, ...patch });

test('S3 uses all eleven supplied medians, including 9.0, in both directions', () => {
    for (const [setting, microns] of [[2.8,483],[3,492],[4,552],[4.5,568],[4.8,632],[5,634],[6,710],[6.8,734],[7,771],[8,845],[9,980]]) {
        assert.equal(parseSettingToMicrons('S3', setting.toFixed(1)), microns);
        assert.equal(Number(convertMicronsToSettingStr('S3', microns).value), setting);
    }
    assert.equal(parseSettingToMicrons('S3', '8.5'), 912.5);
    assert.equal(convertMicronsToSettingStr('S3', 912.5).value, '8.5');
});
test('measured S3 median is not multiplied by 0.55 a second time', () => {
    assert.equal(analyze().metrics.particleMicrons, 710);
});
test('ratio changes both actual water and extraction tendency', () => {
    const short = analyze({ ratio: 10 });
    const long = analyze({ ratio: 25 });
    assert.equal(short.metrics.totalWater, 150);
    assert.equal(long.metrics.totalWater, 375);
    assert.ok(long.score > short.score);
});
test('longer timed steps change extraction tendency, with a bounded contribution', () => {
    const long = analyze({ steps: recipe.steps.map(step => ({ ...step, duration: step.duration * 10 })) });
    assert.ok(long.score > analyze().score);
    assert.ok(long.score - analyze().score <= 40);
});
test('early versus late water affects the contact-time estimate', () => {
    const early = analyze({ steps: recipe.steps.map((s, i) => ({ ...s, waterPercentage: [60,20,20][i] })) });
    const late = analyze({ steps: recipe.steps.map((s, i) => ({ ...s, waterPercentage: [20,20,60][i] })) });
    assert.ok(early.metrics.weightedContactTime > late.metrics.weightedContactTime);
    assert.ok(early.score > late.score);
});
test('splitting the same uniform pour into two rows leaves the prediction unchanged', () => {
    const single = analyze({ steps: [{ id:'1', name:'Pour', waterPercentage:100, duration:180 }] });
    const split = analyze({ steps: [
        { id:'1', name:'Pour', waterPercentage:50, duration:90 },
        { id:'2', name:'Pour', waterPercentage:50, duration:90 },
    ] });
    assert.equal(single.score, split.score);
    assert.deepEqual(single.metrics, split.metrics);
});
test('zero-water wait after pouring affects time but zero-duration rows add no score', () => {
    const wait = { id:'wait', name:'Wait', waterPercentage:0, duration:60 };
    assert.ok(analyze({ steps:[...recipe.steps,wait] }).score > analyze().score);
    assert.equal(analyze({ steps:[...recipe.steps,{...wait,duration:0}] }).score, analyze().score);
});
test('step-specific temperature is weighted by water volume', () => {
    const hot = analyze({ steps: recipe.steps.map((s, i) => ({ ...s, temperature:i===2 ? 100 : 90 })) });
    assert.equal(hot.metrics.weightedTemperature, 94);
    assert.ok(hot.score > analyze().score);
});
test('actual step total determines ratio and explains a mismatch', () => {
    const half = analyze({ steps: recipe.steps.map(s => ({...s,waterPercentage:s.waterPercentage / 2})) });
    assert.equal(half.metrics.totalWater,120);
    assert.equal(half.metrics.actualRatio,8);
    assert.match(half.advice,/工程の注湯合計/);
});
test('scaling dose and water together preserves the ratio-based estimate', () => {
    assert.equal(analyze({beanWeight:30}).metrics.totalWater,480);
    assert.equal(analyze({beanWeight:30}).score,analyze().score);
});
test('missing, invalid or out-of-range settings do not receive a fabricated score', () => {
    for (const patch of [
        {grindSize:'Medium-Fine'}, {grindSize:'.'}, {grindSize:'-6'}, {grindSize:'9.1'},
        {grindSize:'2.7'}, {grinderModel:'unknown'}, {grinderModel:undefined},
        {grinderModel:'EK43',grindSize:'1.2'},
    ]) assert.equal(analyze(patch).score,null,JSON.stringify(patch));
    assert.ok(Number.isFinite(analyze({grinderModel:'EK43',grindSize:'1ギア 2グリッド'}).score));
});
test('invalid recipe fields produce an unavailable result, never NaN or a sweet spot', () => {
    for (const patch of [
        {beanWeight:0}, {ratio:-1}, {ratio:Infinity}, {temperature:NaN}, {temperature:101},
        {steps:[]}, {steps:undefined},
        {steps:[{...recipe.steps[0],duration:-1}]},
        {steps:[{...recipe.steps[0],duration:0}]},
        {steps:[{...recipe.steps[0],waterPercentage:0}]},
        {steps:[{...recipe.steps[0],waterPercentage:NaN}]},
        {steps:[{...recipe.steps[0],temperature:Infinity}]},
    ]) assert.equal(analyze(patch).score,null,JSON.stringify(patch));
});
test('advice labels the model as an estimate and separates strength from extraction', () => {
    assert.match(analyze().advice,/推定/);
    assert.match(analyze().advice,/濃さと抽出/);
    assert.doesNotMatch(analyze().advice,/パーフェクト|完全に理想|最高のセッティング/);
});
