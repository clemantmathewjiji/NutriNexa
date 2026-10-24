import React, { useEffect, useState } from "react";
import { foodsApi, recipesApi } from "../api";
import { FoodItem, RecipeRecord } from "../types";
import { BookOpen, UtensilsCrossed, Database, Plus, Trash2, ExternalLink } from "lucide-react";
import { NavSection } from "../components/Sidebar";

interface MyFoodsViewProps {
  onNavigate: (section: NavSection) => void;
}

export const MyFoodsView: React.FC<MyFoodsViewProps> = ({ onNavigate }) => {
  const [recipes, setRecipes] = useState<RecipeRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"recipes" | "custom_foods">("recipes");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await recipesApi.list();
      setRecipes(res.recipes);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#2D8C83]" />
            <span>My Foods & Recipes Workspace</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            User-formulated food records, laboratory items, and customized recipe batches.
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onNavigate("foods")}
            className="bg-[#2D8C83] hover:bg-[#237069] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Food</span>
          </button>
          <button
            onClick={() => onNavigate("recipes")}
            className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Build Recipe</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#E2E8E2] space-x-3 bg-white p-2 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveTab("recipes")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === "recipes" ? "bg-[#174C3A] text-white" : "text-[#52635C] hover:bg-[#F1F5F2]"
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>My Formulated Recipes ({recipes.length})</span>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs">
        {recipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((r) => (
              <div
                key={r.id}
                onClick={() => onNavigate("recipes")}
                className="p-4 rounded-xl border border-[#E2E8E2] hover:border-[#2D8C83] bg-[#F7F9F7] cursor-pointer transition space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-[#192520]">{r.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    {r.category}
                  </span>
                </div>
                <p className="text-xs text-[#52635C] line-clamp-2">{r.description || "Formulated recipe"}</p>
                <div className="text-[11px] text-[#7D9087] flex justify-between pt-2 border-t border-[#E2E8E2]">
                  <span>Servings: {r.servings}</span>
                  <span>{r.total_weight_grams}g yield</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-xs text-[#7D9087]">
            No user-created recipes found. Click "Build Recipe" to begin.
          </div>
        )}
      </div>
    </div>
  );
};
