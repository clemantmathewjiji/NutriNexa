import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { projectDatasets, auditLogs } from "@/drizzle/schema";
import { computeDescriptiveStats } from "@/lib/calculator";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projId = parseInt(id, 10);
    const user = await getCurrentUser(request);
    const userId = user?.id || 1;
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

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
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
    const newDatasetId = (project?.datasets?.length || 0) + 1;
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

    if (project) {
      if (!project.datasets) project.datasets = [];
      project.datasets.push(newDataset);
    }

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
