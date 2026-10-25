import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { researchReports } from "./research_reports";

export const reportSnapshots = pgTable("report_snapshots", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => researchReports.id, { onDelete: "cascade" }).notNull(),
  investigatorName: text("investigator_name").notNull(),
  investigatorDesignation: text("investigator_designation"),
  investigatorInstitution: text("investigator_institution"),
  investigatorDepartment: text("investigator_department"),
  issuedDate: text("issued_date").notNull(),
  parametersJson: text("parameters_json").default("{}").notNull(),
  resultsJson: text("results_json").default("{}").notNull(),
  citationNotes: text("citation_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
