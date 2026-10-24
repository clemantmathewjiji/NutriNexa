import React, { useEffect, useState } from "react";
import { dietaryApi, foodsApi, recipesApi } from "../api";
import { FoodItem, RecipeRecord, DRVComparisonItem } from "../types";
import {
  CalendarCheck, Plus, Trash2, X
} from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export const DietaryAssessmentView: React.FC = () => {
  const { t, formatNumber, formatDate } = useTranslation();
  const [diaries, setDiaries] = useState<any[]>([]);
  const [selectedDiaryId, setSelectedDiaryId] = useState<number | null>(null);
  const [diaryDetail, setDiaryDetail] = useState<any>(null);
  const [drvProfiles, setDrvProfiles] = useState<any[]>([]);
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [allRecipes, setAllRecipes] = useState<RecipeRecord[]>([]);

  // New Diary Modal
  const [showNewDiaryModal, setShowNewDiaryModal] = useState(false);
  const [clientCode, setClientCode] = useState("SUBJ-412");
  const [diaryDate, setDiaryDate] = useState(new Date().toISOString().split("T")[0]);
  const [assessmentType, setAssessmentType] = useState("24-Hour Recall");
  const [selectedProfileId, setSelectedProfileId] = useState<number>(1);
  const [diaryNotes, setDiaryNotes] = useState("");

  // Add Item to Meal state
  const [activeMealType, setActiveMealType] = useState<string | null>(null);
  const [itemType, setItemType] = useState<"food" | "recipe">("food");
  const [selectedItemId, setSelectedItemId] = useState<number>(1);
  const [itemGrams, setItemGrams] = useState<number>(100);

  useEffect(() => {
    loadDiaries();
    loadReferenceProfiles();
    loadFoodsAndRecipes();
  }, []);

  const loadDiaries = async () => {
    try {
      const res = await dietaryApi.list();
      setDiaries(res.diaries);
      if (res.diaries.length > 0 && !selectedDiaryId) {
        handleSelectDiary(res.diaries[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadReferenceProfiles = async () => {
    try {
      const res = await dietaryApi.listProfiles();
      setDrvProfiles(res.profiles);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFoodsAndRecipes = async () => {
    try {
      const fRes = await foodsApi.list({ limit: 100 });
      setAllFoods(fRes.foods);
      const rRes = await recipesApi.list();
      setAllRecipes(rRes.recipes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectDiary = async (id: number) => {
    setSelectedDiaryId(id);
    try {
      const data = await dietaryApi.get(id);
      setDiaryDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDiary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await dietaryApi.create({
        client_code: clientCode,
        diary_date: diaryDate,
        assessment_type: assessmentType,
        reference_profile_id: selectedProfileId,
        notes: diaryNotes,
      });
      setShowNewDiaryModal(false);
      loadDiaries();
      handleSelectDiary(res.diary_id);
    } catch (err) {
      alert("Failed to create dietary diary.");
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDiaryId || !activeMealType) return;
    try {
      await dietaryApi.addEntry(selectedDiaryId, {
        meal_type: activeMealType,
        item_type: itemType,
        food_id: itemType === "food" ? selectedItemId : null,
        recipe_id: itemType === "recipe" ? selectedItemId : null,
        quantity_grams: itemGrams,
        portion_description: `${itemGrams}g portion`,
      });
      setActiveMealType(null);
      handleSelectDiary(selectedDiaryId);
    } catch (err) {
      alert("Failed to add meal item.");
    }
  };

  const handleRemoveEntry = async (entryId: number) => {
    if (!selectedDiaryId) return;
    try {
      await dietaryApi.removeEntry(selectedDiaryId, entryId);
      handleSelectDiary(selectedDiaryId);
    } catch (err) {
      alert("Failed to remove item.");
    }
  };

  const meals = ["Breakfast", "Lunch", "Dinner", "Morning Snack", "Evening Snack"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#2D8C83]" />
            <span>{t("dietaryTitle")}</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            {t("dietarySubtitle")}
          </p>
        </div>

        <button
          onClick={() => setShowNewDiaryModal(true)}
          className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t("newAssessment")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assessment Selector */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-4 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#7D9087] pb-2 border-b border-[#E2E8E2]">
            {t("dietaryRecords")} ({diaries.length})
          </div>

          <div className="space-y-2">
            {diaries.map((d) => (
              <div
                key={d.id}
                onClick={() => handleSelectDiary(d.id)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedDiaryId === d.id
                    ? "bg-[#174C3A] text-white border-[#174C3A] shadow-xs"
                    : "bg-[#F7F9F7] text-[#192520] border-[#E2E8E2] hover:border-[#2D8C83]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{d.client_code}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      selectedDiaryId === d.id ? "bg-white/20 text-white" : "bg-[#E2E8E2] text-[#52635C]"
                    }`}
                  >
                    {formatDate(d.diary_date)}
                  </span>
                </div>
                <div
                  className={`text-[11px] mt-1 ${
                    selectedDiaryId === d.id ? "text-white/80" : "text-[#7D9087]"
                  }`}
                >
                  {d.assessment_type} &bull; {d.reference_profile_name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Diary Meals & DRV Comparison */}
        <div className="lg:col-span-2 space-y-6">
          {diaryDetail ? (
            <div className="space-y-6">
              {/* Diary Header Card */}
              <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-[#2D8C83]">
                    {t("subjectRecord")}: {diaryDetail.diary.client_code}
                  </div>
                  <h2 className="text-base font-bold text-[#192520] mt-0.5">
                    {diaryDetail.diary.assessment_type} — {formatDate(diaryDetail.diary.diary_date)}
                  </h2>
                  <p className="text-xs text-[#52635C] mt-1">
                    Benchmark Reference Standard:{" "}
                    <strong>{diaryDetail.reference_profile?.profile_name || "US DRI"}</strong>
                  </p>
                </div>

                <div className="text-right rtl:text-left">
                  <div className="text-xs text-[#7D9087]">{t("dailyEnergyIntake")}</div>
                  <div className="text-xl font-bold text-[#174C3A] ltr-only">
                    {formatNumber(diaryDetail.daily_totals.totals.energy_kcal?.amount ?? 0)} kcal
                  </div>
                </div>
              </div>

              {/* Meal Blocks */}
              <div className="space-y-4">
                {meals.map((mealName) => {
                  const mealItems = diaryDetail.meals[mealName] || [];
                  return (
                    <div key={mealName} className="bg-white rounded-xl border border-[#E2E8E2] p-4 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E2]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#192520]">{mealName}</span>
                          <span className="text-[10px] text-[#7D9087]">({mealItems.length} items)</span>
                        </div>
                        <button
                          onClick={() => {
                            setActiveMealType(mealName);
                            setSelectedItemId(allFoods[0]?.id || 1);
                          }}
                          className="text-xs font-semibold text-[#2D8C83] hover:text-[#174C3A] flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t("addItemToMeal")}</span>
                        </button>
                      </div>

                      {mealItems.length > 0 ? (
                        <div className="divide-y divide-[#E2E8E2] text-xs mt-2">
                          {mealItems.map((item: any) => (
                            <div key={item.entry_id} className="py-2 flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-[#192520]">{item.food_name}</span>
                                <span className="text-[#7D9087] mx-2">({formatNumber(item.quantity_grams)}g)</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-[#174C3A] ltr-only">
                                  {formatNumber(item.nutrients?.energy_kcal?.amount ?? 0)} kcal
                                </span>
                                <button
                                  onClick={() => handleRemoveEntry(item.entry_id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#7D9087] py-2 italic">
                          No food logged for {mealName}.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DRV Benchmark & Shortfall / Excess Progress Indicators */}
              <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E2E8E2] bg-[#F7F9F7]">
                  <h3 className="text-sm font-bold text-[#174C3A]">
                    {t("drvIntakeVsReference")}
                  </h3>
                  <p className="text-xs text-[#52635C]">
                    {t("drvShortfallNotice")}
                  </p>
                </div>

                <div className="p-4 space-y-3.5 text-xs">
                  {diaryDetail.drv_comparison?.map((comp: DRVComparisonItem) => {
                    const pct = comp.percentage_of_target ?? 0;
                    const isShortfall = comp.status === "Potential Shortfall";
                    const isExcess = comp.status === "Excess (Above UL)";

                    return (
                      <div key={comp.nutrient_code} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-[#192520] capitalize">
                            {comp.nutrient_code.replace(/_/g, " ")}:
                          </span>
                          <span className="text-[#52635C] ltr-only">
                            <strong>{comp.actual_intake !== null ? formatNumber(comp.actual_intake) : "0"}</strong> / {formatNumber(comp.target_value)} {comp.unit} ({formatNumber(pct, 0)}%)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-2 rounded-full bg-[#E2E8E2] overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, pct)}%` }}
                            className={`h-full transition-all duration-500 ${
                              isExcess
                                ? "bg-red-500"
                                : isShortfall
                                ? "bg-amber-500"
                                : "bg-[#174C3A]"
                            }`}
                          ></div>
                        </div>

                        {/* Status Label */}
                        <div className="flex justify-between text-[10px]">
                          <span className={isExcess ? "text-red-600 font-bold" : isShortfall ? "text-amber-700 font-semibold" : "text-emerald-700 font-medium"}>
                            {isExcess ? t("excessAboveUl") : isShortfall ? t("potentialShortfall") : t("targetMet")}
                          </span>
                          {comp.upper_limit && (
                            <span className="text-[#7D9087] ltr-only">UL: {formatNumber(comp.upper_limit)} {comp.unit}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8E2] p-12 text-center text-[#7D9087] text-xs">
              Select a dietary assessment from the left or create a new recall.
            </div>
          )}
        </div>
      </div>

      {/* ADD ITEM MODAL */}
      {activeMealType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2E8E2] p-5 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#174C3A]">
                {t("addItemToMeal")}: {activeMealType}
              </h3>
              <button onClick={() => setActiveMealType(null)} className="text-[#7D9087] hover:text-[#192520]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border border-[#E2E8E2] rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setItemType("food")}
                className={`flex-1 py-1.5 font-semibold text-center ${
                  itemType === "food" ? "bg-[#174C3A] text-white" : "bg-[#F7F9F7] text-[#52635C]"
                }`}
              >
                Food Item
              </button>
              <button
                type="button"
                onClick={() => setItemType("recipe")}
                className={`flex-1 py-1.5 font-semibold text-center ${
                  itemType === "recipe" ? "bg-[#174C3A] text-white" : "bg-[#F7F9F7] text-[#52635C]"
                }`}
              >
                Recipe Dish
              </button>
            </div>

            <form onSubmit={handleAddEntry} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Select Item</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  {itemType === "food"
                    ? allFoods.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))
                    : allRecipes.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Portion Weight (g)</label>
                <input
                  type="number"
                  min="1"
                  value={itemGrams}
                  onChange={(e) => setItemGrams(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-right rtl:text-left"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveMealType(null)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174C3A] text-white rounded-lg font-bold"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW RECALL MODAL */}
      {showNewDiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2E8E2] p-5 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#174C3A]">{t("newAssessment")}</h3>
              <button onClick={() => setShowNewDiaryModal(false)} className="text-[#7D9087] hover:text-[#192520]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDiary} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Subject Code / ID *</label>
                <input
                  type="text"
                  required
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t("date")} *</label>
                <input
                  type="date"
                  required
                  value={diaryDate}
                  onChange={(e) => setDiaryDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Assessment Type</label>
                <select
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  <option value="24-Hour Recall">24-Hour Recall</option>
                  <option value="3-Day Food Record">3-Day Food Record</option>
                  <option value="Food Frequency (FFQ)">Food Frequency (FFQ)</option>
                  <option value="Clinical Metabolic Diet">Clinical Metabolic Diet</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t("configuredDrvStandards")}</label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                >
                  {drvProfiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.profile_name} ({p.authority})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t("notes")}</label>
                <textarea
                  value={diaryNotes}
                  onChange={(e) => setDiaryNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Clinical observation, baseline or intervention day notes..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDiaryModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174C3A] text-white rounded-lg font-bold"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
