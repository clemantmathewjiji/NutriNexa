import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { reports } from "@/drizzle/schema";
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
            .from(reports)
            .where(eq(reports.userId, userId))
            .orderBy(desc(reports.createdAt));
          return NextResponse.json({ reports: list });
        } catch (dbErr) {
          console.warn("DB list reports error, falling back to mock:", dbErr);
        }
      }
    }

    return NextResponse.json({ reports: mockStore.reports });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list reports." }, { status: 500 });
  }
}
