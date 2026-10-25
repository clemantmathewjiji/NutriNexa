import { pgTable, serial, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";
import { researchProjects } from "./research_projects";

export const researchReports = pgTable("research_reports", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  projectId: integer("project_id").references(() => researchProjects.id, { onDelete: "set null" }),
  reportIdentifier: text("report_identifier").unique().notNull(), // e.g. "NNX-REP-2026-9041"
  reportType: text("report_type").notNull(),
  title: text("title").notNull(),
  language: text("language").default("en").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
