import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { profiles } from "./profiles";

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id").primaryKey().references(() => profiles.id, { onDelete: "cascade" }),
  defaultLanguage: text("default_language").default("en").notNull(),
  defaultUnitSystem: text("default_unit_system").default("metric").notNull(),
  defaultReferenceProfile: text("default_reference_profile").default("US_DRI_ADULT_MALE").notNull(),
  theme: text("theme").default("light").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
