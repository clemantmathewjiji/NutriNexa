import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { foods, foodNutrients, portionUnits } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { mockStore } from "@/lib/mockStore";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const foodId = parseInt(id, 10);
    if (isNaN(foodId)) {
      return NextResponse.json({ detail: "Invalid food ID" }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const rows = await db.select().from(foods).where(eq(foods.id, foodId)).limit(1);
          if (rows.length > 0) {
            const f = rows[0];
            const nutRows = await db
              .select()
              .from(foodNutrients)
              .where(eq(foodNutrients.foodId, f.id));
            const portRows = await db
              .select()
              .from(portionUnits)
              .where(eq(portionUnits.foodId, f.id));

            const nutrientsMap: Record<string, any> = {};
            for (const nr of nutRows) {
              nutrientsMap[nr.nutrientCode] = {
                amount_per_100g: nr.amountPer100g,
                unit: nr.unit,
                is_missing: nr.isMissing,
                is_trace: nr.isTrace,
              };
            }

            return NextResponse.json({
              id: f.id,
              code: f.code,
              name: f.name,
              alt_names: f.altNames,
              food_group: f.foodGroup,
              category: f.category,
              scientific_name: f.scientificName,
              description: f.description,
              source_name: f.sourceName,
              source_citation: f.sourceCitation,
              source_year: f.sourceYear,
              standard_quantity: f.standardQuantity,
              standard_unit: f.standardUnit,
              preparation_state: f.preparationState,
              data_quality_grade: f.dataQualityGrade,
              is_custom: f.isCustom,
              nutrients: nutrientsMap,
              portions: portRows.map((p) => ({
                id: p.id,
                unit_name: p.unitName,
                gram_weight: p.gramWeight,
              })),
            });
          }
        } catch (dbErr) {
          console.warn("DB food lookup error, falling back to mock:", dbErr);
        }
      }
    }

    const mock = mockStore.foods.find((f) => f.id === foodId);
    if (!mock) {
      return NextResponse.json({ detail: "Food item not found." }, { status: 404 });
    }

    return NextResponse.json(mock);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to fetch food." }, { status: 500 });
  }
}
