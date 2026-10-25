import { pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const researchProjects = pgTable("research_projects", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  code: text("code").unique().notNull(), // e.g. "NUTRI-2026-A"
  title: text("title").notNull(),
  objectives: text("objectives"),
  methodologyNotes: text("methodology_notes"),
  status: text("status").default("Active").notNull(),
  tags: text("tags"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
