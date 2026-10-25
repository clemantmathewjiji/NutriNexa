import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { foodDiaries, diaryEntries, auditLogs } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ diaries: [] });
    }

    const userId = user.id;

    if (isDbConnected() && typeof userId === "number") {
      const db = getDb();
      if (db) {
        try {
          const list = await db
            .select()
            .from(foodDiaries)
            .where(eq(foodDiaries.userId, userId))
            .orderBy(desc(foodDiaries.createdAt));
          return NextResponse.json({ diaries: list });
        } catch (dbErr) {
          console.warn("DB list diaries error, falling back to mock:", dbErr);
        }
      }
    }

    const userDiaries = mockStore.diaries.filter((d) => d.user_id === userId);
    return NextResponse.json({ diaries: userDiaries });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list diaries." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required to create dietary assessment." }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();

    const {
      client_code,
      diary_date,
      assessment_type,
      reference_profile_id,
      notes,
      project_id,
      entries,
    } = body;

    if (!client_code || !diary_date) {
      return NextResponse.json({ detail: "Subject/Client code and diary date are required." }, { status: 400 });
    }

    if (isDbConnected() && typeof userId === "number") {
      const db = getDb();
      if (db) {
        try {
          const inserted = await db
            .insert(foodDiaries)
            .values({
              userId,
              projectId: project_id || null,
              clientCode: client_code.trim(),
              diaryDate: diary_date,
              assessmentType: assessment_type || "24-Hour Recall",
              referenceProfileId: reference_profile_id || 1,
              notes: notes || "",
            })
            .returning();

          const diaryId = inserted[0].id;

          if (Array.isArray(entries)) {
            for (const en of entries) {
              await db.insert(diaryEntries).values({
                diaryId,
                mealType: en.meal_type || "General",
                foodId: en.item_type === "food" ? en.food_id : null,
                recipeId: en.item_type === "recipe" ? en.recipe_id : null,
                itemType: en.item_type || "food",
                quantityGrams: Number(en.quantity_grams),
                portionDescription: en.portion_description || "",
                notes: en.notes || "",
              });
            }
          }

          await db.insert(auditLogs).values({
            userId,
            action: "DIARY_CREATED",
            entityType: "food_diaries",
            entityId: diaryId,
            details: `Created dietary assessment diary for ${client_code}`,
          });

          return NextResponse.json({ message: "Dietary assessment diary created.", diary_id: diaryId });
        } catch (dbErr) {
          console.warn("DB create diary error, falling back to mock:", dbErr);
        }
      }
    }

    const newId = mockStore.diaries.length + 1;
    mockStore.diaries.unshift({
      id: newId,
      user_id: userId,
      project_id: project_id || null,
      client_code,
      diary_date,
      assessment_type: assessment_type || "24-Hour Recall",
      reference_profile_id: reference_profile_id || 1,
      notes: notes || "",
      created_at: new Date().toISOString(),
      entries: (entries || []).map((en: any, idx: number) => ({
        id: idx + 1,
        meal_type: en.meal_type || "General",
        food_id: en.item_type === "food" ? en.food_id : null,
        recipe_id: en.item_type === "recipe" ? en.recipe_id : null,
        item_type: en.item_type || "food",
        quantity_grams: Number(en.quantity_grams),
        portion_description: en.portion_description || "",
        notes: en.notes || "",
      })),
    });

    return NextResponse.json({ message: "Dietary assessment diary created.", diary_id: newId });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create diary." }, { status: 500 });
  }
}
