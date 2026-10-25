import { TKPI_FOOD_RECORDS, TkpiFoodRecord } from "@/data/tkpi2017";

export interface TkpiSearchParams {
  query?: string;
  foodGroup?: string;
  preparationState?: string;
  limit?: number;
}

export function searchTkpiFoods(params: TkpiSearchParams = {}): {
  total: number;
  results: TkpiFoodRecord[];
  food_groups: string[];
} {
  const q = (params.query || "").trim().toLowerCase();
  const group = params.foodGroup || "All Groups";
  const state = params.preparationState || "All States";
  const limit = params.limit || 50;

  const allGroups = Array.from(new Set(TKPI_FOOD_RECORDS.map((f) => f.food_group))).sort();

  let filtered = TKPI_FOOD_RECORDS.filter((item) => {
    // Group filter
    if (group !== "All Groups" && item.food_group !== group) {
      return false;
    }

    // Preparation state filter
    if (state !== "All States" && item.preparation_state !== state) {
      return false;
    }

    // Query filter (matches code, Indonesian name, English name, scientific name, or any synonym)
    if (q.length > 0) {
      const matchCode = item.code.toLowerCase().includes(q);
      const matchNameId = item.name_id.toLowerCase().includes(q);
      const matchNameEn = item.name_en.toLowerCase().includes(q);
      const matchSci = item.scientific_name?.toLowerCase().includes(q) || false;
      const matchSynonyms = item.synonyms.some((s) => s.toLowerCase().includes(q));

      return matchCode || matchNameId || matchNameEn || matchSci || matchSynonyms;
    }

    return true;
  });

  return {
    total: filtered.length,
    results: filtered.slice(0, limit),
    food_groups: allGroups,
  };
}

export function getTkpiFoodByCode(code: string): TkpiFoodRecord | undefined {
  return TKPI_FOOD_RECORDS.find((f) => f.code.toUpperCase() === code.trim().toUpperCase());
}
