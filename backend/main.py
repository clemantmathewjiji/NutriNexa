import os
import json
import io
import math
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from database import get_db_connection, log_audit, init_db
from auth import (
    hash_password, verify_password, create_user_token,
    get_current_user, get_optional_current_user
)
from calculator import (
    calculate_single_food_nutrients,
    aggregate_nutrient_calculation,
    calculate_recipe_breakdown,
    compare_intake_to_drv,
    compute_anthropometrics
)
from models import (
    RegisterRequest, LoginRequest, ProfileUpdateRequest,
    CalculationCreateRequest, CalculationPreviewRequest,
    RecipeCreateRequest, DiaryCreateRequest, DiaryEntryInput,
    MealPlanCreateRequest, MealPlanItemInput, AnthropometricCreateRequest,
    ProjectCreateRequest, DatasetCreateRequest, CustomFoodCreateRequest,
    ReportGenerateRequest
)
from seed_data import seed_database

app = FastAPI(
    title="NutriNexa API",
    description="Scientific Nutrition Research & Analytics Backend Engine",
    version="2.0.0"
)

# Enable CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure database is initialized on startup
@app.on_event("startup")
def startup_event():
    seed_database()

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_all_nutrients_list(conn) -> List[Dict[str, Any]]:
    rows = conn.execute("SELECT code, name, category, unit, energy_factor_kcal, display_order FROM nutrients ORDER BY display_order ASC").fetchall()
    return [dict(r) for r in rows]

def get_food_with_nutrients(conn, food_id: int) -> Optional[Dict[str, Any]]:
    food_row = conn.execute("SELECT * FROM foods WHERE id = ?", (food_id,)).fetchone()
    if not food_row:
        return None
    food_dict = dict(food_row)

    fn_rows = conn.execute(
        "SELECT nutrient_code, amount_per_100g, unit, is_missing, is_trace FROM food_nutrients WHERE food_id = ?",
        (food_id,)
    ).fetchall()
    food_dict["nutrients"] = {r["nutrient_code"]: dict(r) for r in fn_rows}

    pu_rows = conn.execute("SELECT id, unit_name, gram_weight FROM portion_units WHERE food_id = ?", (food_id,)).fetchall()
    food_dict["portions"] = [dict(r) for r in pu_rows]
    return food_dict

# ============================================================================
# AUTHENTICATION & USER MANAGEMENT
# ============================================================================

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email.lower(),)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    pwd_hash, salt = hash_password(req.password)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, salt, role, institution) VALUES (?, ?, ?, ?, ?, ?)",
        (req.name.strip(), req.email.lower().strip(), pwd_hash, salt, req.role, req.institution or "")
    )
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit(user_id, "USER_REGISTERED", "users", user_id, f"Registered user {req.email}")
    token = create_user_token(user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": req.name,
            "email": req.email.lower(),
            "role": req.role,
            "institution": req.institution
        }
    }

@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (req.email.lower().strip(),)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(req.password, user["salt"], user["password_hash"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    user_id = user["id"]
    token = create_user_token(user_id)
    conn.close()

    log_audit(user_id, "USER_LOGIN", "users", user_id, "User logged in")
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "institution": user["institution"]
        }
    }

@app.get("/api/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    return {"user": user}

@app.post("/api/auth/logout")
def logout(user: dict = Depends(get_current_user)):
    log_audit(user["id"], "USER_LOGOUT", "users", user["id"], "User logged out")
    return {"message": "Logged out successfully"}

# ============================================================================
# DASHBOARD
# ============================================================================

@app.get("/api/dashboard/stats")
def get_dashboard_stats(user: Optional[dict] = Depends(get_optional_current_user)):
    conn = get_db_connection()
    total_foods = conn.execute("SELECT COUNT(*) as count FROM foods").fetchone()["count"]

    user_id = user["id"] if user else 1  # Default to demo user if not logged in

    user_calcs = conn.execute("SELECT COUNT(*) as count FROM calculations WHERE user_id = ?", (user_id,)).fetchone()["count"]
    user_recipes = conn.execute("SELECT COUNT(*) as count FROM recipes WHERE user_id = ?", (user_id,)).fetchone()["count"]
    user_projects = conn.execute("SELECT COUNT(*) as count FROM projects WHERE user_id = ?", (user_id,)).fetchone()["count"]
    user_diaries = conn.execute("SELECT COUNT(*) as count FROM food_diaries WHERE user_id = ?", (user_id,)).fetchone()["count"]
    user_anthro = conn.execute("SELECT COUNT(*) as count FROM anthropometrics WHERE user_id = ?", (user_id,)).fetchone()["count"]

    recent_calcs = conn.execute(
        "SELECT id, name, description, updated_at FROM calculations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5",
        (user_id,)
    ).fetchall()

    recent_recipes = conn.execute(
        "SELECT id, name, category, servings, updated_at FROM recipes WHERE user_id = ? ORDER BY updated_at DESC LIMIT 5",
        (user_id,)
    ).fetchall()

    active_projects = conn.execute(
        "SELECT id, title, code, status, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 4",
        (user_id,)
    ).fetchall()

    recent_audit = conn.execute(
        "SELECT action, entity_type, details, timestamp FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 6",
        (user_id,)
    ).fetchall()

    conn.close()

    return {
        "summary": {
            "total_foods": total_foods,
            "user_calculations": user_calcs,
            "user_recipes": user_recipes,
            "active_projects": user_projects,
            "dietary_assessments": user_diaries,
            "anthropometric_records": user_anthro
        },
        "recent_calculations": [dict(r) for r in recent_calcs],
        "recent_recipes": [dict(r) for r in recent_recipes],
        "active_projects": [dict(r) for r in active_projects],
        "recent_activity": [dict(r) for r in recent_audit]
    }

# ============================================================================
# NUTRIENT DEFINITIONS
# ============================================================================

@app.get("/api/nutrients")
def list_nutrients():
    conn = get_db_connection()
    nutrients = get_all_nutrients_list(conn)
    conn.close()
    return {"nutrients": nutrients}

# ============================================================================
# FOOD COMPOSITION DATABASE
# ============================================================================

@app.get("/api/foods")
def list_foods(
    query: Optional[str] = Query(None),
    food_group: Optional[str] = Query(None),
    data_source: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    conn = get_db_connection()
    sql = "SELECT id, code, name, alt_names, food_group, category, scientific_name, source_name, standard_quantity, standard_unit, data_quality_grade FROM foods WHERE 1=1"
    params = []

    if query:
        sql += " AND (name LIKE ? OR alt_names LIKE ? OR scientific_name LIKE ?)"
        term = f"%{query.strip()}%"
        params.extend([term, term, term])

    if food_group and food_group != "All Groups":
        sql += " AND food_group = ?"
        params.append(food_group)

    if data_source and data_source != "All Sources":
        sql += " AND source_name LIKE ?"
        params.append(f"%{data_source}%")

    # Count total
    count_sql = f"SELECT COUNT(*) as cnt FROM ({sql})"
    total_count = conn.execute(count_sql, params).fetchone()["cnt"]

    sql += " ORDER BY name ASC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(sql, params).fetchall()

    # Get distinct food groups and data sources for filter dropdowns
    groups = [r["food_group"] for r in conn.execute("SELECT DISTINCT food_group FROM foods ORDER BY food_group").fetchall()]
    sources = [r["source_name"] for r in conn.execute("SELECT DISTINCT source_name FROM foods ORDER BY source_name").fetchall()]

    conn.close()
    return {
        "total": total_count,
        "foods": [dict(r) for r in rows],
        "food_groups": groups,
        "data_sources": sources
    }

@app.get("/api/foods/{food_id}")
def get_food_detail(food_id: int):
    conn = get_db_connection()
    food = get_food_with_nutrients(conn, food_id)
    conn.close()
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found.")
    return food

@app.post("/api/foods/compare")
def compare_foods(food_ids: List[int]):
    if not food_ids or len(food_ids) > 6:
        raise HTTPException(status_code=400, detail="Provide between 1 and 6 food IDs to compare.")

    conn = get_db_connection()
    all_nutrients = get_all_nutrients_list(conn)
    foods_data = []
    for fid in food_ids:
        food = get_food_with_nutrients(conn, fid)
        if food:
            foods_data.append(food)
    conn.close()

    return {
        "nutrients": all_nutrients,
        "foods": foods_data
    }

@app.post("/api/foods/custom")
def create_custom_food(req: CustomFoodCreateRequest, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    code = f"USER-{user['id']}-{int(datetime.utcnow().timestamp())}"
    cursor.execute("""
        INSERT INTO foods (
            code, name, alt_names, food_group, category, scientific_name,
            description, source_name, source_citation, source_year,
            standard_quantity, standard_unit, preparation_state, is_custom, user_id, data_quality_grade
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100.0, 'g', ?, 1, ?, 'User Custom Food (Validated Schema)')
    """, (
        code, req.name.strip(), req.alt_names or "", req.food_group,
        req.category or "Custom", req.scientific_name or "",
        req.description or "", req.source_name, req.source_citation or "",
        req.source_year or "2026", req.preparation_state or "Raw", user["id"]
    ))
    food_id = cursor.lastrowid

    # Insert nutrients
    for code_k, amount in req.nutrients.items():
        if amount is not None:
            unit = "g"
            # look up standard unit
            row_unit = conn.execute("SELECT unit FROM nutrients WHERE code = ?", (code_k,)).fetchone()
            if row_unit:
                unit = row_unit["unit"]
            cursor.execute("""
                INSERT INTO food_nutrients (food_id, nutrient_code, amount_per_100g, unit, is_missing, is_trace)
                VALUES (?, ?, ?, ?, 0, 0)
            """, (food_id, code_k, amount, unit))

    # Insert portion units
    if req.portions:
        for p in req.portions:
            cursor.execute("""
                INSERT INTO portion_units (food_id, unit_name, gram_weight)
                VALUES (?, ?, ?)
            """, (food_id, p["name"], p["weight"]))

    conn.commit()
    conn.close()

    log_audit(user["id"], "CUSTOM_FOOD_CREATED", "foods", food_id, f"Added custom food {req.name}")
    return {"message": "Custom food created successfully", "food_id": food_id}

# ============================================================================
# NUTRIENT CALCULATOR
# ============================================================================

@app.post("/api/calculations/preview")
def preview_calculation(req: CalculationPreviewRequest):
    """
    On-the-fly scientific nutrient calculation for arbitrary list of foods and quantities.
    Formula: Nutrient amount = nutrient_per_100g * quantity_in_g / 100.0
    """
    if not req.items:
        raise HTTPException(status_code=400, detail="Calculation must contain at least one food item.")

    conn = get_db_connection()
    all_nutrients = get_all_nutrients_list(conn)

    item_results = []
    for it in req.items:
        food = get_food_with_nutrients(conn, it.food_id)
        if not food:
            continue
        # Convert food["nutrients"] to list of dicts for calculation
        fn_list = list(food["nutrients"].values())
        single_result = calculate_single_food_nutrients(food, fn_list, it.quantity_grams)
        single_result["portion_unit_name"] = it.portion_unit_name
        item_results.append(single_result)

    conn.close()

    aggregated = aggregate_nutrient_calculation(item_results, all_nutrients)
    return {
        "items": item_results,
        "calculation": aggregated
    }

@app.post("/api/calculations")
def save_calculation(req: CalculationCreateRequest, user: dict = Depends(get_current_user)):
    if not req.items:
        raise HTTPException(status_code=400, detail="Cannot save calculation without items.")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO calculations (user_id, project_id, name, description, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (user["id"], req.project_id, req.name.strip(), req.description or "", req.notes or ""))
    calc_id = cursor.lastrowid

    for it in req.items:
        cursor.execute("""
            INSERT INTO calculation_items (calculation_id, food_id, quantity_grams, portion_unit_name, serving_multiplier)
            VALUES (?, ?, ?, ?, ?)
        """, (calc_id, it.food_id, it.quantity_grams, it.portion_unit_name or "grams", it.serving_multiplier or 1.0))

    conn.commit()
    conn.close()

    log_audit(user["id"], "CALCULATION_SAVED", "calculations", calc_id, f"Saved calculation {req.name}")
    return {"message": "Calculation saved successfully", "calculation_id": calc_id}

@app.get("/api/calculations")
def list_calculations(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT c.id, c.name, c.description, c.project_id, p.title as project_title,
               c.created_at, c.updated_at,
               (SELECT COUNT(*) FROM calculation_items WHERE calculation_id = c.id) as item_count
        FROM calculations c
        LEFT JOIN projects p ON c.project_id = p.id
        WHERE c.user_id = ?
        ORDER BY c.updated_at DESC
    """, (user["id"],)).fetchall()
    conn.close()
    return {"calculations": [dict(r) for r in rows]}

@app.get("/api/calculations/{calc_id}")
def get_calculation(calc_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    calc = conn.execute("SELECT * FROM calculations WHERE id = ? AND user_id = ?", (calc_id, user["id"])).fetchone()
    if not calc:
        conn.close()
        raise HTTPException(status_code=404, detail="Calculation not found or unauthorized.")

    items_rows = conn.execute("""
        SELECT ci.id, ci.food_id, ci.quantity_grams, ci.portion_unit_name, ci.serving_multiplier
        FROM calculation_items ci
        WHERE ci.calculation_id = ?
    """, (calc_id,)).fetchall()

    all_nutrients = get_all_nutrients_list(conn)

    item_results = []
    for it in items_rows:
        food = get_food_with_nutrients(conn, it["food_id"])
        if food:
            fn_list = list(food["nutrients"].values())
            single_result = calculate_single_food_nutrients(food, fn_list, it["quantity_grams"])
            single_result["portion_unit_name"] = it["portion_unit_name"]
            single_result["item_id"] = it["id"]
            item_results.append(single_result)

    conn.close()

    aggregated = aggregate_nutrient_calculation(item_results, all_nutrients)
    return {
        "calculation": dict(calc),
        "items": item_results,
        "results": aggregated
    }

@app.post("/api/calculations/{calc_id}/duplicate")
def duplicate_calculation(calc_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    calc = conn.execute("SELECT * FROM calculations WHERE id = ? AND user_id = ?", (calc_id, user["id"])).fetchone()
    if not calc:
        conn.close()
        raise HTTPException(status_code=404, detail="Calculation not found.")

    items = conn.execute("SELECT food_id, quantity_grams, portion_unit_name, serving_multiplier FROM calculation_items WHERE calculation_id = ?", (calc_id,)).fetchall()

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO calculations (user_id, project_id, name, description, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (user["id"], calc["project_id"], f"{calc['name']} (Copy)", calc["description"], calc["notes"]))
    new_id = cursor.lastrowid

    for it in items:
        cursor.execute("""
            INSERT INTO calculation_items (calculation_id, food_id, quantity_grams, portion_unit_name, serving_multiplier)
            VALUES (?, ?, ?, ?, ?)
        """, (new_id, it["food_id"], it["quantity_grams"], it["portion_unit_name"], it["serving_multiplier"]))

    conn.commit()
    conn.close()
    return {"message": "Calculation duplicated", "calculation_id": new_id}

@app.delete("/api/calculations/{calc_id}")
def delete_calculation(calc_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM calculations WHERE id = ? AND user_id = ?", (calc_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Calculation deleted successfully"}

# ============================================================================
# RECIPE ANALYSIS
# ============================================================================

@app.get("/api/recipes")
def list_recipes(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT r.id, r.name, r.category, r.servings, r.total_weight_grams, r.allergens,
               r.created_at, r.updated_at,
               (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = r.id) as ingredient_count
        FROM recipes r
        WHERE r.user_id = ?
        ORDER BY r.updated_at DESC
    """, (user["id"],)).fetchall()
    conn.close()
    return {"recipes": [dict(r) for r in rows]}

@app.get("/api/recipes/{recipe_id}")
def get_recipe(recipe_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    recipe = conn.execute("SELECT * FROM recipes WHERE id = ? AND user_id = ?", (recipe_id, user["id"])).fetchone()
    if not recipe:
        conn.close()
        raise HTTPException(status_code=404, detail="Recipe not found.")

    ing_rows = conn.execute("SELECT * FROM recipe_ingredients WHERE recipe_id = ?", (recipe_id,)).fetchall()
    all_nutrients = get_all_nutrients_list(conn)

    ingredient_results = []
    for ing in ing_rows:
        food = get_food_with_nutrients(conn, ing["food_id"])
        if food:
            fn_list = list(food["nutrients"].values())
            res = calculate_single_food_nutrients(food, fn_list, ing["quantity_grams"])
            res["preparation_note"] = ing["preparation_note"]
            ingredient_results.append(res)

    conn.close()

    recipe_breakdown = calculate_recipe_breakdown(
        ingredient_results,
        all_nutrients,
        servings=recipe["servings"],
        measured_final_weight_grams=recipe["total_weight_grams"]
    )

    return {
        "recipe": dict(recipe),
        "ingredients": ingredient_results,
        "breakdown": recipe_breakdown
    }

@app.post("/api/recipes")
def create_recipe(req: RecipeCreateRequest, user: dict = Depends(get_current_user)):
    if not req.ingredients:
        raise HTTPException(status_code=400, detail="Recipe must contain at least one ingredient.")

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO recipes (
            user_id, project_id, name, description, category, servings,
            total_weight_grams, cooking_instructions, research_notes, allergens
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user["id"], req.project_id, req.name.strip(), req.description or "",
        req.category or "General", req.servings, req.total_weight_grams or 0.0,
        req.cooking_instructions or "", req.research_notes or "", req.allergens or ""
    ))
    recipe_id = cursor.lastrowid

    for ing in req.ingredients:
        cursor.execute("""
            INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_grams, portion_unit_name, preparation_note)
            VALUES (?, ?, ?, ?, ?)
        """, (recipe_id, ing.food_id, ing.quantity_grams, ing.portion_unit_name or "grams", ing.preparation_note or ""))

    conn.commit()
    conn.close()

    log_audit(user["id"], "RECIPE_CREATED", "recipes", recipe_id, f"Created recipe {req.name}")
    return {"message": "Recipe created successfully", "recipe_id": recipe_id}

@app.delete("/api/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM recipes WHERE id = ? AND user_id = ?", (recipe_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Recipe deleted successfully"}

# ============================================================================
# DIETARY ASSESSMENT & FOOD DIARIES
# ============================================================================

@app.get("/api/diaries/drv-profiles")
def list_drv_profiles():
    conn = get_db_connection()
    profiles = conn.execute("SELECT * FROM dietary_reference_profiles ORDER BY id ASC").fetchall()
    result = []
    for p in profiles:
        vals = conn.execute("SELECT * FROM dietary_reference_values WHERE profile_id = ?", (p["id"],)).fetchall()
        p_dict = dict(p)
        p_dict["values"] = [dict(v) for v in vals]
        result.append(p_dict)
    conn.close()
    return {"profiles": result}

@app.get("/api/diaries")
def list_diaries(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT d.id, d.client_code, d.diary_date, d.assessment_type, d.notes,
               p.profile_name as reference_profile_name,
               (SELECT COUNT(*) FROM diary_entries WHERE diary_id = d.id) as entries_count
        FROM food_diaries d
        LEFT JOIN dietary_reference_profiles p ON d.reference_profile_id = p.id
        WHERE d.user_id = ?
        ORDER BY d.diary_date DESC
    """, (user["id"],)).fetchall()
    conn.close()
    return {"diaries": [dict(r) for r in rows]}

@app.post("/api/diaries")
def create_diary(req: DiaryCreateRequest, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO food_diaries (user_id, project_id, client_code, diary_date, assessment_type, reference_profile_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user["id"], req.project_id, req.client_code.strip(), req.diary_date, req.assessment_type, req.reference_profile_id or 1, req.notes or ""))
    diary_id = cursor.lastrowid

    if req.entries:
        for ent in req.entries:
            cursor.execute("""
                INSERT INTO diary_entries (diary_id, meal_type, food_id, recipe_id, item_type, quantity_grams, portion_description, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (diary_id, ent.meal_type, ent.food_id, ent.recipe_id, ent.item_type, ent.quantity_grams, ent.portion_description or "", ent.notes or ""))

    conn.commit()
    conn.close()
    return {"message": "Dietary record created", "diary_id": diary_id}

@app.get("/api/diaries/{diary_id}")
def get_diary_detail(diary_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    diary = conn.execute("SELECT * FROM food_diaries WHERE id = ? AND user_id = ?", (diary_id, user["id"])).fetchone()
    if not diary:
        conn.close()
        raise HTTPException(status_code=404, detail="Dietary diary not found.")

    entries_rows = conn.execute("SELECT * FROM diary_entries WHERE diary_id = ?", (diary_id,)).fetchall()
    all_nutrients = get_all_nutrients_list(conn)

    # Fetch reference profile values
    ref_id = diary["reference_profile_id"] or 1
    ref_profile = conn.execute("SELECT * FROM dietary_reference_profiles WHERE id = ?", (ref_id,)).fetchone()
    drv_values = conn.execute("SELECT * FROM dietary_reference_values WHERE profile_id = ?", (ref_id,)).fetchall()
    drv_list = [dict(v) for v in drv_values]

    calculated_items = []
    meal_grouped = {"Breakfast": [], "Lunch": [], "Dinner": [], "Morning Snack": [], "Evening Snack": [], "Snacks": []}

    for ent in entries_rows:
        if ent["item_type"] == "food" and ent["food_id"]:
            food = get_food_with_nutrients(conn, ent["food_id"])
            if food:
                fn_list = list(food["nutrients"].values())
                single = calculate_single_food_nutrients(food, fn_list, ent["quantity_grams"])
                single["meal_type"] = ent["meal_type"]
                single["entry_id"] = ent["id"]
                single["item_type"] = "food"
                single["portion_description"] = ent["portion_description"]
                calculated_items.append(single)
                meal_key = ent["meal_type"] if ent["meal_type"] in meal_grouped else "Snacks"
                meal_grouped[meal_key].append(single)
        elif ent["item_type"] == "recipe" and ent["recipe_id"]:
            recipe = conn.execute("SELECT * FROM recipes WHERE id = ?", (ent["recipe_id"],)).fetchone()
            if recipe:
                ing_rows = conn.execute("SELECT * FROM recipe_ingredients WHERE recipe_id = ?", (ent["recipe_id"],)).fetchall()
                ing_calcs = []
                for ing in ing_rows:
                    f = get_food_with_nutrients(conn, ing["food_id"])
                    if f:
                        ing_calcs.append(calculate_single_food_nutrients(f, list(f["nutrients"].values()), ing["quantity_grams"]))
                rec_breakdown = calculate_recipe_breakdown(ing_calcs, all_nutrients, recipe["servings"], recipe["total_weight_grams"])

                scale = ent["quantity_grams"] / rec_breakdown["final_weight_grams"] if rec_breakdown["final_weight_grams"] > 0 else 1.0
                scaled_nuts = {}
                for k, v in rec_breakdown["totals"].items():
                    amt = round(v["amount"] * scale, 3) if v["amount"] is not None else None
                    scaled_nuts[k] = {"amount": amt, "unit": v["unit"], "is_missing": v["is_missing"], "is_trace": False}

                rec_item = {
                    "entry_id": ent["id"],
                    "food_id": None,
                    "food_name": f"[Recipe] {recipe['name']}",
                    "food_group": "Prepared Dishes",
                    "quantity_grams": ent["quantity_grams"],
                    "meal_type": ent["meal_type"],
                    "item_type": "recipe",
                    "portion_description": ent["portion_description"],
                    "nutrients": scaled_nuts
                }
                calculated_items.append(rec_item)
                meal_key = ent["meal_type"] if ent["meal_type"] in meal_grouped else "Snacks"
                meal_grouped[meal_key].append(rec_item)

    conn.close()

    aggregated = aggregate_nutrient_calculation(calculated_items, all_nutrients)
    comparison = compare_intake_to_drv(aggregated["totals"], drv_list)

    return {
        "diary": dict(diary),
        "reference_profile": dict(ref_profile) if ref_profile else None,
        "items": calculated_items,
        "meals": meal_grouped,
        "daily_totals": aggregated,
        "drv_comparison": comparison
    }

@app.post("/api/diaries/{diary_id}/entries")
def add_diary_entry(diary_id: int, ent: DiaryEntryInput, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO diary_entries (diary_id, meal_type, food_id, recipe_id, item_type, quantity_grams, portion_description, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (diary_id, ent.meal_type, ent.food_id, ent.recipe_id, ent.item_type, ent.quantity_grams, ent.portion_description or "", ent.notes or ""))
    entry_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Entry added", "entry_id": entry_id}

@app.delete("/api/diaries/{diary_id}/entries/{entry_id}")
def delete_diary_entry(diary_id: int, entry_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM diary_entries WHERE id = ? AND diary_id = ?", (entry_id, diary_id))
    conn.commit()
    conn.close()
    return {"message": "Entry removed"}

@app.delete("/api/diaries/{diary_id}")
def delete_diary(diary_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM food_diaries WHERE id = ? AND user_id = ?", (diary_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Diary deleted"}

# ============================================================================
# ANTHROPOMETRIC ASSESSMENT
# ============================================================================

@app.post("/api/anthropometrics/calculate")
def calculate_anthro_preview(weight_kg: float, height_cm: float, age_years: int, sex: str, waist_cm: Optional[float] = None, hip_cm: Optional[float] = None):
    return compute_anthropometrics(weight_kg, height_cm, age_years, sex, waist_cm, hip_cm)

@app.post("/api/anthropometrics")
def save_anthropometrics(req: AnthropometricCreateRequest, user: dict = Depends(get_current_user)):
    calc = compute_anthropometrics(req.weight_kg, req.height_cm, req.age_years, req.sex, req.waist_cm, req.hip_cm)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO anthropometrics (
            user_id, project_id, subject_identifier, age_years, sex, assessment_date,
            height_cm, weight_kg, waist_cm, hip_cm, bmi, bmi_category,
            waist_to_height_ratio, reference_standard, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        user["id"], req.project_id, req.subject_identifier.strip(), req.age_years, req.sex,
        req.assessment_date, req.height_cm, req.weight_kg, req.waist_cm, req.hip_cm,
        calc["bmi"], calc["who_category"], calc["waist_to_height_ratio"],
        req.reference_standard or "WHO Adult Classification", req.notes or ""
    ))
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit(user["id"], "ANTHRO_SAVED", "anthropometrics", record_id, f"Recorded anthropometrics for {req.subject_identifier}")
    return {"message": "Anthropometric assessment saved", "record_id": record_id, "results": calc}

@app.get("/api/anthropometrics")
def list_anthropometrics(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT * FROM anthropometrics WHERE user_id = ? ORDER BY assessment_date DESC, id DESC
    """, (user["id"],)).fetchall()
    conn.close()
    return {"records": [dict(r) for r in rows]}

# ============================================================================
# RESEARCH PROJECTS
# ============================================================================

@app.get("/api/projects")
def list_projects(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT p.*,
               (SELECT COUNT(*) FROM calculations WHERE project_id = p.id) as calculations_count,
               (SELECT COUNT(*) FROM recipes WHERE project_id = p.id) as recipes_count,
               (SELECT COUNT(*) FROM food_diaries WHERE project_id = p.id) as diaries_count,
               (SELECT COUNT(*) FROM project_datasets WHERE project_id = p.id) as datasets_count
        FROM projects p
        WHERE p.user_id = ?
        ORDER BY p.updated_at DESC
    """, (user["id"],)).fetchall()
    conn.close()
    return {"projects": [dict(r) for r in rows]}

@app.get("/api/projects/{proj_id}")
def get_project_detail(proj_id: int, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    proj = conn.execute("SELECT * FROM projects WHERE id = ? AND user_id = ?", (proj_id, user["id"])).fetchone()
    if not proj:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found.")

    calcs = conn.execute("SELECT id, name, description, updated_at FROM calculations WHERE project_id = ?", (proj_id,)).fetchall()
    recipes = conn.execute("SELECT id, name, category, servings, updated_at FROM recipes WHERE project_id = ?", (proj_id,)).fetchall()
    diaries = conn.execute("SELECT id, client_code, diary_date, assessment_type FROM food_diaries WHERE project_id = ?", (proj_id,)).fetchall()
    datasets = conn.execute("SELECT id, dataset_name, description, row_count, descriptive_stats_json, uploaded_at FROM project_datasets WHERE project_id = ?", (proj_id,)).fetchall()
    anthros = conn.execute("SELECT id, subject_identifier, bmi, bmi_category, assessment_date FROM anthropometrics WHERE project_id = ?", (proj_id,)).fetchall()

    conn.close()

    parsed_datasets = []
    for d in datasets:
        d_dict = dict(d)
        try:
            d_dict["descriptive_stats"] = json.loads(d["descriptive_stats_json"] or "{}")
        except Exception:
            d_dict["descriptive_stats"] = {}
        parsed_datasets.append(d_dict)

    return {
        "project": dict(proj),
        "calculations": [dict(c) for c in calcs],
        "recipes": [dict(r) for r in recipes],
        "diaries": [dict(d) for d in diaries],
        "anthropometrics": [dict(a) for a in anthros],
        "datasets": parsed_datasets
    }

@app.post("/api/projects")
def create_project(req: ProjectCreateRequest, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO projects (user_id, title, code, objectives, methodology_notes, lead_researcher, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        user["id"], req.title.strip(), req.code.strip(),
        req.objectives or "", req.methodology_notes or "",
        req.lead_researcher or user["name"], req.tags or ""
    ))
    proj_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit(user["id"], "PROJECT_CREATED", "projects", proj_id, f"Created project {req.title}")
    return {"message": "Project created", "project_id": proj_id}

@app.post("/api/projects/{proj_id}/datasets")
def add_project_dataset(proj_id: int, req: DatasetCreateRequest, user: dict = Depends(get_current_user)):
    """
    Computes transparent descriptive statistics (mean, median, std, min, max, N)
    over numeric variables in user-supplied research data.
    """
    conn = get_db_connection()
    proj = conn.execute("SELECT id FROM projects WHERE id = ? AND user_id = ?", (proj_id, user["id"])).fetchone()
    if not proj:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found.")

    raw_data = req.raw_data
    row_count = len(raw_data)
    variables = list(raw_data[0].keys()) if row_count > 0 else []

    # Calculate real descriptive statistics
    descriptive_stats = {}
    for var in variables:
        numeric_vals = []
        for row in raw_data:
            val = row.get(var)
            if isinstance(val, (int, float)) and not math.isnan(val):
                numeric_vals.append(float(val))

        if numeric_vals:
            numeric_vals.sort()
            n = len(numeric_vals)
            mean_v = sum(numeric_vals) / n
            median_v = numeric_vals[n // 2] if n % 2 != 0 else (numeric_vals[n // 2 - 1] + numeric_vals[n // 2]) / 2.0
            variance = sum((x - mean_v) ** 2 for x in numeric_vals) / (n - 1) if n > 1 else 0.0
            std_v = math.sqrt(variance)

            descriptive_stats[var] = {
                "n": n,
                "missing": row_count - n,
                "mean": round(mean_v, 2),
                "median": round(median_v, 2),
                "std_dev": round(std_v, 2),
                "min": round(min(numeric_vals), 2),
                "max": round(max(numeric_vals), 2)
            }

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO project_datasets (
            project_id, dataset_name, description, row_count,
            variables_json, data_json, descriptive_stats_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        proj_id, req.dataset_name.strip(), req.description or "",
        row_count, json.dumps(variables), json.dumps(raw_data), json.dumps(descriptive_stats)
    ))
    dataset_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit(user["id"], "DATASET_UPLOADED", "project_datasets", dataset_id, f"Uploaded dataset {req.dataset_name} with {row_count} rows")
    return {
        "message": "Dataset uploaded and analyzed",
        "dataset_id": dataset_id,
        "row_count": row_count,
        "descriptive_stats": descriptive_stats
    }

# ============================================================================
# SCIENTIFIC REPORTS & AUDIT TRAIL
# ============================================================================

@app.post("/api/reports/generate")
def generate_report(req: ReportGenerateRequest, user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    cursor = conn.cursor()

    report_metadata = {
        "platform": "NutriNexa - Nutrition Research & Analytics",
        "generated_by": user["name"],
        "user_email": user["email"],
        "institution": user["institution"],
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "methodology": "Standard Edible Nutrient Proportion Formula: (Amount_100g * Grams / 100). Energy values derived from published food composition tables (USDA / McCance & Widdowson) with transparent missing-data notation.",
        "parameters": req.parameters
    }

    cursor.execute("""
        INSERT INTO reports (user_id, project_id, report_type, title, parameters_json, summary_json)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        user["id"], req.project_id, req.report_type, req.title.strip(),
        json.dumps(req.parameters or {}), json.dumps(report_metadata)
    ))
    report_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit(user["id"], "REPORT_GENERATED", "reports", report_id, f"Generated report: {req.title}")
    return {
        "message": "Report generated",
        "report_id": report_id,
        "report": {
            "id": report_id,
            "title": req.title,
            "report_type": req.report_type,
            "metadata": report_metadata
        }
    }

@app.get("/api/reports")
def list_reports(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC", (user["id"],)).fetchall()
    conn.close()
    return {"reports": [dict(r) for r in rows]}

@app.get("/api/audit")
def get_audit_trail(user: dict = Depends(get_current_user)):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM audit_logs WHERE user_id = ? ORDER BY timestamp DESC LIMIT 100", (user["id"],)).fetchall()
    conn.close()
    return {"logs": [dict(r) for r in rows]}

# ============================================================================
# CSV EXPORT
# ============================================================================

@app.get("/api/export/foods-csv")
def export_foods_csv():
    conn = get_db_connection()
    foods = conn.execute("SELECT id, code, name, food_group, category, source_name, standard_quantity, standard_unit FROM foods").fetchall()
    all_nuts = conn.execute("SELECT code, name, unit FROM nutrients ORDER BY display_order ASC").fetchall()

    output = io.StringIO()
    # Headers
    header = ["ID", "Code", "Food Name", "Food Group", "Category", "Data Source"]
    for n in all_nuts:
        header.append(f"{n['name']} ({n['unit']})")
    output.write(",".join(f'"{h}"' for h in header) + "\n")

    for f in foods:
        row = [str(f["id"]), f["code"] or "", f'"{f["name"]}"', f'"{f["food_group"]}"', f'"{f["category"]}"', f'"{f["source_name"]}"']
        fn_map = {r["nutrient_code"]: r["amount_per_100g"] for r in conn.execute("SELECT nutrient_code, amount_per_100g FROM food_nutrients WHERE food_id = ?", (f["id"],)).fetchall()}
        for n in all_nuts:
            val = fn_map.get(n["code"])
            row.append(str(val) if val is not None else "")
        output.write(",".join(row) + "\n")

# Mount built frontend static files for seamless single-port serving
FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        target_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(target_path):
            return FileResponse(target_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
