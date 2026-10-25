import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { foodDiaries, diaryEntries, foods, foodNutrients, dietaryReferenceProfiles, dietaryReferenceValues, nutrients } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { calculateSingleFoodNutrients, aggregateNutrientCalculation, compareIntakeToDrv } from "@/lib/calculator";
import { STANDARD_NUTRIENTS, DRV_PROFILES } from "@/lib/seedData";
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
      return NextResponse.json({ detail: "Authentication required to view dietary diary." }, { status: 401 });
    }

    const { id } = await params;
    const diaryId = parseInt(id, 10);
    if (isNaN(diaryId)) {
      return NextResponse.json({ detail: "Invalid diary ID" }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const diaryRows = await db.select().from(foodDiaries).where(eq(foodDiaries.id, diaryId)).limit(1);
          if (diaryRows.length > 0) {
            const diary = diaryRows[0];
            if (diary.userId !== user.id) {
              return NextResponse.json({ detail: "Forbidden: You do not own this dietary assessment." }, { status: 403 });
            }

            const entries = await db.select().from(diaryEntries).where(eq(diaryEntries.diaryId, diaryId));

            const profileRows = await db
              .select()
              .from(dietaryReferenceProfiles)
              .where(eq(dietaryReferenceProfiles.id, diary.referenceProfileId || 1))
              .limit(1);
            const drvVals = await db
              .select()
              .from(dietaryReferenceValues)
              .where(eq(dietaryReferenceValues.profileId, diary.referenceProfileId || 1));

            const dbNuts = await db.select().from(nutrients).orderBy(nutrients.displayOrder);
            const allNuts = dbNuts.map((n) => ({
              code: n.code,
              name: n.name,
              category: n.category,
              unit: n.unit,
              energy_factor_kcal: n.energyFactorKcal || 0,
            }));

            const calculatedItems: any[] = [];
            const mealsMap: Record<string, any[]> = {};

            for (const en of entries) {
              if (en.foodId) {
                const fRows = await db.select().from(foods).where(eq(foods.id, en.foodId)).limit(1);
                if (fRows.length > 0) {
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
                    en.quantityGrams
                  );

                  const fullItem = {
                    ...single,
                    id: en.id,
                    entry_id: en.id,
                    meal_type: en.mealType,
                    item_type: en.itemType,
                    portion_description: en.portionDescription,
                  };

                  calculatedItems.push(fullItem);
                  if (!mealsMap[en.mealType]) mealsMap[en.mealType] = [];
                  mealsMap[en.mealType].push(fullItem);
                }
              }
            }

            const dailyTotals = aggregateNutrientCalculation(calculatedItems, allNuts);
            const drvComparison = compareIntakeToDrv(
              dailyTotals.totals,
              drvVals.map((v) => ({
                nutrient_code: v.nutrientCode,
                target_value: v.targetValue,
                unit: v.unit,
                target_type: v.targetType || "RDA",
                upper_limit: v.upperLimit,
              }))
            );

            return NextResponse.json({
              diary,
              reference_profile: profileRows[0] || null,
              items: calculatedItems,
              meals: mealsMap,
              daily_totals: dailyTotals,
              drv_comparison: drvComparison,
            });
          }
        } catch (dbErr) {
          console.warn("DB get diary detail error, falling back to mock:", dbErr);
        }
      }
    }

    const mock = mockStore.diaries.find((d) => d.id === diaryId);
    if (!mock) {
      return NextResponse.json({ detail: "Diary not found." }, { status: 404 });
    }

    if (mock.user_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden: You do not own this dietary assessment." }, { status: 403 });
    }

    const calculatedItems: any[] = [];
    const mealsMap: Record<string, any[]> = {};

    for (const en of mock.entries) {
      if (en.food_id) {
        const f = mockStore.foods.find((food) => food.id === en.food_id);
        if (f) {
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
            en.quantity_grams
          );

          const fullItem = {
            ...single,
            id: en.id,
            entry_id: en.id,
            meal_type: en.meal_type,
            item_type: en.item_type,
            portion_description: en.portion_description,
          };

          calculatedItems.push(fullItem);
          if (!mealsMap[en.meal_type]) mealsMap[en.meal_type] = [];
          mealsMap[en.meal_type].push(fullItem);
        }
      }
    }

    const dailyTotals = aggregateNutrientCalculation(calculatedItems, STANDARD_NUTRIENTS);
    const mappedProfiles = DRV_PROFILES.map((p, idx) => ({ id: idx + 1, ...p }));
    const refProfile = mappedProfiles.find((p) => p.id === mock.reference_profile_id) || mappedProfiles[0];
    const drvComparison = compareIntakeToDrv(
      dailyTotals.totals,
      refProfile.values.map((n) => ({
        nutrient_code: n.code,
        target_value: n.target,
        unit: n.unit,
        target_type: n.type,
        upper_limit: n.ul,
      }))
    );

    return NextResponse.json({
      diary: mock,
      reference_profile: refProfile,
      items: calculatedItems,
      meals: mealsMap,
      daily_totals: dailyTotals,
      drv_comparison: drvComparison,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to load diary." }, { status: 500 });
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
    const diaryId = parseInt(id, 10);
    if (isNaN(diaryId)) {
      return NextResponse.json({ detail: "Invalid diary ID" }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const diaryRows = await db.select().from(foodDiaries).where(eq(foodDiaries.id, diaryId)).limit(1);
          if (diaryRows.length > 0 && diaryRows[0].userId !== user.id) {
            return NextResponse.json({ detail: "Forbidden: You cannot delete another user's diary." }, { status: 403 });
          }
          await db.delete(foodDiaries).where(eq(foodDiaries.id, diaryId));
          return NextResponse.json({ message: "Diary deleted successfully." });
        } catch (dbErr) {
          console.warn("DB delete diary error, falling back to mock:", dbErr);
        }
      }
    }

    const mock = mockStore.diaries.find((d) => d.id === diaryId);
    if (mock && mock.user_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden: You cannot delete another user's diary." }, { status: 403 });
    }

    mockStore.diaries = mockStore.diaries.filter((d) => d.id !== diaryId);
    return NextResponse.json({ message: "Diary deleted successfully." });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to delete diary." }, { status: 500 });
  }
}
