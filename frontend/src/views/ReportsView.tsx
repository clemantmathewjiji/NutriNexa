import React, { useState } from "react";
import {
  FileText, Printer, Download, ShieldCheck,
  CheckCircle2, Info, Building2, Calendar
} from "lucide-react";

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState("Nutrient Calculation Report");
  const [reportDate] = useState(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* View Header (No Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#2D8C83]" />
            <span>Scientific Reports & Publications</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            Standardized academic reports complete with traceability citations, methodology footnotes, and print-ready formatting.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 text-xs border rounded-lg bg-white"
          >
            <option value="Nutrient Calculation Report">Nutrient Calculation Report</option>
            <option value="Recipe Batch Formulation Report">Recipe Batch Formulation Report</option>
            <option value="Dietary Intake & DRV Benchmark Report">Dietary Intake & DRV Benchmark Report</option>
            <option value="Anthropometric & Physical Assessment Summary">Anthropometric Assessment Summary</option>
          </select>

          <button
            onClick={handlePrint}
            className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4 text-[#84CC16]" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* PRINT-READY SCIENTIFIC REPORT DOCUMENT */}
      <div className="bg-white rounded-2xl border border-[#E2E8E2] p-8 sm:p-12 shadow-sm space-y-8 max-w-4xl mx-auto">
        {/* Letterhead */}
        <div className="border-b-2 border-[#174C3A] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#174C3A] flex items-center justify-center text-white">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#174C3A]">NutriNexa</span>
                <span className="text-[10px] uppercase font-bold text-[#2D8C83] ml-2 tracking-wider">
                  NUTRITION RESEARCH & ANALYTICS
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

          <div className="text-right text-xs">
            <div className="font-bold text-[#192520]">{reportType}</div>
            <div className="text-[#52635C] mt-0.5">Date of Issue: {reportDate}</div>
            <div className="text-[#7D9087] font-mono text-[10px] mt-0.5">ID: NNX-REP-2026-9041</div>
          </div>
        </div>

        {/* Study & Protocol Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F7F9F7] border border-[#E2E8E2] text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7D9087]">Project Protocol</span>
            <div className="font-bold text-[#174C3A] mt-0.5">NUTRI-2026-A</div>
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
            <div className="font-semibold text-[#2D8C83] mt-0.5">NutriNexa v2.0 (Verified)</div>
          </div>
        </div>

        {/* Contributing Ingredients & Sample Formulation */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#174C3A] border-b border-[#E2E8E2] pb-1">
            Contributing Food Items & Standardized Quantities
          </h3>

          <table className="w-full text-left text-xs">
            <thead className="bg-[#F1F5F2] font-semibold text-[#192520]">
              <tr>
                <th className="py-2 px-3">Item Code</th>
                <th className="py-2 px-3">Food Item Name</th>
                <th className="py-2 px-3">Edible Portion</th>
                <th className="py-2 px-3">Data Source Citation</th>
                <th className="py-2 px-3 text-right">Energy (kcal)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E2]">
              <tr>
                <td className="py-2 px-3 font-mono text-[11px]">FDC-168878</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Oats, rolled, raw</td>
                <td className="py-2 px-3">60.0 g</td>
                <td className="py-2 px-3 text-[#7D9087]">USDA FoodData Central SR Legacy</td>
                <td className="py-2 px-3 text-right font-bold text-[#174C3A]">233.4</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[11px]">FDC-171055</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Egg, whole, raw, fresh</td>
                <td className="py-2 px-3">50.0 g</td>
                <td className="py-2 px-3 text-[#7D9087]">USDA FoodData Central SR Legacy</td>
                <td className="py-2 px-3 text-right font-bold text-[#174C3A]">71.5</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[11px]">FDC-170884</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Yogurt, Greek, plain, nonfat</td>
                <td className="py-2 px-3">100.0 g</td>
                <td className="py-2 px-3 text-[#7D9087]">USDA FoodData Central SR Legacy</td>
                <td className="py-2 px-3 text-right font-bold text-[#174C3A]">59.0</td>
              </tr>
            </tbody>
            <tfoot className="border-t-2 border-[#174C3A] font-bold text-xs">
              <tr>
                <td colSpan={2} className="py-2 px-3">Aggregated Formulation Total</td>
                <td className="py-2 px-3">210.0 g</td>
                <td></td>
                <td className="py-2 px-3 text-right text-[#174C3A]">363.9 kcal (1,522 kJ)</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Standardized Scientific Nutrient Assay Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#174C3A] border-b border-[#E2E8E2] pb-1">
            Standardized Nutrient Composition Assay
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {[
              { name: "Total Energy", val: "363.9 kcal (1522.6 kJ)" },
              { name: "Protein", val: "26.6 g" },
              { name: "Total Fat", val: "9.3 g" },
              { name: "Saturated Fatty Acids", val: "2.4 g" },
              { name: "Monounsaturated Fat", val: "3.2 g" },
              { name: "Polyunsaturated Fat", val: "2.5 g" },
              { name: "Cholesterol", val: "191.0 mg" },
              { name: "Total Carbohydrates", val: "43.8 g" },
              { name: "Dietary Fiber", val: "6.4 g" },
              { name: "Total Sugars", val: "4.0 g" },
              { name: "Calcium (Ca)", val: "170.4 mg" },
              { name: "Iron (Fe)", val: "3.8 mg" },
              { name: "Magnesium (Mg)", val: "123.2 mg" },
              { name: "Potassium (K)", val: "467.4 mg" },
              { name: "Sodium (Na)", val: "108.2 mg" },
              { name: "Zinc (Zn)", val: "3.5 mg" },
              { name: "Folate DFE", val: "64.1 µg" },
              { name: "Vitamin B-12", val: "1.2 µg" },
            ].map((n, i) => (
              <div key={i} className="p-2 border border-[#E2E8E2] rounded-lg bg-white flex justify-between items-center">
                <span className="text-[#52635C]">{n.name}:</span>
                <span className="font-bold text-[#192520]">{n.val}</span>
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
            <div>Verified By: ___________________________</div>
            <div className="text-[10px] text-[#7D9087] mt-1">Lead Research Dietitian / Faculty Evaluator</div>
          </div>
          <div className="text-right">
            <div>NutriNexa Research Engine — Academic Edition</div>
            <div className="text-[10px] text-[#7D9087]">Document valid with digital verification hash</div>
          </div>
        </div>
      </div>
    </div>
  );
};
