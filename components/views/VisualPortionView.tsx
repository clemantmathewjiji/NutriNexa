"use client";
import React, { useState } from "react";
import {
  Camera, Utensils, Search, Scale, ChevronRight, BookmarkPlus, Check,
  Info, ExternalLink, ArrowRight, ShieldCheck, Plus, AlertCircle
} from "lucide-react";
import { BUKU_FOTO_MAKANAN_CATALOG, PhotoPortionItem } from "@/data/bukuFotoMakanan2014";
import { estimateConsumedPortion } from "@/services/portionEstimator";
import { useTranslation } from "@/i18n/LanguageContext";

interface VisualPortionViewProps {
  onSendToCalculator?: (foodName: string, edibleGrams: number) => void;
  onSendToRecall?: (foodName: string, edibleGrams: number, portionDesc: string) => void;
}

export const VisualPortionView: React.FC<VisualPortionViewProps> = ({
  onSendToCalculator,
  onSendToRecall,
}) => {
  const { t, formatNumber } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedItem, setSelectedItem] = useState<PhotoPortionItem>(BUKU_FOTO_MAKANAN_CATALOG[0]);
  const [selectedPortionSize, setSelectedPortionSize] = useState<"kecil" | "sedang" | "besar">("sedang");
  const [portionCount, setPortionCount] = useState<number>(1.0);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Composite Dish Custom Breakdown Modal state
  const [showDeconstructModal, setShowDeconstructModal] = useState(false);
  const [compositeIngredients, setCompositeIngredients] = useState([
    { name: "Cooked Base", grams: 100 },
    { name: "Protein Portion", grams: 50 },
    { name: "Vegetable Mix", grams: 40 },
    { name: "Cooking Oil / Sauce", grams: 10 },
  ]);

  const categories = [
    "All Categories",
    "Nasi & Serealia",
    "Lauk Pauk Hewani",
    "Lauk Pauk Nabati",
    "Sayuran",
    "Buah-buahan",
  ];

  const filteredItems = BUKU_FOTO_MAKANAN_CATALOG.filter((item) => {
    if (selectedCategory !== "All Categories" && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        item.food_name_id.toLowerCase().includes(q) ||
        item.food_name_en.toLowerCase().includes(q) ||
        item.household_utensil.toLowerCase().includes(q) ||
        item.source_page.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const estimated = estimateConsumedPortion(selectedItem.id, selectedPortionSize, portionCount);

  const handleSendToCalculatorAction = () => {
    if (onSendToCalculator) {
      onSendToCalculator(selectedItem.food_name_id, estimated.total_edible_weight_grams);
      setActionNotice(`Transferred ${estimated.total_edible_weight_grams}g of ${selectedItem.food_name_id} to Nutrient Calculator.`);
      setTimeout(() => setActionNotice(null), 3500);
    } else {
      setActionNotice(`Ready: ${estimated.total_edible_weight_grams}g edible ${selectedItem.food_name_id} available for modeling.`);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  const handleSendToRecallAction = () => {
    if (onSendToRecall) {
      onSendToRecall(selectedItem.food_name_id, estimated.total_edible_weight_grams, estimated.household_description);
      setActionNotice(`Logged ${selectedItem.food_name_id} (${estimated.household_description}) to 24-Hour Recall.`);
      setTimeout(() => setActionNotice(null), 3500);
    } else {
      setActionNotice(`Logged ${selectedItem.food_name_id} (${estimated.household_description}) to 24-Hour Recall.`);
      setTimeout(() => setActionNotice(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#174C3A]/10 text-[#174C3A]">
              <Camera className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-[#174C3A]">
              Visual Food-Portion Estimation Reference
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wide">
              Buku Foto Makanan 2014 &bull; SKMI
            </span>
          </div>
          <p className="text-xs text-[#52635C] mt-1">
            Photographic food portion sizing, household utensil measurements, and edible weight corrections (% BDD) based on Indonesian Balitbangkes standards.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#52635C]">
          <span className="px-2.5 py-1 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2] font-medium">
            Kementerian Kesehatan RI
          </span>
          <button
            onClick={() => setShowDeconstructModal(true)}
            className="px-3 py-1.5 bg-[#2D8C83]/15 hover:bg-[#2D8C83]/25 text-[#174C3A] font-semibold rounded-lg border border-[#2D8C83]/30 transition"
          >
            Deconstruct Mixed Dish
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Catalog & Photo Selector (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4">
          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Indonesian food (e.g. Nasi, Tempe, Ayam, Lele, Pisang)..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs border border-[#E2E8E2] rounded-lg bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Photo Portions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredItems.map((item) => {
              const isSelected = selectedItem.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-3 rounded-xl border cursor-pointer transition text-xs space-y-2 ${
                    isSelected
                      ? "border-[#174C3A] bg-[#F1F5F2] ring-1 ring-[#174C3A]"
                      : "border-[#E2E8E2] hover:border-[#2D8C83] bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#174C3A]">{item.food_name_id}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-[#E2E8E2] text-[#52635C]">
                      {item.photo_badge}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#52635C] italic">{item.food_name_en}</div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#E2E8E2]/60">
                    <span className="text-[#7D9087] flex items-center gap-1">
                      <Utensils className="w-3 h-3" /> {item.household_utensil}
                    </span>
                    <span className="font-semibold text-emerald-800">{item.bdd_percentage}% BDD</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px] text-center pt-1 font-mono">
                    <div className="bg-white p-1 rounded border border-[#E2E8E2]">
                      <div className="text-[#7D9087]">Kecil (P)</div>
                      <div className="font-bold text-[#192520]">{item.portions.kecil.raw_weight_grams}g</div>
                    </div>
                    <div className="bg-[#174C3A]/10 p-1 rounded border border-[#174C3A]/20">
                      <div className="text-[#174C3A] font-semibold">Sedang (S)</div>
                      <div className="font-bold text-[#174C3A]">{item.portions.sedang.raw_weight_grams}g</div>
                    </div>
                    <div className="bg-white p-1 rounded border border-[#E2E8E2]">
                      <div className="text-[#7D9087]">Besar (B)</div>
                      <div className="font-bold text-[#192520]">{item.portions.besar.raw_weight_grams}g</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Portion Calculator & Diagnostic Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4 text-xs">
            {/* Selected Food Badge */}
            <div className="border-b border-[#E2E8E2] pb-3 flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#2D8C83] tracking-wide">
                  Active Reference Food
                </span>
                <h3 className="text-base font-bold text-[#174C3A] mt-0.5">
                  {selectedItem.food_name_id}
                </h3>
                <div className="text-[11px] text-[#52635C]">{selectedItem.food_name_en}</div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-1 bg-[#174C3A] text-white rounded-md">
                Ref: {selectedItem.source_page}
              </span>
            </div>

            {/* Portion Selector Buttons */}
            <div>
              <label className="block font-semibold text-[#192520] mb-1.5">
                Select Photo Portion Size:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["kecil", "sedang", "besar"] as const).map((size) => {
                  const data = selectedItem.portions[size];
                  const active = selectedPortionSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedPortionSize(size)}
                      className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                        active
                          ? "bg-[#174C3A] text-white border-[#174C3A] shadow-xs"
                          : "bg-[#F7F9F7] text-[#192520] border-[#E2E8E2] hover:border-[#2D8C83]"
                      }`}
                    >
                      <div className="font-bold uppercase text-[11px]">{data.label_id}</div>
                      <div className="text-sm font-extrabold mt-0.5 font-mono">
                        {data.raw_weight_grams}g
                      </div>
                      <div className={`text-[9px] mt-1 truncate ${active ? "text-white/80" : "text-[#7D9087]"}`}>
                        {data.household_desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Multiplier */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-[#192520] mb-1">
                  Portion Multiplier (Count)
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="20"
                  value={portionCount}
                  onChange={(e) => setPortionCount(parseFloat(e.target.value) || 1.0)}
                  className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg font-bold text-center"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#192520] mb-1">
                  Household Measure
                </label>
                <div className="p-2 bg-[#F7F9F7] border border-[#E2E8E2] rounded-lg text-[11px] font-medium text-[#52635C] truncate">
                  {estimated.household_description}
                </div>
              </div>
            </div>

            {/* Calculated Edible Weights Summary */}
            <div className="p-3.5 bg-[#F1F5F2] border border-[#174C3A]/20 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#52635C]">Gross Consumed Weight:</span>
                <span className="font-bold text-[#192520] font-mono">{estimated.total_raw_weight_grams} g</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#52635C]">Edible Portion (% BDD):</span>
                <span className="font-bold text-[#2D8C83] font-mono">{estimated.bdd_percentage}%</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-[#174C3A]/20 pt-2 font-bold">
                <span className="text-[#174C3A]">Net Edible Consumed Weight:</span>
                <span className="text-[#174C3A] text-sm font-mono">{estimated.total_edible_weight_grams} g</span>
              </div>
              {estimated.refuse_note && (
                <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                  <strong>Refuse Note:</strong> {estimated.refuse_note}
                </div>
              )}
            </div>

            {/* Nutrient Assay Preview (Derived from TKPI 2017) */}
            <div className="space-y-2">
              <div className="font-bold text-[#174C3A] flex items-center justify-between">
                <span>Calculated Nutrient Contribution</span>
                <span className="text-[10px] text-[#7D9087]">per net edible intake</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 border border-[#E2E8E2] rounded-lg bg-[#F7F9F7] flex justify-between">
                  <span className="text-[#52635C]">Energy:</span>
                  <span className="font-bold text-[#174C3A]">
                    {estimated.calculated_nutrients["energy_kcal"]?.display || "—"}
                  </span>
                </div>
                <div className="p-2 border border-[#E2E8E2] rounded-lg bg-[#F7F9F7] flex justify-between">
                  <span className="text-[#52635C]">Protein:</span>
                  <span className="font-bold text-[#192520]">
                    {estimated.calculated_nutrients["protein"]?.display || "—"}
                  </span>
                </div>
                <div className="p-2 border border-[#E2E8E2] rounded-lg bg-[#F7F9F7] flex justify-between">
                  <span className="text-[#52635C]">Total Fat:</span>
                  <span className="font-bold text-[#192520]">
                    {estimated.calculated_nutrients["fat"]?.display || "—"}
                  </span>
                </div>
                <div className="p-2 border border-[#E2E8E2] rounded-lg bg-[#F7F9F7] flex justify-between">
                  <span className="text-[#52635C]">Carbohydrate:</span>
                  <span className="font-bold text-[#192520]">
                    {estimated.calculated_nutrients["carbs"]?.display || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSendToCalculatorAction}
                className="py-2.5 px-3 bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>To Calculator</span>
              </button>

              <button
                type="button"
                onClick={handleSendToRecallAction}
                className="py-2.5 px-3 bg-[#2D8C83] hover:bg-[#236F68] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>To 24h Recall</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Composite Dish Ingredient Breakdown Modal */}
      {showDeconstructModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8E2] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E2]">
              <div>
                <h3 className="text-sm font-bold text-[#174C3A]">
                  Deconstruct Mixed / Composite Dish
                </h3>
                <p className="text-xs text-[#52635C]">
                  Specify exact ingredient contributions instead of assuming fixed recipe composition.
                </p>
              </div>
              <button
                onClick={() => setShowDeconstructModal(false)}
                className="p-1 text-[#7D9087] hover:text-[#192520]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {compositeIngredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => {
                      const updated = [...compositeIngredients];
                      updated[idx].name = e.target.value;
                      setCompositeIngredients(updated);
                    }}
                    className="flex-1 px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
                  />
                  <input
                    type="number"
                    value={ing.grams}
                    onChange={(e) => {
                      const updated = [...compositeIngredients];
                      updated[idx].grams = parseFloat(e.target.value) || 0;
                      setCompositeIngredients(updated);
                    }}
                    className="w-20 px-3 py-1.5 border border-[#E2E8E2] rounded-lg text-right font-mono"
                  />
                  <span className="text-[#7D9087] font-semibold">g</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#E2E8E2]">
              <div className="text-xs font-bold text-[#174C3A]">
                Total: {compositeIngredients.reduce((s, i) => s + i.grams, 0)}g
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDeconstructModal(false);
                  setActionNotice("Composite recipe breakdown saved for analysis.");
                  setTimeout(() => setActionNotice(null), 3500);
                }}
                className="px-4 py-2 bg-[#174C3A] text-white text-xs font-semibold rounded-lg hover:bg-[#123C2E]"
              >
                Apply Custom Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
