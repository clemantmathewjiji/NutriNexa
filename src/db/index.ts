import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = global as unknown as {
  sqlClient?: postgres.Sql;
  drizzleDb?: PostgresJsDatabase<typeof schema>;
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
          prepare: false, // Required for Supabase transaction pooler (port 6543)
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

export async function testDbConnection(): Promise<{
  connected: boolean;
  message: string;
  timestamp: string;
}> {
  if (!isDbConnected()) {
    return {
      connected: false,
      message: "DATABASE_URL is not configured in environment variables. Operating in secure decoupled mode.",
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const db = getDb();
    if (!db) {
      return {
        connected: false,
        message: "Failed to initialize Drizzle database client instance.",
        timestamp: new Date().toISOString(),
      };
    }

    const result = await globalForDb.sqlClient!`SELECT 1 as connected, current_database() as db_name, version() as pg_version`;
    if (result && result.length > 0) {
      return {
        connected: true,
        message: `Successfully connected to Supabase PostgreSQL database: ${result[0].db_name}`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      connected: false,
      message: "Database ping returned empty result.",
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Database connection error: ${err.message || String(err)}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export { schema };
