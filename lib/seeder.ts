import { getDb, isDbConnected } from "./db";
import { sql } from "drizzle-orm";
import {
  users, nutrients, foods, foodNutrients, portionUnits,
  dietaryReferenceProfiles, dietaryReferenceValues, projects,
  calculations, calculationItems, recipes, recipeIngredients,
  foodDiaries, diaryEntries, anthropometrics, auditLogs, projectDatasets
} from "@/drizzle/schema";
import { STANDARD_NUTRIENTS, FOOD_RECORDS, DRV_PROFILES } from "./seedData";
import { hashPassword } from "./auth";

/**
 * Creates database tables in Supabase PostgreSQL if they do not yet exist,
 * and seeds baseline scientific references, nutrients, and demo data.
 */
export async function seedSupabaseDatabase(): Promise<{
  success: boolean;
  message: string;
  nutrients_count: number;
  foods_count: number;
  drv_profiles_count: number;
}> {
  if (!isDbConnected()) {
    return {
      success: false,
      message: "DATABASE_URL is not configured in .env.local yet. Please paste your Supabase connection string.",
      nutrients_count: 0,
      foods_count: 0,
      drv_profiles_count: 0,
    };
  }

  const db = getDb();
  if (!db) {
    throw new Error("Could not initialize database connection.");
  }

  // 1. Create tables if not already existing using PostgreSQL DDL
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      full_name TEXT,
      email TEXT UNIQUE NOT NULL,
      phone VARCHAR(256),
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Researcher',
      institution TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      code TEXT NOT NULL,
      objectives TEXT DEFAULT '',
      methodology_notes TEXT DEFAULT '',
      lead_researcher TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Active',
      tags TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS nutrients (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      energy_factor_kcal DOUBLE PRECISION DEFAULT 0.0,
      display_order INTEGER DEFAULT 100
    );

    CREATE TABLE IF NOT EXISTS foods (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      alt_names TEXT DEFAULT '',
      food_group TEXT NOT NULL,
      category TEXT DEFAULT '',
      scientific_name TEXT DEFAULT '',
      description TEXT DEFAULT '',
      source_name TEXT NOT NULL,
      source_citation TEXT DEFAULT '',
      source_year TEXT DEFAULT '',
      standard_quantity DOUBLE PRECISION DEFAULT 100.0,
      standard_unit TEXT DEFAULT 'g',
      preparation_state TEXT DEFAULT 'Raw / Unprepared',
      data_quality_grade TEXT DEFAULT 'Validated',
      is_custom INTEGER DEFAULT 0,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS food_nutrients (
      id SERIAL PRIMARY KEY,
      food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
      nutrient_code TEXT NOT NULL,
      amount_per_100g DOUBLE PRECISION,
      unit TEXT NOT NULL,
      is_missing INTEGER DEFAULT 0,
      is_trace INTEGER DEFAULT 0,
      CONSTRAINT unq_food_nutrient UNIQUE(food_id, nutrient_code)
    );

    CREATE TABLE IF NOT EXISTS portion_units (
      id SERIAL PRIMARY KEY,
      food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
      unit_name TEXT NOT NULL,
      gram_weight DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dietary_reference_profiles (
      id SERIAL PRIMARY KEY,
      authority TEXT NOT NULL,
      profile_name TEXT NOT NULL,
      target_group TEXT NOT NULL,
      energy_kcal_target DOUBLE PRECISION DEFAULT 2000.0,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS dietary_reference_values (
      id SERIAL PRIMARY KEY,
      profile_id INTEGER NOT NULL REFERENCES dietary_reference_profiles(id) ON DELETE CASCADE,
      nutrient_code TEXT NOT NULL,
      target_value DOUBLE PRECISION NOT NULL,
      unit TEXT NOT NULL,
      target_type TEXT DEFAULT 'RDA',
      upper_limit DOUBLE PRECISION
    );

    CREATE TABLE IF NOT EXISTS calculations (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS calculation_items (
      id SERIAL PRIMARY KEY,
      calculation_id INTEGER NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
      food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
      quantity_grams DOUBLE PRECISION NOT NULL,
      portion_unit_name TEXT DEFAULT 'grams',
      serving_multiplier DOUBLE PRECISION DEFAULT 1.0
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category TEXT DEFAULT 'General',
      servings DOUBLE PRECISION DEFAULT 1.0,
      total_weight_grams DOUBLE PRECISION DEFAULT 0.0,
      cooking_instructions TEXT DEFAULT '',
      research_notes TEXT DEFAULT '',
      allergens TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id SERIAL PRIMARY KEY,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      food_id INTEGER NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
      quantity_grams DOUBLE PRECISION NOT NULL,
      portion_unit_name TEXT DEFAULT 'grams',
      preparation_note TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS food_diaries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      client_code TEXT NOT NULL,
      diary_date TEXT NOT NULL,
      assessment_type TEXT DEFAULT '24-Hour Recall',
      reference_profile_id INTEGER,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS diary_entries (
      id SERIAL PRIMARY KEY,
      diary_id INTEGER NOT NULL REFERENCES food_diaries(id) ON DELETE CASCADE,
      meal_type TEXT NOT NULL,
      food_id INTEGER REFERENCES foods(id) ON DELETE RESTRICT,
      recipe_id INTEGER REFERENCES recipes(id) ON DELETE RESTRICT,
      item_type TEXT DEFAULT 'food',
      quantity_grams DOUBLE PRECISION NOT NULL,
      portion_description TEXT DEFAULT '',
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      plan_type TEXT DEFAULT 'Daily Plan',
      target_calories DOUBLE PRECISION DEFAULT 2000.0,
      reference_profile_id INTEGER,
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meal_plan_items (
      id SERIAL PRIMARY KEY,
      meal_plan_id INTEGER NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
      day_of_week TEXT DEFAULT 'Day 1',
      meal_type TEXT NOT NULL,
      food_id INTEGER REFERENCES foods(id) ON DELETE RESTRICT,
      recipe_id INTEGER REFERENCES recipes(id) ON DELETE RESTRICT,
      item_type TEXT DEFAULT 'food',
      quantity_grams DOUBLE PRECISION NOT NULL
    );

    CREATE TABLE IF NOT EXISTS anthropometrics (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
      subject_identifier TEXT NOT NULL,
      age_years INTEGER NOT NULL,
      sex TEXT NOT NULL,
      assessment_date TEXT NOT NULL,
      height_cm DOUBLE PRECISION NOT NULL,
      weight_kg DOUBLE PRECISION NOT NULL,
      waist_cm DOUBLE PRECISION,
      hip_cm DOUBLE PRECISION,
      bmi DOUBLE PRECISION NOT NULL,
      bmi_category TEXT NOT NULL,
      waist_to_height_ratio DOUBLE PRECISION,
      reference_standard TEXT DEFAULT 'WHO Adult Classification (1995/2004)',
      notes TEXT DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_datasets (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      dataset_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      row_count INTEGER DEFAULT 0,
      variables_json TEXT DEFAULT '[]',
      data_json TEXT DEFAULT '[]',
      descriptive_stats_json TEXT DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      project_id INTEGER,
      report_type TEXT NOT NULL,
      title TEXT NOT NULL,
      parameters_json TEXT DEFAULT '{}',
      summary_json TEXT DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT DEFAULT '',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Seed Nutrients
  for (const nut of STANDARD_NUTRIENTS) {
    await db.execute(sql`
      INSERT INTO nutrients (code, name, category, unit, energy_factor_kcal, display_order)
      VALUES (${nut.code}, ${nut.name}, ${nut.category}, ${nut.unit}, ${nut.energy_factor}, ${nut.order})
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        unit = EXCLUDED.unit,
        energy_factor_kcal = EXCLUDED.energy_factor_kcal,
        display_order = EXCLUDED.display_order;
    `);
  }

  // 3. Seed Reference Foods
  for (const food of FOOD_RECORDS) {
    const res = await db.execute(sql`
      INSERT INTO foods (
        code, name, alt_names, food_group, category, scientific_name,
        description, source_name, source_citation, source_year,
        standard_quantity, standard_unit, preparation_state, is_custom, data_quality_grade
      ) VALUES (
        ${food.code}, ${food.name}, ${food.alt_names}, ${food.food_group},
        ${food.category}, ${food.scientific_name}, ${food.description},
        ${food.source_name}, ${food.source_citation}, ${food.source_year},
        100.0, 'g', 'Raw / Analyzed', 0, 'USDA National Nutrient DB (Grade A)'
      )
      ON CONFLICT (code) DO UPDATE SET
        alt_names = EXCLUDED.alt_names,
        scientific_name = EXCLUDED.scientific_name
      RETURNING id;
    `);

    const foodId = (res as any)[0]?.id;
    if (foodId) {
      // Insert Nutrients
      for (const [nutCode, val] of Object.entries(food.nutrients)) {
        const nutDef = STANDARD_NUTRIENTS.find((n) => n.code === nutCode);
        const unit = nutDef ? nutDef.unit : "g";
        await db.execute(sql`
          INSERT INTO food_nutrients (food_id, nutrient_code, amount_per_100g, unit, is_missing, is_trace)
          VALUES (${foodId}, ${nutCode}, ${val}, ${unit}, 0, 0)
          ON CONFLICT (food_id, nutrient_code) DO UPDATE SET
            amount_per_100g = EXCLUDED.amount_per_100g,
            unit = EXCLUDED.unit;
        `);
      }

      // Insert Portions
      await db.execute(sql`DELETE FROM portion_units WHERE food_id = ${foodId}`);
      for (const p of food.portions) {
        await db.execute(sql`
          INSERT INTO portion_units (food_id, unit_name, gram_weight)
          VALUES (${foodId}, ${p.name}, ${p.weight});
        `);
      }
    }
  }

  // 4. Seed DRV Profiles
  for (const profile of DRV_PROFILES) {
    const profRes = await db.execute(sql`
      INSERT INTO dietary_reference_profiles (authority, profile_name, target_group, energy_kcal_target, is_default)
      VALUES (${profile.authority}, ${profile.profile_name}, ${profile.target_group}, ${profile.energy_kcal_target}, ${profile.is_default})
      ON CONFLICT DO NOTHING
      RETURNING id;
    `);

    let profileId = (profRes as any)[0]?.id;
    if (!profileId) {
      const existing = await db.execute(sql`SELECT id FROM dietary_reference_profiles WHERE profile_name = ${profile.profile_name} LIMIT 1;`);
      profileId = (existing as any)[0]?.id;
    }

    if (profileId) {
      await db.execute(sql`DELETE FROM dietary_reference_values WHERE profile_id = ${profileId}`);
      for (const val of profile.values) {
        await db.execute(sql`
          INSERT INTO dietary_reference_values (profile_id, nutrient_code, target_value, unit, target_type, upper_limit)
          VALUES (${profileId}, ${val.code}, ${val.target}, ${val.unit}, ${val.type}, ${val.ul});
        `);
      }
    }
  }

  // 5. Seed Demo User Account
  const existingUser = await db.execute(sql`SELECT id FROM users WHERE email = 'demo@nutrinexa.org' LIMIT 1;`);
  let userId: number;

  if (existingUser.length === 0) {
    const { hash, salt } = hashPassword("NutriNexa2026!");
    const userRes = await db.execute(sql`
      INSERT INTO users (name, email, password_hash, salt, role, institution)
      VALUES (
        'Dr. Clemant Mathew Jiji',
        'demo@nutrinexa.org',
        ${hash},
        ${salt},
        'Principal Investigator',
        'SJCET Palai Nutrition Science & Computational Lab'
      ) RETURNING id;
    `);
    userId = (userRes as any)[0].id;
  } else {
    userId = (existingUser as any)[0].id;
  }

  // 6. Seed Sample Project
  const existingProj = await db.execute(sql`SELECT id FROM projects WHERE user_id = ${userId} AND code = 'NUTRI-2026-A' LIMIT 1;`);
  if (existingProj.length === 0) {
    await db.execute(sql`
      INSERT INTO projects (
        user_id, title, code, objectives, methodology_notes, lead_researcher, status, tags
      ) VALUES (
        ${userId},
        'Nutritional Quality & Bioactive Intake in University Student Cohort',
        'NUTRI-2026-A',
        'Assess micronutrient adequacy, omega-3 to omega-6 ratio, and dietary fiber intake across 120 undergraduate students.',
        'Repeated 24-hour recalls analyzed against US DRI and ICMR-NIN 2020 standards using NutriNexa calculation engine.',
        'Dr. Clemant Mathew Jiji',
        'Active',
        'Micronutrients, University Cohort, Dietary Recall, Bioavailability'
      );
    `);
  }

  return {
    success: true,
    message: "Supabase PostgreSQL database successfully migrated and seeded with master reference data.",
    nutrients_count: STANDARD_NUTRIENTS.length,
    foods_count: FOOD_RECORDS.length,
    drv_profiles_count: DRV_PROFILES.length,
  };
}
