import { BUKU_FOTO_MAKANAN_CATALOG, PhotoPortionItem } from "@/data/bukuFotoMakanan2014";
import { TKPI_FOOD_RECORDS, TkpiFoodRecord } from "@/data/tkpi2017";
import { calculateNutrientForWeight } from "./calculator";

export interface PortionEstimationResult {
  photo_item: PhotoPortionItem;
  tkpi_record?: TkpiFoodRecord;
  portion_size: "kecil" | "sedang" | "besar";
  portion_count: number;
  household_description: string;
  total_raw_weight_grams: number;
  total_edible_weight_grams: number;
  bdd_percentage: number;
  refuse_note?: string;
  source_citation: string;
  calculated_nutrients: Record<
    string,
    {
      amount: number | null;
      unit: string;
      display: string;
    }
  >;
}

export function estimateConsumedPortion(
  photoItemId: string,
  portionSize: "kecil" | "sedang" | "besar",
  portionCount: number = 1.0
): PortionEstimationResult {
  const photoItem = BUKU_FOTO_MAKANAN_CATALOG.find((p) => p.id === photoItemId);
  if (!photoItem) {
    throw new Error(`Buku Foto Makanan item ${photoItemId} not found.`);
  }

  const portionData = photoItem.portions[portionSize];
  const safeCount = portionCount > 0 ? portionCount : 1.0;

  const totalRawWeight = Number((portionData.raw_weight_grams * safeCount).toFixed(1));
  const totalEdibleWeight = Number((portionData.edible_weight_grams * safeCount).toFixed(1));

  // Find linked TKPI record
  const tkpiRecord = TKPI_FOOD_RECORDS.find((t) => t.code === photoItem.food_code_ref);

  const calculatedNutrients: Record<string, { amount: number | null; unit: string; display: string }> = {};

  if (tkpiRecord) {
    const nutEntries = [
      { key: "energy_kcal", val: tkpiRecord.nutrients.energy_kcal, unit: "kcal" },
      { key: "protein", val: tkpiRecord.nutrients.protein_g, unit: "g" },
      { key: "fat", val: tkpiRecord.nutrients.fat_g, unit: "g" },
      { key: "carbs", val: tkpiRecord.nutrients.carbs_g, unit: "g" },
      { key: "fiber", val: tkpiRecord.nutrients.fiber_g, unit: "g" },
      { key: "calcium", val: tkpiRecord.nutrients.calcium_mg, unit: "mg" },
      { key: "iron", val: tkpiRecord.nutrients.iron_mg, unit: "mg" },
      { key: "sodium", val: tkpiRecord.nutrients.sodium_mg, unit: "mg" },
      { key: "potassium", val: tkpiRecord.nutrients.potassium_mg, unit: "mg" },
      { key: "vit_c", val: tkpiRecord.nutrients.vit_c_mg, unit: "mg" },
      { key: "thiamin_b1", val: tkpiRecord.nutrients.thiamin_b1_mg, unit: "mg" },
      { key: "riboflavin_b2", val: tkpiRecord.nutrients.riboflavin_b2_mg, unit: "mg" },
      { key: "niacin_b3", val: tkpiRecord.nutrients.niacin_b3_mg, unit: "mg" },
    ];

    for (const nut of nutEntries) {
      // Direct edible weight scaling: nutrient per 100g * totalEdibleWeight / 100.0
      const res = calculateNutrientForWeight(nut.val, totalEdibleWeight, 100.0, nut.unit);
      calculatedNutrients[nut.key] = {
        amount: res.amount,
        unit: nut.unit,
        display: res.display,
      };
    }
  }

  return {
    photo_item: photoItem,
    tkpi_record: tkpiRecord,
    portion_size: portionSize,
    portion_count: safeCount,
    household_description: `${safeCount} x ${portionData.household_desc}`,
    total_raw_weight_grams: totalRawWeight,
    total_edible_weight_grams: totalEdibleWeight,
    bdd_percentage: photoItem.bdd_percentage,
    refuse_note: photoItem.refuse_note,
    source_citation: `${photoItem.source_page} & ${tkpiRecord?.source_page || "TKPI 2017"}`,
    calculated_nutrients: calculatedNutrients,
  };
}
