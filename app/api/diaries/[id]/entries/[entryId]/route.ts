import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { diaryEntries } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { mockStore } from "@/lib/mockStore";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params;
    const diaryId = parseInt(id, 10);
    const entryNum = parseInt(entryId, 10);

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          await db.delete(diaryEntries).where(eq(diaryEntries.id, entryNum));
          return NextResponse.json({ message: "Entry removed successfully." });
        } catch (dbErr) {
          console.warn("DB remove entry error, falling back to mock:", dbErr);
        }
      }
    }

    const diary = mockStore.diaries.find((d) => d.id === diaryId);
    if (diary && diary.entries) {
      diary.entries = diary.entries.filter((e: any) => e.id !== entryNum);
    }

    return NextResponse.json({ message: "Entry removed successfully." });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to remove diary entry." }, { status: 500 });
  }
}
