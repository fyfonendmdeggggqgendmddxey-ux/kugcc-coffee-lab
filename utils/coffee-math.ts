import { Bean, Recipe } from './types';
import { GRINDERS, parseSettingToMicrons } from './grinder-logic';

export type BrewingAdjustments = {
  bloomTimeAdjustment: number; // seconds
  tempAdjustment: number; // degrees Celsius
  advice: string;
  filterPeak: number[];
  espressoPeak: number[];
  currentPhase: 'Degas' | 'Peak' | 'Good' | 'Aged';
  gasLevel: number;
  effectiveDays: number;
};

/**
 * Calculates total water based on coffee grounds and ratio.
 * Formula: W_total = G * Ratio
 */
export function calculateTotalWater(grams: number, ratio: number): number {
  return grams * ratio;
}

/**
 * Calculates water adjustment for a specific step (e.g. 15% Bloom).
 */
export function calculateStepWater(totalWater: number, percentage: number): number {
  return totalWater * (percentage / 100);
}

const YOKOHAMA_TEMPS = [6.1, 6.8, 9.8, 14.8, 19.4, 22.8, 26.8, 28.1, 24.4, 18.9, 13.6, 8.7];

export function getArrheniusMultiplier(tempCelsius: number): number {
  // Base temperature is 22°C (295.15K) where multiplier is 1.0
  // Ea/R ≈ 5472 K
  const baseK = 295.15;
  const targetK = tempCelsius + 273.15;
  return Math.exp(5472 * (1 / baseK - 1 / targetK));
}

export function getStorageMultiplier(location: string | undefined, date: Date): number {
  if (location === 'Freezer') {
    return getArrheniusMultiplier(-18); // ~0.05
  }
  if (location === 'Fridge') {
    return getArrheniusMultiplier(4); // ~0.28
  }
  if (location === 'HighTemp') {
    return getArrheniusMultiplier(30); // ~1.63
  }
  if (location === 'Shop') {
    return getArrheniusMultiplier(22); // Standard shop room temp (1.0x)
  }
  // Room temp defaults to Yokohama average for the month
  const month = date.getMonth(); // 0-11
  const roomTemp = YOKOHAMA_TEMPS[month];
  return getArrheniusMultiplier(roomTemp);
}

/**
 * Calculates aging adjustments based on days since roast and roast level.
 * Implements Scientific Aging Matrix with Altitude, Freezer, and Open Date factors.
 */
export function getAgingAdjustments(bean: Bean): BrewingAdjustments {
  const today = new Date();
  const oneDay = 1000 * 60 * 60 * 24;
  
  if (!bean.roastDate) {
    return {
      bloomTimeAdjustment: 0, tempAdjustment: 0, advice: "焙煎日が未設定です。",
      filterPeak: [7, 14], espressoPeak: [14, 21], currentPhase: 'Degas', gasLevel: 100, effectiveDays: 0
    };
  }

  const roastDate = new Date(bean.roastDate);
  let effectiveDaysRaw = 0;

  // Roast Level Multiplier (Dark roasts degas faster)
  let roastMultiplier = 1.0;
  const level = (bean.roastLevel || 'Medium').toLowerCase();
  if (level === 'light' || level === '浅煎り') roastMultiplier = 0.8;
  else if (level === 'dark' || level === '深煎り') roastMultiplier = 1.3;

  // Processing Method Multiplier (Anaerobics and Naturals hold gas longer due to complex chemical structures)
  let processMultiplier = 1.0;
  const process = (bean.process || '').toLowerCase();
  if (process.includes('anaerobic') || process.includes('maceration') || process.includes('嫌気性') || process.includes('アナエロビック')) {
      processMultiplier = 0.60; // Extremely slow degassing
  } else if (process.includes('natural') || process.includes('dry') || process.includes('ナチュラル')) {
      processMultiplier = 0.85; // Slower degassing
  } else if (process.includes('washed') || process.includes('wet') || process.includes('ウォッシュト') || process.includes('ウォッシュド')) {
      processMultiplier = 1.20; // Fastest degassing
  }

  // Altitude/Density Multiplier (Continuous gradient: Higher altitude = slower degassing)
  let densityMultiplier = 1.0;
  if (bean.altitude) {
    const matches = bean.altitude.match(/\d+/g);
    if (matches && matches.length > 0) {
      const avgAltitude = matches.reduce((acc, val) => acc + parseInt(val, 10), 0) / matches.length;
      densityMultiplier = 1.0 - ((avgAltitude - 1400) / 4000);
      densityMultiplier = Math.max(0.6, Math.min(1.4, densityMultiplier)); // clamp
    }
  }

  // Calculate chronological days
  const chronoDays = Math.max(0, (today.getTime() - roastDate.getTime()) / oneDay);

  // Apply storage location kinetics via Arrhenius
  const shopDate = bean.purchaseDate ? new Date(bean.purchaseDate) : roastDate;
  // If frozenDate is earlier than purchaseDate (unlikely, but just in case), use frozenDate
  const homeStorageStartDate = bean.frozenDate && new Date(bean.frozenDate) > shopDate ? new Date(bean.frozenDate) : shopDate;

  const daysInShopRaw = Math.max(0, (homeStorageStartDate.getTime() - roastDate.getTime()) / oneDay);
  const daysInShop = Math.min(chronoDays, daysInShopRaw);
  const daysAtHome = Math.max(0, chronoDays - daysInShop);
  
  const roomMultiplier = getStorageMultiplier('Shop', roastDate);
  let homeMultiplier = getStorageMultiplier(bean.storageLocation, homeStorageStartDate);

  const isFreezer = bean.isFrozen || bean.storageLocation === 'Freezer';
  if (isFreezer) {
    homeMultiplier = getStorageMultiplier('Freezer', today);
  }
  
  effectiveDaysRaw = (daysInShop * roomMultiplier) + (daysAtHome * homeMultiplier);

  // Final effective days combining roast degree, processing method, and density kinetics
  const effectiveDays = effectiveDaysRaw * roastMultiplier * processMultiplier * (1 / densityMultiplier);

  // Peak calculations (base values adjusted by multipliers)
  const baseFilterStart = 6;
  const baseFilterEnd = 20;
  const filterPeak = [
    Math.round(baseFilterStart / (roastMultiplier * processMultiplier * (1 / densityMultiplier))),
    Math.round(baseFilterEnd / (roastMultiplier * processMultiplier * (1 / densityMultiplier)))
  ];

  const espressoPeak = [
    Math.round(14 / (roastMultiplier * processMultiplier * (1 / densityMultiplier))),
    Math.round(28 / (roastMultiplier * processMultiplier * (1 / densityMultiplier)))
  ];

  // Determine current phase based on effective days
  let currentPhase: 'Degas' | 'Peak' | 'Good' | 'Aged' = 'Degas';
  if (effectiveDays < baseFilterStart) currentPhase = 'Degas';
  else if (effectiveDays <= baseFilterEnd) currentPhase = 'Peak';
  else if (effectiveDays <= baseFilterEnd + 15) currentPhase = 'Good';
  else currentPhase = 'Aged';

  // Removed Open Bag Oxidation Override as per user request
  // Calculate theoretical gas level (Exponential decay: N = N0 * e^(-kt))
  // k is chosen so that gas is ~5% at effective day 30
  const k = 0.1; 
  let gasLevel = 100 * Math.exp(-k * effectiveDays);
  gasLevel = Math.max(0, Math.min(100, Math.round(gasLevel)));

  let adjustments: BrewingAdjustments = {
    bloomTimeAdjustment: 0,
    tempAdjustment: 0,
    advice: "エイジング適正範囲内（Peak）。標準的なガス抜け状態です。",
    filterPeak,
    espressoPeak,
    currentPhase,
    gasLevel,
    effectiveDays
  };

  const storageText = ` (実質${Math.floor(effectiveDays)}日相当)`;

  if (currentPhase === 'Degas') {
    adjustments.advice = `[Fresh] ガス放出過多${storageText}。お湯が強く弾かれるため、非常に成分が溶け出しにくい状態です。蒸らし時間を長めに取ってください。`;
  } else if (currentPhase === 'Aged') {
    adjustments.advice = `[Aged] エイジング進行済み${storageText}。酸化が進んでおり、ガスが抜けきり成分が出やすくなっています。お湯の温度を少し下げると雑味を防げます。`;
  } else if (currentPhase === 'Peak') {
    adjustments.advice = `[Peak] 飲み頃です${storageText}。ガス抜けが適度で、クリーンなフレーバーが最大化される完璧な状態です。`;
  } else {
    adjustments.advice = `[Good] まだまだ美味しく飲めます${storageText}。`;
  }

  // Inject specific storage advice
  if (isFreezer) {
      adjustments.advice += " ❄️冷凍保存中：エイジング進行が約95%ストップしています。";
  } else if (bean.storageLocation === 'Fridge') {
      adjustments.advice += " 🧊冷蔵保存中：エイジング進行が約70%遅くなっています。";
  } else if (bean.storageLocation === 'HighTemp') {
      adjustments.advice += " 🔥高温保管中：エイジング進行が1.5倍加速しています。";
  }

  return adjustments;
}

export type DynamicsAdvice = {
  score: number | null;
  advice: string;
  metrics?: {
    totalWater: number;
    actualRatio: number;
    totalDuration: number;
    weightedContactTime: number;
    weightedTemperature: number;
    particleMicrons: number;
  };
};

export function analyzeExtractionDynamics(bean: Bean, recipe: Recipe): DynamicsAdvice {
  const unavailable = (reason: string): DynamicsAdvice => ({
      score: null,
      advice: `${reason}\n入力を確認すると抽出傾向の目安を表示します。`,
  });
  const positive = (value: number) => Number.isFinite(value) && value > 0;
  const validTemperature = (value: number) => positive(value) && value <= 100;
  if (!positive(recipe.beanWeight) || !positive(recipe.ratio)) {
      return unavailable('豆量と湯量比を正の数で設定してください。');
  }
  if (!validTemperature(recipe.temperature)) {
      return unavailable('湯温を0°Cより大きく100°C以下で設定してください。');
  }
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0 || recipe.steps.some(step =>
      !step || !Number.isFinite(step.duration) || step.duration < 0 ||
      !Number.isFinite(step.waterPercentage) || step.waterPercentage < 0 ||
      (step.temperature !== undefined && !validTemperature(step.temperature))
  )) {
      return unavailable('各工程の時間・注湯量・湯温を確認してください。');
  }

  const plannedWater = recipe.beanWeight * recipe.ratio;
  const totalDuration = recipe.steps.reduce((sum, step) => sum + step.duration, 0);
  const totalWater = recipe.steps.reduce((sum, step) => sum + plannedWater * step.waterPercentage / 100, 0);
  if (!positive(totalDuration) || !positive(totalWater)) {
      return unavailable('工程の合計時間と注湯量を正の数で設定してください。');
  }
  // Proxy only: assume each step's water is added uniformly during that step.
  // Weight the remaining brew time by water added; waiting after a pour counts,
  // while splitting an identical pour into equivalent rows changes nothing.
  let elapsed = 0;
  let weightedContactTime = 0;
  let weightedTemperature = 0;
  for (const step of recipe.steps) {
      const weight = (plannedWater * step.waterPercentage / 100) / totalWater;
      weightedContactTime += weight * (totalDuration - elapsed - step.duration / 2);
      weightedTemperature += weight * (step.temperature ?? recipe.temperature);
      elapsed += step.duration;
  }
  const actualRatio = totalWater / recipe.beanWeight;
  if (![actualRatio, weightedContactTime, weightedTemperature].every(positive)) {
      return unavailable('工程から有効な湯量比・時間・湯温を計算できません。');
  }
  const grinderModel = recipe.grinderModel || '';
  const profile = GRINDERS[grinderModel];
  if (!profile || typeof recipe.grindSize !== 'string') {
      return unavailable('グラインダーと数値の挽き目を設定してください。');
  }
  const setting = recipe.grindSize.trim();
  const exact = profile.data?.find(point => point.label === setting);
  // Avoid silently guessing a size for descriptive or malformed settings.
  const numericSetting = /^\d+(?:\.\d+)?$/.test(setting) ? Number(setting) : null;
  if (!exact && numericSetting === null) {
      return unavailable('挽き目は数値、または登録されている目盛り表記で入力してください。');
  }
  if (!exact && profile.data) {
      if (profile.data.some(point => !/^\d+(?:\.\d+)?$/.test(point.label))) {
          return unavailable('この機種は「ギア・グリッド」など、登録されている目盛り表記で入力してください。');
      }
      const settings = profile.data.map(point => Number(point.label));
      if (numericSetting! < Math.min(...settings) || numericSetting! > Math.max(...settings)) {
          return unavailable('挽き目が換算データの範囲外です。範囲内の設定で確認してください。');
      }
  }
  const microns = parseSettingToMicrons(grinderModel, setting);
  if (microns === null || !positive(microns)) {
      return unavailable('挽き目から有効な粒径の目安を計算できません。');
  }
  const particleMicrons = profile.micronMetric === 'particle-median' ? microns : microns * 0.55;
  const metrics = { totalWater, actualRatio, totalDuration, weightedContactTime, weightedTemperature, particleMicrons };
  let score = 0;

  // 1. Process & Roast Matrix (Structural Integrity & Porosity)
  let processScore = 0;
  const process = (bean.process || '').toLowerCase();
  if (process.includes('anaerobic') || process.includes('maceration') || process.includes('嫌気性') || process.includes('アナエロビック')) {
      processScore = 12.0; // 酵素による細胞壁の分解（極めて浸透しやすい）
  } else if (process.includes('natural') || process.includes('dry') || process.includes('ナチュラル')) {
      processScore = 8.26; // 論文値：体積膨張率が高く、脆くて浸透しやすい
  } else if (process.includes('washed') || process.includes('wet') || process.includes('ウォッシュト') || process.includes('ウォッシュド')) {
      processScore = -8.26; // 論文値：体積膨張率が低く、硬くて浸透しにくい
  }

  let roastMultiplier = 1.0;
  let baseRoastScore = 0;
  const roast = (bean.roastLevel || 'Medium').toLowerCase();
  if (roast === 'light' || roast === '浅煎り') {
      roastMultiplier = 0.85; // 組織が硬い
      baseRoastScore = -15;
  } else if (roast === 'dark' || roast === '深煎り') {
      roastMultiplier = 1.2;  // 熱分解で組織がスカスカ
      baseRoastScore = 15;
  }

  score += baseRoastScore + (processScore * roastMultiplier);

  // 2. Temperature Kinetics (Non-linear Arrhenius approximation)
  // アレニウスの式ベース：高温になるほど抽出効率が非線形（指数関数的）に増大し、さらに焙煎度（豆の脆さ）を掛け合わせる
  const tempDiff = weightedTemperature - 90;
  const tempKinetics = Math.sign(tempDiff) * Math.pow(Math.abs(tempDiff), 1.2) * 0.8;
  score += tempKinetics * roastMultiplier;

  // 3. Fines & Microns (Inverse Square Law for Surface Area)
  // Retain legacy fines estimates; these are not measurements for this brew.
  const finesRatio = microns > 700 ? profile.finesRatio.coarse : profile.finesRatio.medium;

  // 表面積の反比例の法則：同じ質量の豆なら、粒径が半分になれば総表面積は2倍になる
  // 500μmを基準(1.0)とした表面積比率を算出
  const surfaceAreaRatio = 500 / Math.max(100, particleMicrons);
  // スコアへの影響を *60 に調整して現実の溶出スピードの体感に合わせる
  score += (surfaceAreaRatio - 1) * 60;

  // 微粉（Fines）によるチャネリングペナルティと過抽出リスクの非線形化
  // Gagné理論: 微粉は一定割合(例:20%)までは過抽出スコアを線形に上げるが、
  // それを超えるとチャネリングにより予測不能な渋み（局所的な過抽出）を誘発する。
  if (finesRatio <= 20) {
      score += (finesRatio - 20) * 1.5;
  } else {
      // 20%を超えると指数関数的に抽出が暴走する（スコアが跳ね上がる＝過抽出判定）
      score += Math.pow((finesRatio - 20), 1.5) * 2.0;
  }

  // 4. Recipe sensitivity, not fitted extraction physics. Baselines: 1:16
  // and 90 s water-weighted remaining time (180 s uniform pour).
  // Bounded log terms prevent long timers / large ratios dominating the score.
  const bounded = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
  score += bounded(12 * Math.log2(actualRatio / 16), 20);
  score += bounded(10 * Math.log2(weightedContactTime / 90), 20);

  // 5. Aging Kinetics (CO2 Off-gassing and Cell degradation)
  // 実質経過日数（effectiveDays）によるガスの抜け具合と抽出効率の変化
  // ※冷凍保存などを考慮するため、カレンダー上の日数ではなく実質日数を使う
  if (bean.roastDate) {
      const adj = getAgingAdjustments(bean);
      const effectiveDays = adj.effectiveDays;
      
      let agingScore = 0;
      // ガスが大量に残っている場合（実質7日以内）、お湯が弾かれて極端に成分が出にくい
      if (effectiveDays <= 7) {
          agingScore = -10 * (1 - Math.max(0, effectiveDays)/7);
      } 
      // エイジングが進んでいる場合（実質25日以上）、細胞が崩壊しオイルが浮くため成分が極めて出やすい
      else if (effectiveDays >= 25) {
          agingScore = Math.min(10, (effectiveDays - 25) * 0.5);
      }
      score += agingScore * roastMultiplier;
  }

  if (!Number.isFinite(score)) {
      return unavailable('入力値から抽出傾向を計算できません。日付や数値を確認してください。');
  }

  // This heuristic is a relative guide, not a measured extraction yield or TDS.
  let advice = 'レシピ条件からの推定です。実際の抽出率・濃度・味を保証するものではありません。';
  if (score > 18) {
      advice += '\n抽出が進みやすい傾向です。渋みや苦味が気になる場合は、湯温を1°C下げる、挽き目を1段階粗くする、抽出時間を短くする、のいずれかを少しずつ試してください。';
  } else if (score < -18) {
      advice += '\n抽出が進みにくい傾向です。酸味が強く甘みが不足する場合は、湯温を1°C上げる、挽き目を1段階細かくする、抽出時間を長くする、のいずれかを少しずつ試してください。';
  } else {
      advice += '\nモデル上は中間の範囲です。味を確かめながら、一度に1つの条件を調整してください。';
  }
  advice += '\n湯量比を増やすと抽出は進みやすくても、飲み物の濃度は下がる場合があります。濃さと抽出の進み方は分けて評価してください。';
  if (Math.abs(totalWater / plannedWater - 1) > 0.005) {
      advice += `\n工程の注湯合計が設定総湯量と異なるため、実際の工程合計 ${Math.round(totalWater)}ml（1:${actualRatio.toFixed(1)}）で計算しています。`;
  }

  return { score, advice, metrics };
}
