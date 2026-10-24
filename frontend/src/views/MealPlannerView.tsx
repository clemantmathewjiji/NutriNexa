import React, { useState } from "react";
import {
  CalendarDays,
  Info
} from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

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
  const { t, formatNumber } = useTranslation();
  const [targetCalories, setTargetCalories] = useState<number>(2200);
  const [activeDay, setActiveDay] = useState("Monday");

  // Sample meal items
  const [meals] = useState<Record<string, PlannedItem[]>>({
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
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#2D8C83]" />
            <span>{t("plannerTitle")}</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            {t("plannerSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-[#52635C]">{t("calorieTarget")}:</div>
          <input
            type="number"
            step="50"
            value={targetCalories}
            onChange={(e) => setTargetCalories(parseInt(e.target.value) || 2000)}
            className="w-24 px-3 py-1.5 text-xs font-bold border rounded-lg bg-white rtl:text-left"
          />
          <span className="text-xs text-[#7D9087]">kcal</span>
        </div>
      </div>

      {/* Day Selector Tabs */}
      <div className="flex border-b border-[#E2E8E2] gap-1 overflow-x-auto bg-white p-2 rounded-xl shadow-xs">
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
            {t("dailyEnergyBalance")}: <span className="text-[#174C3A] ltr-only">{formatNumber(totalKcal)}</span> / {formatNumber(targetCalories)} kcal
          </span>
          <span className="font-bold text-[#2D8C83] ltr-only">{caloriePct}%</span>
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
          <div className="p-2.5 rounded-lg bg-[#F7F9F7] border border-[#E2E8E2]">
            <div className="text-[10px] uppercase font-semibold text-[#7D9087]">{t("termProtein")}</div>
            <div className="text-sm font-bold text-[#2D8C83] mt-0.5 ltr-only">{formatNumber(totalProtein, 1)} g</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#F7F9F7] border border-[#E2E8E2]">
            <div className="text-[10px] uppercase font-semibold text-[#7D9087]">{t("termCarbohydrates")}</div>
            <div className="text-sm font-bold text-[#84CC16] mt-0.5 ltr-only">{formatNumber(totalCarbs, 1)} g</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#F7F9F7] border border-[#E2E8E2]">
            <div className="text-[10px] uppercase font-semibold text-[#7D9087]">{t("termTotalFat")}</div>
            <div className="text-sm font-bold text-amber-600 mt-0.5 ltr-only">{formatNumber(totalFat, 1)} g</div>
          </div>
        </div>
      </div>

      {/* Planned Meals Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(meals).map(([mealType, items]) => {
          const mealKcal = items.reduce((s, it) => s + it.kcal, 0);
          return (
            <div key={mealType} className="bg-white rounded-xl border border-[#E2E8E2] p-4 shadow-xs space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-[#E2E8E2]">
                <span className="font-bold text-xs text-[#192520]">{mealType}</span>
                <span className="text-xs font-semibold text-[#174C3A] ltr-only">{formatNumber(mealKcal)} kcal</span>
              </div>

              <div className="space-y-2 text-xs">
                {items.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-[#F7F9F7] flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-[#192520]">{item.name}</div>
                      <div className="text-[10px] text-[#7D9087] ltr-only">
                        {formatNumber(item.grams)}g &bull; P: {formatNumber(item.protein, 1)}g, C: {formatNumber(item.carbs, 1)}g, F: {formatNumber(item.fat, 1)}g
                      </div>
                    </div>
                    <span className="font-bold text-[#2D8C83] ltr-only">{formatNumber(item.kcal)} kcal</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-[#F1F5F2] border border-[#E2E8E2] text-xs flex items-center gap-2">
        <Info className="w-4 h-4 text-[#2D8C83] shrink-0" />
        <span className="text-[#52635C]">{t("academicDraftNotice")}</span>
      </div>
    </div>
  );
};
