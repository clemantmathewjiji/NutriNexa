import { pgTable, serial, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const referenceDocuments = pgTable("reference_documents", {
  id: serial("id").primaryKey(),
  documentCode: text("document_code").unique().notNull(), // e.g. "DOC-TKPI-2017", "DOC-BUKU-FOTO-2014"
  title: text("title").notNull(),
  authors: text("authors"),
  publisher: text("publisher"),
  publicationYear: integer("publication_year"),
  pageCount: integer("page_count"),
  extractionStatus: text("extraction_status").default("verified").notNull(), // 'pending', 'in_progress', 'verified', 'review_required'
  filePath: text("file_path"),
  summary: text("summary"),
  verifiedBy: uuid("verified_by").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
