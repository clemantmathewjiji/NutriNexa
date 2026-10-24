import unittest
import math
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from calculator import (
    calculate_single_food_nutrients,
    aggregate_nutrient_calculation,
    calculate_recipe_breakdown,
    compare_intake_to_drv,
    compute_anthropometrics,
    KCAL_TO_KJ
)
from auth import hash_password, verify_password

class TestNutriNexaCalculationEngine(unittest.TestCase):

    def test_single_food_nutrient_scaling(self):
        """
        Verify: Nutrient amount = nutrient value per 100 g * edible food quantity in grams / 100.
        """
        food_row = {"id": 1, "name": "Test Oats", "code": "TEST-01", "food_group": "Cereals"}
        food_nutrients = [
            {"nutrient_code": "protein", "amount_per_100g": 16.0, "unit": "g", "is_missing": 0, "is_trace": 0},
            {"nutrient_code": "energy_kcal", "amount_per_100g": 380.0, "unit": "kcal", "is_missing": 0, "is_trace": 0},
            {"nutrient_code": "vitamin_b12", "amount_per_100g": None, "unit": "µg", "is_missing": 1, "is_trace": 0},
            {"nutrient_code": "selenium", "amount_per_100g": 0.0, "unit": "µg", "is_missing": 0, "is_trace": 1}
        ]

        # Test 50 grams (half portion)
        result_50g = calculate_single_food_nutrients(food_row, food_nutrients, 50.0)
        self.assertEqual(result_50g["nutrients"]["protein"]["amount"], 8.0)
        self.assertEqual(result_50g["nutrients"]["energy_kcal"]["amount"], 190.0)
        self.assertTrue(result_50g["nutrients"]["vitamin_b12"]["is_missing"])
        self.assertIsNone(result_50g["nutrients"]["vitamin_b12"]["amount"])
        self.assertTrue(result_50g["nutrients"]["selenium"]["is_trace"])

        # Test 200 grams (double portion)
        result_200g = calculate_single_food_nutrients(food_row, food_nutrients, 200.0)
        self.assertEqual(result_200g["nutrients"]["protein"]["amount"], 32.0)
        self.assertEqual(result_200g["nutrients"]["energy_kcal"]["amount"], 760.0)

    def test_multi_food_aggregation(self):
        """
        Verify: Summing multiple foods preserves individual contributions and computes per 100g of composite.
        """
        all_nutrients = [
            {"code": "energy_kcal", "name": "Energy", "category": "Energy", "unit": "kcal"},
            {"code": "protein", "name": "Protein", "category": "Proximates", "unit": "g"},
            {"code": "fat", "name": "Fat", "category": "Proximates", "unit": "g"},
            {"code": "carbs", "name": "Carbs", "category": "Proximates", "unit": "g"}
        ]

        item1 = {
            "quantity_grams": 100.0,
            "nutrients": {
                "energy_kcal": {"amount": 100.0, "is_missing": False, "is_trace": False},
                "protein": {"amount": 20.0, "is_missing": False, "is_trace": False},
                "fat": {"amount": 2.0, "is_missing": False, "is_trace": False},
                "carbs": {"amount": 0.0, "is_missing": False, "is_trace": False}
            }
        }
        item2 = {
            "quantity_grams": 100.0,
            "nutrients": {
                "energy_kcal": {"amount": 200.0, "is_missing": False, "is_trace": False},
                "protein": {"amount": 10.0, "is_missing": False, "is_trace": False},
                "fat": {"amount": 5.0, "is_missing": False, "is_trace": False},
                "carbs": {"amount": 30.0, "is_missing": False, "is_trace": False}
            }
        }

        agg = aggregate_nutrient_calculation([item1, item2], all_nutrients)
        self.assertEqual(agg["total_edible_weight_grams"], 200.0)
        self.assertEqual(agg["totals"]["protein"]["amount"], 30.0)
        self.assertEqual(agg["totals"]["energy_kcal"]["amount"], 300.0)
        # Concentration per 100g of total 200g mixture
        self.assertEqual(agg["per_100g"]["protein"], 15.0)
        self.assertEqual(agg["per_100g"]["energy_kcal"], 150.0)

    def test_recipe_yield_and_servings(self):
        """
        Verify: Recipe calculation divides by servings and calculates cooked yield density.
        """
        all_nutrients = [
            {"code": "energy_kcal", "name": "Energy", "category": "Energy", "unit": "kcal"},
            {"code": "protein", "name": "Protein", "category": "Proximates", "unit": "g"}
        ]
        items = [
            {
                "quantity_grams": 200.0,
                "nutrients": {
                    "energy_kcal": {"amount": 400.0, "is_missing": False, "is_trace": False},
                    "protein": {"amount": 40.0, "is_missing": False, "is_trace": False}
                }
            }
        ]

        # 4 servings, cooked down from 200g to 160g
        recipe = calculate_recipe_breakdown(items, all_nutrients, servings=4.0, measured_final_weight_grams=160.0)
        self.assertEqual(recipe["servings"], 4.0)
        self.assertEqual(recipe["per_serving"]["energy_kcal"], 100.0)
        self.assertEqual(recipe["per_serving"]["protein"], 10.0)
        self.assertEqual(recipe["yield_factor"], 0.8)
        # Per 100g of prepared final dish: (400 / 160) * 100 = 250 kcal
        self.assertEqual(recipe["per_100g"]["energy_kcal"], 250.0)

    def test_drv_comparison_shortfall_and_excess(self):
        """
        Verify: Accurate flagging of shortfalls (<70% target) and upper limit exceedance (>UL).
        """
        intake_totals = {
            "iron": {"amount": 5.0},         # Target 18.0 -> ~27.7% -> Shortfall
            "vitamin_c": {"amount": 80.0},   # Target 75.0 -> 106.7% -> Target Met
            "sodium": {"amount": 2800.0}     # Target 1500, UL 2300 -> Excess (Above UL)
        }
        drvs = [
            {"nutrient_code": "iron", "target_value": 18.0, "unit": "mg", "target_type": "RDA", "upper_limit": 45.0},
            {"nutrient_code": "vitamin_c", "target_value": 75.0, "unit": "mg", "target_type": "RDA", "upper_limit": 2000.0},
            {"nutrient_code": "sodium", "target_value": 1500.0, "unit": "mg", "target_type": "AI", "upper_limit": 2300.0}
        ]

        comparison = compare_intake_to_drv(intake_totals, drvs)
        comp_map = {c["nutrient_code"]: c for c in comparison}

        self.assertEqual(comp_map["iron"]["status"], "Potential Shortfall")
        self.assertEqual(comp_map["vitamin_c"]["status"], "Target Met")
        self.assertEqual(comp_map["sodium"]["status"], "Excess (Above UL)")

    def test_anthropometrics(self):
        """
        Verify: BMI and Waist-to-Height calculations and scientific classifications.
        """
        # Height 1.75m, Weight 70kg -> BMI = 70 / (1.75^2) = 22.86 (Normal)
        anthro = compute_anthropometrics(weight_kg=70.0, height_cm=175.0, age_years=25, sex="Male", waist_cm=80.0)
        self.assertAlmostEqual(anthro["bmi"], 22.86, places=2)
        self.assertEqual(anthro["who_category"], "Normal Weight")
        self.assertAlmostEqual(anthro["waist_to_height_ratio"], 0.457, places=2)
        self.assertIn("Healthy Range", anthro["waist_to_height_status"])

        # Overweight check
        anthro_over = compute_anthropometrics(weight_kg=85.0, height_cm=170.0, age_years=30, sex="Female", waist_cm=95.0)
        self.assertAlmostEqual(anthro_over["bmi"], 29.41, places=2)
        self.assertEqual(anthro_over["who_category"], "Pre-Obesity / Overweight")
        self.assertIn("Increased Cardiometabolic Risk", anthro_over["waist_to_height_status"])

    def test_auth_password_hashing(self):
        """
        Verify: Passwords are salted with PBKDF2-HMAC-SHA256 and never stored plain.
        """
        pwd = "ScientificSecure2026!"
        pwd_hash, salt = hash_password(pwd)
        self.assertNotEqual(pwd, pwd_hash)
        self.assertTrue(verify_password(pwd, salt, pwd_hash))
        self.assertFalse(verify_password("WrongPassword", salt, pwd_hash))

if __name__ == "__main__":
    unittest.main()
