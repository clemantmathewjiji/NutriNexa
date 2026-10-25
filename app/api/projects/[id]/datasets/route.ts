import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { projects, projectDatasets, auditLogs } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { computeDescriptiveStats } from "@/lib/calculator";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Authentication required to upload dataset." }, { status: 401 });
    }

    const { id } = await params;
    const projId = parseInt(id, 10);
    const userId = user.id;
    const body = await request.json();

    const { dataset_name, description, raw_data } = body;

    if (!dataset_name || !Array.isArray(raw_data) || raw_data.length === 0) {
      return NextResponse.json({ detail: "Dataset name and at least one data row are required." }, { status: 400 });
    }

    const variables = Object.keys(raw_data[0] || {});
    const descriptiveStats: Record<string, any> = {};

    for (const varName of variables) {
      const numericValues = raw_data
        .map((row) => parseFloat(row[varName]))
        .filter((val) => !isNaN(val));

      if (numericValues.length > 0) {
        descriptiveStats[varName] = computeDescriptiveStats(numericValues);
      }
    }

    if (isDbConnected() && typeof userId === "number") {
      const db = getDb();
      if (db) {
        try {
          // Verify project ownership
          const projRows = await db.select().from(projects).where(eq(projects.id, projId)).limit(1);
          if (projRows.length === 0) {
            return NextResponse.json({ detail: "Project not found." }, { status: 404 });
          }
          if (projRows[0].userId !== userId) {
            return NextResponse.json({ detail: "Forbidden: You are not authorized to add datasets to this project." }, { status: 403 });
          }

          const inserted = await db
            .insert(projectDatasets)
            .values({
              projectId: projId,
              datasetName: dataset_name.trim(),
              description: description || "",
              rowCount: raw_data.length,
              variablesJson: JSON.stringify(variables),
              dataJson: JSON.stringify(raw_data),
              descriptiveStatsJson: JSON.stringify(descriptiveStats),
            })
            .returning();

          const datasetId = inserted[0].id;

          await db.insert(auditLogs).values({
            userId,
            action: "DATASET_UPLOADED",
            entityType: "project_datasets",
            entityId: datasetId,
            details: `Uploaded dataset: ${dataset_name} (${raw_data.length} rows) into project ${projId}`,
          });

          return NextResponse.json({
            message: "Dataset added and descriptive statistics calculated.",
            dataset_id: datasetId,
            row_count: raw_data.length,
            descriptive_stats: descriptiveStats,
          });
        } catch (dbErr) {
          console.warn("DB add dataset error, falling back to mock:", dbErr);
        }
      }
    }

    const project = mockStore.projects.find((p) => p.id === projId);
    if (!project) {
      return NextResponse.json({ detail: "Project not found." }, { status: 404 });
    }
    if (project.user_id !== userId) {
      return NextResponse.json({ detail: "Forbidden: You are not authorized to add datasets to this project." }, { status: 403 });
    }

    const newDatasetId = (project.datasets?.length || 0) + 1;
    const newDataset = {
      id: newDatasetId,
      project_id: projId,
      dataset_name,
      description: description || "",
      row_count: raw_data.length,
      variables_json: JSON.stringify(variables),
      data_json: JSON.stringify(raw_data),
      descriptive_stats_json: JSON.stringify(descriptiveStats),
      created_at: new Date().toISOString(),
    };

    if (!project.datasets) project.datasets = [];
    project.datasets.push(newDataset);

    return NextResponse.json({
      message: "Dataset added and descriptive statistics calculated.",
      dataset_id: newDatasetId,
      row_count: raw_data.length,
      descriptive_stats: descriptiveStats,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to add dataset." }, { status: 500 });
  }
}
