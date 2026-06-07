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
