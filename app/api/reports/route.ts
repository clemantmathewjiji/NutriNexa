import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { reports } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ reports: [] });
    }

    const userId = user.id;

    if (isDbConnected() && typeof userId === "number") {
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

    const userReports = mockStore.reports.filter((r) => r.user_id === userId);
    return NextResponse.json({ reports: userReports });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list reports." }, { status: 500 });
  }
}
