import { pgTable, serial, text, integer, doublePrecision } from "drizzle-orm/pg-core";
import { dietaryAssessments } from "./dietary_assessments";
import { foods } from "./foods";
import { recipes } from "./recipes";

export const dietaryRecallEntries = pgTable("dietary_recall_entries", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").references(() => dietaryAssessments.id, { onDelete: "cascade" }).notNull(),
  mealType: text("meal_type").notNull(), // 'Breakfast', 'Lunch', 'Dinner', 'Morning Snack', 'Evening Snack'
  itemType: text("item_type").default("food").notNull(), // 'food', 'recipe', 'portion_photo'
  foodId: integer("food_id").references(() => foods.id, { onDelete: "restrict" }),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "restrict" }),
  quantityGrams: doublePrecision("quantity_grams").notNull(),
  householdMeasure: text("household_measure"), // e.g. "1 centong", "1 potong sedang"
  photoReference: text("photo_reference"), // e.g. "Buku Foto Makanan 2014 Hal. 14"
  notes: text("notes"),
});
