import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { calculations, calculationItems } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const calcId = parseInt(id, 10);
    const user = await getCurrentUser(request);
    const userId = user?.id || 1;

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const rows = await db.select().from(calculations).where(eq(calculations.id, calcId)).limit(1);
          if (rows.length > 0) {
            const orig = rows[0];
            const items = await db.select().from(calculationItems).where(eq(calculationItems.calculationId, calcId));

            const dupCalc = await db
              .insert(calculations)
              .values({
                userId,
                projectId: orig.projectId,
                name: `${orig.name} (Copy)`,
                description: orig.description,
                notes: orig.notes,
              })
              .returning();

            const newCalcId = dupCalc[0].id;
            for (const it of items) {
              await db.insert(calculationItems).values({
                calculationId: newCalcId,
                foodId: it.foodId,
                quantityGrams: it.quantityGrams,
                portionUnitName: it.portionUnitName,
                servingMultiplier: it.servingMultiplier,
              });
            }

            return NextResponse.json({ message: "Calculation duplicated successfully.", calculation_id: newCalcId });
          }
        } catch (dbErr) {
          console.warn("DB duplicate calculation error, falling back to mock:", dbErr);
        }
      }
    }

    const mock = mockStore.calculations.find((c) => c.id === calcId);
    if (!mock) {
      return NextResponse.json({ detail: "Calculation not found." }, { status: 404 });
    }

    const newId = mockStore.calculations.length + 1;
    mockStore.calculations.unshift({
      ...mock,
      id: newId,
      name: `${mock.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Calculation duplicated successfully.", calculation_id: newId });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to duplicate calculation." }, { status: 500 });
  }
}
