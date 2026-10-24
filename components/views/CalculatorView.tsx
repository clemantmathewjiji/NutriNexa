"use client";
import React, { useEffect, useState } from "react";
import { calculatorApi, foodsApi } from "@/lib/api";
import { FoodItem, AggregatedCalculation, CalculationItemResult, CalculationRecord } from "@/lib/types";
import {
  Calculator, Plus, Trash2, Save,
  PieChart as PieIcon, FolderOpen, X
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

interface ItemSlot {
  food_id: number;
  food?: FoodItem;
  quantity_grams: number;
  portion_unit_name: string;
}

export const CalculatorView: React.FC = () => {
  const { t, formatNumber } = useTranslation();
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [slots, setSlots] = useState<ItemSlot[]>([]);
  const [calcResult, setCalcResult] = useState<AggregatedCalculation | null>(null);
  const [itemResults, setItemResults] = useState<CalculationItemResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculation metadata & saving
  const [calcName, setCalcName] = useState("Composite Nutrient Formulation");
  const [calcNotes, setCalcNotes] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedCalculations, setSavedCalculations] = useState<CalculationRecord[]>([]);
  const [showSavedDrawer, setShowSavedDrawer] = useState(false);

  // Active nutrient category tab for results table
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const res = await foodsApi.list({ limit: 100 });
      setAllFoods(res.foods);

      // Load existing calculations list
      const calcsRes = await calculatorApi.list();
      setSavedCalculations(calcsRes.calculations);

      // Preload demonstration composite if empty slots
      if (res.foods.length >= 3) {
        const sampleSlots: ItemSlot[] = [
          { food_id: res.foods[0].id, food: res.foods[0], quantity_grams: 60.0, portion_unit_name: "60g dry" },
          { food_id: res.foods[5].id, food: res.foods[5], quantity_grams: 50.0, portion_unit_name: "1 large egg (50g)" },
        ];
        setSlots(sampleSlots);
        runPreview(sampleSlots);
      }
    } catch (err) {
      console.error("Failed to load calculator data:", err);
    }
  };

  const runPreview = async (currentSlots: ItemSlot[]) => {
    const valid = currentSlots.filter((s) => s.food_id > 0 && s.quantity_grams > 0);
    if (valid.length === 0) {
      setCalcResult(null);
      setItemResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await calculatorApi.preview(
        valid.map((s) => ({
          food_id: s.food_id,
          quantity_grams: s.quantity_grams,
          portion_unit_name: s.portion_unit_name,
        }))
      );
      setCalcResult(res.calculation);
      setItemResults(res.items);
    } catch (err) {
      console.error("Preview error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    if (allFoods.length === 0) return;
    const first = allFoods[0];
    const newSlots = [
      ...slots,
      { food_id: first.id, food: first, quantity_grams: 100.0, portion_unit_name: "100g" },
    ];
    setSlots(newSlots);
    runPreview(newSlots);
  };

  const handleRemoveSlot = (index: number) => {
    const updated = slots.filter((_, i) => i !== index);
    setSlots(updated);
    runPreview(updated);
  };

  const handleFoodChange = (index: number, foodId: number) => {
    const food = allFoods.find((f) => f.id === foodId);
    const updated = [...slots];
    updated[index] = { ...updated[index], food_id: foodId, food };
    setSlots(updated);
    runPreview(updated);
  };

  const handleQuantityChange = (index: number, grams: number) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], quantity_grams: grams };
    setSlots(updated);
    runPreview(updated);
  };

  const handleSaveCalculation = async () => {
    const valid = slots.filter((s) => s.food_id > 0 && s.quantity_grams > 0);
    if (valid.length === 0) {
      alert("Add at least one food item with quantity.");
      return;
    }
    try {
      await calculatorApi.save({
        name: calcName,
        notes: calcNotes,
        items: valid.map((s) => ({
          food_id: s.food_id,
          quantity_grams: s.quantity_grams,
          portion_unit_name: s.portion_unit_name,
        })),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      const calcsRes = await calculatorApi.list();
      setSavedCalculations(calcsRes.calculations);
    } catch (err) {
      alert("Failed to save calculation.");
    }
  };

  const handleLoadSaved = async (calcId: number) => {
    try {
      const res = await calculatorApi.get(calcId);
      setCalcName(res.calculation.name);
      setCalcNotes(res.calculation.notes || "");
      const loadedSlots: ItemSlot[] = res.items.map((it) => ({
        food_id: it.food_id,
        food: allFoods.find((f) => f.id === it.food_id),
        quantity_grams: it.quantity_grams,
        portion_unit_name: it.portion_unit_name || "grams",
      }));
      setSlots(loadedSlots);
      setCalcResult(res.results);
      setItemResults(res.items);
      setShowSavedDrawer(false);
    } catch (err) {
      alert("Failed to load calculation.");
    }
  };

  // Group nutrients by category
  const categories = ["All", "Energy", "Proximates", "Carbohydrates", "Lipids", "Minerals", "Vitamins"];
  const filteredNutrientCodes = calcResult
    ? Object.keys(calcResult.totals).filter((code) => {
        if (activeCategory === "All") return true;
        return calcResult.totals[code].category.toLowerCase() === activeCategory.toLowerCase();
      })
    : [];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#2D8C83]" />
            <h1 className="text-xl font-bold text-[#174C3A]">{t("calcTitle")}</h1>
          </div>
          <p className="text-xs text-[#52635C] mt-1">
            {t("calcSubtitle")} &bull; <code>Amount = (Nutrient / 100g) × Quantity(g)</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSavedDrawer(true)}
            className="border border-[#E2E8E2] hover:bg-[#F7F9F7] text-[#192520] text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <FolderOpen className="w-4 h-4 text-[#7D9087]" />
            <span>{t("savedCalculations")} ({savedCalculations.length})</span>
          </button>

          <button
            onClick={handleSaveCalculation}
            className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition"
          >
            <Save className="w-4 h-4 text-[#84CC16]" />
            <span>{saveSuccess ? t("calcSavedSuccess") : t("saveCalculation")}</span>
          </button>
        </div>
      </div>

      {/* Formulation Inputs Panel */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#192520] mb-1">{t("batchName")}</label>
            <input
              type="text"
              value={calcName}
              onChange={(e) => setCalcName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-medium border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#192520] mb-1">{t("researchProtocolNotes")}</label>
            <input
              type="text"
              placeholder="e.g. Standardized study breakfast composite (Subject Group A)"
              value={calcNotes}
              onChange={(e) => setCalcNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
            />
          </div>
        </div>

        {/* Selected Foods List */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7D9087] pb-1 border-b border-[#E2E8E2]">
            <span>{t("contributingFoods")} ({slots.length})</span>
            <span>{t("edibleWeight")}</span>
          </div>

          {slots.map((slot, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl border border-[#E2E8E2] bg-[#F7F9F7]/70"
            >
              {/* Food Selector */}
              <div className="flex-1 w-full">
                <select
                  value={slot.food_id}
                  onChange={(e) => handleFoodChange(index, parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-semibold border border-[#E2E8E2] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                >
                  {allFoods.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.food_group})
                    </option>
                  ))}
                </select>
              </div>

              {/* Portion Descriptor / Grams Input */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={slot.quantity_grams}
                    onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 text-xs font-bold text-right rtl:text-left border border-[#E2E8E2] rounded-lg bg-white"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#7D9087] pointer-events-none rtl:left-2 rtl:right-auto">
                    g
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveSlot(index)}
                  title="Remove food"
                  className="p-2 text-[#7D9087] hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={handleAddSlot}
            className="w-full py-2.5 border-2 border-dashed border-[#2D8C83]/40 hover:border-[#2D8C83] bg-teal-50/50 hover:bg-teal-50 text-[#174C3A] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t("addAnotherFood")}</span>
          </button>
        </div>
      </div>

      {/* CALCULATION RESULTS PANEL */}
      {calcResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs">
              <span className="text-[11px] font-semibold text-[#52635C] uppercase">{t("totalEdibleMass")}</span>
              <div className="text-xl font-bold text-[#174C3A] mt-1 ltr-only">
                {formatNumber(calcResult.total_edible_weight_grams)} g
              </div>
              <div className="text-[10px] text-[#7D9087]">From {calcResult.items_count} selected item(s)</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs">
              <span className="text-[11px] font-semibold text-[#52635C] uppercase">{t("totalEnergy")}</span>
              <div className="text-xl font-bold text-[#192520] mt-1 ltr-only">
                {formatNumber(calcResult.totals.energy_kcal?.amount ?? 0)} kcal
              </div>
              <div className="text-[10px] text-[#7D9087] ltr-only">
                {formatNumber(calcResult.totals.energy_kj?.amount ?? 0)} kJ
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs">
              <span className="text-[11px] font-semibold text-[#52635C] uppercase">{t("totalProtein")}</span>
              <div className="text-xl font-bold text-[#2D8C83] mt-1 ltr-only">
                {formatNumber(calcResult.totals.protein?.amount ?? 0)} g
              </div>
              <div className="text-[10px] text-[#7D9087] ltr-only">
                {formatNumber(calcResult.per_100g.protein ?? 0)} g / 100g
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs">
              <span className="text-[11px] font-semibold text-[#52635C] uppercase">{t("totalDietaryFiber")}</span>
              <div className="text-xl font-bold text-[#84CC16] mt-1 ltr-only">
                {formatNumber(calcResult.totals.fiber?.amount ?? 0)} g
              </div>
              <div className="text-[10px] text-[#7D9087] ltr-only">
                {formatNumber(calcResult.per_100g.fiber ?? 0)} g / 100g
              </div>
            </div>
          </div>

          {/* Macronutrient Energy Contribution Split */}
          <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#192520] mb-3 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#2D8C83]" />
              <span>{t("atwaterTitle")}</span>
            </h3>

            <div className="space-y-3">
              <div className="h-4 rounded-full overflow-hidden flex bg-[#E2E8E2]">
                <div
                  style={{ width: `${calcResult.macro_distribution.protein_pct}%` }}
                  className="bg-[#2D8C83] transition-all duration-500"
                  title={`Protein: ${calcResult.macro_distribution.protein_pct}%`}
                ></div>
                <div
                  style={{ width: `${calcResult.macro_distribution.carbs_pct}%` }}
                  className="bg-[#84CC16] transition-all duration-500"
                  title={`Carbohydrates: ${calcResult.macro_distribution.carbs_pct}%`}
                ></div>
                <div
                  style={{ width: `${calcResult.macro_distribution.fat_pct}%` }}
                  className="bg-amber-400 transition-all duration-500"
                  title={`Fat: ${calcResult.macro_distribution.fat_pct}%`}
                ></div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#2D8C83]"></div>
                  <span className="font-semibold text-[#192520]">{t("termProtein")}: {formatNumber(calcResult.macro_distribution.protein_pct, 1)}%</span>
                  <span className="text-[#7D9087] ltr-only">({formatNumber(calcResult.totals.protein?.amount ?? 0)} g)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#84CC16]"></div>
                  <span className="font-semibold text-[#192520]">{t("termCarbohydrates")}: {formatNumber(calcResult.macro_distribution.carbs_pct, 1)}%</span>
                  <span className="text-[#7D9087] ltr-only">({formatNumber(calcResult.totals.carbs?.amount ?? 0)} g)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <span className="font-semibold text-[#192520]">{t("termTotalFat")}: {formatNumber(calcResult.macro_distribution.fat_pct, 1)}%</span>
                  <span className="text-[#7D9087] ltr-only">({formatNumber(calcResult.totals.fat?.amount ?? 0)} g)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Nutrient Matrix */}
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] bg-[#F7F9F7] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#174C3A]">{t("completeNutrientProfile")}</h3>
                <p className="text-xs text-[#52635C]">{t("mixtureValuesSubtitle")}</p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                      activeCategory === cat
                        ? "bg-[#174C3A] text-white"
                        : "bg-white border border-[#E2E8E2] text-[#52635C] hover:bg-[#F1F5F2]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs">
                <thead className="bg-[#F1F5F2] text-[#192520] font-semibold border-b border-[#E2E8E2]">
                  <tr>
                    <th className="py-2.5 px-4">Nutrient</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right rtl:text-left">{t("compositeTotal")}</th>
                    <th className="py-2.5 px-4 text-right rtl:text-left">{t("per100gMixture")}</th>
                    <th className="py-2.5 px-4">{t("dataQualityNotes")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]">
                  {filteredNutrientCodes.map((code) => {
                    const nut = calcResult.totals[code];
                    const per100 = calcResult.per_100g[code];
                    return (
                      <tr key={code} className="hover:bg-[#F7F9F7] transition">
                        <td className="py-2.5 px-4 font-semibold text-[#192520]">{nut.name}</td>
                        <td className="py-2.5 px-4 text-[#7D9087]">{nut.category}</td>
                        <td className="py-2.5 px-4 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">
                          {nut.is_missing ? "N/A" : `${formatNumber(nut.amount)} ${nut.unit}`}
                        </td>
                        <td className="py-2.5 px-4 text-right rtl:text-left font-medium text-[#52635C] ltr-only">
                          {per100 !== null && per100 !== undefined ? `${formatNumber(per100)} ${nut.unit}` : "—"}
                        </td>
                        <td className="py-2.5 px-4 text-[#7D9087]">
                          {nut.has_partial_missing ? (
                            <span className="text-amber-700 font-medium">Missing in {nut.missing_items_count} item(s)</span>
                          ) : (
                            <span className="text-emerald-700">Complete data</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SAVED CALCULATIONS DRAWER / MODAL */}
      {showSavedDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-[#E2E8E2]">
            <div className="px-6 py-4 border-b border-[#E2E8E2] bg-[#F7F9F7] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#174C3A]">{t("savedCalculations")}</h3>
              <button onClick={() => setShowSavedDrawer(false)} className="text-[#7D9087] hover:text-[#192520]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto divide-y divide-[#E2E8E2] text-xs">
              {savedCalculations.map((calc) => (
                <div key={calc.id} className="py-3 flex items-center justify-between hover:bg-[#F7F9F7] px-2 rounded-lg">
                  <div>
                    <div className="font-bold text-[#192520]">{calc.name}</div>
                    <div className="text-[#7D9087]">{calc.description || "Saved research calculation"}</div>
                  </div>
                  <button
                    onClick={() => handleLoadSaved(calc.id)}
                    className="px-3 py-1.5 bg-[#2D8C83] text-white rounded-lg font-semibold hover:bg-[#237069]"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
