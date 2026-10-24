import sqlite3
import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "nutrinexa.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Researcher',
        institution TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Active Auth Tokens / Sessions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Research Projects
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        code TEXT NOT NULL,
        objectives TEXT DEFAULT '',
        methodology_notes TEXT DEFAULT '',
        lead_researcher TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        tags TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Standard & Reference Nutrients
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS nutrients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT NOT NULL,
        energy_factor_kcal REAL DEFAULT 0.0,
        display_order INTEGER DEFAULT 100
    );
    """)

    # Food Items Table (USDA / FCT Reference + Custom User Foods)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        standard_quantity REAL DEFAULT 100.0,
        standard_unit TEXT DEFAULT 'g',
        preparation_state TEXT DEFAULT 'Raw / Unprepared',
        data_quality_grade TEXT DEFAULT 'Validated',
        is_custom INTEGER DEFAULT 0,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    """)

    # Food Nutrient Values (per 100g edible portion)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS food_nutrients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_id INTEGER NOT NULL,
        nutrient_code TEXT NOT NULL,
        amount_per_100g REAL,
        unit TEXT NOT NULL,
        is_missing INTEGER DEFAULT 0,
        is_trace INTEGER DEFAULT 0,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
        UNIQUE(food_id, nutrient_code)
    );
    """)

    # Standard Household Portion Units per Food
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS portion_units (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_id INTEGER NOT NULL,
        unit_name TEXT NOT NULL,
        gram_weight REAL NOT NULL,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
    );
    """)

    # Dietary Reference Values (DRV / RDA / DRI Profiles)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dietary_reference_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        authority TEXT NOT NULL,
        profile_name TEXT NOT NULL,
        target_group TEXT NOT NULL,
        energy_kcal_target REAL DEFAULT 2000.0,
        is_default INTEGER DEFAULT 0
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dietary_reference_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL,
        nutrient_code TEXT NOT NULL,
        target_value REAL NOT NULL,
        unit TEXT NOT NULL,
        target_type TEXT DEFAULT 'RDA',
        upper_limit REAL,
        FOREIGN KEY (profile_id) REFERENCES dietary_reference_profiles(id) ON DELETE CASCADE
    );
    """)

    # Saved Nutrient Calculations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS calculations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS calculation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        calculation_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        quantity_grams REAL NOT NULL,
        portion_unit_name TEXT DEFAULT 'grams',
        serving_multiplier REAL DEFAULT 1.0,
        FOREIGN KEY (calculation_id) REFERENCES calculations(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE RESTRICT
    );
    """)

    # Recipes Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        category TEXT DEFAULT 'General',
        servings REAL DEFAULT 1.0,
        total_weight_grams REAL DEFAULT 0.0,
        cooking_instructions TEXT DEFAULT '',
        research_notes TEXT DEFAULT '',
        allergens TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        quantity_grams REAL NOT NULL,
        portion_unit_name TEXT DEFAULT 'grams',
        preparation_note TEXT DEFAULT '',
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE RESTRICT
    );
    """)

    # Dietary Assessments / Food Diaries
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS food_diaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        client_code TEXT NOT NULL,
        diary_date DATE NOT NULL,
        assessment_type TEXT DEFAULT '24-Hour Recall',
        reference_profile_id INTEGER,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS diary_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        diary_id INTEGER NOT NULL,
        meal_type TEXT NOT NULL,
        food_id INTEGER,
        recipe_id INTEGER,
        item_type TEXT DEFAULT 'food',
        quantity_grams REAL NOT NULL,
        portion_description TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        FOREIGN KEY (diary_id) REFERENCES food_diaries(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE RESTRICT,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE RESTRICT
    );
    """)

    # Meal Plans
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meal_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        title TEXT NOT NULL,
        plan_type TEXT DEFAULT 'Daily Plan',
        target_calories REAL DEFAULT 2000.0,
        reference_profile_id INTEGER,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meal_plan_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_plan_id INTEGER NOT NULL,
        day_of_week TEXT DEFAULT 'Day 1',
        meal_type TEXT NOT NULL,
        food_id INTEGER,
        recipe_id INTEGER,
        item_type TEXT DEFAULT 'food',
        quantity_grams REAL NOT NULL,
        FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE RESTRICT,
        FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE RESTRICT
    );
    """)

    # Anthropometric Assessments
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS anthropometrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        subject_identifier TEXT NOT NULL,
        age_years INTEGER NOT NULL,
        sex TEXT NOT NULL,
        assessment_date DATE NOT NULL,
        height_cm REAL NOT NULL,
        weight_kg REAL NOT NULL,
        waist_cm REAL,
        hip_cm REAL,
        bmi REAL NOT NULL,
        bmi_category TEXT NOT NULL,
        waist_to_height_ratio REAL,
        reference_standard TEXT DEFAULT 'WHO Adult Classification (1995/2004)',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );
    """)

    # Project Datasets & Statistics
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS project_datasets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        dataset_name TEXT NOT NULL,
        description TEXT DEFAULT '',
        row_count INTEGER DEFAULT 0,
        variables_json TEXT DEFAULT '[]',
        data_json TEXT DEFAULT '[]',
        descriptive_stats_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    """)

    # Saved Reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        project_id INTEGER,
        report_type TEXT NOT NULL,
        title TEXT NOT NULL,
        parameters_json TEXT DEFAULT '{}',
        summary_json TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Audit Trail for Research Rigor
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        details TEXT DEFAULT '',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    conn.commit()
    conn.close()

def log_audit(user_id: Optional[int], action: str, entity_type: str, entity_id: Optional[int], details: str = ""):
    try:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)",
            (user_id, action, entity_type, entity_id, details)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass
