import { describe, it, expect } from "vitest";
import {
  calculateNutrientForWeight,
  aggregateFormulation,
  calculateRecipeYieldBreakdown,
  calculateAnthropometrics,
  calculateDescriptiveStatistics,
} from "../src/services/calculator";
import { estimateConsumedPortion } from "../src/services/portionEstimator";
import { searchTkpiFoods, getTkpiFoodByCode } from "../src/services/tkpiService";

describe("NutriNexa Scientific Calculation Engine", () => {
  it("calculates nutrient amount correctly per edible weight", () => {
    // 20.8g protein per 100g tempeh, 50g consumed with 100% BDD -> 10.4g protein
    const res = calculateNutrientForWeight(20.8, 50.0, 100.0, "g");
    expect(res.amount).toBe(10.4);
    expect(res.is_missing).toBe(false);
    expect(res.display).toBe("10.40 g");
  });

  it("factors in % BDD (edible portion) refuse adjustment correctly", () => {
    // Chicken with 58% BDD: 100g gross chicken -> 58g edible portion.
    // Protein: 18.2g per 100g edible -> 18.2 * 0.58 = 10.556g
    const res = calculateNutrientForWeight(18.2, 100.0, 58.0, "g");
    expect(res.amount).toBeCloseTo(10.556, 2);
  });

  it("handles missing nutrients without falsifying as zero", () => {
    const res = calculateNutrientForWeight(null, 100.0, 100.0, "mg", true);
    expect(res.amount).toBeNull();
    expect(res.is_missing).toBe(true);
    expect(res.display).toContain("N/A");
  });

  it("handles trace nutrients properly", () => {
    const res = calculateNutrientForWeight(0.001, 100.0, 100.0, "mg", false, true);
    expect(res.amount).toBe(0.0);
    expect(res.is_trace).toBe(true);
    expect(res.display).toBe("Trace");
  });

  it("aggregates recipes with yield factors and per-serving breakdown", () => {
    const ingredients = [
      {
        food_name: "Raw Rice",
        quantity_grams: 100,
        bdd_percentage: 100,
        nutrients: {
          energy_kcal: { amount_per_100g: 357, unit: "kcal" },
          protein: { amount_per_100g: 8.4, unit: "g" },
          fat: { amount_per_100g: 1.7, unit: "g" },
          carbs: { amount_per_100g: 77.1, unit: "g" },
        },
      },
      {
        food_name: "Raw Tempeh",
        quantity_grams: 50,
        bdd_percentage: 100,
        nutrients: {
          energy_kcal: { amount_per_100g: 201, unit: "kcal" },
          protein: { amount_per_100g: 20.8, unit: "g" },
          fat: { amount_per_100g: 8.8, unit: "g" },
          carbs: { amount_per_100g: 13.5, unit: "g" },
        },
      },
    ];

    const metadata = [
      { code: "energy_kcal", name: "Energy", category: "Energy", unit: "kcal" },
      { code: "protein", name: "Protein", category: "Macronutrients", unit: "g" },
      { code: "fat", name: "Total Fat", category: "Macronutrients", unit: "g" },
      { code: "carbs", name: "Carbohydrates", category: "Macronutrients", unit: "g" },
    ];

    // Raw weight = 150g, cooked weight after water absorption = 250g, 2 servings
    const breakdown = calculateRecipeYieldBreakdown(ingredients, metadata, 2.0, 250.0);

    expect(breakdown.raw_weight_grams).toBe(150.0);
    expect(breakdown.cooked_weight_grams).toBe(250.0);
    expect(breakdown.yield_factor).toBeCloseTo(1.667, 2);

    // Total calories = 357 + 0.5 * 201 = 357 + 100.5 = 457.5 kcal
    expect(breakdown.totals["energy_kcal"].amount).toBe(457.5);
    // Per serving (2 servings) = 457.5 / 2 = 228.75 kcal
    expect(breakdown.per_serving["energy_kcal"]).toBe(228.75);
  });

  it("computes WHO and Asian-Pacific BMI categories correctly", () => {
    // 72 kg, 175 cm -> BMI = 72 / (1.75^2) = 23.51
    const anthro = calculateAnthropometrics(72, 175, 25, "Male", 80, 95);
    expect(anthro.bmi).toBe(23.51);
    expect(anthro.who_category).toBe("Normal Weight");
    // Under Asian-Pacific standard, 23.0 - 27.4 is Overweight
    expect(anthro.asian_category).toBe("Overweight");
    // WHtR = 80 / 175 = 0.457 (< 0.50 Healthy)
    expect(anthro.waist_to_height_ratio).toBe(0.457);
    expect(anthro.waist_to_height_status).toContain("Healthy Range");
  });

  it("computes descriptive sample statistics with n-1 degrees of freedom", () => {
    const data = [10, 12, 14, 16, 18];
    const stats = calculateDescriptiveStatistics(data);
    expect(stats.count).toBe(5);
    expect(stats.mean).toBe(14);
    expect(stats.median).toBe(14);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(18);
    // Sample variance = [(16 + 4 + 0 + 4 + 16) / 4] = 40 / 4 = 10 -> std = sqrt(10) ≈ 3.16
    expect(stats.std).toBe(3.16);
  });
});

describe("Indonesian Nutrition Reference Integration", () => {
  it("estimates portion from Buku Foto Makanan 2014 and links to TKPI 2017", () => {
    // 1 Porsi Sedang (S) Cooked Rice = 100g
    const res = estimateConsumedPortion("BFM-NASI-01", "sedang", 1.0);
    expect(res.total_raw_weight_grams).toBe(100);
    expect(res.total_edible_weight_grams).toBe(100);
    expect(res.photo_item.food_name_id).toBe("Nasi Putih");
    expect(res.calculated_nutrients["energy_kcal"].amount).toBe(180);
    expect(res.source_citation).toContain("Buku Foto Makanan 2014");
    expect(res.source_citation).toContain("TKPI 2017");
  });

  it("handles refuse correctly in Buku Foto Makanan (e.g. fried chicken 70% BDD)", () => {
    // 1 Porsi Sedang (S) Fried Chicken = 60g gross weight -> 42g edible weight
    const res = estimateConsumedPortion("BFM-AYAM-04", "sedang", 1.0);
    expect(res.total_raw_weight_grams).toBe(60);
    expect(res.total_edible_weight_grams).toBe(42);
    expect(res.bdd_percentage).toBe(70);
  });

  it("searches Indonesian foods in TKPI 2017 by Indonesian vernacular names", () => {
    const searchRes = searchTkpiFoods({ query: "tempe" });
    expect(searchRes.total).toBeGreaterThan(0);
    expect(searchRes.results[0].name_id.toLowerCase()).toContain("tempe");

    const directLookup = getTkpiFoodByCode("AR001");
    expect(directLookup).toBeDefined();
    expect(directLookup?.name_id).toContain("Beras giling putih");
  });
});
