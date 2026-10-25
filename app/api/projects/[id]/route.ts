import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { projects, calculations, recipes, foodDiaries, anthropometrics, projectDatasets } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
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
      return NextResponse.json({ detail: "Authentication required to access research project." }, { status: 401 });
    }

    const { id } = await params;
    const projId = parseInt(id, 10);
    if (isNaN(projId)) {
      return NextResponse.json({ detail: "Invalid project ID" }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const rows = await db.select().from(projects).where(eq(projects.id, projId)).limit(1);
          if (rows.length > 0) {
            const project = rows[0];
            if (project.userId !== user.id) {
              return NextResponse.json({ detail: "Forbidden: You are not authorized to view this project." }, { status: 403 });
            }

            const calcs = await db.select().from(calculations).where(eq(calculations.projectId, projId));
            const recs = await db.select().from(recipes).where(eq(recipes.projectId, projId));
            const diaries = await db.select().from(foodDiaries).where(eq(foodDiaries.projectId, projId));
            const anthros = await db.select().from(anthropometrics).where(eq(anthropometrics.projectId, projId));
            const datasets = await db.select().from(projectDatasets).where(eq(projectDatasets.projectId, projId));

            return NextResponse.json({
              project,
              calculations: calcs,
              recipes: recs,
              diaries,
              anthropometrics: anthros,
              datasets,
            });
          }
        } catch (dbErr) {
          console.warn("DB get project detail error, falling back to mock:", dbErr);
        }
      }
    }

    const mock = mockStore.projects.find((p) => p.id === projId);
    if (!mock) {
      return NextResponse.json({ detail: "Project not found." }, { status: 404 });
    }

    if (mock.user_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden: You are not authorized to view this project." }, { status: 403 });
    }

    const calcs = mockStore.calculations.filter((c) => c.project_id === projId);
    const recs = mockStore.recipes.filter((r) => r.project_id === projId);
    const diaries = mockStore.diaries.filter((d) => d.project_id === projId);
    const anthros = mockStore.anthropometrics.filter((a) => a.project_id === projId);

    return NextResponse.json({
      project: mock,
      calculations: calcs,
      recipes: recs,
      diaries,
      anthropometrics: anthros,
      datasets: mock.datasets || [],
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to load project." }, { status: 500 });
  }
}
