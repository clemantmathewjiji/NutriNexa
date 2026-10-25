import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const foodSources = pgTable("food_sources", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(), // e.g. TKPI_2017, USDA_SR_LEGACY, BUKU_FOTO_2014
  name: text("name").notNull(),
  shortTitle: text("short_title").notNull(),
  citation: text("citation").notNull(),
  publicationYear: integer("publication_year"),
  country: text("country").default("ID"),
  description: text("description"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
