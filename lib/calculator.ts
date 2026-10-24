/**
 * NutriNexa Scientific Nutrition Calculation Engine
 * High-precision nutrient aggregation, Atwater energy distribution,
 * DRV screening comparisons, and anthropometric calculations.
 */

export const KCAL_TO_KJ = 4.184;
export const SODIUM_TO_SALT = 2.54 / 1000.0;

export const ATWATER_PROTEIN_KCAL = 4.0;
export const ATWATER_CARB_KCAL = 4.0;
export const ATWATER_FAT_KCAL = 9.0;
export const ATWATER_FIBER_KCAL = 2.0;

export interface FoodNutrientInput {
  nutrient_code: string;
  amount_per_100g: number | null;
  unit: string;
  is_missing?: boolean | number | null;
  is_trace?: boolean | number | null;
}

export interface FoodItemInput {
  id: number;
  name: string;
  code?: string | null;
  food_group: string;
}

export interface NutrientMeta {
  code: string;
  name: string;
  category: string;
  unit: string;
  energy_factor_kcal?: number;
  display_order?: number;
}

export interface SingleNutrientResult {
  amount: number | null;
  amount_per_100g: number | null;
  unit: string;
  is_missing: boolean;
  is_trace: boolean;
  display: string;
}

export interface SingleFoodCalculationResult {
  food_id: number;
  food_name: string;
  food_code: string | null;
  food_group: string;
  quantity_grams: number;
  nutrients: Record<string, SingleNutrientResult>;
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

export interface MacroDistribution {
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

export interface AggregatedCalculationResult {
  total_edible_weight_grams: number;
  items_count: number;
  totals: Record<string, AggregatedNutrientValue>;
  per_100g: Record<string, number | null>;
  macro_distribution: MacroDistribution;
  data_quality_notes: string[];
}

/**
 * Calculates nutrient contribution for a given edible quantity in grams.
 * Formula: Nutrient amount = nutrient_per_100g * quantity_in_g / 100.0
 */
export function calculateSingleFoodNutrients(
  food: FoodItemInput,
  foodNutrients: FoodNutrientInput[],
  quantityGrams: number
): SingleFoodCalculationResult {
  const scale = quantityGrams / 100.0;
  const computedNutrients: Record<string, SingleNutrientResult> = {};

  for (const fn of foodNutrients) {
    const code = fn.nutrient_code;
    const amount100g = fn.amount_per_100g;
    const unit = fn.unit;
    const isMissing = Boolean(fn.is_missing);
    const isTrace = Boolean(fn.is_trace);

    if (isMissing || amount100g === null || amount100g === undefined) {
      computedNutrients[code] = {
        amount: null,
        amount_per_100g: null,
        unit,
        is_missing: true,
        is_trace: false,
        display: "N/A",
      };
    } else if (isTrace) {
      computedNutrients[code] = {
        amount: 0.0,
        amount_per_100g: 0.0,
        unit,
        is_missing: false,
        is_trace: true,
        display: "Trace",
      };
    } else {
      const calcVal = Number((amount100g * scale).toFixed(4));
      computedNutrients[code] = {
        amount: calcVal,
        amount_per_100g: amount100g,
        unit,
        is_missing: false,
        is_trace: false,
        display: `${calcVal.toFixed(2)} ${unit}`,
      };
    }
  }

  return {
    food_id: food.id,
    food_name: food.name,
    food_code: food.code || null,
    food_group: food.food_group,
    quantity_grams: quantityGrams,
    nutrients: computedNutrients,
  };
}

/**
 * Aggregates multiple foods into total nutrient sum and concentration per 100g of mixture.
 * Respects missing value propagation: if a nutrient is missing in ANY contributing item,
 * an indicator flag is raised.
 */
export function aggregateNutrientCalculation(
  items: Array<{ quantity_grams: number; nutrients: Record<string, SingleNutrientResult> }>,
  allNutrients: NutrientMeta[]
): AggregatedCalculationResult {
  const totalGrams = items.reduce((sum, it) => sum + it.quantity_grams, 0);
  const aggregatedTotals: Record<string, AggregatedNutrientValue> = {};
  const per100gTotals: Record<string, number | null> = {};
  const dataQualityNotes: string[] = [];

  for (const nut of allNutrients) {
    const code = nut.code;
    const unit = nut.unit;
    const name = nut.name;
    const category = nut.category;

    let totalVal = 0.0;
    let missingCount = 0;
    let hasAnyData = false;

    for (const item of items) {
      const nutData = item.nutrients[code];
      if (!nutData || nutData.is_missing) {
        missingCount++;
      } else {
        hasAnyData = true;
        if (!nutData.is_trace && nutData.amount !== null) {
          totalVal += nutData.amount;
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
        dataQualityNotes.push(`${name}: missing data in ${missingCount} item(s)`);
      }

      const finalTotal = Number(totalVal.toFixed(3));
      aggregatedTotals[code] = {
        name,
        category,
        amount: finalTotal,
        unit,
        is_missing: false,
        has_partial_missing: isPartial,
        missing_items_count: missingCount,
        display: `${finalTotal.toFixed(2)} ${unit}`,
      };

      if (totalGrams > 0) {
        per100gTotals[code] = Number(((finalTotal / totalGrams) * 100.0).toFixed(3));
      } else {
        per100gTotals[code] = 0.0;
      }
    }
  }

  // Energy kJ consistency check
  if (aggregatedTotals["energy_kcal"] && aggregatedTotals["energy_kcal"].amount !== null) {
    const kcal = aggregatedTotals["energy_kcal"].amount;
    if (!aggregatedTotals["energy_kj"] || aggregatedTotals["energy_kj"].amount === null) {
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
      if (totalGrams > 0) {
        per100gTotals["energy_kj"] = Number(((kjVal / totalGrams) * 100.0).toFixed(1));
      }
    }
  }

  // Salt calculation from sodium
  if (aggregatedTotals["sodium"] && aggregatedTotals["sodium"].amount !== null) {
    const sodMg = aggregatedTotals["sodium"].amount;
    const calcSaltG = Number(((sodMg * 2.54) / 1000.0).toFixed(2));
    if (!aggregatedTotals["salt"] || aggregatedTotals["salt"].amount === null) {
      aggregatedTotals["salt"] = {
        name: "Salt (NaCl equiv)",
        category: "Minerals",
        amount: calcSaltG,
        unit: "g",
        is_missing: false,
        has_partial_missing: false,
        missing_items_count: 0,
        display: `${calcSaltG} g`,
      };
      if (totalGrams > 0) {
        per100gTotals["salt"] = Number(((calcSaltG / totalGrams) * 100.0).toFixed(3));
      }
    }
  }

  // Macronutrient energy distribution percentages
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
    total_edible_weight_grams: Number(totalGrams.toFixed(2)),
    items_count: items.length,
    totals: aggregatedTotals,
    per_100g: per100gTotals,
    macro_distribution: macroDistribution,
    data_quality_notes: dataQualityNotes,
  };
}

/**
 * Computes total recipe nutrients, per-serving values, and per-100g prepared yield values.
 */
export function calculateRecipeBreakdown(
  ingredientCalculations: Array<{ quantity_grams: number; nutrients: Record<string, SingleNutrientResult> }>,
  allNutrients: NutrientMeta[],
  servings = 1.0,
  measuredFinalWeightGrams?: number | null
) {
  const safeServings = servings > 0 ? servings : 1.0;
  const aggregated = aggregateNutrientCalculation(ingredientCalculations, allNutrients);
  const totalRawWeight = aggregated.total_edible_weight_grams;
  const effectiveFinalWeight =
    measuredFinalWeightGrams && measuredFinalWeightGrams > 0 ? measuredFinalWeightGrams : totalRawWeight;

  const perServing: Record<string, number | null> = {};
  const per100gFinal: Record<string, number | null> = {};

  for (const [code, data] of Object.entries(aggregated.totals)) {
    if (data.amount !== null) {
      perServing[code] = Number((data.amount / safeServings).toFixed(2));
      if (effectiveFinalWeight > 0) {
        per100gFinal[code] = Number(((data.amount / effectiveFinalWeight) * 100.0).toFixed(2));
      } else {
        per100gFinal[code] = 0.0;
      }
    } else {
      perServing[code] = null;
      per100gFinal[code] = null;
    }
  }

  return {
    servings: safeServings,
    raw_weight_grams: totalRawWeight,
    final_weight_grams: effectiveFinalWeight,
    yield_factor: totalRawWeight > 0 ? Number((effectiveFinalWeight / totalRawWeight).toFixed(3)) : 1.0,
    totals: aggregated.totals,
    per_serving: perServing,
    per_100g: per100gFinal,
    macro_distribution: aggregated.macro_distribution,
    data_quality_notes: aggregated.data_quality_notes,
  };
}

export interface DRVComparisonResult {
  nutrient_code: string;
  actual_intake: number | null;
  target_value: number;
  unit: string;
  target_type: string;
  upper_limit: number | null;
  percentage_of_target: number | null;
  status: "Target Met" | "Adequate Range" | "Potential Shortfall" | "Excess (Above UL)" | "No Data";
}

/**
 * Compares aggregated intake totals against selected Dietary Reference Values (DRV/RDA/AI/UL).
 */
export function compareIntakeToDrv(
  intakeTotals: Record<string, { amount: number | null }>,
  drvReferenceValues: Array<{
    nutrient_code: string;
    target_value: number;
    unit: string;
    target_type?: string;
    upper_limit?: number | null;
  }>
): DRVComparisonResult[] {
  const comparison: DRVComparisonResult[] = [];

  for (const drv of drvReferenceValues) {
    const code = drv.nutrient_code;
    const target = drv.target_value;
    const targetUnit = drv.unit;
    const targetType = drv.target_type || "RDA";
    const ul = drv.upper_limit ?? null;

    const actualData = intakeTotals[code];
    if (!actualData || actualData.amount === null || actualData.amount === undefined) {
      comparison.push({
        nutrient_code: code,
        actual_intake: null,
        target_value: target,
        unit: targetUnit,
        target_type: targetType,
        upper_limit: ul,
        percentage_of_target: null,
        status: "No Data",
      });
    } else {
      const actualAmount = actualData.amount;
      const pctTarget = target > 0 ? Number(((actualAmount / target) * 100.0).toFixed(1)) : 0.0;

      let status: DRVComparisonResult["status"] = "Adequate Range";
      if (ul && actualAmount > ul) {
        status = "Excess (Above UL)";
      } else if (pctTarget >= 100.0) {
        status = "Target Met";
      } else if (pctTarget >= 70.0) {
        status = "Adequate Range";
      } else {
        status = "Potential Shortfall";
      }

      comparison.push({
        nutrient_code: code,
        actual_intake: actualAmount,
        target_value: target,
        unit: targetUnit,
        target_type: targetType,
        upper_limit: ul,
        percentage_of_target: pctTarget,
        status,
      });
    }
  }

  return comparison;
}

/**
 * Computes BMI, WHO category, Asian-Pacific category, and Waist-to-Height Ratio.
 */
export function computeAnthropometrics(
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
    if (bmi < 18.5) {
      whoCategory = "Underweight";
    } else if (bmi < 25.0) {
      whoCategory = "Normal Weight";
    } else if (bmi < 30.0) {
      whoCategory = "Pre-Obesity / Overweight";
    } else if (bmi < 35.0) {
      whoCategory = "Obesity Class I";
    } else if (bmi < 40.0) {
      whoCategory = "Obesity Class II";
    } else {
      whoCategory = "Obesity Class III";
    }

    if (bmi < 18.5) {
      asianCategory = "Underweight";
    } else if (bmi < 23.0) {
      asianCategory = "Normal / Increasing Risk";
    } else if (bmi < 27.5) {
      asianCategory = "Overweight";
    } else {
      asianCategory = "Obese";
    }
  } else {
    whoCategory = "Pediatric (Requires WHO Growth Standard Z-Scores for Age/Sex)";
    asianCategory = "Pediatric";
  }

  let whtr: number | null = null;
  let whtrStatus: string | null = null;
  if (waistCm && waistCm > 0) {
    whtr = Number((waistCm / heightCm).toFixed(3));
    if (whtr < 0.5) {
      whtrStatus = "Healthy Range (< 0.5)";
    } else if (whtr < 0.6) {
      whtrStatus = "Increased Cardiometabolic Risk (0.5 - 0.59)";
    } else {
      whtrStatus = "Substantially Increased Cardiometabolic Risk (>= 0.6)";
    }
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
    method_citation: "WHO Technical Report Series 854 (1995) & WHO Expert Consultation (Lancet 2004)",
  };
}

/**
 * Computes descriptive statistics (mean, SD, median, IQR, min, max) for dataset variables.
 */
export function computeDescriptiveStats(values: number[]) {
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
