import { pgTable, serial, text, integer, doublePrecision, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const anthropometricRecords = pgTable("anthropometric_records", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  projectId: integer("project_id"),
  subjectIdentifier: text("subject_identifier").notNull(),
  assessmentDate: text("assessment_date").notNull(),
  ageYears: integer("age_years").notNull(),
  sex: text("sex").notNull(), // 'Male' | 'Female'
  heightCm: doublePrecision("height_cm").notNull(),
  weightKg: doublePrecision("weight_kg").notNull(),
  waistCm: doublePrecision("waist_cm"),
  hipCm: doublePrecision("hip_cm"),
  bmi: doublePrecision("bmi").notNull(),
  whoCategory: text("who_category").notNull(),
  asianCategory: text("asian_category").notNull(),
  waistToHeightRatio: doublePrecision("waist_to_height_ratio"),
  waistToHeightStatus: text("waist_to_height_status"),
  waistHipRatio: doublePrecision("waist_hip_ratio"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
