"use client";
import React, { useEffect, useState } from "react";
import { recipesApi, foodsApi } from "@/lib/api";
import { FoodItem, RecipeRecord } from "@/lib/types";
import {
  UtensilsCrossed, Plus, Trash2
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

interface IngredientSlot {
  food_id: number;
  quantity_grams: number;
  preparation_note: string;
}

export const RecipeAnalysisView: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [recipeDetail, setRecipeDetail] = useState<any>(null);

  // New Recipe Form state
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Entrée");
  const [servings, setServings] = useState(2);
  const [totalWeightGrams, setTotalWeightGrams] = useState(300);
  const [cookingInstructions, setCookingInstructions] = useState("");
  const [allergens, setAllergens] = useState("None");
  const [ingredients, setIngredients] = useState<IngredientSlot[]>([]);

  useEffect(() => {
    loadRecipes();
    loadFoods();
  }, []);

  const loadRecipes = async () => {
    try {
      const res = await recipesApi.list();
      setRecipes(res.recipes);
      if (res.recipes.length > 0 && !selectedRecipeId) {
        handleSelectRecipe(res.recipes[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadFoods = async () => {
    try {
      const res = await foodsApi.list({ limit: 100 });
      setAllFoods(res.foods);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectRecipe = async (id: number) => {
    setSelectedRecipeId(id);
    setIsCreating(false);
    try {
      const data = await recipesApi.get(id);
      setRecipeDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddIngredient = () => {
    if (allFoods.length === 0) return;
    setIngredients([
      ...ingredients,
      { food_id: allFoods[0].id, quantity_grams: 100, preparation_note: "Raw / prepped" }
    ]);
  };

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ingredients.length === 0) {
      alert("Please add at least one ingredient.");
      return;
    }
    try {
      const res = await recipesApi.create({
        name,
        description,
        category,
        servings,
        total_weight_grams: totalWeightGrams,
        cooking_instructions: cookingInstructions,
        allergens,
        ingredients,
      });
      setIsCreating(false);
      loadRecipes();
      handleSelectRecipe(res.recipe_id);
    } catch (err) {
      alert("Failed to create recipe.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-[#2D8C83]" />
            <span>{t("recipeTitle")}</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            {t("recipeSubtitle")}
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setIngredients([
              { food_id: allFoods[0]?.id || 1, quantity_grams: 150, preparation_note: "Prepped fresh" }
            ]);
          }}
          className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t("newRecipe")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recipe Selector List */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-4 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#7D9087] pb-2 border-b border-[#E2E8E2]">
            {t("standardizedRecipes")} ({recipes.length})
          </div>

          <div className="space-y-2">
            {recipes.map((r) => (
              <div
                key={r.id}
                onClick={() => handleSelectRecipe(r.id)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedRecipeId === r.id && !isCreating
                    ? "bg-[#174C3A] text-white border-[#174C3A] shadow-xs"
                    : "bg-[#F7F9F7] text-[#192520] border-[#E2E8E2] hover:border-[#2D8C83]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{r.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      selectedRecipeId === r.id && !isCreating
                        ? "bg-white/20 text-white"
                        : "bg-[#E2E8E2] text-[#52635C]"
                    }`}
                  >
                    {r.category}
                  </span>
                </div>
                <div
                  className={`text-[11px] mt-1 line-clamp-1 ${
                    selectedRecipeId === r.id && !isCreating ? "text-white/80" : "text-[#7D9087]"
                  }`}
                >
                  {r.description || "—"}
                </div>
                <div
                  className={`text-[10px] mt-1.5 flex items-center justify-between ${
                    selectedRecipeId === r.id && !isCreating ? "text-white/70" : "text-[#7D9087]"
                  }`}
                >
                  <span>{t("servingsCount")}: {formatNumber(r.servings)}</span>
                  <span>{r.ingredient_count || 3} items</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recipe Details or Creation Form */}
        <div className="lg:col-span-2 space-y-6">
          {isCreating ? (
            /* Creation Form */
            <form onSubmit={handleCreateRecipe} className="bg-white rounded-xl border border-[#E2E8E2] p-6 shadow-xs space-y-4 text-xs">
              <h3 className="text-sm font-bold text-[#174C3A]">{t("recipeFormTitle")}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">{t("recipeName")} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quinoa Lentil Protein Medley"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t("category")}</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                    <option value="Entrée">Entrée</option>
                    <option value="Breakfast">Breakfast</option>
                    <option value="Soup & Salad">Soup & Salad</option>
                    <option value="Snack">Snack</option>
                    <option value="Beverage">Beverage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t("description")}</label>
                <input
                  type="text"
                  placeholder="e.g. Plant-based formulation rich in essential amino acids and soluble fiber."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">{t("servingsCount")} *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={servings}
                    onChange={(e) => setServings(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t("cookedYieldWeight")} (g)</label>
                  <input
                    type="number"
                    min="1"
                    value={totalWeightGrams}
                    onChange={(e) => setTotalWeightGrams(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">{t("allergensLabel")}</label>
                  <input
                    type="text"
                    placeholder="e.g. Fish, Dairy, Soy"
                    value={allergens}
                    onChange={(e) => setAllergens(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              {/* Ingredients Slot Builder */}
              <div className="space-y-2 pt-2">
                <label className="block font-bold uppercase text-[#7D9087]">{t("ingredientsLabel")}</label>
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={ing.food_id}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[idx].food_id = parseInt(e.target.value);
                        setIngredients(copy);
                      }}
                      className="flex-1 px-3 py-2 border rounded-lg bg-white"
                    >
                      {allFoods.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Grams"
                      value={ing.quantity_grams}
                      onChange={(e) => {
                        const copy = [...ingredients];
                        copy[idx].quantity_grams = parseFloat(e.target.value) || 0;
                        setIngredients(copy);
                      }}
                      className="w-24 px-3 py-2 border rounded-lg text-right rtl:text-left"
                    />

                    <button
                      type="button"
                      onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="w-full py-2 border border-dashed rounded-lg text-[#2D8C83] font-semibold hover:bg-teal-50"
                >
                  + {t("addIngredient")}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 border rounded-lg"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174C3A] text-white rounded-lg font-bold"
                >
                  {t("analyzeSaveRecipe")}
                </button>
              </div>
            </form>
          ) : recipeDetail ? (
            /* Selected Recipe Breakdown */
            <div className="space-y-6">
              {/* Recipe Meta Card */}
              <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#174C3A]">
                    {recipeDetail.recipe.category}
                  </span>
                  <span className="text-xs text-[#7D9087]">
                    Yield Factor: {formatNumber(recipeDetail.breakdown.yield_factor, 2)}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#192520] mt-1.5">{recipeDetail.recipe.name}</h2>
                <p className="text-xs text-[#52635C] mt-1">{recipeDetail.recipe.description}</p>

                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#E2E8E2] text-center">
                  <div>
                    <div className="text-[10px] text-[#7D9087] uppercase font-semibold">{t("servingsCount")}</div>
                    <div className="text-sm font-bold text-[#192520] mt-0.5">{recipeDetail.recipe.servings} Servings</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7D9087] uppercase font-semibold">{t("cookedYieldWeight")}</div>
                    <div className="text-sm font-bold text-[#192520] mt-0.5 ltr-only">{formatNumber(recipeDetail.recipe.total_weight_grams)} g</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#7D9087] uppercase font-semibold">{t("allergensLabel")}</div>
                    <div className="text-sm font-bold text-[#2D8C83] mt-0.5">{recipeDetail.recipe.allergens || "None"}</div>
                  </div>
                </div>
              </div>

              {/* Per-Serving vs Total Nutrients Table */}
              <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E2E8E2] bg-[#F7F9F7]">
                  <h3 className="text-sm font-bold text-[#174C3A]">{t("perServing")} &bull; {t("per100gCooked")}</h3>
                  <p className="text-xs text-[#52635C]">Calculated across all standardized raw and cooked recipe components.</p>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left rtl:text-right">
                    <thead className="bg-[#F1F5F2] text-[#192520] font-semibold border-b border-[#E2E8E2]">
                      <tr>
                        <th className="py-2.5 px-4">Nutrient</th>
                        <th className="py-2.5 px-4 text-right rtl:text-left">{t("perServing")} ({Math.round(recipeDetail.recipe.total_weight_grams / recipeDetail.recipe.servings)}g)</th>
                        <th className="py-2.5 px-4 text-right rtl:text-left">{t("per100gCooked")}</th>
                        <th className="py-2.5 px-4 text-right rtl:text-left">{t("total")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8E2]">
                      {["energy_kcal", "protein", "carbs", "fat", "fiber", "sodium", "calcium", "iron", "vitamin_c"].map((code) => {
                        const tot = recipeDetail.breakdown.totals[code];
                        const serv = recipeDetail.breakdown.per_serving[code];
                        const per100 = recipeDetail.breakdown.per_100g[code];
                        if (!tot) return null;
                        return (
                          <tr key={code} className="hover:bg-[#F7F9F7]">
                            <td className="py-2.5 px-4 font-semibold text-[#192520] capitalize">{tot.name}</td>
                            <td className="py-2.5 px-4 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">
                              {serv !== null ? `${formatNumber(serv)} ${tot.unit}` : "N/A"}
                            </td>
                            <td className="py-2.5 px-4 text-right rtl:text-left font-medium text-[#52635C] ltr-only">
                              {per100 !== null ? `${formatNumber(per100)} ${tot.unit}` : "—"}
                            </td>
                            <td className="py-2.5 px-4 text-right rtl:text-left text-[#7D9087] ltr-only">
                              {formatNumber(tot.amount)} {tot.unit}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cooking Instructions & Culinary Notes */}
              {recipeDetail.recipe.cooking_instructions && (
                <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-2 text-xs">
                  <h3 className="font-bold text-[#174C3A]">{t("preparationProtocol")}</h3>
                  <p className="text-[#52635C] leading-relaxed whitespace-pre-wrap">
                    {recipeDetail.recipe.cooking_instructions}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8E2] p-12 text-center text-[#7D9087] text-xs">
              Select a recipe from the list or click "+ New Recipe" to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
