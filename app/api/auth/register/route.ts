import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword, createSessionToken } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, institution } = await request.json();
    if (!name || !email || !password) {
      return NextResponse.json({ detail: "Name, email, and password are required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const userRole = role || "Researcher";
    const userInst = institution || "";

    const { hash, salt } = hashPassword(password);

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
        if (existing.length > 0) {
          return NextResponse.json({ detail: "An account with this email already exists." }, { status: 400 });
        }

        const inserted = await db
          .insert(users)
          .values({
            name: cleanName,
            email: cleanEmail,
            passwordHash: hash,
            salt,
            role: userRole,
            institution: userInst,
          })
          .returning();

        const newUser = inserted[0];
        const token = await createSessionToken(newUser.id);
        return NextResponse.json({
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            institution: newUser.institution,
          },
        });
      }
    }

    // Mock store fallback
    if (mockStore.users.some((u) => u.email === cleanEmail)) {
      return NextResponse.json({ detail: "An account with this email already exists." }, { status: 400 });
    }

    const newId = mockStore.users.length + 1;
    const mockUser = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      password_hash: hash,
      salt,
      role: userRole,
      institution: userInst,
    };
    mockStore.users.push(mockUser);

    const token = await createSessionToken(newId);
    return NextResponse.json({
      token,
      user: {
        id: newId,
        name: cleanName,
        email: cleanEmail,
        role: userRole,
        institution: userInst,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Registration failed." }, { status: 500 });
  }
}
