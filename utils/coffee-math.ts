import { Bean, Recipe } from './types';
import { GRINDER_PROFILES, getGrinderClicks } from './grinder-table';

export type BrewingAdjustments = {
  bloomTimeAdjustment: number; // seconds
  tempAdjustment: number; // degrees Celsius
  advice: string;
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
 * Calculates aging adjustments based on days since roast.
 * D <= 6: Bloom +15s, Temp -1°C (Too fresh, needs off-gassing)
 * D >= 22: Bloom -5s, Temp +2°C (Aged, needs higher extraction)
 */
/**
 * Calculates aging adjustments based on days since roast and roast level.
 * Implements Scientific Aging Matrix.
 */
export function getAgingAdjustments(roastDate: Date, roastLevel: string = 'Medium', storageLocation: string = 'Room', purchaseDate?: Date): BrewingAdjustments {
  const today = new Date();
  const oneDay = 1000 * 60 * 60 * 24;
  
  let validPurchaseDate = purchaseDate;
  if (!validPurchaseDate || isNaN(validPurchaseDate.getTime())) {
      validPurchaseDate = roastDate;
  }
  if (validPurchaseDate.getTime() < roastDate.getTime()) {
      validPurchaseDate = roastDate;
  }
  if (validPurchaseDate.getTime() > today.getTime()) {
      validPurchaseDate = today;
  }

  const phase1Days = Math.floor((validPurchaseDate.getTime() - roastDate.getTime()) / oneDay);
  const phase2Days = Math.floor((today.getTime() - validPurchaseDate.getTime()) / oneDay);

  let roastMultiplier = 1.0;
  if (roastLevel === 'Light' || roastLevel === '浅煎り') roastMultiplier = 0.8;
  else if (roastLevel === 'Dark' || roastLevel === '深煎り') roastMultiplier = 1.2;

  let storageMultiplier = 1.0;
  if (storageLocation === 'HighTemp') storageMultiplier = 1.5;
  else if (storageLocation === 'Fridge') storageMultiplier = 0.2;
  else if (storageLocation === 'Freezer') storageMultiplier = 0.05;

  const effectiveDaysRaw = (phase1Days * roastMultiplier) + (phase2Days * roastMultiplier * storageMultiplier);
  const daysSinceRoast = Math.floor(effectiveDaysRaw); // Use floored effective days for the matrix

  let adjustments: BrewingAdjustments = {
    bloomTimeAdjustment: 0,
    tempAdjustment: 0,
    advice: "エイジング適正範囲内（Peak）。標準抽出変数を適用します。",
  };

  const level = roastLevel.toLowerCase();
  const storageText = (storageMultiplier !== 1.0 || roastMultiplier !== 1.0) ? ` (実質${daysSinceRoast}日相当)` : ``;

  // Matrix Logic based on EFFECTIVE days
  if (level === 'light' || level === '浅煎り') {
    if (daysSinceRoast <= 10) {
      adjustments.bloomTimeAdjustment = 20;
      adjustments.advice = `[Light/Fresh] ガス放出過多${storageText}。蒸らしを+20秒延長し、十分な脱ガスを行います。`;
    } else if (daysSinceRoast >= 26) {
      adjustments.tempAdjustment = 2;
      adjustments.advice = `[Light/Aged] 酸化リスク${storageText}。湯温を+2°C上げ、抽出効率を高めます。`;
    } else {
      adjustments.advice = `[Light/Peak] 飲み頃です${storageText}。標準レシピでフレーバーを最大化できます。`;
    }
  } else if (level === 'dark' || level === '深煎り') {
    if (daysSinceRoast <= 3) {
      adjustments.bloomTimeAdjustment = 10;
      adjustments.tempAdjustment = -3;
      adjustments.advice = `[Dark/Fresh] 極めてガスが多い状態${storageText}。蒸らし+10秒、湯温-3°Cで刺激味を抑制します。`;
    } else if (daysSinceRoast >= 15) {
      adjustments.tempAdjustment = 2;
      adjustments.advice = `[Dark/Aged] 酸化リスク${storageText}。湯温+2°Cでボディ感を補強します。`;
    } else {
      adjustments.advice = `[Dark/Peak] 飲み頃です${storageText}。標準レシピでコクと甘みを楽しめます。`;
    }
  } else {
    // Medium (Default)
    if (daysSinceRoast <= 6) {
      adjustments.bloomTimeAdjustment = 15;
      adjustments.advice = `[Medium/Fresh] ガス放出過多${storageText}。蒸らしを+15秒延長します。`;
    } else if (daysSinceRoast >= 22) {
      adjustments.tempAdjustment = 2;
      adjustments.advice = `[Medium/Aged] 酸化リスク${storageText}。湯温+2°Cで抽出効率を改善します。`;
    } else {
      adjustments.advice = `[Medium/Peak] 飲み頃です${storageText}。バランスの良い標準レシピが最適です。`;
    }
  }

  // Inject specific freezer advice
  if (storageLocation === 'Freezer') {
      adjustments.advice += " 冷凍保存されているため、エイジング進行がストップしています。";
  } else if (storageLocation === 'HighTemp') {
      adjustments.advice += " 高温環境のため、エイジング（劣化）が非常に早く進行しています。";
  }

  return adjustments;
}

export type DynamicsAdvice = {
  score: number;
  advice: string;
};

export function analyzeExtractionDynamics(bean: Bean, recipe: Recipe): DynamicsAdvice {
  let score = 0;

  // 1. Roast Level (Light: -15, Medium: 0, Dark: +15)
  // 浅煎り＝多孔性が低く成分が出にくい(マイナス)。深煎り＝成分が出やすい(プラス)。
  const roast = (bean.roastLevel || 'Medium').toLowerCase();
  if (roast === 'light' || roast === '浅煎り') score -= 15;
  else if (roast === 'dark' || roast === '深煎り') score += 15;

  // 2. Temperature (Base: 90°C)
  // 高温＝メラノイジン等の溶解度が上がり抽出が早い(プラス)。低温＝抽出が遅い(マイナス)。
  const tempDiff = recipe.temperature - 90;
  score += tempDiff * 1.5;

  // 3. Fines & Microns (Grinder Profile)
  let finesRatio = 22; // Default (stable)
  let absoluteMicrons = 600; // Default (medium)

  const grinderModel = recipe.grinderModel || "C40_MK4";
  const profile = GRINDER_PROFILES[grinderModel];

  if (profile) {
      // Calculate absolute gap size using the relative clicks
      const clicks = getGrinderClicks(grinderModel, recipe.grindSize);
      if (typeof clicks === 'number') {
          // コニカル刃の幾何学的減衰係数（0.55）をかけて実際の隙間に近似
          absoluteMicrons = clicks * profile.micronsPerClick * 0.55;
      }

      // Fines Ratio
      const isCoarse = recipe.grindSize === 'Coarse' || recipe.grindSize === 'Medium-Coarse';
      finesRatio = isCoarse ? profile.finesRatio.coarse : profile.finesRatio.medium;
  }

  // Microns scoring (Base: 500μm). 細かいほど表面積が増えて抽出が早い(プラス)。
  score += (500 - absoluteMicrons) / 15;

  // Fines scoring (Base: 20%). 微粉が多いほど過抽出・目詰まりリスク大(プラス)。
  score += (finesRatio - 20) * 1.5;

  // 4. Pour Structure (Contact Time & Flow)
  // 注ぎの回数が多い（多投）＝ 内部拡散（Diffusion）が促進され抽出が進む（プラス）。
  const stepsCount = recipe.steps?.length || 3;
  score += (stepsCount - 3) * 3;

  // Evaluate the final score (-100 to +100 range conceptually)
  let advice = "";
  if (score > 18) {
      // 極度の過抽出リスク
      advice = `少し濃く出すぎる（渋みや苦味が強くなる）組み合わせです。お湯の温度を少し下げるか、注ぎの回数を減らして早めに切り上げるとよりスッキリと甘くなります。`;
      if (finesRatio >= 26) {
          advice += `また、使用中のグラインダー（${grinderModel}）は微粉が出やすいため、後半の注ぎは勢いをつけず優しく置いてあげるイメージで注ぐと目詰まりを防げます。`;
      }
  } else if (score < -18) {
      // 極度の未抽出リスク
      advice = `少しサッパリしすぎて、酸味が際立つ（薄く感じる）かもしれません。もう少しお湯の温度を上げるか、注ぐ回数を増やしてあげると、甘みとコクがしっかり引き出せます。`;
      if (absoluteMicrons > 700) {
          advice += `挽き目がかなり粗いため、お湯が早く抜けすぎている可能性があります。挽き目を少し細かくするのもおすすめです。`;
      }
  } else {
      // スイートスポット
      advice = `抽出バランス（甘み・酸味・コク）が非常に整いやすい、理想的なスイートスポット設定です！`;
      if (finesRatio <= 18) {
          advice += `お使いのグラインダー（${grinderModel}）のこの設定は微粉が非常に少なくクリーンなため、フレーバーがとても綺麗に出ます。`;
      }
  }

  return { score, advice };
}
