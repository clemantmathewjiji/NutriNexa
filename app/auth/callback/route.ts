import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/src/lib/supabase/server";
import { getDb, isDbConnected } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { createSessionToken, hashPassword } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (code) {
    // 1. Direct Google OAuth 2.0 Token Exchange
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

    if (googleClientId && googleClientSecret) {
      try {
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: googleClientId,
            client_secret: googleClientSecret,
            redirect_uri: `${origin}/auth/callback`,
            grant_type: "authorization_code",
          }),
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;

          const userinfoRes = await fetch(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (userinfoRes.ok) {
            const googleUser = await userinfoRes.json();
            const cleanEmail = String(googleUser.email || "").toLowerCase().trim();
            const userName =
              googleUser.name ||
              googleUser.given_name ||
              cleanEmail.split("@")[0] ||
              "Researcher";

            let userId: number | string | null = null;

            if (isDbConnected()) {
              const db = getDb();
              if (db) {
                const found = await db
                  .select()
                  .from(users)
                  .where(eq(users.email, cleanEmail))
                  .limit(1);

                if (found.length > 0) {
                  userId = found[0].id;
                } else {
                  const randomSecret = crypto.randomBytes(24).toString("hex");
                  const { hash, salt } = hashPassword(randomSecret);
                  const inserted = await db
                    .insert(users)
                    .values({
                      name: userName,
                      fullName: userName,
                      email: cleanEmail,
                      passwordHash: hash,
                      salt: salt,
                      role: "Researcher",
                      institution: "Google Verified Researcher",
                    })
                    .returning({ id: users.id });

                  if (inserted.length > 0) {
                    userId = inserted[0].id;
                  }
                }
              }
            }

            if (!userId) {
              const mockFound = mockStore.users.find(
                (u) => u.email.toLowerCase() === cleanEmail
              );
              if (mockFound) {
                userId = mockFound.id;
              } else {
                const newId = mockStore.users.length + 1;
                const randomSecret = crypto.randomBytes(24).toString("hex");
                const { hash, salt } = hashPassword(randomSecret);
                mockStore.users.push({
                  id: newId,
                  name: userName,
                  email: cleanEmail,
                  password_hash: hash,
                  salt: salt,
                  role: "Researcher",
                  institution: "Google Verified Researcher",
                  created_at: new Date().toISOString(),
                } as any);
                userId = newId;
              }
            }

            if (userId) {
              const sessionToken = await createSessionToken(userId);
              const response = NextResponse.redirect(`${origin}${next}`);
              response.cookies.set("nutrinexa_auth_token", sessionToken, {
                httpOnly: false,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 7 * 24 * 60 * 60,
              });
              return response;
            }
          }
        }
      } catch (googleOAuthErr) {
        console.warn("Direct Google OAuth exchange attempt error:", googleOAuthErr);
      }
    }

    // 2. Supabase OAuth Code Exchange Fallback
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          return NextResponse.redirect(`${origin}${next}`);
        }
        console.warn("OAuth exchange error:", error);
      }
    } catch (sbErr) {
      console.warn("Supabase SSR exchange error:", sbErr);
    }
  }

  // Return the user to an error page or main page with notice
  return NextResponse.redirect(`${origin}/?auth_error=oauth_callback_failed`);
}
