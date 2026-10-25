import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }).notNull(),
  projectId: integer("project_id"),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").default("Entrée").notNull(),
  servings: doublePrecision("servings").default(1.0).notNull(),
  rawWeightGrams: doublePrecision("raw_weight_grams").default(0.0).notNull(),
  cookedWeightGrams: doublePrecision("cooked_weight_grams"),
  yieldFactor: doublePrecision("yield_factor").default(1.0).notNull(),
  cookingMethod: text("cooking_method"),
  cookingInstructions: text("cooking_instructions"),
  allergens: text("allergens").default("None").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
