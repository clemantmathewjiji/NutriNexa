from typing import List, Dict, Any, Optional
import math

# Standard conversion constants
KCAL_TO_KJ = 4.184
SODIUM_TO_SALT = 2.54 / 1000.0  # Sodium (mg) * 2.54 / 1000 = Salt (g)

# General Atwater energy factors (kcal per gram)
ATWATER_PROTEIN_KCAL = 4.0
ATWATER_CARB_KCAL = 4.0
ATWATER_FAT_KCAL = 9.0
ATWATER_FIBER_KCAL = 2.0

def calculate_single_food_nutrients(
    food_row: Dict[str, Any],
    food_nutrients: List[Dict[str, Any]],
    quantity_grams: float
) -> Dict[str, Any]:
    """
    Calculates nutrient contribution for a given edible quantity in grams.
    Formula: Nutrient amount = nutrient_per_100g * quantity_in_g / 100.0
    """
    scale = quantity_grams / 100.0
    computed_nutrients = {}

    for fn in food_nutrients:
        code = fn["nutrient_code"]
        amount_100g = fn["amount_per_100g"]
        unit = fn["unit"]
        is_missing = bool(fn.get("is_missing", 0))
        is_trace = bool(fn.get("is_trace", 0))

        if is_missing or amount_100g is None:
            computed_nutrients[code] = {
                "amount": None,
                "amount_per_100g": None,
                "unit": unit,
                "is_missing": True,
                "is_trace": False,
                "display": "N/A"
            }
        elif is_trace:
            computed_nutrients[code] = {
                "amount": 0.0,
                "amount_per_100g": 0.0,
                "unit": unit,
                "is_missing": False,
                "is_trace": True,
                "display": "Trace"
            }
        else:
            calc_val = round(amount_100g * scale, 4)
            computed_nutrients[code] = {
                "amount": calc_val,
                "amount_per_100g": amount_100g,
                "unit": unit,
                "is_missing": False,
                "is_trace": False,
                "display": f"{round(calc_val, 2)} {unit}"
            }

    return {
        "food_id": food_row["id"],
        "food_name": food_row["name"],
        "food_code": food_row["code"],
        "food_group": food_row["food_group"],
        "quantity_grams": quantity_grams,
        "nutrients": computed_nutrients
    }

def aggregate_nutrient_calculation(
    items: List[Dict[str, Any]],
    all_nutrients: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Aggregates multiple foods into total nutrient sum and concentration per 100g of mixture.
    Respects missing value propagation: if a nutrient is missing in ANY contributing item,
    an indicator flag is raised so researchers are fully informed.
    """
    total_grams = sum(item["quantity_grams"] for item in items)
    aggregated_totals = {}
    per_100g_totals = {}
    data_quality_notes = []

    for nut in all_nutrients:
        code = nut["code"]
        unit = nut["unit"]
        name = nut["name"]
        category = nut["category"]

        total_val = 0.0
        missing_count = 0
        has_any_data = False

        for item in items:
            nut_data = item["nutrients"].get(code)
            if not nut_data or nut_data["is_missing"]:
                missing_count += 1
            else:
                has_any_data = True
                if not nut_data["is_trace"]:
                    total_val += nut_data["amount"]

        if not has_any_data:
            aggregated_totals[code] = {
                "name": name,
                "category": category,
                "amount": None,
                "unit": unit,
                "is_missing": True,
                "has_partial_missing": False,
                "missing_items_count": missing_count,
                "display": "N/A"
            }
            per_100g_totals[code] = None
        else:
            is_partial = (missing_count > 0)
            if is_partial:
                data_quality_notes.append(f"{name}: missing data in {missing_count} item(s)")

            final_total = round(total_val, 3)
            aggregated_totals[code] = {
                "name": name,
                "category": category,
                "amount": final_total,
                "unit": unit,
                "is_missing": False,
                "has_partial_missing": is_partial,
                "missing_items_count": missing_count,
                "display": f"{round(final_total, 2)} {unit}"
            }

            if total_grams > 0:
                per_100g_totals[code] = round((final_total / total_grams) * 100.0, 3)
            else:
                per_100g_totals[code] = 0.0

    # Ensure kJ consistency if energy_kcal exists
    if "energy_kcal" in aggregated_totals and aggregated_totals["energy_kcal"]["amount"] is not None:
        kcal = aggregated_totals["energy_kcal"]["amount"]
        if "energy_kj" not in aggregated_totals or aggregated_totals["energy_kj"]["amount"] is None:
            aggregated_totals["energy_kj"] = {
                "name": "Energy (kJ)",
                "category": "energy",
                "amount": round(kcal * KCAL_TO_KJ, 1),
                "unit": "kJ",
                "is_missing": False,
                "has_partial_missing": False,
                "missing_items_count": 0,
                "display": f"{round(kcal * KCAL_TO_KJ, 1)} kJ"
            }
            if total_grams > 0:
                per_100g_totals["energy_kj"] = round((kcal * KCAL_TO_KJ / total_grams) * 100.0, 1)

    # Compute salt from sodium if sodium exists
    if "sodium" in aggregated_totals and aggregated_totals["sodium"]["amount"] is not None:
        sod_mg = aggregated_totals["sodium"]["amount"]
        calc_salt_g = round((sod_mg * 2.54) / 1000.0, 2)
        if "salt" not in aggregated_totals or aggregated_totals["salt"]["amount"] is None:
            aggregated_totals["salt"] = {
                "name": "Salt (NaCl equiv)",
                "category": "minerals",
                "amount": calc_salt_g,
                "unit": "g",
                "is_missing": False,
                "has_partial_missing": False,
                "missing_items_count": 0,
                "display": f"{calc_salt_g} g"
            }
            if total_grams > 0:
                per_100g_totals["salt"] = round((calc_salt_g / total_grams) * 100.0, 3)

    # Calculate macronutrient energy distribution percentages
    energy_kcal = aggregated_totals.get("energy_kcal", {}).get("amount", 0.0) or 0.0
    macro_distribution = {"protein_pct": 0.0, "carbs_pct": 0.0, "fat_pct": 0.0}
    if energy_kcal > 0:
        p_g = aggregated_totals.get("protein", {}).get("amount", 0.0) or 0.0
        c_g = aggregated_totals.get("carbs", {}).get("amount", 0.0) or 0.0
        f_g = aggregated_totals.get("fat", {}).get("amount", 0.0) or 0.0

        p_kcal = p_g * ATWATER_PROTEIN_KCAL
        c_kcal = c_g * ATWATER_CARB_KCAL
        f_kcal = f_g * ATWATER_FAT_KCAL

        macro_distribution = {
            "protein_pct": round((p_kcal / energy_kcal) * 100.0, 1),
            "carbs_pct": round((c_kcal / energy_kcal) * 100.0, 1),
            "fat_pct": round((f_kcal / energy_kcal) * 100.0, 1)
        }

    return {
        "total_edible_weight_grams": round(total_grams, 2),
        "items_count": len(items),
        "totals": aggregated_totals,
        "per_100g": per_100g_totals,
        "macro_distribution": macro_distribution,
        "data_quality_notes": data_quality_notes
    }

def calculate_recipe_breakdown(
    ingredient_calculations: List[Dict[str, Any]],
    all_nutrients: List[Dict[str, Any]],
    servings: float = 1.0,
    measured_final_weight_grams: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes total recipe nutrients, per-serving values, and per-100g prepared yield values.
    """
    if servings <= 0:
        servings = 1.0

    aggregated = aggregate_nutrient_calculation(ingredient_calculations, all_nutrients)
    total_raw_weight = aggregated["total_edible_weight_grams"]
    effective_final_weight = measured_final_weight_grams if (measured_final_weight_grams and measured_final_weight_grams > 0) else total_raw_weight

    per_serving = {}
    per_100g_final = {}

    for code, data in aggregated["totals"].items():
        if data["amount"] is not None:
            per_serving[code] = round(data["amount"] / servings, 2)
            if effective_final_weight > 0:
                per_100g_final[code] = round((data["amount"] / effective_final_weight) * 100.0, 2)
            else:
                per_100g_final[code] = 0.0
        else:
            per_serving[code] = None
            per_100g_final[code] = None

    return {
        "servings": servings,
        "raw_weight_grams": total_raw_weight,
        "final_weight_grams": effective_final_weight,
        "yield_factor": round(effective_final_weight / total_raw_weight, 3) if total_raw_weight > 0 else 1.0,
        "totals": aggregated["totals"],
        "per_serving": per_serving,
        "per_100g": per_100g_final,
        "macro_distribution": aggregated["macro_distribution"],
        "data_quality_notes": aggregated["data_quality_notes"]
    }

def compare_intake_to_drv(
    intake_totals: Dict[str, Any],
    drv_reference_values: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Compares aggregated intake totals against selected Dietary Reference Values (DRV/RDA/AI/UL).
    Identifies potential shortfall (<70% RDA) or excessive intake (> Upper Limit).
    Transparently notes that this is research screening, not clinical diagnosis.
    """
    comparison = []

    for drv in drv_reference_values:
        code = drv["nutrient_code"]
        target = drv["target_value"]
        target_unit = drv["unit"]
        target_type = drv.get("target_type", "RDA")
        ul = drv.get("upper_limit")

        actual_data = intake_totals.get(code)
        if not actual_data or actual_data.get("amount") is None:
            actual_amount = None
            pct_target = None
            status = "No Data"
        else:
            actual_amount = actual_data["amount"]
            pct_target = round((actual_amount / target) * 100.0, 1) if target > 0 else 0.0

            if ul and actual_amount > ul:
                status = "Excess (Above UL)"
            elif pct_target >= 100.0:
                status = "Target Met"
            elif pct_target >= 70.0:
                status = "Adequate Range"
            else:
                status = "Potential Shortfall"

        comparison.append({
            "nutrient_code": code,
            "actual_intake": actual_amount,
            "target_value": target,
            "unit": target_unit,
            "target_type": target_type,
            "upper_limit": ul,
            "percentage_of_target": pct_target,
            "status": status
        })

    return comparison

def compute_anthropometrics(
    weight_kg: float,
    height_cm: float,
    age_years: int,
    sex: str,
    waist_cm: Optional[float] = None,
    hip_cm: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes BMI, WHO category, Asian-Pacific category, and Waist-to-Height Ratio.
    Explicitly distinguishes adult standard from pediatric percentiles.
    """
    if height_cm <= 0 or weight_kg <= 0:
        raise ValueError("Height and weight must be positive numbers.")

    height_m = height_cm / 100.0
    bmi = round(weight_kg / (height_m * height_m), 2)

    # Standard WHO Adult Classification
    if age_years >= 18:
        if bmi < 18.5:
            who_category = "Underweight"
        elif bmi < 25.0:
            who_category = "Normal Weight"
        elif bmi < 30.0:
            who_category = "Pre-Obesity / Overweight"
        elif bmi < 35.0:
            who_category = "Obesity Class I"
        elif bmi < 40.0:
            who_category = "Obesity Class II"
        else:
            who_category = "Obesity Class III"

        # Asian Pacific cutoffs (WPRO / WHO Expert Consultation 2004)
        if bmi < 18.5:
            asian_category = "Underweight"
        elif bmi < 23.0:
            asian_category = "Normal / Increasing Risk"
        elif bmi < 27.5:
            asian_category = "Overweight"
        else:
            asian_category = "Obese"
    else:
        who_category = "Pediatric (Requires WHO Growth Standard Z-Scores for Age/Sex)"
        asian_category = "Pediatric"

    whtr = None
    whtr_status = None
    if waist_cm and waist_cm > 0:
        whtr = round(waist_cm / height_cm, 3)
        if whtr < 0.5:
            whtr_status = "Healthy Range (< 0.5)"
        elif whtr < 0.6:
            whtr_status = "Increased Cardiometabolic Risk (0.5 - 0.59)"
        else:
            whtr_status = "Substantially Increased Cardiometabolic Risk (>= 0.6)"

    waist_hip_ratio = None
    if waist_cm and hip_cm and hip_cm > 0:
        waist_hip_ratio = round(waist_cm / hip_cm, 2)

    return {
        "bmi": bmi,
        "who_category": who_category,
        "asian_category": asian_category,
        "waist_to_height_ratio": whtr,
        "waist_to_height_status": whtr_status,
        "waist_hip_ratio": waist_hip_ratio,
        "is_pediatric": age_years < 18,
        "method_citation": "WHO Technical Report Series 854 (1995) & WHO Expert Consultation (Lancet 2004)"
    }
