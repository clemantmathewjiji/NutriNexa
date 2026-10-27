import {
  User, FoodItem, NutrientDefinition, AggregatedCalculation,
  CalculationRecord, CalculationItemResult, RecipeRecord,
  AnthropometricRecord, ProjectRecord, DRVComparisonItem
} from "./types";

const API_BASE = "/api";

import { createClient } from "@/src/lib/supabase/client";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nutrinexa_auth_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("nutrinexa_auth_token", token);
  } else {
    localStorage.removeItem("nutrinexa_auth_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let token = getStoredToken();
  if (!token && typeof window !== "undefined") {
    try {
      const supabase = createClient();
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) {
          token = data.session.access_token;
        }
      }
    } catch {
      // fallback gracefully
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMsg = errJson.detail;
      }
    } catch {
      // keep fallback message
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

// ==========================================
// AUTH API
// ==========================================
export const authApi = {
  login: async (email: string, password: string) => {
    const data = await request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  register: async (name: string, email: string, password: string, role: string, institution: string) => {
    const data = await request<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role, institution }),
    });
    setStoredToken(data.token);
    return data;
  },

  getMe: async () => {
    return request<{ user: User; isGuest?: boolean }>("/auth/me");
  },

  googleVerify: async (payload: { email?: string; name?: string; credential?: string; idToken?: string }) => {
    const data = await request<{ token: string; user: User; message?: string }>("/auth/google", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setStoredToken(data.token);
    return data;
  },

  logout: async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      await request("/auth/logout", { method: "POST" });
    } catch {
      // Continue cleanup
    } finally {
      setStoredToken(null);
    }
  },
};

// ==========================================
// DASHBOARD API
// ==========================================
export const dashboardApi = {
  getStats: async () => {
    return request<{
      summary: {
        total_foods: number;
        user_calculations: number;
        user_recipes: number;
        active_projects: number;
        dietary_assessments: number;
        anthropometric_records: number;
      };
      recent_calculations: CalculationRecord[];
      recent_recipes: RecipeRecord[];
      active_projects: ProjectRecord[];
      recent_activity: Array<{ action: string; entity_type: string; details: string; timestamp: string }>;
    }>("/dashboard/stats");
  },
};

// ==========================================
// FOODS API
// ==========================================
export const foodsApi = {
  list: async (params: { query?: string; food_group?: string; data_source?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params.query) q.set("query", params.query);
    if (params.food_group) q.set("food_group", params.food_group);
    if (params.data_source) q.set("data_source", params.data_source);
    if (params.limit) q.set("limit", params.limit.toString());
    if (params.offset) q.set("offset", params.offset.toString());
    return request<{
      total: number;
      foods: FoodItem[];
      food_groups: string[];
      data_sources: string[];
    }>(`/foods?${q.toString()}`);
  },

  getDetail: async (foodId: number) => {
    return request<FoodItem>(`/foods/${foodId}`);
  },

  compare: async (foodIds: number[]) => {
    return request<{
      nutrients: NutrientDefinition[];
      foods: FoodItem[];
    }>("/foods/compare", {
      method: "POST",
      body: JSON.stringify(foodIds),
    });
  },

  createCustom: async (foodData: any) => {
    return request<{ message: string; food_id: number }>("/foods/custom", {
      method: "POST",
      body: JSON.stringify(foodData),
    });
  },
};

// ==========================================
// CALCULATOR API
// ==========================================
export const calculatorApi = {
  preview: async (items: Array<{ food_id: number; quantity_grams: number; portion_unit_name?: string }>) => {
    return request<{
      items: CalculationItemResult[];
      calculation: AggregatedCalculation;
    }>("/calculations/preview", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },

  save: async (data: {
    name: string;
    description?: string;
    notes?: string;
    project_id?: number | null;
    items: Array<{ food_id: number; quantity_grams: number; portion_unit_name?: string; serving_multiplier?: number }>;
  }) => {
    return request<{ message: string; calculation_id: number }>("/calculations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async () => {
    return request<{ calculations: CalculationRecord[] }>("/calculations");
  },

  get: async (calcId: number) => {
    return request<{
      calculation: CalculationRecord;
      items: CalculationItemResult[];
      results: AggregatedCalculation;
    }>(`/calculations/${calcId}`);
  },

  duplicate: async (calcId: number) => {
    return request<{ message: string; calculation_id: number }>(`/calculations/${calcId}/duplicate`, {
      method: "POST",
    });
  },

  delete: async (calcId: number) => {
    return request<{ message: string }>(`/calculations/${calcId}`, {
      method: "DELETE",
    });
  },
};

// ==========================================
// RECIPES API
// ==========================================
export const recipesApi = {
  list: async () => {
    return request<{ recipes: RecipeRecord[] }>("/recipes");
  },

  get: async (recipeId: number) => {
    return request<{
      recipe: RecipeRecord;
      ingredients: CalculationItemResult[];
      breakdown: {
        servings: number;
        raw_weight_grams: number;
        final_weight_grams: number;
        yield_factor: number;
        totals: Record<string, any>;
        per_serving: Record<string, any>;
        per_100g: Record<string, any>;
        macro_distribution: any;
        data_quality_notes: string[];
      };
    }>(`/recipes/${recipeId}`);
  },

  create: async (recipeData: any) => {
    return request<{ message: string; recipe_id: number }>("/recipes", {
      method: "POST",
      body: JSON.stringify(recipeData),
    });
  },

  delete: async (recipeId: number) => {
    return request<{ message: string }>(`/recipes/${recipeId}`, {
      method: "DELETE",
    });
  },
};

// ==========================================
// DIETARY ASSESSMENT API
// ==========================================
export const dietaryApi = {
  listProfiles: async () => {
    return request<{ profiles: any[] }>("/diaries/drv-profiles");
  },

  list: async () => {
    return request<{ diaries: any[] }>("/diaries");
  },

  get: async (diaryId: number) => {
    return request<{
      diary: any;
      reference_profile: any;
      items: any[];
      meals: Record<string, any[]>;
      daily_totals: AggregatedCalculation;
      drv_comparison: DRVComparisonItem[];
    }>(`/diaries/${diaryId}`);
  },

  create: async (data: any) => {
    return request<{ message: string; diary_id: number }>("/diaries", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  addEntry: async (diaryId: number, entry: any) => {
    return request<{ message: string; entry_id: number }>(`/diaries/${diaryId}/entries`, {
      method: "POST",
      body: JSON.stringify(entry),
    });
  },

  removeEntry: async (diaryId: number, entryId: number) => {
    return request<{ message: string }>(`/diaries/${diaryId}/entries/${entryId}`, {
      method: "DELETE",
    });
  },

  delete: async (diaryId: number) => {
    return request<{ message: string }>(`/diaries/${diaryId}`, {
      method: "DELETE",
    });
  },
};

// ==========================================
// ANTHROPOMETRICS API
// ==========================================
export const anthropometricsApi = {
  calculate: async (params: { weight_kg: number; height_cm: number; age_years: number; sex: string; waist_cm?: number; hip_cm?: number }) => {
    const q = new URLSearchParams({
      weight_kg: params.weight_kg.toString(),
      height_cm: params.height_cm.toString(),
      age_years: params.age_years.toString(),
      sex: params.sex,
    });
    if (params.waist_cm) q.set("waist_cm", params.waist_cm.toString());
    if (params.hip_cm) q.set("hip_cm", params.hip_cm.toString());
    return request<any>(`/anthropometrics/calculate?${q.toString()}`, { method: "POST" });
  },

  save: async (data: any) => {
    return request<{ message: string; record_id: number; results: any }>("/anthropometrics", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async () => {
    return request<{ records: AnthropometricRecord[] }>("/anthropometrics");
  },
};

// ==========================================
// RESEARCH PROJECTS API
// ==========================================
export const projectsApi = {
  list: async () => {
    return request<{ projects: ProjectRecord[] }>("/projects");
  },

  get: async (projId: number) => {
    return request<{
      project: ProjectRecord;
      calculations: any[];
      recipes: any[];
      diaries: any[];
      anthropometrics: any[];
      datasets: any[];
    }>(`/projects/${projId}`);
  },

  create: async (data: any) => {
    return request<{ message: string; project_id: number }>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  addDataset: async (projId: number, data: { dataset_name: string; description?: string; raw_data: any[] }) => {
    return request<{ message: string; dataset_id: number; row_count: number; descriptive_stats: any }>(`/projects/${projId}/datasets`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ==========================================
// REPORTS API
// ==========================================
export const reportsApi = {
  generate: async (data: { report_type: string; title: string; project_id?: number | null; parameters?: any }) => {
    return request<{ message: string; report_id: number; report: any }>("/reports/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async () => {
    return request<{ reports: any[] }>("/reports");
  },
};

// ==========================================
// SEED & HEALTH API
// ==========================================
export const systemApi = {
  seedDatabase: async () => {
    return request<{ success: boolean; message: string; nutrients_count: number; foods_count: number; drv_profiles_count: number }>("/seed", {
      method: "POST",
    });
  },

  getHealth: async () => {
    return request<{ status: string; app: string; database: any }>("/health");
  },
};
