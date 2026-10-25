import { pgTable, serial, text, integer, doublePrecision, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const nutrientCalculations = pgTable("nutrient_calculations", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  projectId: integer("project_id"),
  name: text("name").notNull(),
  description: text("description"),
  totalWeightGrams: doublePrecision("total_weight_grams").default(0.0).notNull(),
  notes: text("notes"),
  calculatedTotalsJson: text("calculated_totals_json").default("{}").notNull(),
  macroDistributionJson: text("macro_distribution_json").default("{}").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
