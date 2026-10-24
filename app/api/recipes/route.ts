import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { recipes, recipeIngredients, auditLogs } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const userId = user?.id || 1;

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const list = await db
            .select()
            .from(recipes)
            .where(eq(recipes.userId, userId))
            .orderBy(desc(recipes.createdAt));
          return NextResponse.json({ recipes: list });
        } catch (dbErr) {
          console.warn("DB recipes list error, falling back to mock:", dbErr);
        }
      }
    }

    return NextResponse.json({ recipes: mockStore.recipes });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list recipes." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const userId = user?.id || 1;
    const body = await request.json();

    const {
      name,
      description,
      category,
      servings,
      total_weight_grams,
      cooking_instructions,
      research_notes,
      allergens,
      project_id,
      ingredients,
    } = body;

    if (!name || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ detail: "Recipe name and ingredients are required." }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const inserted = await db
            .insert(recipes)
            .values({
              userId,
              projectId: project_id || null,
              name: name.trim(),
              description: description || "",
              category: category || "General",
              servings: Number(servings) || 1.0,
              totalWeightGrams: Number(total_weight_grams) || 0.0,
              cookingInstructions: cooking_instructions || "",
              researchNotes: research_notes || "",
              allergens: allergens || "",
            })
            .returning();

          const recipeId = inserted[0].id;

          for (const ing of ingredients) {
            await db.insert(recipeIngredients).values({
              recipeId,
              foodId: ing.food_id,
              quantityGrams: Number(ing.quantity_grams),
              portionUnitName: ing.portion_unit_name || "grams",
              preparationNote: ing.preparation_note || "",
            });
          }

          await db.insert(auditLogs).values({
            userId,
            action: "RECIPE_CREATED",
            entityType: "recipes",
            entityId: recipeId,
            details: `Created recipe: ${name}`,
          });

          return NextResponse.json({ message: "Recipe created successfully.", recipe_id: recipeId });
        } catch (dbErr) {
          console.warn("DB create recipe error, falling back to mock:", dbErr);
        }
      }
    }

    const newId = mockStore.recipes.length + 1;
    mockStore.recipes.unshift({
      id: newId,
      user_id: userId,
      project_id: project_id || null,
      name,
      description: description || "",
      category: category || "General",
      servings: Number(servings) || 1.0,
      total_weight_grams: Number(total_weight_grams) || 0.0,
      cooking_instructions: cooking_instructions || "",
      research_notes: research_notes || "",
      allergens: allergens || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ingredients: ingredients.map((ing: any) => ({
        food_id: ing.food_id,
        quantity_grams: Number(ing.quantity_grams),
        portion_unit_name: ing.portion_unit_name || "grams",
        preparation_note: ing.preparation_note || "",
      })),
    });

    return NextResponse.json({ message: "Recipe created successfully.", recipe_id: newId });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create recipe." }, { status: 500 });
  }
}
