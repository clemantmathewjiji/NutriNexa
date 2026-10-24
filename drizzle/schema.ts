import { pgTable, serial, text, integer, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ==============================================================================
// 1. Users Table
// ==============================================================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  salt: text("salt").notNull(),
  role: text("role").default("Researcher").notNull(),
  institution: text("institution").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==============================================================================
// 2. Active Auth Tokens / Sessions
// ==============================================================================
export const authTokens = pgTable("auth_tokens", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// ==============================================================================
// 3. Research Projects
// ==============================================================================
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  code: text("code").notNull(),
  objectives: text("objectives").default(""),
  methodologyNotes: text("methodology_notes").default(""),
  leadResearcher: text("lead_researcher").default(""),
  status: text("status").default("Active").notNull(),
  tags: text("tags").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ==============================================================================
// 4. Standard & Reference Nutrients
// ==============================================================================
export const nutrients = pgTable("nutrients", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  energyFactorKcal: doublePrecision("energy_factor_kcal").default(0.0),
  displayOrder: integer("display_order").default(100),
});

// ==============================================================================
// 5. Food Items (USDA / FCT Reference + Custom User Foods)
// ==============================================================================
export const foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  code: text("code").unique(),
  name: text("name").notNull(),
  altNames: text("alt_names").default(""),
  foodGroup: text("food_group").notNull(),
  category: text("category").default(""),
  scientificName: text("scientific_name").default(""),
  description: text("description").default(""),
  sourceName: text("source_name").notNull(),
  sourceCitation: text("source_citation").default(""),
  sourceYear: text("source_year").default(""),
  standardQuantity: doublePrecision("standard_quantity").default(100.0),
  standardUnit: text("standard_unit").default("g"),
  preparationState: text("preparation_state").default("Raw / Unprepared"),
  dataQualityGrade: text("data_quality_grade").default("Validated"),
  isCustom: integer("is_custom").default(0),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==============================================================================
// 6. Food Nutrient Values (per 100g edible portion)
// ==============================================================================
export const foodNutrients = pgTable("food_nutrients", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id")
    .references(() => foods.id, { onDelete: "cascade" })
    .notNull(),
  nutrientCode: text("nutrient_code").notNull(),
  amountPer100g: doublePrecision("amount_per_100g"),
  unit: text("unit").notNull(),
  isMissing: integer("is_missing").default(0),
  isTrace: integer("is_trace").default(0),
});

// ==============================================================================
// 7. Standard Household Portion Units per Food
// ==============================================================================
export const portionUnits = pgTable("portion_units", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id")
    .references(() => foods.id, { onDelete: "cascade" })
    .notNull(),
  unitName: text("unit_name").notNull(),
  gramWeight: doublePrecision("gram_weight").notNull(),
});

// ==============================================================================
// 8. Dietary Reference Profiles (DRV / RDA / DRI)
// ==============================================================================
export const dietaryReferenceProfiles = pgTable("dietary_reference_profiles", {
  id: serial("id").primaryKey(),
  authority: text("authority").notNull(),
  profileName: text("profile_name").notNull(),
  targetGroup: text("target_group").notNull(),
  energyKcalTarget: doublePrecision("energy_kcal_target").default(2000.0),
  isDefault: integer("is_default").default(0),
});

export const dietaryReferenceValues = pgTable("dietary_reference_values", {
  id: serial("id").primaryKey(),
  profileId: integer("profile_id")
    .references(() => dietaryReferenceProfiles.id, { onDelete: "cascade" })
    .notNull(),
  nutrientCode: text("nutrient_code").notNull(),
  targetValue: doublePrecision("target_value").notNull(),
  unit: text("unit").notNull(),
  targetType: text("target_type").default("RDA"),
  upperLimit: doublePrecision("upper_limit"),
});

// ==============================================================================
// 9. Saved Nutrient Calculations
// ==============================================================================
export const calculations = pgTable("calculations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description").default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calculationItems = pgTable("calculation_items", {
  id: serial("id").primaryKey(),
  calculationId: integer("calculation_id")
    .references(() => calculations.id, { onDelete: "cascade" })
    .notNull(),
  foodId: integer("food_id")
    .references(() => foods.id, { onDelete: "restrict" })
    .notNull(),
  quantityGrams: doublePrecision("quantity_grams").notNull(),
  portionUnitName: text("portion_unit_name").default("grams"),
  servingMultiplier: doublePrecision("serving_multiplier").default(1.0),
});

// ==============================================================================
// 10. Recipes
// ==============================================================================
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  description: text("description").default(""),
  category: text("category").default("General"),
  servings: doublePrecision("servings").default(1.0),
  totalWeightGrams: doublePrecision("total_weight_grams").default(0.0),
  cookingInstructions: text("cooking_instructions").default(""),
  researchNotes: text("research_notes").default(""),
  allergens: text("allergens").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id")
    .references(() => recipes.id, { onDelete: "cascade" })
    .notNull(),
  foodId: integer("food_id")
    .references(() => foods.id, { onDelete: "restrict" })
    .notNull(),
  quantityGrams: doublePrecision("quantity_grams").notNull(),
  portionUnitName: text("portion_unit_name").default("grams"),
  preparationNote: text("preparation_note").default(""),
});

// ==============================================================================
// 11. Dietary Assessments / Food Diaries
// ==============================================================================
export const foodDiaries = pgTable("food_diaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  clientCode: text("client_code").notNull(),
  diaryDate: text("diary_date").notNull(),
  assessmentType: text("assessment_type").default("24-Hour Recall"),
  referenceProfileId: integer("reference_profile_id"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const diaryEntries = pgTable("diary_entries", {
  id: serial("id").primaryKey(),
  diaryId: integer("diary_id")
    .references(() => foodDiaries.id, { onDelete: "cascade" })
    .notNull(),
  mealType: text("meal_type").notNull(),
  foodId: integer("food_id").references(() => foods.id, { onDelete: "restrict" }),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "restrict" }),
  itemType: text("item_type").default("food"),
  quantityGrams: doublePrecision("quantity_grams").notNull(),
  portionDescription: text("portion_description").default(""),
  notes: text("notes").default(""),
});

// ==============================================================================
// 12. Meal Plans
// ==============================================================================
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  planType: text("plan_type").default("Daily Plan"),
  targetCalories: doublePrecision("target_calories").default(2000.0),
  referenceProfileId: integer("reference_profile_id"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealPlanItems = pgTable("meal_plan_items", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id")
    .references(() => mealPlans.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: text("day_of_week").default("Day 1"),
  mealType: text("meal_type").notNull(),
  foodId: integer("food_id").references(() => foods.id, { onDelete: "restrict" }),
  recipeId: integer("recipe_id").references(() => recipes.id, { onDelete: "restrict" }),
  itemType: text("item_type").default("food"),
  quantityGrams: doublePrecision("quantity_grams").notNull(),
});

// ==============================================================================
// 13. Anthropometric Assessments
// ==============================================================================
export const anthropometrics = pgTable("anthropometrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "set null" }),
  subjectIdentifier: text("subject_identifier").notNull(),
  ageYears: integer("age_years").notNull(),
  sex: text("sex").notNull(),
  assessmentDate: text("assessment_date").notNull(),
  heightCm: doublePrecision("height_cm").notNull(),
  weightKg: doublePrecision("weight_kg").notNull(),
  waistCm: doublePrecision("waist_cm"),
  hipCm: doublePrecision("hip_cm"),
  bmi: doublePrecision("bmi").notNull(),
  bmiCategory: text("bmi_category").notNull(),
  waistToHeightRatio: doublePrecision("waist_to_height_ratio"),
  referenceStandard: text("reference_standard").default("WHO Adult Classification (1995/2004)"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==============================================================================
// 14. Project Datasets & Statistics
// ==============================================================================
export const projectDatasets = pgTable("project_datasets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  datasetName: text("dataset_name").notNull(),
  description: text("description").default(""),
  rowCount: integer("row_count").default(0),
  variablesJson: text("variables_json").default("[]"),
  dataJson: text("data_json").default("[]"),
  descriptiveStatsJson: text("descriptive_stats_json").default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==============================================================================
// 15. Saved Reports
// ==============================================================================
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  projectId: integer("project_id"),
  reportType: text("report_type").notNull(),
  title: text("title").notNull(),
  parametersJson: text("parameters_json").default("{}"),
  summaryJson: text("summary_json").default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==============================================================================
// 16. Research Audit Logs
// ==============================================================================
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  details: text("details").default(""),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ==============================================================================
// Relations
// ==============================================================================
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  calculations: many(calculations),
  recipes: many(recipes),
  foodDiaries: many(foodDiaries),
  mealPlans: many(mealPlans),
  anthropometrics: many(anthropometrics),
}));

export const foodsRelations = relations(foods, ({ many }) => ({
  nutrients: many(foodNutrients),
  portions: many(portionUnits),
}));

export const foodNutrientsRelations = relations(foodNutrients, ({ one }) => ({
  food: one(foods, {
    fields: [foodNutrients.foodId],
    references: [foods.id],
  }),
}));

export const portionUnitsRelations = relations(portionUnits, ({ one }) => ({
  food: one(foods, {
    fields: [portionUnits.foodId],
    references: [foods.id],
  }),
}));

export const calculationsRelations = relations(calculations, ({ one, many }) => ({
  user: one(users, {
    fields: [calculations.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [calculations.projectId],
    references: [projects.id],
  }),
  items: many(calculationItems),
}));

export const calculationItemsRelations = relations(calculationItems, ({ one }) => ({
  calculation: one(calculations, {
    fields: [calculationItems.calculationId],
    references: [calculations.id],
  }),
  food: one(foods, {
    fields: [calculationItems.foodId],
    references: [foods.id],
  }),
}));

export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
  ingredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  food: one(foods, {
    fields: [recipeIngredients.foodId],
    references: [foods.id],
  }),
}));
