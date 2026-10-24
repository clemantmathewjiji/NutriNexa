import { NextRequest, NextResponse } from "next/server";
import { testDbConnection } from "@/lib/db";

export async function GET(_request: NextRequest) {
  const dbStatus = await testDbConnection();
  return NextResponse.json({
    status: "ok",
    app: "NutriNexa Nutrition Research & Analytics",
    version: "2.0.0",
    engine: "Next.js 15 Full-Stack (Drizzle ORM + Supabase PostgreSQL)",
    database: dbStatus,
  });
}
