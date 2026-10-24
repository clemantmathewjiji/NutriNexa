import { NextRequest, NextResponse } from "next/server";
import { seedSupabaseDatabase } from "@/lib/seeder";

export async function POST(_request: NextRequest) {
  try {
    const result = await seedSupabaseDatabase();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to seed Supabase database.",
      },
      { status: 500 }
    );
  }
}
