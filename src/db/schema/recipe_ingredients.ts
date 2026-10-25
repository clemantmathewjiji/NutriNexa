import { pgTable, serial, text, integer, doublePrecision } from "drizzle-orm/pg-core";
import { recipes } from "./recipes";
import { foods } from "./foods";

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "cascade" }).notNull(),
  foodId: integer("food_id").references(() => foods.id, { onDelete: "restrict" }).notNull(),
  quantityGrams: doublePrecision("quantity_grams").notNull(),
  portionUnitName: text("portion_unit_name").default("grams").notNull(),
  preparationNote: text("preparation_note"),
  retentionFactorKey: text("retention_factor_key"),
  displayOrder: integer("display_order").default(0).notNull(),
});
