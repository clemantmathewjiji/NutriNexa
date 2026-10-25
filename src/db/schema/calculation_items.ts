import { pgTable, serial, text, integer, doublePrecision } from "drizzle-orm/pg-core";
import { nutrientCalculations } from "./nutrient_calculations";
import { foods } from "./foods";

export const calculationItems = pgTable("calculation_items", {
  id: serial("id").primaryKey(),
  calculationId: integer("calculation_id").references(() => nutrientCalculations.id, { onDelete: "cascade" }).notNull(),
  foodId: integer("food_id").references(() => foods.id, { onDelete: "restrict" }).notNull(),
  quantityGrams: doublePrecision("quantity_grams").notNull(),
  portionUnitName: text("portion_unit_name").default("grams").notNull(),
  servingMultiplier: doublePrecision("serving_multiplier").default(1.0).notNull(),
});
