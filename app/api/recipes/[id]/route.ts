import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { recipes, recipeIngredients, foods, foodNutrients, nutrients } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { calculateSingleFoodNutrients, calculateRecipeBreakdown } from "@/lib/calculator";
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
      return NextResponse.json({ detail: "Authentication required to view recipe details." }, { status: 401 });
    }

    const { id } = await params;
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) {
      return NextResponse.json({ detail: "Invalid recipe ID" }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const rows = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
          if (rows.length > 0) {
            const recipe = rows[0];
            if (recipe.userId !== user.id) {
              return NextResponse.json({ detail: "Forbidden: You do not own this recipe." }, { status: 403 });
            }

            const ingredients = await db
              .select()
              .from(recipeIngredients)
              .where(eq(recipeIngredients.recipeId, recipeId));
            const dbNuts = await db.select().from(nutrients).orderBy(nutrients.displayOrder);
            const allNuts = dbNuts.map((n) => ({
              code: n.code,
              name: n.name,
              category: n.category,
              unit: n.unit,
              energy_factor_kcal: n.energyFactorKcal || 0,
            }));

            const ingredientCalculations: any[] = [];
            for (const ing of ingredients) {
              const fRows = await db.select().from(foods).where(eq(foods.id, ing.foodId)).limit(1);
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
                ing.quantityGrams
              );

              ingredientCalculations.push({
                ...single,
                portion_unit_name: ing.portionUnitName || "grams",
                preparation_note: ing.preparationNote || "",
              });
            }

            const breakdown = calculateRecipeBreakdown(
              ingredientCalculations,
              allNuts,
              recipe.servings || 1.0,
              recipe.totalWeightGrams
            );

            return NextResponse.json({
              recipe,
              ingredients: ingredientCalculations,
              breakdown,
            });
          }
        } catch (dbErr) {
          console.warn("DB recipe detail error, falling back to mock:", dbErr);
        }
      }
    }

    const mock = mockStore.recipes.find((r) => r.id === recipeId);
    if (!mock) {
      return NextResponse.json({ detail: "Recipe not found." }, { status: 404 });
    }

    if (mock.user_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden: You do not own this recipe." }, { status: 403 });
    }

    const ingredientCalculations: any[] = [];
    for (const ing of mock.ingredients) {
      const f = mockStore.foods.find((food) => food.id === ing.food_id);
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
        ing.quantity_grams
      );

      ingredientCalculations.push({
        ...single,
        portion_unit_name: ing.portion_unit_name || "grams",
        preparation_note: ing.preparation_note || "",
      });
    }

    const breakdown = calculateRecipeBreakdown(
      ingredientCalculations,
      STANDARD_NUTRIENTS,
      mock.servings || 1.0,
      mock.total_weight_grams
    );

    return NextResponse.json({
      recipe: mock,
      ingredients: ingredientCalculations,
      breakdown,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to load recipe." }, { status: 500 });
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
    const recipeId = parseInt(id, 10);
    if (isNaN(recipeId)) {
      return NextResponse.json({ detail: "Invalid recipe ID" }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const rows = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1);
          if (rows.length > 0 && rows[0].userId !== user.id) {
            return NextResponse.json({ detail: "Forbidden: You cannot delete another user's recipe." }, { status: 403 });
          }
          await db.delete(recipes).where(eq(recipes.id, recipeId));
          return NextResponse.json({ message: "Recipe deleted successfully." });
        } catch (dbErr) {
          console.warn("DB delete recipe error, falling back to mock:", dbErr);
        }
      }
    }

    const mock = mockStore.recipes.find((r) => r.id === recipeId);
    if (mock && mock.user_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden: You cannot delete another user's recipe." }, { status: 403 });
    }

    mockStore.recipes = mockStore.recipes.filter((r) => r.id !== recipeId);
    return NextResponse.json({ message: "Recipe deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to delete recipe." }, { status: 500 });
  }
}
