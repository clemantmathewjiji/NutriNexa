import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { reports, auditLogs } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const userId = user?.id || 1;
    const body = await request.json();

    const { report_type, title, project_id, parameters } = body;

    if (!title || !report_type) {
      return NextResponse.json({ detail: "Report title and type are required." }, { status: 400 });
    }

    const summaryData = {
      generated_at: new Date().toISOString(),
      report_type,
      title,
      investigator: user?.name || "Dr. Clemant Mathew Jiji",
      institution: user?.institution || "SJCET Palai Nutrition Science & Computational Lab",
      status: "Finalized Academic Document",
      metadata: parameters || {},
    };

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const inserted = await db
            .insert(reports)
            .values({
              userId,
              projectId: project_id || null,
              reportType: report_type,
              title: title.trim(),
              parametersJson: JSON.stringify(parameters || {}),
              summaryJson: JSON.stringify(summaryData),
            })
            .returning();

          const repId = inserted[0].id;

          await db.insert(auditLogs).values({
            userId,
            action: "REPORT_GENERATED",
            entityType: "reports",
            entityId: repId,
            details: `Generated ${report_type} report: ${title}`,
          });

          return NextResponse.json({
            message: "Report generated successfully.",
            report_id: repId,
            report: { id: repId, ...summaryData },
          });
        } catch (dbErr) {
          console.warn("DB generate report error, falling back to mock:", dbErr);
        }
      }
    }

    const newId = mockStore.reports.length + 1;
    const reportItem = {
      id: newId,
      user_id: userId,
      project_id: project_id || null,
      report_type,
      title,
      parameters_json: JSON.stringify(parameters || {}),
      summary_json: JSON.stringify(summaryData),
      created_at: new Date().toISOString(),
    };
    mockStore.reports.unshift(reportItem);

    return NextResponse.json({
      message: "Report generated successfully.",
      report_id: newId,
      report: { id: newId, ...summaryData },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to generate report." }, { status: 500 });
  }
}
