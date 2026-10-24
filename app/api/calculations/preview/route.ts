import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { foods, foodNutrients, nutrients } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";
import { calculateSingleFoodNutrients, aggregateNutrientCalculation } from "@/lib/calculator";
import { STANDARD_NUTRIENTS } from "@/lib/seedData";
import { mockStore } from "@/lib/mockStore";

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ detail: "Please provide items with food_id and quantity_grams." }, { status: 400 });
    }

    const foodIds = items.map((it) => it.food_id);
    let allNutrientsList: any[] = STANDARD_NUTRIENTS;
    const itemCalculations: any[] = [];

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const dbNuts = await db.select().from(nutrients).orderBy(nutrients.displayOrder);
          if (dbNuts.length > 0) {
            allNutrientsList = dbNuts.map((n) => ({
              code: n.code,
              name: n.name,
              category: n.category,
              unit: n.unit,
              energy_factor_kcal: n.energyFactorKcal || 0,
            }));
          }

          const dbFoods = await db.select().from(foods).where(inArray(foods.id, foodIds));
          for (const item of items) {
            const food = dbFoods.find((f) => f.id === item.food_id);
            if (!food) continue;

            const fnRows = await db
              .select()
              .from(foodNutrients)
              .where(eq(foodNutrients.foodId, food.id));

            const singleCalc = calculateSingleFoodNutrients(
              { id: food.id, name: food.name, code: food.code, food_group: food.foodGroup },
              fnRows.map((fn) => ({
                nutrient_code: fn.nutrientCode,
                amount_per_100g: fn.amountPer100g,
                unit: fn.unit,
                is_missing: fn.isMissing,
                is_trace: fn.isTrace,
              })),
              item.quantity_grams
            );

            itemCalculations.push({
              ...singleCalc,
              portion_unit_name: item.portion_unit_name || "grams",
            });
          }

          const aggregated = aggregateNutrientCalculation(itemCalculations, allNutrientsList);
          return NextResponse.json({
            items: itemCalculations,
            calculation: aggregated,
          });
        } catch (dbErr) {
          console.warn("DB calculation preview error, falling back to mock:", dbErr);
        }
      }
    }

    // Mock store fallback calculation
    for (const item of items) {
      const food = mockStore.foods.find((f) => f.id === item.food_id);
      if (!food) continue;

      const fnList = Object.entries(food.nutrients).map(([code, data]) => ({
        nutrient_code: code,
        amount_per_100g: data.amount_per_100g,
        unit: data.unit,
        is_missing: data.is_missing,
        is_trace: data.is_trace,
      }));

      const singleCalc = calculateSingleFoodNutrients(
        { id: food.id, name: food.name, code: food.code, food_group: food.food_group },
        fnList,
        item.quantity_grams
      );

      itemCalculations.push({
        ...singleCalc,
        portion_unit_name: item.portion_unit_name || "grams",
      });
    }

    const aggregated = aggregateNutrientCalculation(itemCalculations, allNutrientsList);
    return NextResponse.json({
      items: itemCalculations,
      calculation: aggregated,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to preview calculation." }, { status: 500 });
  }
}
