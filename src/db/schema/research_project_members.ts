import { pgTable, serial, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { researchProjects } from "./research_projects";
import { profiles } from "./profiles";

export const researchProjectMembers = pgTable("research_project_members", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => researchProjects.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("collaborator").notNull(), // 'lead', 'collaborator', 'viewer', 'analyst'
  addedAt: timestamp("added_at").defaultNow().notNull(),
});
