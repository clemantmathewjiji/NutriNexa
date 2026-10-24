import React, { useEffect, useState } from "react";
import { foodsApi } from "../api";
import { FoodItem, NutrientDefinition } from "../types";
import {
  Search, Plus, Eye, Scale, Download, X,
  Database
} from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

interface FoodsDatabaseViewProps {
  initialSearch?: string;
}

export const FoodsDatabaseView: React.FC<FoodsDatabaseViewProps> = ({ initialSearch = "" }) => {
  const { t, formatNumber } = useTranslation();
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [foodGroups, setFoodGroups] = useState<string[]>([]);
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedGroup, setSelectedGroup] = useState("All Groups");
  const [selectedSource, setSelectedSource] = useState("All Sources");
  const [loading, setLoading] = useState(true);

  // Detail Modal
  const [detailFood, setDetailFood] = useState<FoodItem | null>(null);

  // Comparison State
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareResult, setCompareResult] = useState<{ nutrients: NutrientDefinition[]; foods: FoodItem[] } | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Custom Food Modal
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customGroup, setCustomGroup] = useState("Cereal Grains & Pasta");
  const [customKcal, setCustomKcal] = useState<number>(0);
  const [customProtein, setCustomProtein] = useState<number>(0);
  const [customCarbs, setCustomCarbs] = useState<number>(0);
  const [customFat, setCustomFat] = useState<number>(0);
  const [customFiber, setCustomFiber] = useState<number>(0);
  const [customSodium, setCustomSodium] = useState<number>(0);

  useEffect(() => {
    fetchFoods();
  }, [searchTerm, selectedGroup, selectedSource]);

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const data = await foodsApi.list({
        query: searchTerm,
        food_group: selectedGroup,
        data_source: selectedSource,
      });
      setFoods(data.foods);
      setFoodGroups(["All Groups", ...data.food_groups]);
      setDataSources(["All Sources", ...data.data_sources]);
      setTotalCount(data.total);
    } catch (err) {
      console.error("Error fetching foods:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (foodId: number) => {
    try {
      const fullFood = await foodsApi.getDetail(foodId);
      setDetailFood(fullFood);
    } catch (err) {
      console.error("Failed to load details:", err);
    }
  };

  const toggleCompare = (foodId: number) => {
    if (compareIds.includes(foodId)) {
      setCompareIds(compareIds.filter((id) => id !== foodId));
    } else {
      if (compareIds.length >= 4) {
        alert("You can compare up to 4 foods simultaneously.");
        return;
      }
      setCompareIds([...compareIds, foodId]);
    }
  };

  const handleRunComparison = async () => {
    if (compareIds.length === 0) return;
    try {
      const res = await foodsApi.compare(compareIds);
      setCompareResult(res);
      setShowCompareModal(true);
    } catch (err) {
      console.error("Comparison failed:", err);
    }
  };

  const handleCreateCustomFood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await foodsApi.createCustom({
        name: customName,
        food_group: customGroup,
        source_name: "Laboratory / User Formulated Food Record",
        nutrients: {
          energy_kcal: customKcal,
          energy_kj: Math.round(customKcal * 4.184),
          protein: customProtein,
          carbs: customCarbs,
          fat: customFat,
          fiber: customFiber,
          sodium: customSodium,
        },
      });
      setShowAddCustomModal(false);
      setCustomName("");
      fetchFoods();
    } catch (err) {
      alert("Failed to save custom food.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#2D8C83]" />
            <span>{t("foodsTitle")}</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            {t("foodsSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {compareIds.length > 0 && (
            <button
              onClick={handleRunComparison}
              className="bg-[#2D8C83] hover:bg-[#237069] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition"
            >
              <Scale className="w-4 h-4" />
              <span>{t("compareSelected")} ({compareIds.length})</span>
            </button>
          )}

          <a
            href="/api/export/foods-csv"
            download
            className="border border-[#E2E8E2] hover:bg-[#F7F9F7] text-[#192520] text-xs font-medium px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-[#7D9087]" />
            <span>{t("exportCsv")}</span>
          </a>

          <button
            onClick={() => setShowAddCustomModal(true)}
            className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t("addCustomFood")}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087] rtl:right-3 rtl:left-auto" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 focus:border-[#2D8C83] rtl:pr-9 rtl:pl-3"
          />
        </div>

        <div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E2E8E2] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
          >
            {foodGroups.map((g) => (
              <option key={g} value={g}>{g === "All Groups" ? t("allGroups") : g}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E2E8E2] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
          >
            {dataSources.map((s) => (
              <option key={s} value={s}>{s === "All Sources" ? t("allSources") : s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Foods Table */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E2E8E2] bg-[#F7F9F7] flex items-center justify-between text-xs text-[#52635C]">
          <span>Displaying <strong>{foods.length}</strong> of <strong>{totalCount}</strong> verified records</span>
          <span className="text-[11px] text-[#7D9087]">{t("standardPortion")}: 100g</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-[#F1F5F2] text-[#192520] font-semibold border-b border-[#E2E8E2]">
              <tr>
                <th className="py-3 px-4 w-10 text-center">Compare</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">{t("foodName")}</th>
                <th className="py-3 px-4">{t("foodGroup")}</th>
                <th className="py-3 px-4">{t("category")}</th>
                <th className="py-3 px-4">{t("dataSource")}</th>
                <th className="py-3 px-4 text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E2]">
              {foods.map((food) => {
                const isCompared = compareIds.includes(food.id);
                return (
                  <tr key={food.id} className="hover:bg-[#F7F9F7] transition">
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(food.id)}
                        className="rounded text-[#2D8C83] focus:ring-[#2D8C83]"
                      />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#52635C]">{food.code || "USER-ITEM"}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#192520]">{food.name}</div>
                      {food.alt_names && (
                        <div className="text-[11px] text-[#7D9087] line-clamp-1">{food.alt_names}</div>
                      )}
                      {food.scientific_name && (
                        <div className="text-[10px] italic text-[#52635C]">{food.scientific_name}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#52635C]">{food.food_group}</td>
                    <td className="py-3 px-4 text-[#7D9087]">{food.category || "—"}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-[#174C3A] font-medium border border-emerald-200">
                        {food.source_name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenDetail(food.id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D8C83] hover:text-[#174C3A] bg-[#2D8C83]/10 hover:bg-[#2D8C83]/20 px-2.5 py-1 rounded transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t("viewProfile")}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E2E8E2] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E2E8E2] bg-[#F7F9F7] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono bg-[#174C3A]/10 text-[#174C3A] px-2 py-0.5 rounded uppercase font-bold">
                  {detailFood.code} &bull; {detailFood.food_group}
                </span>
                <h3 className="text-base font-bold text-[#192520] mt-1">{detailFood.name}</h3>
                <p className="text-xs text-[#52635C] italic">{detailFood.scientific_name}</p>
              </div>
              <button
                onClick={() => setDetailFood(null)}
                className="p-1 rounded-lg text-[#7D9087] hover:text-[#192520] hover:bg-[#E2E8E2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Description & Attribution */}
              <div className="bg-[#F1F5F2] p-3.5 rounded-xl border border-[#E2E8E2] space-y-1">
                <div className="font-semibold text-[#174C3A]">Data Source Attribution & Audit</div>
                <div className="text-[#52635C]">{detailFood.source_citation || detailFood.source_name} ({detailFood.source_year})</div>
                <div className="text-[11px] text-[#7D9087]">{detailFood.description || "Standard laboratory reference item analyzed according to official AOAC methods."}</div>
              </div>

              {/* Household Serving Weights */}
              {detailFood.portions && detailFood.portions.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#192520] mb-2 uppercase tracking-wider text-[11px]">
                    {t("householdPortions")}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {detailFood.portions.map((p, i) => (
                      <div key={i} className="p-2.5 rounded-lg border border-[#E2E8E2] bg-white">
                        <div className="font-semibold text-[#192520]">{p.unit_name}</div>
                        <div className="text-[11px] text-[#2D8C83] font-medium">{formatNumber(p.gram_weight)} g</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comprehensive Nutrients Table */}
              <div>
                <h4 className="font-bold text-[#192520] mb-2 uppercase tracking-wider text-[11px]">
                  {t("nutrientsPer100g")}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {detailFood.nutrients && Object.entries(detailFood.nutrients).map(([code, nut]) => (
                    <div key={code} className="p-2 border border-[#E2E8E2] rounded-lg bg-white flex justify-between items-center">
                      <span className="text-[#52635C] capitalize font-medium">{code.replace(/_/g, " ")}:</span>
                      <span className="font-bold text-[#192520] ltr-only">
                        {nut.amount_per_100g !== null ? `${formatNumber(nut.amount_per_100g)} ${nut.unit}` : "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-[#E2E8E2] bg-[#F7F9F7] flex justify-end">
              <button
                onClick={() => setDetailFood(null)}
                className="px-4 py-2 bg-[#174C3A] text-white rounded-lg text-xs font-semibold hover:bg-[#123C2E] transition"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPARISON MODAL */}
      {showCompareModal && compareResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#E2E8E2] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E2E8E2] bg-[#F7F9F7] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#174C3A] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#2D8C83]" />
                  <span>{t("comparisonMatrixTitle")}</span>
                </h3>
                <p className="text-xs text-[#52635C]">{t("comparisonMatrixSubtitle")}</p>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-1 rounded-lg text-[#7D9087] hover:text-[#192520] hover:bg-[#E2E8E2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs">
              <table className="w-full text-left rtl:text-right border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E8E2] bg-[#F1F5F2]">
                    <th className="py-2.5 px-3 font-semibold text-[#192520]">Nutrient</th>
                    {compareResult.foods.map((f) => (
                      <th key={f.id} className="py-2.5 px-3 font-bold text-[#174C3A]">
                        {f.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]">
                  {compareResult.nutrients.map((nut) => (
                    <tr key={nut.code} className="hover:bg-[#F7F9F7]">
                      <td className="py-2 px-3 font-medium text-[#52635C]">
                        {nut.name} ({nut.unit})
                      </td>
                      {compareResult.foods.map((f) => {
                        const val = f.nutrients?.[nut.code]?.amount_per_100g;
                        return (
                          <td key={f.id} className="py-2 px-3 font-semibold text-[#192520] ltr-only">
                            {val !== undefined && val !== null ? `${formatNumber(val)} ${nut.unit}` : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-3 border-t border-[#E2E8E2] bg-[#F7F9F7] flex justify-end">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-4 py-2 bg-[#174C3A] text-white rounded-lg text-xs font-semibold hover:bg-[#123C2E] transition"
              >
                {t("done")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CUSTOM FOOD MODAL */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E2E8E2] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#E2E8E2] bg-[#F7F9F7] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#174C3A]">{t("addCustomFood")}</h3>
                <p className="text-xs text-[#52635C]">Enter laboratory-assayed or specialized food values per 100g.</p>
              </div>
              <button
                onClick={() => setShowAddCustomModal(false)}
                className="p-1 rounded-lg text-[#7D9087] hover:text-[#192520] hover:bg-[#E2E8E2] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomFood} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#192520] mb-1">{t("foodName")} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fortified Sorghum Flour Sample B-4"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#192520] mb-1">{t("foodGroup")}</label>
                <select
                  value={customGroup}
                  onChange={(e) => setCustomGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg bg-white"
                >
                  <option value="Cereal Grains & Pasta">Cereal Grains & Pasta</option>
                  <option value="Legumes and Legume Products">Legumes and Legume Products</option>
                  <option value="Vegetables and Vegetable Products">Vegetables and Vegetable Products</option>
                  <option value="Dairy and Egg Products">Dairy and Egg Products</option>
                  <option value="Poultry Products">Poultry Products</option>
                  <option value="Nut and Seed Products">Nut and Seed Products</option>
                  <option value="Custom Research Formulations">Custom Research Formulations</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-[#192520] mb-1">{t("termEnergy")} (kcal / 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customKcal}
                    onChange={(e) => setCustomKcal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#192520] mb-1">{t("termProtein")} (g / 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customProtein}
                    onChange={(e) => setCustomProtein(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#192520] mb-1">{t("termCarbohydrates")} (g / 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#192520] mb-1">{t("termTotalFat")} (g / 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFat}
                    onChange={(e) => setCustomFat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#192520] mb-1">{t("termDietaryFiber")} (g / 100g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customFiber}
                    onChange={(e) => setCustomFiber(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#192520] mb-1">{t("termSodium")} (mg / 100g)</label>
                  <input
                    type="number"
                    step="1"
                    value={customSodium}
                    onChange={(e) => setCustomSodium(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3 py-2 border border-[#E2E8E2] rounded-lg hover:bg-[#F7F9F7]"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#174C3A] hover:bg-[#123C2E] text-white rounded-lg font-semibold"
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
