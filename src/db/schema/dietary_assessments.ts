import { pgTable, serial, text, integer, doublePrecision, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const dietaryAssessments = pgTable("dietary_assessments", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  projectId: integer("project_id"),
  subjectIdentifier: text("subject_identifier").notNull(),
  assessmentDate: text("assessment_date").notNull(),
  assessmentType: text("assessment_type").default("24-Hour Recall").notNull(),
  referenceProfileCode: text("reference_profile_code").default("US_DRI_ADULT_MALE").notNull(),
  totalEnergyKcal: doublePrecision("total_energy_kcal"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
