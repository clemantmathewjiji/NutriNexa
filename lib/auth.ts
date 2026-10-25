import crypto from "crypto";
import { NextRequest } from "next/server";
import { getDb, isDbConnected } from "./db";
import { users, authTokens } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { mockStore } from "./mockStore";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";

export interface AuthUser {
  id: number | string;
  name: string;
  email: string;
  role: string;
  institution: string;
}

/**
 * PBKDF2-HMAC-SHA256 password hashing matching scientific standards and Python backend compatibility.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return { hash, salt };
}

/**
 * Verifies a password against the stored salt and expected hash.
 */
export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
}

/**
 * Creates and persists a secure session token.
 */
export async function createSessionToken(userId: number | string): Promise<string> {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  if (isDbConnected() && typeof userId === "number") {
    try {
      const db = getDb();
      if (db) {
        await db.insert(authTokens).values({
          token,
          userId,
          expiresAt,
        });
        return token;
      }
    } catch (err) {
      console.warn("Could not insert token into DB, falling back to mock store:", err);
    }
  }

  // Fallback to memory mockStore
  mockStore.tokens.set(token, { userId: typeof userId === "number" ? userId : 1, expiresAt });
  return token;
}

/**
 * Invalidates and deletes a session token upon logout.
 */
export async function invalidateSessionToken(token: string): Promise<void> {
  if (isDbConnected()) {
    try {
      const db = getDb();
      if (db) {
        await db.delete(authTokens).where(eq(authTokens.token, token));
      }
    } catch (err) {
      console.warn("DB token invalidation error:", err);
    }
  }
  mockStore.tokens.delete(token);
}

/**
 * Extracts the bearer token from the incoming Next.js request.
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7).trim();
}

/**
 * Validates the token or Supabase session and returns the authenticated user, or null for guests.
 * NEVER returns a default or fallback profile.
 */
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  // 1. Check Supabase SSR session via cookies
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: { user: sbUser }, error: sbErr } = await supabase.auth.getUser();
      if (!sbErr && sbUser) {
        const metadata = sbUser.user_metadata || {};
        return {
          id: sbUser.id,
          name: metadata.full_name || metadata.display_name || metadata.name || sbUser.email?.split("@")[0] || "Researcher",
          email: sbUser.email || "",
          role: metadata.role || metadata.designation || "Researcher",
          institution: metadata.institution || "",
        };
      }
    }
  } catch {
    // Supabase client not configured or no active session cookie
  }

  // 2. Check Bearer token in headers
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  // 2a. If bearer token is a Supabase JWT
  try {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data: { user: sbUser }, error: jwtErr } = await supabase.auth.getUser(token);
      if (!jwtErr && sbUser) {
        const metadata = sbUser.user_metadata || {};
        return {
          id: sbUser.id,
          name: metadata.full_name || metadata.display_name || metadata.name || sbUser.email?.split("@")[0] || "Researcher",
          email: sbUser.email || "",
          role: metadata.role || metadata.designation || "Researcher",
          institution: metadata.institution || "",
        };
      }
    }
  } catch {
    // Ignore and proceed to internal token check
  }

  // 2b. Check Postgres DB authTokens
  if (isDbConnected()) {
    try {
      const db = getDb();
      if (db) {
        const rows = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            institution: users.institution,
            expiresAt: authTokens.expiresAt,
          })
          .from(authTokens)
          .innerJoin(users, eq(authTokens.userId, users.id))
          .where(eq(authTokens.token, token))
          .limit(1);

        if (rows.length > 0) {
          const row = rows[0];
          if (new Date() <= new Date(row.expiresAt)) {
            return {
              id: row.id,
              name: row.name,
              email: row.email,
              role: row.role,
              institution: row.institution || "",
            };
          }
        }
      }
    } catch (err) {
      console.warn("DB auth lookup error, checking mockStore:", err);
    }
  }

  // 2c. Check mock store fallback
  const mockToken = mockStore.tokens.get(token);
  if (mockToken && new Date() <= mockToken.expiresAt) {
    const user = mockStore.users.find((u) => u.id === mockToken.userId);
    if (user) {
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution || "",
      };
    }
  }

  return null;
}
