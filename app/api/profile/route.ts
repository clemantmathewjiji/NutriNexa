import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb, isDbConnected } from "@/src/db";
import { profiles } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { mockStore } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db && typeof user.id === "string") {
        try {
          const rows = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
          if (rows.length > 0) {
            return NextResponse.json({ profile: rows[0] });
          }
        } catch (dbErr) {
          console.warn("DB profile lookup error:", dbErr);
        }
      }
    }

    // Mock fallback
    return NextResponse.json({
      profile: {
        id: user.id,
        full_name: user.name,
        display_name: user.name,
        designation: user.role,
        institution: user.institution || "",
        department: "Food Science & Clinical Nutrition Laboratory",
        email: user.email,
        preferred_language: "en",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to load profile." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, display_name, designation, institution, department, preferred_language } = body;

    if (!full_name || full_name.trim().length < 2) {
      return NextResponse.json({ detail: "Full name is required." }, { status: 400 });
    }

    if (isDbConnected()) {
      const db = getDb();
      if (db && typeof user.id === "string") {
        try {
          await db
            .insert(profiles)
            .values({
              id: user.id,
              fullName: full_name.trim(),
              displayName: display_name?.trim() || full_name.trim(),
              designation: designation?.trim() || "Researcher",
              institution: institution?.trim() || "",
              department: department?.trim() || "",
              email: user.email,
              preferredLanguage: preferred_language || "en",
              role: user.role,
              updatedAt: new Date(),
            })
            .onConflictDoUpdate({
              target: profiles.id,
              set: {
                fullName: full_name.trim(),
                displayName: display_name?.trim() || full_name.trim(),
                designation: designation?.trim() || "Researcher",
                institution: institution?.trim() || "",
                department: department?.trim() || "",
                preferredLanguage: preferred_language || "en",
                updatedAt: new Date(),
              },
            });

          return NextResponse.json({
            message: "Profile updated successfully.",
            profile: {
              id: user.id,
              full_name,
              display_name,
              designation,
              institution,
              department,
            },
          });
        } catch (dbErr) {
          console.warn("DB profile update error, using fallback:", dbErr);
        }
      }
    }

    // Mock Store update
    const mockUser = mockStore.users.find((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    if (mockUser) {
      mockUser.name = display_name?.trim() || full_name.trim();
      mockUser.role = designation?.trim() || mockUser.role;
      mockUser.institution = institution?.trim() || mockUser.institution;
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
      profile: {
        id: user.id,
        full_name,
        display_name,
        designation,
        institution,
        department,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to update profile." }, { status: 500 });
  }
}
