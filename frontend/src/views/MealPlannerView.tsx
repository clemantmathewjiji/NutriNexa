import React, { useState } from "react";
import {
  CalendarDays, Plus, Trash2, CheckCircle2,
  AlertCircle, Sparkles, ChefHat, Info
} from "lucide-react";

interface PlannedItem {
  id: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const MealPlannerView: React.FC = () => {
  const [targetCalories, setTargetCalories] = useState<number>(2200);
  const [planTitle, setPlanTitle] = useState("Balanced Metabolic Research Meal Plan (2200 kcal)");
  const [activeDay, setActiveDay] = useState("Monday");

  // Sample meal items
  const [meals, setMeals] = useState<Record<string, PlannedItem[]>>({
    Breakfast: [
      { id: "1", name: "Rolled Oats with Berries", grams: 80, kcal: 310, protein: 13.5, carbs: 53.0, fat: 5.5 },
      { id: "2", name: "Greek Yogurt (Nonfat)", grams: 170, kcal: 100, protein: 17.3, carbs: 6.1, fat: 0.7 },
    ],
    Lunch: [
      { id: "3", name: "Brown Rice & Lentil Pilaf", grams: 250, kcal: 450, protein: 19.5, carbs: 82.0, fat: 3.5 },
      { id: "4", name: "Steamed Broccoli & Olive Oil", grams: 150, kcal: 120, protein: 4.2, carbs: 9.9, fat: 7.5 },
    ],
    Dinner: [
      { id: "5", name: "Wild Atlantic Salmon Fillet", grams: 198, kcal: 281, protein: 39.2, carbs: 0.0, fat: 12.5 },
      { id: "6", name: "Sautéed Baby Spinach", grams: 100, kcal: 23, protein: 2.8, carbs: 3.6, fat: 0.4 },
    ],
    Snacks: [
      { id: "7", name: "Raw Almonds (Handful)", grams: 28, kcal: 162, protein: 5.9, carbs: 6.0, fat: 14.0 },
      { id: "8", name: "Fresh Gala Apple", grams: 182, kcal: 95, protein: 0.5, carbs: 25.1, fat: 0.3 },
    ],
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Compute daily totals
  const totalKcal = Object.values(meals).flat().reduce((sum, item) => sum + item.kcal, 0);
  const totalProtein = Object.values(meals).flat().reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = Object.values(meals).flat().reduce((sum, item) => sum + item.carbs, 0);
  const totalFat = Object.values(meals).flat().reduce((sum, item) => sum + item.fat, 0);

  const caloriePct = Math.round((totalKcal / targetCalories) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-[#2D8C83]" />
            <span>Meal Planning & Nutrient Targeting</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            Weekly and daily menus modeled against energy and macronutrient distribution goals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-xs font-semibold text-[#52635C]">Calorie Target:</div>
          <input
            type="number"
            step="50"
            value={targetCalories}
            onChange={(e) => setTargetCalories(parseInt(e.target.value) || 2000)}
            className="w-24 px-3 py-1.5 text-xs font-bold border rounded-lg bg-white"
          />
          <span className="text-xs text-[#7D9087]">kcal</span>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex border-b border-[#E2E8E2] space-x-1 overflow-x-auto bg-white p-2 rounded-xl shadow-xs">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setActiveDay(d)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeDay === d
                ? "bg-[#174C3A] text-white shadow-xs"
                : "text-[#52635C] hover:bg-[#F1F5F2]"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Target Progress Meter */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-[#192520]">
            Daily Energy Balance: <span className="text-[#174C3A]">{totalKcal}</span> / {targetCalories} kcal
          </span>
          <span className={`font-bold ${caloriePct > 105 ? "text-amber-700" : "text-emerald-700"}`}>
            {caloriePct}% of Daily Target
          </span>
        </div>

        <div className="h-3 rounded-full bg-[#E2E8E2] overflow-hidden">
          <div
            style={{ width: `${Math.min(100, caloriePct)}%` }}
            className={`h-full transition-all duration-500 ${
              caloriePct > 105 ? "bg-amber-500" : "bg-[#174C3A]"
            }`}
          ></div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-[#F7F9F7]">
            <div className="text-[#7D9087] font-semibold">Protein</div>
            <div className="font-bold text-[#174C3A] text-sm mt-0.5">{Math.round(totalProtein)} g</div>
            <div className="text-[10px] text-[#52635C]">{Math.round((totalProtein * 4 / totalKcal) * 100)}% kcal</div>
          </div>
          <div className="p-2 rounded-lg bg-[#F7F9F7]">
            <div className="text-[#7D9087] font-semibold">Carbohydrates</div>
            <div className="font-bold text-[#2D8C83] text-sm mt-0.5">{Math.round(totalCarbs)} g</div>
            <div className="text-[10px] text-[#52635C]">{Math.round((totalCarbs * 4 / totalKcal) * 100)}% kcal</div>
          </div>
          <div className="p-2 rounded-lg bg-[#F7F9F7]">
            <div className="text-[#7D9087] font-semibold">Total Fat</div>
            <div className="font-bold text-amber-700 text-sm mt-0.5">{Math.round(totalFat)} g</div>
            <div className="text-[10px] text-[#52635C]">{Math.round((totalFat * 9 / totalKcal) * 100)}% kcal</div>
          </div>
        </div>
      </div>

      {/* Meal Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(meals).map(([mealType, items]) => {
          const mealKcal = items.reduce((s, it) => s + it.kcal, 0);
          return (
            <div key={mealType} className="bg-white rounded-xl border border-[#E2E8E2] p-4 shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8E2]">
                <span className="font-bold text-sm text-[#192520]">{mealType}</span>
                <span className="text-xs font-semibold text-[#174C3A] bg-emerald-50 px-2 py-0.5 rounded">
                  {mealKcal} kcal
                </span>
              </div>

              <div className="divide-y divide-[#E2E8E2] text-xs">
                {items.map((it) => (
                  <div key={it.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-[#192520]">{it.name}</div>
                      <div className="text-[11px] text-[#7D9087]">
                        {it.grams}g &bull; P: {it.protein}g &bull; C: {it.carbs}g &bull; F: {it.fat}g
                      </div>
                    </div>
                    <div className="font-bold text-[#174C3A]">{it.kcal} kcal</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Academic Disclaimer Note */}
      <div className="p-4 bg-[#F1F5F2] rounded-xl border border-[#E2E8E2] text-xs flex items-start space-x-2.5">
        <Info className="w-4 h-4 text-[#2D8C83] mt-0.5 flex-shrink-0" />
        <div className="text-[#52635C] leading-relaxed">
          <strong>Academic Draft Notice:</strong> This module is configured for scientific dietetics curriculum training, nutrient density simulation, and academic meal analysis. Plans generated represent drafts and do not replace individualized clinical dietary counseling.
        </div>
      </div>
    </div>
  );
};
