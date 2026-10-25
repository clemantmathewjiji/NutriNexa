import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { calculations, calculationItems, auditLogs } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      // Guests have no saved calculations
      return NextResponse.json({ calculations: [] });
    }

    const userId = user.id;

    if (isDbConnected() && typeof userId === "number") {
      const db = getDb();
      if (db) {
        try {
          const list = await db
            .select()
            .from(calculations)
            .where(eq(calculations.userId, userId))
            .orderBy(desc(calculations.createdAt));
          return NextResponse.json({ calculations: list });
        } catch (dbErr) {
          console.warn("DB calculations list error, falling back to mock:", dbErr);
        }
      }
    }

    const userCalcs = mockStore.calculations.filter((c) => c.user_id === userId);
    return NextResponse.json({ calculations: userCalcs });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list calculations." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required to save calculations." }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();
    const { name, description, notes, project_id, items } = body;

    if (!name || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ detail: "Calculation name and at least one item are required." }, { status: 400 });
    }

    if (isDbConnected() && typeof userId === "number") {
      const db = getDb();
      if (db) {
        try {
          const inserted = await db
            .insert(calculations)
            .values({
              userId,
              projectId: project_id || null,
              name: name.trim(),
              description: description || "",
              notes: notes || "",
            })
            .returning();

          const calcId = inserted[0].id;

          for (const it of items) {
            await db.insert(calculationItems).values({
              calculationId: calcId,
              foodId: it.food_id,
              quantityGrams: it.quantity_grams,
              portionUnitName: it.portion_unit_name || "grams",
              servingMultiplier: it.serving_multiplier || 1.0,
            });
          }

          await db.insert(auditLogs).values({
            userId,
            action: "CALCULATION_SAVED",
            entityType: "calculations",
            entityId: calcId,
            details: `Saved nutrient calculation: ${name}`,
          });

          return NextResponse.json({ message: "Calculation saved successfully.", calculation_id: calcId });
        } catch (dbErr) {
          console.warn("DB save calculation error, falling back to mock:", dbErr);
        }
      }
    }

    const newId = mockStore.calculations.length + 1;
    mockStore.calculations.unshift({
      id: newId,
      user_id: userId,
      project_id: project_id || null,
      name,
      description: description || "",
      notes: notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: items.map((it: any) => ({
        food_id: it.food_id,
        quantity_grams: it.quantity_grams,
        portion_unit_name: it.portion_unit_name || "grams",
        serving_multiplier: it.serving_multiplier || 1.0,
      })),
    });

    return NextResponse.json({ message: "Calculation saved successfully.", calculation_id: newId });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to save calculation." }, { status: 500 });
  }
}
