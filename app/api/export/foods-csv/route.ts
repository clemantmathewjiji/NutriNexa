import { NextResponse } from "next/server";
import { mockStore } from "@/lib/mockStore";

export async function GET() {
  const headers = [
    "Food Code",
    "Food Name",
    "Alternative Names",
    "Food Group",
    "Preparation State",
    "Source Name",
    "Energy (kcal)",
    "Protein (g)",
    "Fat (g)",
    "Carbohydrates (g)",
    "Dietary Fiber (g)",
    "Calcium (mg)",
    "Iron (mg)",
    "Sodium (mg)",
    "Potassium (mg)",
    "Vitamin C (mg)",
  ];

  const rows = mockStore.foods.map((f) => [
    `"${f.code}"`,
    `"${f.name.replace(/"/g, '""')}"`,
    `"${(f.alt_names || "").replace(/"/g, '""')}"`,
    `"${f.food_group}"`,
    `"${f.preparation_state}"`,
    `"${f.source_name}"`,
    f.nutrients.energy_kcal?.amount_per_100g ?? "",
    f.nutrients.protein?.amount_per_100g ?? "",
    f.nutrients.fat?.amount_per_100g ?? "",
    f.nutrients.carbs?.amount_per_100g ?? "",
    f.nutrients.fiber?.amount_per_100g ?? "",
    f.nutrients.calcium?.amount_per_100g ?? "",
    f.nutrients.iron?.amount_per_100g ?? "",
    f.nutrients.sodium?.amount_per_100g ?? "",
    f.nutrients.potassium?.amount_per_100g ?? "",
    f.nutrients.vit_c?.amount_per_100g ?? "",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="NutriNexa_Food_Composition_Catalog.csv"',
    },
  });
}
