from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    role: str = "Researcher"
    institution: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    institution: Optional[str] = None

class CalculationItemInput(BaseModel):
    food_id: int
    quantity_grams: float = Field(..., gt=0)
    portion_unit_name: Optional[str] = "grams"
    serving_multiplier: Optional[float] = 1.0

class CalculationCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""
    notes: Optional[str] = ""
    project_id: Optional[int] = None
    items: List[CalculationItemInput]

class CalculationPreviewRequest(BaseModel):
    items: List[CalculationItemInput]

class RecipeIngredientInput(BaseModel):
    food_id: int
    quantity_grams: float = Field(..., gt=0)
    portion_unit_name: Optional[str] = "grams"
    preparation_note: Optional[str] = ""

class RecipeCreateRequest(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = ""
    category: Optional[str] = "General"
    servings: float = Field(1.0, gt=0)
    total_weight_grams: Optional[float] = 0.0
    cooking_instructions: Optional[str] = ""
    research_notes: Optional[str] = ""
    allergens: Optional[str] = ""
    project_id: Optional[int] = None
    ingredients: List[RecipeIngredientInput]

class DiaryEntryInput(BaseModel):
    meal_type: str  # Breakfast, Lunch, Dinner, Morning Snack, Evening Snack
    item_type: str = "food"  # "food" or "recipe"
    food_id: Optional[int] = None
    recipe_id: Optional[int] = None
    quantity_grams: float = Field(..., gt=0)
    portion_description: Optional[str] = ""
    notes: Optional[str] = ""

class DiaryCreateRequest(BaseModel):
    client_code: str = Field(..., min_length=1)
    diary_date: str
    assessment_type: str = "24-Hour Recall"
    reference_profile_id: Optional[int] = 1
    notes: Optional[str] = ""
    project_id: Optional[int] = None
    entries: Optional[List[DiaryEntryInput]] = []

class MealPlanItemInput(BaseModel):
    day_of_week: str = "Day 1"
    meal_type: str
    item_type: str = "food"
    food_id: Optional[int] = None
    recipe_id: Optional[int] = None
    quantity_grams: float = Field(..., gt=0)

class MealPlanCreateRequest(BaseModel):
    title: str = Field(..., min_length=1)
    plan_type: str = "Daily Plan"
    target_calories: float = 2000.0
    reference_profile_id: Optional[int] = 1
    notes: Optional[str] = ""
    project_id: Optional[int] = None
    items: Optional[List[MealPlanItemInput]] = []

class AnthropometricCreateRequest(BaseModel):
    subject_identifier: str = Field(..., min_length=1)
    age_years: int = Field(..., ge=1, le=120)
    sex: str = "Male"
    assessment_date: str
    height_cm: float = Field(..., gt=30, lt=260)
    weight_kg: float = Field(..., gt=2, lt=500)
    waist_cm: Optional[float] = None
    hip_cm: Optional[float] = None
    reference_standard: Optional[str] = "WHO Adult Classification (1995/2004)"
    notes: Optional[str] = ""
    project_id: Optional[int] = None

class ProjectCreateRequest(BaseModel):
    title: str = Field(..., min_length=2)
    code: str = Field(..., min_length=2)
    objectives: Optional[str] = ""
    methodology_notes: Optional[str] = ""
    lead_researcher: Optional[str] = ""
    tags: Optional[str] = ""

class DatasetCreateRequest(BaseModel):
    dataset_name: str
    description: Optional[str] = ""
    raw_data: List[Dict[str, Any]]

class CustomFoodCreateRequest(BaseModel):
    name: str = Field(..., min_length=2)
    alt_names: Optional[str] = ""
    food_group: str = "Custom Foods"
    category: Optional[str] = "User Added"
    scientific_name: Optional[str] = ""
    description: Optional[str] = ""
    source_name: str = "User / Laboratory Analysis"
    source_citation: Optional[str] = ""
    source_year: Optional[str] = "2026"
    preparation_state: Optional[str] = "Raw"
    nutrients: Dict[str, Optional[float]]
    portions: Optional[List[Dict[str, Any]]] = []

class ReportGenerateRequest(BaseModel):
    report_type: str
    title: str
    project_id: Optional[int] = None
    parameters: Optional[Dict[str, Any]] = {}
