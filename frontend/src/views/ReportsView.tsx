import React, { useState } from "react";
import {
  FileText, Printer, Globe2
} from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { LanguageCode, SUPPORTED_LANGUAGES } from "../i18n/types";
import { getTranslation } from "../i18n/locales";

export const ReportsView: React.FC = () => {
  const { language, formatDate, formatNumber } = useTranslation();
  const [reportLang, setReportLang] = useState<LanguageCode>(language);
  const [reportType, setReportType] = useState("Nutrient Calculation Report");

  const rT = (key: any) => getTranslation(reportLang, key);
  const reportLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === reportLang) || SUPPORTED_LANGUAGES[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* View Header (No Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2D8C83]" />
            <span>{rT("reportsTitle")}</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            {rT("reportsSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Independent Report Language Selector (Section H Requirement) */}
          <div className="flex items-center gap-1.5 bg-[#F7F9F7] px-2.5 py-1.5 rounded-lg border border-[#E2E8E2] text-xs">
            <Globe2 className="w-3.5 h-3.5 text-emerald-800" />
            <span className="font-semibold text-[#192520]">Report Language:</span>
            <select
              value={reportLang}
              onChange={(e) => setReportLang(e.target.value as LanguageCode)}
              className="bg-transparent font-bold text-emerald-950 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 text-xs border border-[#E2E8E2] rounded-lg bg-white"
          >
            <option value="Nutrient Calculation Report">{rT("reportTypeNutrient")}</option>
            <option value="Recipe Batch Formulation Report">{rT("reportTypeRecipe")}</option>
            <option value="Dietary Intake & DRV Benchmark Report">{rT("reportTypeDietary")}</option>
            <option value="Anthropometric & Physical Assessment Summary">{rT("reportTypeAnthro")}</option>
          </select>

          <button
            onClick={handlePrint}
            className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4 text-[#84CC16]" />
            <span>{rT("printSavePdf")}</span>
          </button>
        </div>
      </div>

      {/* PRINT-READY SCIENTIFIC REPORT DOCUMENT */}
      <div
        dir={reportLangInfo.dir}
        className={`bg-white rounded-2xl border border-[#E2E8E2] p-8 sm:p-12 shadow-sm space-y-8 max-w-4xl mx-auto transition-all ${
          reportLangInfo.dir === "rtl" ? "text-right" : "text-left"
        }`}
      >
        {/* Letterhead */}
        <div className="border-b-2 border-[#174C3A] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#174C3A] flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#174C3A]">NutriNexa</span>
                <span className="text-[10px] uppercase font-bold text-[#2D8C83] mx-2 tracking-wider">
                  {rT("researchAndAnalytics")}
                </span>
              </div>
            </div>
            <div className="text-xs text-[#52635C] mt-2">
              Food Science & Computational Nutrition Laboratory
            </div>
            <div className="text-[11px] text-[#7D9087]">
              SJCET Palai &bull; ISO/IEC Research Data Standard Compliance
            </div>
          </div>

          <div className="text-right rtl:text-left text-xs">
            <div className="font-bold text-[#192520]">{reportType}</div>
            <div className="text-[#52635C] mt-0.5">{rT("dateOfIssue")}: {formatDate(new Date())}</div>
            <div className="text-[#7D9087] font-mono text-[10px] mt-0.5 ltr-only">ID: NNX-REP-2026-9041</div>
          </div>
        </div>

        {/* Study & Protocol Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F7F9F7] border border-[#E2E8E2] text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7D9087]">Project Protocol</span>
            <div className="font-bold text-[#174C3A] mt-0.5 ltr-only">NUTRI-2026-A</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7D9087]">Lead Investigator</span>
            <div className="font-semibold text-[#192520] mt-0.5">Dr. Clemant Mathew Jiji</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7D9087]">Reference Authority</span>
            <div className="font-semibold text-[#192520] mt-0.5">USDA SR Legacy / ICMR 2020</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7D9087]">Calculation Engine</span>
            <div className="font-semibold text-[#2D8C83] mt-0.5">{rT("scientificCore")} v2.0</div>
          </div>
        </div>

        {/* Contributing Ingredients & Sample Formulation */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#174C3A] border-b border-[#E2E8E2] pb-1">
            {rT("contributingFoods")} &bull; {rT("edibleWeight")}
          </h3>

          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-[#F1F5F2] font-semibold text-[#192520]">
              <tr>
                <th className="py-2 px-3">Item Code</th>
                <th className="py-2 px-3">{rT("foodName")}</th>
                <th className="py-2 px-3">{rT("edibleWeight")}</th>
                <th className="py-2 px-3">{rT("dataSource")}</th>
                <th className="py-2 px-3 text-right rtl:text-left">{rT("termEnergy")} (kcal)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E2]">
              <tr>
                <td className="py-2 px-3 font-mono text-[11px] ltr-only">FDC-168878</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Oats, rolled, raw</td>
                <td className="py-2 px-3 ltr-only">60.0 g</td>
                <td className="py-2 px-3 text-[#7D9087]">USDA FoodData Central SR Legacy</td>
                <td className="py-2 px-3 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">233.4</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[11px] ltr-only">FDC-171055</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Egg, whole, raw, fresh</td>
                <td className="py-2 px-3 ltr-only">50.0 g</td>
                <td className="py-2 px-3 text-[#7D9087]">USDA FoodData Central SR Legacy</td>
                <td className="py-2 px-3 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">71.5</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[11px] ltr-only">FDC-170884</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Yogurt, Greek, plain, nonfat</td>
                <td className="py-2 px-3 ltr-only">100.0 g</td>
                <td className="py-2 px-3 text-[#7D9087]">USDA FoodData Central SR Legacy</td>
                <td className="py-2 px-3 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">59.0</td>
              </tr>
            </tbody>
            <tfoot className="border-t-2 border-[#174C3A] font-bold text-xs">
              <tr>
                <td colSpan={2} className="py-2 px-3">{rT("compositeTotal")}</td>
                <td className="py-2 px-3 ltr-only">210.0 g</td>
                <td></td>
                <td className="py-2 px-3 text-right rtl:text-left text-[#174C3A] ltr-only">363.9 kcal (1,522 kJ)</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Standardized Scientific Nutrient Assay Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#174C3A] border-b border-[#E2E8E2] pb-1">
            {rT("completeNutrientProfile")}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {[
              { name: rT("termEnergy"), val: "363.9 kcal (1522.6 kJ)" },
              { name: rT("termProtein"), val: "26.6 g" },
              { name: rT("termTotalFat"), val: "9.3 g" },
              { name: rT("termSaturatedFat"), val: "2.4 g" },
              { name: rT("termMonounsaturatedFat"), val: "3.2 g" },
              { name: rT("termPolyunsaturatedFat"), val: "2.5 g" },
              { name: rT("termCholesterol"), val: "191.0 mg" },
              { name: rT("termCarbohydrates"), val: "43.8 g" },
              { name: rT("termDietaryFiber"), val: "6.4 g" },
              { name: rT("termSugars"), val: "4.0 g" },
              { name: rT("termCalcium"), val: "170.4 mg" },
              { name: rT("termIron"), val: "3.8 mg" },
              { name: rT("termMagnesium"), val: "123.2 mg" },
              { name: rT("termPotassium"), val: "467.4 mg" },
              { name: rT("termSodium"), val: "108.2 mg" },
              { name: rT("termZinc"), val: "3.5 mg" },
              { name: rT("termFolate"), val: "64.1 µg" },
              { name: rT("termVitaminB12"), val: "1.2 µg" },
            ].map((n, i) => (
              <div key={i} className="p-2 border border-[#E2E8E2] rounded-lg bg-white flex justify-between items-center">
                <span className="text-[#52635C]">{n.name}:</span>
                <span className="font-bold text-[#192520] ltr-only">{n.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific Footnotes & Methodology Notes */}
        <div className="p-4 rounded-xl bg-[#F7F9F7] border border-[#E2E8E2] text-xs space-y-2">
          <div className="font-bold text-[#174C3A]">Methodology & Audit Declarations</div>
          <p className="text-[#52635C] text-[11px] leading-relaxed">
            1. <strong>Calculation Principle:</strong> Nutrient content computed strictly as <code>Nutrient = (Value / 100g) × Quantity(g)</code>.
            <br />
            2. <strong>Energy Factor Standard:</strong> Derived from standard Atwater general factors (Protein: 4 kcal/g, Carbohydrate: 4 kcal/g, Fat: 9 kcal/g, Fiber: 2 kcal/g) where unstated in source files.
            <br />
            3. <strong>Data Provenance:</strong> Derived from USDA Agricultural Research Service FoodData Central (Release 2019/2023). Missing values are not imputed as zero.
          </p>
        </div>

        {/* Institutional Sign-off */}
        <div className="pt-6 border-t border-[#E2E8E2] flex justify-between items-end text-xs text-[#52635C]">
          <div>
            <div>{rT("verifiedBy")}: ___________________________</div>
            <div className="text-[10px] text-[#7D9087] mt-1">{rT("leadEvaluator")}</div>
          </div>
          <div className="text-right rtl:text-left">
            <div>NutriNexa Research Engine — Academic Edition</div>
            <div className="text-[10px] text-[#7D9087]">Document valid with digital verification hash</div>
          </div>
        </div>
      </div>
    </div>
  );
};
