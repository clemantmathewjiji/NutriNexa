import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { anthropometrics, auditLogs } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { computeAnthropometrics } from "@/lib/calculator";
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
            .from(anthropometrics)
            .where(eq(anthropometrics.userId, userId))
            .orderBy(desc(anthropometrics.createdAt));
          return NextResponse.json({ records: list });
        } catch (dbErr) {
          console.warn("DB list anthropometrics error, falling back to mock:", dbErr);
        }
      }
    }

    return NextResponse.json({ records: mockStore.anthropometrics });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list anthropometrics." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const userId = user?.id || 1;
    const body = await request.json();

    const {
      subject_identifier,
      age_years,
      sex,
      assessment_date,
      height_cm,
      weight_kg,
      waist_cm,
      hip_cm,
      reference_standard,
      notes,
      project_id,
    } = body;

    const h = parseFloat(height_cm);
    const w = parseFloat(weight_kg);
    const age = parseInt(age_years, 10);
    const waist = waist_cm ? parseFloat(waist_cm) : null;
    const hip = hip_cm ? parseFloat(hip_cm) : null;

    if (!subject_identifier || !h || !w) {
      return NextResponse.json({ detail: "Subject ID, height, and weight are required." }, { status: 400 });
    }

    const computed = computeAnthropometrics(w, h, age, sex, waist, hip);

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const inserted = await db
            .insert(anthropometrics)
            .values({
              userId,
              projectId: project_id || null,
              subjectIdentifier: subject_identifier.trim(),
              ageYears: age,
              sex: sex || "Male",
              assessmentDate: assessment_date || new Date().toISOString().split("T")[0],
              heightCm: h,
              weightKg: w,
              waistCm: waist,
              hipCm: hip,
              bmi: computed.bmi,
              bmiCategory: computed.who_category,
              waistToHeightRatio: computed.waist_to_height_ratio,
              referenceStandard: reference_standard || "WHO Adult Classification (1995/2004)",
              notes: notes || "",
            })
            .returning();

          const recId = inserted[0].id;

          await db.insert(auditLogs).values({
            userId,
            action: "ANTHROPOMETRIC_SAVED",
            entityType: "anthropometrics",
            entityId: recId,
            details: `Saved anthropometric assessment for ${subject_identifier}`,
          });

          return NextResponse.json({ message: "Assessment recorded successfully.", record_id: recId, results: computed });
        } catch (dbErr) {
          console.warn("DB save anthropometrics error, falling back to mock:", dbErr);
        }
      }
    }

    const newId = mockStore.anthropometrics.length + 1;
    const record = {
      id: newId,
      user_id: userId,
      project_id: project_id || null,
      subject_identifier,
      age_years: age,
      sex: sex || "Male",
      assessment_date: assessment_date || new Date().toISOString().split("T")[0],
      height_cm: h,
      weight_kg: w,
      waist_cm: waist,
      hip_cm: hip,
      bmi: computed.bmi,
      bmi_category: computed.who_category,
      waist_to_height_ratio: computed.waist_to_height_ratio,
      reference_standard: reference_standard || "WHO Adult Standard",
      notes: notes || "",
      created_at: new Date().toISOString(),
    };
    mockStore.anthropometrics.unshift(record);

    return NextResponse.json({ message: "Assessment recorded successfully.", record_id: newId, results: computed });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to save assessment." }, { status: 500 });
  }
}
