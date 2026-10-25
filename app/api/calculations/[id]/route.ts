import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { calculations, calculationItems, foods, foodNutrients, nutrients } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { calculateSingleFoodNutrients, aggregateNutrientCalculation } from "@/lib/calculator";
import { STANDARD_NUTRIENTS } from "@/lib/seedData";
import { mockStore } from "@/lib/mockStore";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;
    const calcId = parseInt(id, 10);
    if (isNaN(calcId)) {
      return NextResponse.json({ detail: "Invalid calculation ID" }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const rows = await db.select().from(calculations).where(eq(calculations.id, calcId)).limit(1);
          if (rows.length > 0) {
            const calc = rows[0];
            if (calc.userId !== user.id) {
              return NextResponse.json({ detail: "Forbidden: You do not own this calculation." }, { status: 403 });
            }

            const items = await db.select().from(calculationItems).where(eq(calculationItems.calculationId, calcId));
            const dbNuts = await db.select().from(nutrients).orderBy(nutrients.displayOrder);
            const allNuts = dbNuts.map((n) => ({
              code: n.code,
              name: n.name,
              category: n.category,
              unit: n.unit,
              energy_factor_kcal: n.energyFactorKcal || 0,
            }));

            const itemResults: any[] = [];
            for (const it of items) {
              const fRows = await db.select().from(foods).where(eq(foods.id, it.foodId)).limit(1);
              if (fRows.length === 0) continue;
              const f = fRows[0];
              const fnRows = await db.select().from(foodNutrients).where(eq(foodNutrients.foodId, f.id));

              const single = calculateSingleFoodNutrients(
                { id: f.id, name: f.name, code: f.code, food_group: f.foodGroup },
                fnRows.map((fn) => ({
                  nutrient_code: fn.nutrientCode,
                  amount_per_100g: fn.amountPer100g,
                  unit: fn.unit,
                  is_missing: fn.isMissing,
                  is_trace: fn.isTrace,
                })),
                it.quantityGrams
              );

              itemResults.push({
                ...single,
                portion_unit_name: it.portionUnitName || "grams",
              });
            }

            const aggregated = aggregateNutrientCalculation(itemResults, allNuts);
            return NextResponse.json({
              calculation: calc,
              items: itemResults,
              results: aggregated,
            });
          }
        } catch (dbErr) {
          console.warn("DB get calculation error, falling back to mock:", dbErr);
        }
      }
    }

    const mock = mockStore.calculations.find((c) => c.id === calcId);
    if (!mock) {
      return NextResponse.json({ detail: "Calculation not found." }, { status: 404 });
    }

    if (mock.user_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden: You do not own this calculation." }, { status: 403 });
    }

    const itemResults: any[] = [];
    for (const it of mock.items) {
      const f = mockStore.foods.find((food) => food.id === it.food_id);
      if (!f) continue;
      const fnList = Object.entries(f.nutrients).map(([code, data]) => ({
        nutrient_code: code,
        amount_per_100g: data.amount_per_100g,
        unit: data.unit,
        is_missing: data.is_missing,
        is_trace: data.is_trace,
      }));

      const single = calculateSingleFoodNutrients(
        { id: f.id, name: f.name, code: f.code, food_group: f.food_group },
        fnList,
        it.quantity_grams
      );

      itemResults.push({
        ...single,
        portion_unit_name: it.portion_unit_name || "grams",
      });
    }

    const aggregated = aggregateNutrientCalculation(itemResults, STANDARD_NUTRIENTS);
    return NextResponse.json({
      calculation: mock,
      items: itemResults,
      results: aggregated,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to load calculation." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
    }

    const { id } = await params;
    const calcId = parseInt(id, 10);
    if (isNaN(calcId)) {
      return NextResponse.json({ detail: "Invalid calculation ID" }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const rows = await db.select().from(calculations).where(eq(calculations.id, calcId)).limit(1);
          if (rows.length > 0 && rows[0].userId !== user.id) {
            return NextResponse.json({ detail: "Forbidden: You cannot delete another user's calculation." }, { status: 403 });
          }
          await db.delete(calculations).where(eq(calculations.id, calcId));
          return NextResponse.json({ message: "Calculation deleted successfully." });
        } catch (dbErr) {
          console.warn("DB delete calculation error, falling back to mock:", dbErr);
        }
      }
    }

    const mock = mockStore.calculations.find((c) => c.id === calcId);
    if (mock && mock.user_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden: You cannot delete another user's calculation." }, { status: 403 });
    }

    mockStore.calculations = mockStore.calculations.filter((c) => c.id !== calcId);
    return NextResponse.json({ message: "Calculation deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to delete calculation." }, { status: 500 });
  }
}
