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

  // Altitude/Density Multiplier (Higher altitude = slower degassing)
  let densityMultiplier = 1.0;
  if (bean.altitude) {
    const num = parseInt(bean.altitude.replace(/[^0-9]/g, ''));
    if (!isNaN(num)) {
      if (num > 1600) densityMultiplier = 0.9; // SHB/SHG: 10% slower
      else if (num < 1200) densityMultiplier = 1.1; // Softer bean: 10% faster
    }
  }

  // Calculate chronological days
  const chronoDays = Math.max(0, (today.getTime() - roastDate.getTime()) / oneDay);

  // Apply freezer pause & storage location kinetics
  const isFreezer = bean.isFrozen || bean.storageLocation === 'Freezer';
  if (isFreezer) {
    // If frozenDate isn't set, assume it was frozen on purchaseDate or roastDate
    const frozenDate = bean.frozenDate ? new Date(bean.frozenDate) : (bean.purchaseDate ? new Date(bean.purchaseDate) : roastDate);
    const daysBeforeFreezing = Math.max(0, (frozenDate.getTime() - roastDate.getTime()) / oneDay);
    const daysInFreezer = Math.max(0, (today.getTime() - frozenDate.getTime()) / oneDay);
    effectiveDaysRaw = daysBeforeFreezing + (daysInFreezer * 0.05); // 95% slower in freezer
  } else if (bean.storageLocation === 'Fridge') {
    effectiveDaysRaw = chronoDays * 0.3; // 70% slower in fridge
  } else if (bean.storageLocation === 'HighTemp') {
    effectiveDaysRaw = chronoDays * 1.5; // 50% faster in high temp
  } else {
    effectiveDaysRaw = chronoDays;
  }

  // Final effective days combining roast degree and density kinetics
  const effectiveDays = effectiveDaysRaw * roastMultiplier * (1 / densityMultiplier);

  // Peak calculations (base values adjusted by multipliers)
  const baseFilterStart = 6;
  const baseFilterEnd = 20;
  const filterPeak = [
    Math.round(baseFilterStart / (roastMultiplier * (1 / densityMultiplier))),
    Math.round(baseFilterEnd / (roastMultiplier * (1 / densityMultiplier)))
  ];

  const espressoPeak = [
    Math.round(14 / (roastMultiplier * (1 / densityMultiplier))),
    Math.round(28 / (roastMultiplier * (1 / densityMultiplier)))
  ];

  // Determine current phase based on effective days
  let currentPhase: 'Degas' | 'Peak' | 'Good' | 'Aged' = 'Degas';
  if (effectiveDays < baseFilterStart) currentPhase = 'Degas';
  else if (effectiveDays <= baseFilterEnd) currentPhase = 'Peak';
  else if (effectiveDays <= baseFilterEnd + 15) currentPhase = 'Good';
  else currentPhase = 'Aged';

  // Open Bag Oxidation Override
  if (bean.openedDate && !bean.isFrozen) {
    const openedDate = new Date(bean.openedDate);
    const daysOpen = Math.max(0, (today.getTime() - openedDate.getTime()) / oneDay);
    // After 14 days open, forcefully shift to Aged due to oxidation
    if (daysOpen > 14) currentPhase = 'Aged';
    else if (daysOpen > 7 && currentPhase === 'Peak') currentPhase = 'Good';
  }

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
  if (bean.openedDate && !isFreezer) {
      const daysOpen = Math.floor((today.getTime() - new Date(bean.openedDate).getTime()) / oneDay);
      adjustments.advice += ` ✂️開封から${daysOpen}日経過：酸化スピードが加速しています。早めに飲み切ることを推奨します。`;
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
