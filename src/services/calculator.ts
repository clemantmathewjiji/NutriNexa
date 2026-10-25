/**
 * NutriNexa Scientific Nutrition Calculation Engine
 * High-precision nutrient aggregation, Atwater energy distribution,
 * cooked yield factors, edible portion (BDD) corrections, and DRV screening.
 */

export const KCAL_TO_KJ = 4.184;
export const SODIUM_TO_SALT = 2.54 / 1000.0;

export const ATWATER_PROTEIN_KCAL = 4.0;
export const ATWATER_CARB_KCAL = 4.0;
export const ATWATER_FAT_KCAL = 9.0;
export const ATWATER_FIBER_KCAL = 2.0;

export interface NutrientItemInput {
  nutrient_code: string;
  amount_per_100g: number | null;
  unit: string;
  is_missing?: boolean;
  is_trace?: boolean;
}

export interface SingleNutrientResult {
  amount: number | null;
  amount_per_100g: number | null;
  unit: string;
  is_missing: boolean;
  is_trace: boolean;
  display: string;
}

export interface MacroDistribution {
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

export interface AggregatedNutrientValue {
  name: string;
  category: string;
  amount: number | null;
  unit: string;
  is_missing: boolean;
  has_partial_missing: boolean;
  missing_items_count: number;
  display: string;
}

export interface AggregatedCalculationResult {
  total_raw_weight_grams: number;
  total_edible_weight_grams: number;
  items_count: number;
  totals: Record<string, AggregatedNutrientValue>;
  per_100g: Record<string, number | null>;
  macro_distribution: MacroDistribution;
  data_quality_notes: string[];
}

/**
 * Calculates nutrient contribution for edible consumed weight.
 * Formula: Nutrient amount = nutrient_per_100g * (quantity_grams * bdd_factor) / 100.0
 */
export function calculateNutrientForWeight(
  nutrientPer100g: number | null | undefined,
  quantityGrams: number,
  bddPercentage: number = 100.0,
  unit: string = "g",
  isMissing: boolean = false,
  isTrace: boolean = false
): SingleNutrientResult {
  if (isMissing || nutrientPer100g === null || nutrientPer100g === undefined) {
    return {
      amount: null,
      amount_per_100g: null,
      unit,
      is_missing: true,
      is_trace: false,
      display: "N/A (Missing)",
    };
  }

  if (isTrace) {
    return {
      amount: 0.0,
      amount_per_100g: 0.0,
      unit,
      is_missing: false,
      is_trace: true,
      display: "Trace",
    };
  }

  const bddFactor = Math.max(0.0, Math.min(1.0, bddPercentage / 100.0));
  const edibleGrams = quantityGrams * bddFactor;
  const computedAmount = Number(((nutrientPer100g * edibleGrams) / 100.0).toFixed(4));

  return {
    amount: computedAmount,
    amount_per_100g: nutrientPer100g,
    unit,
    is_missing: false,
    is_trace: false,
    display: `${computedAmount.toFixed(2)} ${unit}`,
  };
}

/**
 * Aggregates multi-ingredient composite formulations.
 * Preserves missing data propagation without falsifying values as zero.
 */
export function aggregateFormulation(
  items: Array<{
    food_name: string;
    quantity_grams: number;
    bdd_percentage?: number;
    nutrients: Record<string, { amount_per_100g: number | null; unit: string; is_missing?: boolean; is_trace?: boolean }>;
  }>,
  nutrientMetadataList: Array<{ code: string; name: string; category: string; unit: string }>
): AggregatedCalculationResult {
  let totalRawWeight = 0.0;
  let totalEdibleWeight = 0.0;

  for (const item of items) {
    const raw = item.quantity_grams;
    const bdd = item.bdd_percentage ?? 100.0;
    const edible = raw * (bdd / 100.0);
    totalRawWeight += raw;
    totalEdibleWeight += edible;
  }

  const aggregatedTotals: Record<string, AggregatedNutrientValue> = {};
  const per100gTotals: Record<string, number | null> = {};
  const dataQualityNotes: string[] = [];

  for (const meta of nutrientMetadataList) {
    const code = meta.code;
    const unit = meta.unit;
    const name = meta.name;
    const category = meta.category;

    let totalAmount = 0.0;
    let missingCount = 0;
    let hasAnyData = false;

    for (const item of items) {
      const nut = item.nutrients[code];
      const raw = item.quantity_grams;
      const bdd = item.bdd_percentage ?? 100.0;

      if (!nut || nut.is_missing || nut.amount_per_100g === null || nut.amount_per_100g === undefined) {
        missingCount++;
      } else {
        hasAnyData = true;
        if (!nut.is_trace) {
          const edible = raw * (bdd / 100.0);
          totalAmount += (nut.amount_per_100g * edible) / 100.0;
        }
      }
    }

    if (!hasAnyData) {
      aggregatedTotals[code] = {
        name,
        category,
        amount: null,
        unit,
        is_missing: true,
        has_partial_missing: false,
        missing_items_count: missingCount,
        display: "N/A",
      };
      per100gTotals[code] = null;
    } else {
      const isPartial = missingCount > 0;
      if (isPartial) {
        dataQualityNotes.push(`${name}: Unanalyzed in ${missingCount} ingredient(s)`);
      }

      const finalVal = Number(totalAmount.toFixed(3));
      aggregatedTotals[code] = {
        name,
        category,
        amount: finalVal,
        unit,
        is_missing: false,
        has_partial_missing: isPartial,
        missing_items_count: missingCount,
        display: `${finalVal.toFixed(2)} ${unit}`,
      };

      if (totalEdibleWeight > 0) {
        per100gTotals[code] = Number(((finalVal / totalEdibleWeight) * 100.0).toFixed(3));
      } else {
        per100gTotals[code] = 0.0;
      }
    }
  }

  // Energy kJ consistency
  if (aggregatedTotals["energy_kcal"] && aggregatedTotals["energy_kcal"].amount !== null) {
    const kcal = aggregatedTotals["energy_kcal"].amount;
    const kjVal = Number((kcal * KCAL_TO_KJ).toFixed(1));
    aggregatedTotals["energy_kj"] = {
      name: "Energy (kJ)",
      category: "Energy",
      amount: kjVal,
      unit: "kJ",
      is_missing: false,
      has_partial_missing: false,
      missing_items_count: 0,
      display: `${kjVal} kJ`,
    };
    if (totalEdibleWeight > 0) {
      per100gTotals["energy_kj"] = Number(((kjVal / totalEdibleWeight) * 100.0).toFixed(1));
    }
  }

  // Salt equivalent calculation from sodium
  if (aggregatedTotals["sodium"] && aggregatedTotals["sodium"].amount !== null) {
    const sodMg = aggregatedTotals["sodium"].amount;
    const saltG = Number(((sodMg * 2.54) / 1000.0).toFixed(2));
    aggregatedTotals["salt"] = {
      name: "Salt (NaCl equivalent)",
      category: "Minerals",
      amount: saltG,
      unit: "g",
      is_missing: false,
      has_partial_missing: false,
      missing_items_count: 0,
      display: `${saltG} g`,
    };
    if (totalEdibleWeight > 0) {
      per100gTotals["salt"] = Number(((saltG / totalEdibleWeight) * 100.0).toFixed(3));
    }
  }

  // Atwater Macronutrient Distribution
  const energyKcal = aggregatedTotals["energy_kcal"]?.amount || 0.0;
  let macroDistribution: MacroDistribution = { protein_pct: 0.0, carbs_pct: 0.0, fat_pct: 0.0 };

  if (energyKcal > 0) {
    const pG = aggregatedTotals["protein"]?.amount || 0.0;
    const cG = aggregatedTotals["carbs"]?.amount || 0.0;
    const fG = aggregatedTotals["fat"]?.amount || 0.0;

    const pKcal = pG * ATWATER_PROTEIN_KCAL;
    const cKcal = cG * ATWATER_CARB_KCAL;
    const fKcal = fG * ATWATER_FAT_KCAL;

    macroDistribution = {
      protein_pct: Number(((pKcal / energyKcal) * 100.0).toFixed(1)),
      carbs_pct: Number(((cKcal / energyKcal) * 100.0).toFixed(1)),
      fat_pct: Number(((fKcal / energyKcal) * 100.0).toFixed(1)),
    };
  }

  return {
    total_raw_weight_grams: Number(totalRawWeight.toFixed(2)),
    total_edible_weight_grams: Number(totalEdibleWeight.toFixed(2)),
    items_count: items.length,
    totals: aggregatedTotals,
    per_100g: per100gTotals,
    macro_distribution: macroDistribution,
    data_quality_notes: dataQualityNotes,
  };
}

/**
 * Computes standardized recipe yield adjustments, per-serving and per-100g prepared values.
 */
export function calculateRecipeYieldBreakdown(
  items: Array<{
    food_name: string;
    quantity_grams: number;
    bdd_percentage?: number;
    nutrients: Record<string, { amount_per_100g: number | null; unit: string; is_missing?: boolean; is_trace?: boolean }>;
  }>,
  nutrientMetadataList: Array<{ code: string; name: string; category: string; unit: string }>,
  servings: number = 1.0,
  measuredFinalCookedWeight?: number | null
) {
  const safeServings = servings > 0 ? servings : 1.0;
  const aggregated = aggregateFormulation(items, nutrientMetadataList);
  const rawWeight = aggregated.total_raw_weight_grams;
  const effectiveFinalWeight =
    measuredFinalCookedWeight && measuredFinalCookedWeight > 0 ? measuredFinalCookedWeight : rawWeight;
  const yieldFactor = rawWeight > 0 ? Number((effectiveFinalWeight / rawWeight).toFixed(3)) : 1.0;

  const perServing: Record<string, number | null> = {};
  const per100gCooked: Record<string, number | null> = {};

  for (const [code, val] of Object.entries(aggregated.totals)) {
    if (val.amount !== null) {
      perServing[code] = Number((val.amount / safeServings).toFixed(2));
      if (effectiveFinalWeight > 0) {
        per100gCooked[code] = Number(((val.amount / effectiveFinalWeight) * 100.0).toFixed(2));
      } else {
        per100gCooked[code] = 0.0;
      }
    } else {
      perServing[code] = null;
      per100gCooked[code] = null;
    }
  }

  return {
    servings: safeServings,
    raw_weight_grams: rawWeight,
    cooked_weight_grams: effectiveFinalWeight,
    yield_factor: yieldFactor,
    totals: aggregated.totals,
    per_serving: perServing,
    per_100g_cooked: per100gCooked,
    macro_distribution: aggregated.macro_distribution,
    data_quality_notes: aggregated.data_quality_notes,
  };
}

/**
 * Anthropometric indices: BMI (WHO & Asian-Pacific standards) and WHtR cardiometabolic risk.
 */
export function calculateAnthropometrics(
  weightKg: number,
  heightCm: number,
  ageYears: number,
  sex: string,
  waistCm?: number | null,
  hipCm?: number | null
) {
  if (heightCm <= 0 || weightKg <= 0) {
    throw new Error("Height and weight must be positive numbers.");
  }

  const heightM = heightCm / 100.0;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(2));

  let whoCategory = "Normal Weight";
  let asianCategory = "Normal / Increasing Risk";

  if (ageYears >= 18) {
    if (bmi < 18.5) whoCategory = "Underweight";
    else if (bmi < 25.0) whoCategory = "Normal Weight";
    else if (bmi < 30.0) whoCategory = "Pre-Obesity / Overweight";
    else if (bmi < 35.0) whoCategory = "Obesity Class I";
    else if (bmi < 40.0) whoCategory = "Obesity Class II";
    else whoCategory = "Obesity Class III";

    if (bmi < 18.5) asianCategory = "Underweight";
    else if (bmi < 23.0) asianCategory = "Normal / Increasing Risk";
    else if (bmi < 27.5) asianCategory = "Overweight";
    else asianCategory = "Obese";
  } else {
    whoCategory = "Pediatric (Requires WHO Growth Standard Z-Scores for Age/Sex)";
    asianCategory = "Pediatric";
  }

  let whtr: number | null = null;
  let whtrStatus: string | null = null;
  if (waistCm && waistCm > 0) {
    whtr = Number((waistCm / heightCm).toFixed(3));
    if (whtr < 0.5) whtrStatus = "Healthy Range (< 0.50)";
    else if (whtr < 0.6) whtrStatus = "Increased Cardiometabolic Risk (0.50 - 0.59)";
    else whtrStatus = "Substantially Increased Cardiometabolic Risk (>= 0.60)";
  }

  let waistHipRatio: number | null = null;
  if (waistCm && hipCm && hipCm > 0) {
    waistHipRatio = Number((waistCm / hipCm).toFixed(2));
  }

  return {
    bmi,
    who_category: whoCategory,
    asian_category: asianCategory,
    waist_to_height_ratio: whtr,
    waist_to_height_status: whtrStatus,
    waist_hip_ratio: waistHipRatio,
    is_pediatric: ageYears < 18,
    method_citation: "WHO TRS 854 (1995) & WHO Expert Consultation on Asian Populations (Lancet 2004)",
  };
}

/**
 * Descriptive statistics engine (Mean, Sample Variance n-1, Sample SD, Median, IQR, Min, Max).
 */
export function calculateDescriptiveStatistics(values: number[]) {
  if (!values || values.length === 0) {
    return { count: 0, mean: 0, std: 0, median: 0, iqr: 0, min: 0, max: 0 };
  }

  const valid = values.filter((v) => typeof v === "number" && !isNaN(v)).sort((a, b) => a - b);
  const n = valid.length;
  if (n === 0) {
    return { count: 0, mean: 0, std: 0, median: 0, iqr: 0, min: 0, max: 0 };
  }

  const sum = valid.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const std = Math.sqrt(variance);

  const getPercentile = (p: number) => {
    const idx = (p / 100) * (n - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return valid[lower] * (1 - weight) + valid[upper] * weight;
  };

  const median = getPercentile(50);
  const q1 = getPercentile(25);
  const q3 = getPercentile(75);
  const iqr = q3 - q1;

  return {
    count: n,
    mean: Number(mean.toFixed(2)),
    std: Number(std.toFixed(2)),
    median: Number(median.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    min: Number(valid[0].toFixed(2)),
    max: Number(valid[n - 1].toFixed(2)),
  };
}
