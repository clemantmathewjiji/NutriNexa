import { pgTable, serial, text, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { foods } from "./foods";

export const foodPortions = pgTable("food_portions", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id").references(() => foods.id, { onDelete: "cascade" }).notNull(),
  portionName: text("portion_name").notNull(), // e.g. "1 Porsi Sedang (P)", "1 Centong Nasi", "1 Potong Sedang"
  portionSizeCategory: text("portion_size_category").default("Sedang"), // 'Kecil', 'Sedang', 'Besar', 'Household'
  gramWeight: doublePrecision("gram_weight").notNull(), // As-served or cooked portion weight
  householdMeasure: text("household_measure"), // e.g. "1 ctg", "1 ptg sdg", "1 sdm", "1 bh bsr"
  sourceDocument: text("source_document").default("Buku Foto Makanan 2014"),
  sourcePage: text("source_page"), // e.g. "Hal. 14"
  photoReference: text("photo_reference"), // Reference code or image asset path
  edibleWeightGrams: doublePrecision("edible_weight_grams"), // Computed edible fraction
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
