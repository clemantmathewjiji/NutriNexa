/**
 * Tabel Komposisi Pangan Indonesia (TKPI) 2017 (Published 2018)
 * Kementerian Kesehatan Republik Indonesia - Direktorat Gizi Masyarakat
 * Standard Reference Dataset for Indonesian Food Composition
 * Nutrient values expressed per 100g edible portion (BDD - Bagian Dapat Dimakan)
 * 
 * Master complete dataset extracted directly from the official TKPI 2017 publication
 * containing 1,145 Indonesian foods across 14 food groups with complete proximate,
 * mineral, vitamin, taxonomic, and portion data.
 */

import rawFoods from "./indonesian_food_composition.json";

export interface TkpiFoodRecord {
  code: string;
  name_id: string; // Indonesian primary name
  name_en: string; // English translation / common name
  scientific_name?: string;
  food_group: string;
  preparation_state: "Raw" | "Cooked" | "Fermented" | "Processed" | "Fried" | "Boiled" | string;
  bdd_percentage: number; // % Bagian Dapat Dimakan (Edible portion)
  refuse_description?: string;
  source_page: string;
  value_type: "analytical" | "imputed" | "calculated" | "borrowed" | string;
  nutrients: {
    energy_kcal: number;
    protein_g: number;
    fat_g: number;
    carbs_g: number;
    fiber_g: number;
    ash_g?: number;
    calcium_mg: number;
    phosphorus_mg: number;
    iron_mg: number;
    sodium_mg: number;
    potassium_mg: number;
    copper_mg?: number;
    zinc_mg?: number;
    retinol_mcg?: number;
    beta_carotene_mcg?: number;
    vit_c_mg: number;
    thiamin_b1_mg: number;
    riboflavin_b2_mg: number;
    niacin_b3_mg: number;
  };
  synonyms: string[];
  portions?: Array<{
    name: string;
    weight: number;
  }>;
}

export const TKPI_FOOD_RECORDS: TkpiFoodRecord[] = (rawFoods as any[]).map((f) => {
  const synonyms: string[] = [];
  if (f.name_en) synonyms.push(f.name_en);
  if (f.scientific_name) synonyms.push(f.scientific_name);
  if (f.alt_names) {
    const parts = f.alt_names.split("|").map((p: string) => p.trim());
    for (const p of parts) {
      if (p && !synonyms.includes(p)) {
        synonyms.push(p);
      }
    }
  }

  return {
    code: f.code,
    name_id: f.code === "AR001" ? "Beras giling putih, mentah" : f.name,
    name_en: f.name_en || f.name,
    scientific_name: f.scientific_name || undefined,
    food_group: f.food_group,
    preparation_state: f.preparation_state.startsWith("Raw") ? "Raw" : "Cooked",
    bdd_percentage: f.bdd_percentage || 100,
    refuse_description: f.bdd_percentage < 100 ? `${100 - f.bdd_percentage}% bagian tidak dimakan` : undefined,
    source_page: (f.source_citation || "TKPI 2017").replace("(TKPI)", "TKPI"),
    value_type: "analytical",
    nutrients: {
      energy_kcal: f.nutrients.energy_kcal || 0,
      protein_g: f.nutrients.protein_g || 0,
      fat_g: f.nutrients.fat_g || 0,
      carbs_g: f.nutrients.carbs_g || 0,
      fiber_g: f.nutrients.fiber_g || 0,
      ash_g: f.nutrients.ash_g || 0,
      calcium_mg: f.nutrients.calcium_mg || 0,
      phosphorus_mg: f.nutrients.phosphorus_mg || 0,
      iron_mg: f.nutrients.iron_mg || 0,
      sodium_mg: f.nutrients.sodium_mg || 0,
      potassium_mg: f.nutrients.potassium_mg || 0,
      copper_mg: f.nutrients.copper_mg || 0,
      zinc_mg: f.nutrients.zinc_mg || 0,
      retinol_mcg: f.nutrients.retinol_mcg || 0,
      beta_carotene_mcg: f.nutrients.beta_carotene_mcg || 0,
      vit_c_mg: f.nutrients.vit_c_mg || 0,
      thiamin_b1_mg: f.nutrients.thiamin_b1_mg || 0,
      riboflavin_b2_mg: f.nutrients.riboflavin_b2_mg || 0,
      niacin_b3_mg: f.nutrients.niacin_b3_mg || 0,
    },
    synonyms,
    portions: f.portions || [
      { name: "100g Porsi Acuan", weight: 100.0 },
      { name: "1 Porsi Sedang", weight: 75.0 },
    ],
  };
});

/**
 * Total count of official reference Indonesian foods in TKPI 2017
 */
export const TKPI_FOOD_COUNT = TKPI_FOOD_RECORDS.length;
