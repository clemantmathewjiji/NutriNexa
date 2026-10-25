import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { projects, auditLogs } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ projects: [] });
    }

    const userId = user.id;

    if (isDbConnected() && typeof userId === "number") {
      const db = getDb();
      if (db) {
        try {
          const list = await db
            .select()
            .from(projects)
            .where(eq(projects.userId, userId))
            .orderBy(desc(projects.createdAt));
          return NextResponse.json({ projects: list });
        } catch (dbErr) {
          console.warn("DB list projects error, falling back to mock:", dbErr);
        }
      }
    }

    const userProjects = mockStore.projects.filter((p) => p.user_id === userId);
    return NextResponse.json({ projects: userProjects });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list projects." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required to create research projects." }, { status: 401 });
    }

    const userId = user.id;
    const body = await request.json();

    const { title, code, objectives, methodology_notes, lead_researcher, status, tags } = body;

    if (!title || !code) {
      return NextResponse.json({ detail: "Project title and research code are required." }, { status: 400 });
    }

    if (isDbConnected() && typeof userId === "number") {
      const db = getDb();
      if (db) {
        try {
          const inserted = await db
            .insert(projects)
            .values({
              userId,
              title: title.trim(),
              code: code.trim(),
              objectives: objectives || "",
              methodologyNotes: methodology_notes || "",
              leadResearcher: lead_researcher || user.name || "Lead Researcher",
              status: status || "Active",
              tags: tags || "",
            })
            .returning();

          const projId = inserted[0].id;

          await db.insert(auditLogs).values({
            userId,
            action: "PROJECT_CREATED",
            entityType: "projects",
            entityId: projId,
            details: `Created research project: ${title} (${code})`,
          });

          return NextResponse.json({ message: "Research project created successfully.", project_id: projId });
        } catch (dbErr) {
          console.warn("DB create project error, falling back to mock:", dbErr);
        }
      }
    }

    const newId = mockStore.projects.length + 1;
    mockStore.projects.unshift({
      id: newId,
      user_id: userId,
      title,
      code,
      objectives: objectives || "",
      methodology_notes: methodology_notes || "",
      lead_researcher: lead_researcher || user.name || "Lead Researcher",
      status: status || "Active",
      tags: tags || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      datasets: [],
    });

    return NextResponse.json({ message: "Research project created successfully.", project_id: newId });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to create project." }, { status: 500 });
  }
}
