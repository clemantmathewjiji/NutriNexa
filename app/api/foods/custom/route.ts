import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { foods, foodNutrients, portionUnits, auditLogs } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required to create custom food records." }, { status: 401 });
    }
    const userId = user.id;
    const numericUserId = typeof user.id === "number" ? user.id : null;
    const body = await request.json();

    const {
      name,
      food_group,
      category,
      scientific_name,
      description,
      source_citation,
      portions,
      nutrients,
    } = body;

    if (!name || !food_group) {
      return NextResponse.json({ detail: "Name and food group are required." }, { status: 400 });
    }

    const customCode = `CUSTOM-${Date.now()}`;

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const inserted = await db
            .insert(foods)
            .values({
              code: customCode,
              name: name.trim(),
              foodGroup: food_group,
              category: category || "",
              scientificName: scientific_name || "",
              description: description || "",
              sourceName: "User Custom Database",
              sourceCitation: source_citation || "User Generated Scientific Entry",
              standardQuantity: 100.0,
              standardUnit: "g",
              preparationState: "Custom Prepared",
              dataQualityGrade: "User Provided",
              isCustom: 1,
              userId: numericUserId,
            })
            .returning();

          const newFood = inserted[0];

          if (nutrients && typeof nutrients === "object") {
            for (const [nutCode, val] of Object.entries(nutrients)) {
              if (val !== null && val !== undefined) {
                await db.insert(foodNutrients).values({
                  foodId: newFood.id,
                  nutrientCode: nutCode,
                  amountPer100g: Number(val),
                  unit: "g",
                });
              }
            }
          }

          if (Array.isArray(portions)) {
            for (const p of portions) {
              if (p.unit_name && p.gram_weight) {
                await db.insert(portionUnits).values({
                  foodId: newFood.id,
                  unitName: p.unit_name,
                  gramWeight: Number(p.gram_weight),
                });
              }
            }
          }

          await db.insert(auditLogs).values({
            userId: numericUserId,
            action: "FOOD_CUSTOM_CREATED",
            entityType: "foods",
            entityId: newFood.id,
            details: `Created custom food: ${name}`,
          });

          return NextResponse.json({ message: "Custom food item saved successfully.", food_id: newFood.id });
        } catch (dbErr) {
          console.warn("DB custom food error, falling back to mock:", dbErr);
        }
      }
    }

    const newId = mockStore.foods.length + 100;
    const nutMap: Record<string, any> = {};
    if (nutrients) {
      for (const [k, v] of Object.entries(nutrients)) {
        nutMap[k] = { amount_per_100g: Number(v), unit: "g", is_missing: 0, is_trace: 0 };
      }
    }

    mockStore.foods.push({
      id: newId,
      code: customCode,
      name,
      alt_names: "",
      food_group,
      category: category || "",
      scientific_name: scientific_name || "",
      description: description || "",
      source_name: "User Custom Database",
      source_citation: source_citation || "",
      source_year: "2026",
      standard_quantity: 100,
      standard_unit: "g",
      preparation_state: "Custom Prepared",
      data_quality_grade: "User Provided",
      is_custom: 1,
      user_id: numericUserId,
      portions: (portions || []).map((p: any, idx: number) => ({
        id: idx + 1,
        unit_name: p.unit_name,
        gram_weight: Number(p.gram_weight),
      })),
      nutrients: nutMap,
    });

    return NextResponse.json({ message: "Custom food item saved successfully.", food_id: newId });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create custom food." }, { status: 500 });
  }
}
