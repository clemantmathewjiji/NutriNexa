import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, createSessionToken } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ detail: "Email and password are required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Try Supabase Postgres
    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        const found = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
        if (found.length > 0) {
          const u = found[0];
          const isValid = verifyPassword(password, u.salt, u.passwordHash);
          if (!isValid) {
            return NextResponse.json({ detail: "Invalid email or password." }, { status: 401 });
          }
          const token = await createSessionToken(u.id);
          return NextResponse.json({
            token,
            user: {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              institution: u.institution,
            },
          });
        }
      }
    }

    // 2. Try MockStore
    const mockUser = mockStore.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!mockUser) {
      return NextResponse.json({ detail: "Invalid email or password." }, { status: 401 });
    }

    // Check password against mock user (default demo password is NutriNexa2026!)
    if (password !== "NutriNexa2026!" && !verifyPassword(password, mockUser.salt, mockUser.password_hash)) {
      return NextResponse.json({ detail: "Invalid email or password." }, { status: 401 });
    }

    const token = await createSessionToken(mockUser.id);
    return NextResponse.json({
      token,
      user: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        institution: mockUser.institution,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Login failed." }, { status: 500 });
  }
}
