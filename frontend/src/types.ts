export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  institution?: string;
}

export interface NutrientDefinition {
  code: string;
  name: string;
  category: string;
  unit: string;
  energy_factor_kcal: number;
  display_order: number;
}

export interface PortionUnit {
  id?: number;
  unit_name: string;
  gram_weight: number;
}

export interface FoodNutrientValue {
  nutrient_code: string;
  amount_per_100g: number | null;
  unit: string;
  is_missing: boolean;
  is_trace: boolean;
}

export interface FoodItem {
  id: number;
  code: string;
  name: string;
  alt_names?: string;
  food_group: string;
  category?: string;
  scientific_name?: string;
  description?: string;
  source_name: string;
  source_citation?: string;
  source_year?: string;
  standard_quantity: number;
  standard_unit: string;
  data_quality_grade: string;
  is_custom?: number;
  nutrients?: Record<string, FoodNutrientValue>;
  portions?: PortionUnit[];
}

export interface ComputedNutrient {
  name: string;
  category: string;
  amount: number | null;
  unit: string;
  is_missing: boolean;
  has_partial_missing?: boolean;
  missing_items_count?: number;
  display: string;
}

export interface MacroDistribution {
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

export interface AggregatedCalculation {
  total_edible_weight_grams: number;
  items_count: number;
  totals: Record<string, ComputedNutrient>;
  per_100g: Record<string, number | null>;
  macro_distribution: MacroDistribution;
  data_quality_notes: string[];
}

export interface CalculationItemResult {
  item_id?: number;
  food_id: number;
  food_name: string;
  food_code: string;
  food_group: string;
  quantity_grams: number;
  portion_unit_name?: string;
  nutrients: Record<string, {
    amount: number | null;
    amount_per_100g: number | null;
    unit: string;
    is_missing: boolean;
    is_trace: boolean;
    display: string;
  }>;
}

export interface CalculationRecord {
  id: number;
  name: string;
  description?: string;
  notes?: string;
  project_id?: number;
  project_title?: string;
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeRecord {
  id: number;
  name: string;
  description?: string;
  category?: string;
  servings: number;
  total_weight_grams?: number;
  cooking_instructions?: string;
  research_notes?: string;
  allergens?: string;
  ingredient_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DRVComparisonItem {
  nutrient_code: string;
  actual_intake: number | null;
  target_value: number;
  unit: string;
  target_type: string;
  upper_limit: number | null;
  percentage_of_target: number | null;
  status: "Target Met" | "Adequate Range" | "Potential Shortfall" | "Excess (Above UL)" | "No Data";
}

export interface AnthropometricRecord {
  id: number;
  subject_identifier: string;
  age_years: number;
  sex: string;
  assessment_date: string;
  height_cm: number;
  weight_kg: number;
  waist_cm?: number;
  hip_cm?: number;
  bmi: number;
  bmi_category: string;
  waist_to_height_ratio?: number;
  reference_standard?: string;
  notes?: string;
}

export interface ProjectRecord {
  id: number;
  title: string;
  code: string;
  objectives?: string;
  methodology_notes?: string;
  lead_researcher?: string;
  status: string;
  tags?: string;
  calculations_count?: number;
  recipes_count?: number;
  diaries_count?: number;
  datasets_count?: number;
  updated_at: string;
}

export interface DescriptiveStat {
  n: number;
  missing: number;
  mean: number;
  median: number;
  std_dev: number;
  min: number;
  max: number;
}
