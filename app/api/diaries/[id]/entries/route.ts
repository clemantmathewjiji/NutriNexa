import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { diaryEntries } from "@/drizzle/schema";
import { mockStore } from "@/lib/mockStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const diaryId = parseInt(id, 10);
    const body = await request.json();
    const { meal_type, food_id, recipe_id, item_type, quantity_grams, portion_description, notes } = body;

    if (!quantity_grams) {
      return NextResponse.json({ detail: "Quantity in grams is required." }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const inserted = await db
            .insert(diaryEntries)
            .values({
              diaryId,
              mealType: meal_type || "General",
              foodId: item_type === "food" ? food_id : null,
              recipeId: item_type === "recipe" ? recipe_id : null,
              itemType: item_type || "food",
              quantityGrams: Number(quantity_grams),
              portionDescription: portion_description || "",
              notes: notes || "",
            })
            .returning();
          return NextResponse.json({ message: "Entry added successfully.", entry_id: inserted[0].id });
        } catch (dbErr) {
          console.warn("DB add entry error, falling back to mock:", dbErr);
        }
      }
    }

    const diary = mockStore.diaries.find((d) => d.id === diaryId);
    if (!diary) {
      return NextResponse.json({ detail: "Diary not found." }, { status: 404 });
    }

    const newEntryId = (diary.entries?.length || 0) + 1;
    diary.entries.push({
      id: newEntryId,
      meal_type: meal_type || "General",
      food_id: item_type === "food" ? food_id : null,
      recipe_id: item_type === "recipe" ? recipe_id : null,
      item_type: item_type || "food",
      quantity_grams: Number(quantity_grams),
      portion_description: portion_description || "",
      notes: notes || "",
    });

    return NextResponse.json({ message: "Entry added successfully.", entry_id: newEntryId });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to add diary entry." }, { status: 500 });
  }
}
