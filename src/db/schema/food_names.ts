import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { foods } from "./foods";

export const foodNames = pgTable("food_names", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id").references(() => foods.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  languageCode: text("language_code").notNull(), // 'id', 'en', 'ml', 'ar', etc.
  isPrimary: boolean("is_primary").default(false).notNull(),
  nameType: text("name_type").default("vernacular").notNull(), // 'scientific', 'vernacular', 'synonym', 'local'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
