import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import * as schema from "@/drizzle/schema";

// Global cache for serverless environments
const globalForDb = global as unknown as {
  sqlClient?: postgres.Sql;
  drizzleDb?: PostgresJsDatabase<typeof schema>;
  supabaseClient?: SupabaseClient;
};

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim();
}

export function isDbConnected(): boolean {
  const url = getDatabaseUrl();
  return Boolean(
    url &&
      url.length > 10 &&
      (url.startsWith("postgres://") || url.startsWith("postgresql://")) &&
      !url.includes("[YOUR-PASSWORD]") &&
      !url.includes("[PASSWORD]")
  );
}

export function getDb(): PostgresJsDatabase<typeof schema> | null {
  if (!isDbConnected()) {
    return null;
  }

  const url = getDatabaseUrl()!;

  if (!globalForDb.drizzleDb) {
    try {
      const client =
        globalForDb.sqlClient ||
        postgres(url, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
          prepare: false,
          ssl: url.includes("localhost") ? false : "prefer",
        });

      globalForDb.sqlClient = client;
      globalForDb.drizzleDb = drizzle(client, { schema });
    } catch (err) {
      console.warn("Could not initialize PostgreSQL client:", err);
      return null;
    }
  }

  return globalForDb.drizzleDb;
}

export function getSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("[YOUR-PROJECT-REF]")) {
    return null;
  }

  if (!globalForDb.supabaseClient) {
    try {
      globalForDb.supabaseClient = createClient(supabaseUrl, supabaseKey);
    } catch (err) {
      console.warn("Could not initialize Supabase client:", err);
      return null;
    }
  }

  return globalForDb.supabaseClient;
}

export async function testDbConnection(): Promise<{
  connected: boolean;
  message: string;
  source: "supabase-postgres" | "memory-mock";
}> {
  if (!isDbConnected()) {
    return {
      connected: false,
      message: "Supabase DATABASE_URL is not configured in .env.local yet. Using in-memory fallback store.",
      source: "memory-mock",
    };
  }

  try {
    const db = getDb();
    if (!db) {
      return {
        connected: false,
        message: "Failed to initialize Postgres client instance.",
        source: "memory-mock",
      };
    }

    // Execute simple query to test connection
    const result = await globalForDb.sqlClient!`SELECT 1 as connected`;
    if (result && result.length > 0) {
      return {
        connected: true,
        message: "Successfully connected to Supabase PostgreSQL database.",
        source: "supabase-postgres",
      };
    }

    return {
      connected: false,
      message: "Database ping returned empty result.",
      source: "memory-mock",
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Database connection error: ${err.message || String(err)}`,
      source: "memory-mock",
    };
  }
}
