import { Bean, Recipe } from './types';
import { GRINDER_PROFILES, getGrinderClicks } from './grinder-table';

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

  const daysInShop = Math.max(0, (homeStorageStartDate.getTime() - roastDate.getTime()) / oneDay);
  const daysAtHome = Math.max(0, (today.getTime() - homeStorageStartDate.getTime()) / oneDay);
  
  const roomMultiplier = getStorageMultiplier('Room', roastDate);
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
  score: number;
  advice: string;
};

export function analyzeExtractionDynamics(bean: Bean, recipe: Recipe): DynamicsAdvice {
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
  const tempDiff = recipe.temperature - 90;
  const tempKinetics = Math.sign(tempDiff) * Math.pow(Math.abs(tempDiff), 1.2) * 0.8;
  score += tempKinetics * roastMultiplier;

  // 3. Fines & Microns (Inverse Square Law for Surface Area)
  let finesRatio = 22; // Default
  let absoluteMicrons = 600; // Default

  const grinderModel = recipe.grinderModel || "C40_MK4";
  const profile = GRINDER_PROFILES[grinderModel];

  if (profile) {
      let clicks = getGrinderClicks(grinderModel, recipe.grindSize);
      if (typeof clicks === 'number') {
          if (grinderModel === 'S3') {
              clicks = clicks * 10;
          }
          absoluteMicrons = clicks * profile.micronsPerClick * 0.55;
      }
      const isCoarse = recipe.grindSize === 'Coarse' || recipe.grindSize === 'Medium-Coarse';
      finesRatio = isCoarse ? profile.finesRatio.coarse : profile.finesRatio.medium;
  }

  // 表面積の逆二乗の法則：粒径が半分になれば表面積は4倍になる
  // 500μmを基準(1.0)とした表面積比率を算出
  const surfaceAreaRatio = Math.pow(500 / Math.max(100, absoluteMicrons), 2);
  score += (surfaceAreaRatio - 1) * 20;

  // 微粉は過抽出と目詰まりの最大要因（抽出を極端に加速させる）
  score += (finesRatio - 20) * 1.8;

  // 4. Pour Structure (Fick's Law of Diffusion & Concentration Gradient)
  // 注ぎ回数が多い＝フレッシュな溶媒が追加され濃度勾配が維持される＝抽出効率が上がる
  const stepsCount = recipe.steps?.length || 3;
  score += (stepsCount - 3) * 4.2;

  // 5. Aging Kinetics (CO2 Off-gassing and Cell degradation)
  // 焙煎からの経過日数によるガスの抜け具合と抽出効率の変化
  if (bean.roastDate) {
      const today = new Date();
      const roastDate = new Date(bean.roastDate);
      const oneDay = 1000 * 60 * 60 * 24;
      const daysSinceRoast = Math.floor((today.getTime() - roastDate.getTime()) / oneDay);
      
      let agingScore = 0;
      // ガスが大量に残っている場合（7日以内）、お湯が弾かれて極端に成分が出にくい
      if (daysSinceRoast <= 7) {
          agingScore = -10 * (1 - Math.max(0, daysSinceRoast)/7);
      } 
      // エイジングが進んでいる場合（25日以上）、細胞が崩壊しオイルが浮くため成分が極めて出やすい
      else if (daysSinceRoast >= 25) {
          agingScore = Math.min(10, (daysSinceRoast - 25) * 0.5);
      }
      score += agingScore * roastMultiplier;
  }

  // Helper to format click adjustments
  const formatClicks = (clicks: number) => {
      if (grinderModel === 'S3') {
          return `ダイヤル ${Number((clicks / 10).toFixed(1))} 分`;
      }
      return `${clicks} クリック`;
  };

  // Evaluate the final score (-100 to +100 range conceptually)
  let advice = "";
  if (score > 18) {
      // 極度の過抽出リスク
      const tempDrop = Math.min(3, Math.ceil((score - 18) / 5)); // Max 3 degrees
      const clicksCoarser = profile ? Math.max(1, Math.ceil(((score - 18) * 10) / profile.micronsPerClick)) : 1;
      
      advice = `少し濃く出すぎる（渋みや苦味が強くなる）組み合わせです。\n【改善アクション】\n・お湯の温度を ${tempDrop}°C 下げる\n・挽き目を ${formatClicks(clicksCoarser)} 粗くする\n・注ぎの回数を 1回 減らす\n\n上記のいずれかを試すと、よりスッキリと甘くなります。`;
      if (finesRatio >= 26) {
          advice += `\n※グラインダー（${grinderModel}）は微粉が出やすいため、後半は優しく注いで目詰まりを防いでください。`;
      }
  } else if (score < -18) {
      // 極度の未抽出リスク
      const tempRise = Math.min(3, Math.ceil((Math.abs(score) - 18) / 5)); // Max 3 degrees
      const clicksFiner = profile ? Math.max(1, Math.ceil(((Math.abs(score) - 18) * 10) / profile.micronsPerClick)) : 1;
      
      advice = `少しサッパリしすぎて、酸味が際立つ（薄く感じる）かもしれません。\n【改善アクション】\n・お湯の温度を ${tempRise}°C 上げる\n・挽き目を ${formatClicks(clicksFiner)} 細かくする\n・注ぎの回数を 1回 増やす\n\n上記のいずれかで、甘みとコクがしっかり引き出せます。`;
  } else {
      // スイートスポット
      advice = `抽出バランス（甘み・酸味・コク）が非常に整いやすい、理想的なスイートスポット設定です！`;
      if (finesRatio <= 18) {
          advice += `\n※お使いのグラインダー（${grinderModel}）のこの設定は微粉が非常に少なくクリーンなため、フレーバーがとても綺麗に出ます。`;
      }

      // 理想値（スコア0）への微調整アドバイス
      if (score > 5) {
          const tempDrop = Math.max(1, Math.round(score / 5)); // More conservative
          const clicksCoarser = profile ? Math.max(1, Math.round((score * 10) / profile.micronsPerClick)) : 1;
          advice += `\n\n【さらなる極みへ】\nより完璧な理論値（スコア0）を目指す場合、以下の微調整がおすすめです：\n・お湯の温度を ${tempDrop}°C 下げる\n・挽き目を ${formatClicks(clicksCoarser)} 粗くする`;
      } else if (score < -5) {
          const tempRise = Math.max(1, Math.round(Math.abs(score) / 5)); // More conservative
          const clicksFiner = profile ? Math.max(1, Math.round((Math.abs(score) * 10) / profile.micronsPerClick)) : 1;
          advice += `\n\n【さらなる極みへ】\nより完璧な理論値（スコア0）を目指す場合、以下の微調整がおすすめです：\n・お湯の温度を ${tempRise}°C 上げる\n・挽き目を ${formatClicks(clicksFiner)} 細かくする`;
      } else {
          advice += `\n\n【パーフェクト】\n現在の設定は数学的モデルにおいて完全に理想値（スコア0付近）です！文句なしの最高のセッティングです。`;
      }
  }

  return { score, advice };
}
