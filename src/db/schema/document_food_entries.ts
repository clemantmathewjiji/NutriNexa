import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { referenceDocuments } from "./reference_documents";
import { foods } from "./foods";

export const documentFoodEntries = pgTable("document_food_entries", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => referenceDocuments.id, { onDelete: "cascade" }).notNull(),
  foodId: integer("food_id").references(() => foods.id, { onDelete: "set null" }),
  rawPageNumber: integer("raw_page_number"),
  rawTableIdentifier: text("raw_table_identifier"),
  rawRowDataJson: text("raw_row_data_json"),
  validationStatus: text("validation_status").default("validated").notNull(), // 'validated', 'flagged_for_review', 'duplicate'
  validationNotes: text("validation_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
