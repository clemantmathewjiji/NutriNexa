/**
 * In-memory fallback data repository for zero-downtime execution
 * and instant local testing prior to or alongside Supabase PostgreSQL connection.
 */

import { STANDARD_NUTRIENTS, FOOD_RECORDS, DRV_PROFILES } from "./seedData";

export interface MockUser {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  salt: string;
  role: string;
  institution: string;
}

export interface MockFood {
  id: number;
  code: string;
  name: string;
  alt_names: string;
  food_group: string;
  category: string;
  scientific_name: string;
  description: string;
  source_name: string;
  source_citation: string;
  source_year: string;
  standard_quantity: number;
  standard_unit: string;
  preparation_state: string;
  data_quality_grade: string;
  is_custom: number;
  user_id: number | null;
  portions: Array<{ id: number; unit_name: string; gram_weight: number }>;
  nutrients: Record<string, { amount_per_100g: number; unit: string; is_missing: number; is_trace: number }>;
}

class MockStore {
  users: MockUser[] = [];
  tokens: Map<string, { userId: number; expiresAt: Date }> = new Map();
  foods: MockFood[] = [];
  calculations: any[] = [];
  recipes: any[] = [];
  diaries: any[] = [];
  anthropometrics: any[] = [];
  projects: any[] = [];
  reports: any[] = [];
  auditLogs: any[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 1. Initial Demo User
    // NutriNexa2026! with salt 00112233445566778899aabbccddeeff
    this.users.push({
      id: 1,
      name: "Dr. Clemant Mathew Jiji",
      email: "demo@nutrinexa.org",
      password_hash: "3139fcbfaec2b55776d6ec555bc0d1eb9f02931db6fb9c0715d9cf2813dfd597",
      salt: "00112233445566778899aabbccddeeff",
      role: "Principal Investigator",
      institution: "SJCET Palai Nutrition Science & Computational Lab",
    });

    // 2. Initial Reference Foods
    let foodIdCounter = 1;
    let portionIdCounter = 1;

    for (const record of FOOD_RECORDS) {
      const foodId = foodIdCounter++;
      const portions = record.portions.map((p) => ({
        id: portionIdCounter++,
        unit_name: p.name,
        gram_weight: p.weight,
      }));

      const nutrientsMap: Record<string, any> = {};
      for (const [code, val] of Object.entries(record.nutrients)) {
        const nutDef = STANDARD_NUTRIENTS.find((n) => n.code === code);
        nutrientsMap[code] = {
          amount_per_100g: val,
          unit: nutDef ? nutDef.unit : "g",
          is_missing: 0,
          is_trace: 0,
        };
      }

      this.foods.push({
        id: foodId,
        code: record.code,
        name: record.name,
        alt_names: record.alt_names,
        food_group: record.food_group,
        category: record.category,
        scientific_name: record.scientific_name,
        description: record.description,
        source_name: record.source_name,
        source_citation: record.source_citation,
        source_year: record.source_year,
        standard_quantity: 100.0,
        standard_unit: "g",
        preparation_state: "Raw / Analyzed",
        data_quality_grade: "USDA National Nutrient DB (Grade A)",
        is_custom: 0,
        user_id: null,
        portions,
        nutrients: nutrientsMap,
      });
    }

    // 3. Initial Project
    this.projects.push({
      id: 1,
      user_id: 1,
      title: "Nutritional Quality & Bioactive Intake in University Student Cohort",
      code: "NUTRI-2026-A",
      objectives: "Assess micronutrient adequacy, omega-3 to omega-6 ratio, and dietary fiber intake across 120 undergraduate students.",
      methodology_notes: "Repeated 24-hour recalls analyzed against US DRI and ICMR-NIN 2020 standards using NutriNexa calculation engine.",
      lead_researcher: "Dr. Clemant Mathew Jiji",
      status: "Active",
      tags: "Micronutrients, University Cohort, Dietary Recall, Bioavailability",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      datasets: [
        {
          id: 1,
          dataset_name: "Cohort Baseline Macronutrients",
          description: "Initial 24-hour dietary recall survey records (N=48).",
          row_count: 48,
          variables_json: JSON.stringify(["SubjectID", "Energy_kcal", "Protein_g", "Carb_g", "Fat_g", "Fiber_g"]),
          data_json: "[]",
          descriptive_stats_json: JSON.stringify({
            Energy_kcal: { count: 48, mean: 2154.2, std: 342.1, median: 2110.0, iqr: 420.0, min: 1480.0, max: 2950.0 },
            Protein_g: { count: 48, mean: 78.4, std: 18.2, median: 76.5, iqr: 24.0, min: 42.0, max: 124.0 },
            Fiber_g: { count: 48, mean: 22.1, std: 6.8, median: 21.0, iqr: 8.5, min: 9.0, max: 38.0 },
          }),
        },
      ],
    });

    // 4. Initial Saved Calculation
    this.calculations.push({
      id: 1,
      user_id: 1,
      project_id: 1,
      name: "High-Protein Breakfast Composite (Sample)",
      description: "Nutrient composition of rolled oats, whole egg, and plain Greek yogurt breakfast.",
      notes: "Sample calculation for academic protocol demonstration.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        { food_id: 1, quantity_grams: 60.0, portion_unit_name: "60g dry oats", serving_multiplier: 1.0 },
        { food_id: 6, quantity_grams: 50.0, portion_unit_name: "1 large egg", serving_multiplier: 1.0 },
        { food_id: 12, quantity_grams: 100.0, portion_unit_name: "100g Greek yogurt", serving_multiplier: 1.0 },
      ],
    });

    // 5. Initial Sample Recipe
    this.recipes.push({
      id: 1,
      user_id: 1,
      project_id: 1,
      name: "Mediterranean Wild Salmon & Greens",
      description: "Heart-healthy pan-seared salmon with baby spinach and cold-pressed extra virgin olive oil.",
      category: "Entrée",
      servings: 2.0,
      total_weight_grams: 310.0,
      cooking_instructions: "Sear salmon in olive oil for 4 minutes per side; gently wilt fresh spinach with residual heat.",
      research_notes: "Demonstration recipe showing nutrient concentration per serving.",
      allergens: "Fish",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: [
        { food_id: 5, quantity_grams: 198.0, portion_unit_name: "1/2 fillet", preparation_note: "Fresh skinless wild fillet" },
        { food_id: 7, quantity_grams: 100.0, portion_unit_name: "Raw baby spinach", preparation_note: "Washed raw baby spinach" },
        { food_id: 11, quantity_grams: 14.0, portion_unit_name: "1 tbsp", preparation_note: "Extra virgin cold pressed" },
      ],
    });

    // 6. Initial Food Diary (24-Hour Recall)
    this.diaries.push({
      id: 1,
      user_id: 1,
      project_id: 1,
      client_code: "SUBJ-409",
      diary_date: "2026-10-24",
      assessment_type: "24-Hour Recall",
      reference_profile_id: 1,
      notes: "Day 1 baseline recall for longitudinal micronutrient study.",
      created_at: new Date().toISOString(),
      entries: [
        { id: 1, meal_type: "Breakfast", food_id: 1, recipe_id: null, item_type: "food", quantity_grams: 81.0, portion_description: "1 cup dry rolled oats" },
        { id: 2, meal_type: "Breakfast", food_id: 9, recipe_id: null, item_type: "food", quantity_grams: 118.0, portion_description: "1 medium banana" },
        { id: 3, meal_type: "Lunch", food_id: null, recipe_id: 1, item_type: "recipe", quantity_grams: 155.0, portion_description: "1 serving Mediterranean Salmon" },
      ],
    });

    // 7. Initial Anthropometric Assessment
    this.anthropometrics.push({
      id: 1,
      user_id: 1,
      project_id: 1,
      subject_identifier: "SUBJ-409",
      age_years: 23,
      sex: "Male",
      assessment_date: "2026-10-24",
      height_cm: 178.0,
      weight_kg: 72.5,
      waist_cm: 81.0,
      hip_cm: 96.0,
      bmi: 22.88,
      bmi_category: "Normal Weight",
      waist_to_height_ratio: 0.455,
      reference_standard: "WHO Adult Standard",
      notes: "Baseline physical assessment.",
      created_at: new Date().toISOString(),
    });

    // 8. Initial Audit Log
    this.auditLogs.push({
      id: 1,
      user_id: 1,
      action: "SYSTEM_INITIALIZED",
      entity_type: "system",
      entity_id: 1,
      details: "NutriNexa Next.js full-stack platform initialized with Drizzle ORM.",
      timestamp: new Date().toISOString(),
    });
  }
}

// Global singleton instance
const globalForMock = global as unknown as { mockStore: MockStore };
export const mockStore = globalForMock.mockStore || new MockStore();
if (process.env.NODE_ENV !== "production") globalForMock.mockStore = mockStore;
