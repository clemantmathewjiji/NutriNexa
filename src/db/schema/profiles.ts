import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // Matches Supabase auth.users.id
  fullName: text("full_name").notNull(),
  displayName: text("display_name"),
  designation: text("designation"),
  institution: text("institution"),
  department: text("department"),
  email: text("email").notNull(),
  preferredLanguage: text("preferred_language").default("en").notNull(),
  avatarUrl: text("avatar_url"),
  role: text("role").default("Researcher").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
