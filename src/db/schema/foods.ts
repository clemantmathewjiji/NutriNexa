import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { foodSources } from "./food_sources";
import { profiles } from "./profiles";

export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => foodSources.id, { onDelete: "set null" }),
  foodCode: text("food_code").unique().notNull(), // e.g. "AR001", "1123", etc.
  primaryName: text("primary_name").notNull(),
  scientificName: text("scientific_name"),
  foodGroup: text("food_group").notNull(),
  preparationState: text("preparation_state").default("Raw / Unprepared").notNull(),
  ediblePortionFactor: doublePrecision("edible_portion_factor").default(1.0).notNull(), // 0.0 to 1.0 (BDD / 100)
  ediblePercentage: doublePrecision("edible_percentage").default(100.0).notNull(), // % BDD (Bagian Dapat Dimakan)
  refuseDescription: text("refuse_description"), // e.g. "Biji, kulit, tulang"
  sourcePage: text("source_page"),
  dataQualityGrade: text("data_quality_grade").default("Validated"),
  isCustom: boolean("is_custom").default(false).notNull(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  isVerified: boolean("is_verified").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
