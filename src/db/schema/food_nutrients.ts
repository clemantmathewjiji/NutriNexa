import { pgTable, serial, text, integer, doublePrecision, boolean, timestamp } from "drizzle-orm/pg-core";
import { foods } from "./foods";

export const foodNutrients = pgTable("food_nutrients", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id").references(() => foods.id, { onDelete: "cascade" }).notNull(),
  nutrientCode: text("nutrient_code").notNull(),
  amountPer100g: doublePrecision("amount_per_100g"),
  unit: text("unit").notNull(),
  isMissing: boolean("is_missing").default(false).notNull(),
  isTrace: boolean("is_trace").default(false).notNull(),
  valueType: text("value_type").default("analytical").notNull(), // 'analytical', 'imputed', 'calculated', 'borrowed', 'presumed'
  methodNote: text("method_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
