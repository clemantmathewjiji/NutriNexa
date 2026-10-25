import { NextRequest, NextResponse } from "next/server";
import { extractBearerToken, invalidateSessionToken } from "@/lib/auth";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const token = extractBearerToken(request);
    if (token) {
      await invalidateSessionToken(token);
    }

    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch {
      // Supabase signOut handled
    }

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (err: any) {
    return NextResponse.json({ message: "Logged out with warnings", detail: err.message }, { status: 200 });
  }
}
