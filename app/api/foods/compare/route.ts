import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { foods, nutrients, foodNutrients, portionUnits } from "@/drizzle/schema";
import { inArray, eq } from "drizzle-orm";
import { STANDARD_NUTRIENTS } from "@/lib/seedData";
import { mockStore } from "@/lib/mockStore";

export async function POST(request: NextRequest) {
  try {
    const foodIds: number[] = await request.json();
    if (!Array.isArray(foodIds) || foodIds.length === 0) {
      return NextResponse.json({ detail: "Please provide a list of food IDs to compare." }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const nutList = await db.select().from(nutrients).orderBy(nutrients.displayOrder);
          const foodRows = await db.select().from(foods).where(inArray(foods.id, foodIds));

          const enrichedFoods = await Promise.all(
            foodRows.map(async (f) => {
              const nutRows = await db.select().from(foodNutrients).where(eq(foodNutrients.foodId, f.id));
              const portRows = await db.select().from(portionUnits).where(eq(portionUnits.foodId, f.id));

              const nutrientsMap: Record<string, any> = {};
              for (const nr of nutRows) {
                nutrientsMap[nr.nutrientCode] = {
                  amount_per_100g: nr.amountPer100g,
                  unit: nr.unit,
                  is_missing: nr.isMissing,
                  is_trace: nr.isTrace,
                };
              }

              return {
                id: f.id,
                code: f.code,
                name: f.name,
                alt_names: f.altNames,
                food_group: f.foodGroup,
                category: f.category,
                scientific_name: f.scientificName,
                description: f.description,
                source_name: f.sourceName,
                standard_quantity: f.standardQuantity,
                standard_unit: f.standardUnit,
                nutrients: nutrientsMap,
                portions: portRows.map((p) => ({
                  id: p.id,
                  unit_name: p.unitName,
                  gram_weight: p.gramWeight,
                })),
              };
            })
          );

          return NextResponse.json({
            nutrients: nutList,
            foods: enrichedFoods,
          });
        } catch (dbErr) {
          console.warn("DB foods compare error, falling back to mock:", dbErr);
        }
      }
    }

    const matched = mockStore.foods.filter((f) => foodIds.includes(f.id));
    return NextResponse.json({
      nutrients: STANDARD_NUTRIENTS,
      foods: matched,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to compare foods." }, { status: 500 });
  }
}
