import { NextRequest, NextResponse } from "next/server";
import { computeAnthropometrics } from "@/lib/calculator";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let weightKg = parseFloat(searchParams.get("weight_kg") || "0");
    let heightCm = parseFloat(searchParams.get("height_cm") || "0");
    let ageYears = parseInt(searchParams.get("age_years") || "0", 10);
    let sex = searchParams.get("sex") || "Male";
    let waistCm = searchParams.get("waist_cm") ? parseFloat(searchParams.get("waist_cm")!) : null;
    let hipCm = searchParams.get("hip_cm") ? parseFloat(searchParams.get("hip_cm")!) : null;

    // If query params are 0, check json body
    if (!weightKg || !heightCm) {
      try {
        const body = await request.json();
        weightKg = parseFloat(body.weight_kg) || weightKg;
        heightCm = parseFloat(body.height_cm) || heightCm;
        ageYears = parseInt(body.age_years, 10) || ageYears;
        sex = body.sex || sex;
        waistCm = body.waist_cm ? parseFloat(body.waist_cm) : waistCm;
        hipCm = body.hip_cm ? parseFloat(body.hip_cm) : hipCm;
      } catch {
        // use query params
      }
    }

    if (!weightKg || !heightCm) {
      return NextResponse.json({ detail: "Valid weight and height are required." }, { status: 400 });
    }

    const results = computeAnthropometrics(weightKg, heightCm, ageYears, sex, waistCm, hipCm);
    return NextResponse.json(results);
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to calculate anthropometrics." }, { status: 500 });
  }
}
