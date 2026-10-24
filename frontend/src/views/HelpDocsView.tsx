import React from "react";
import { HelpCircle, BookOpen, ShieldCheck, Scale, Info, CheckCircle2 } from "lucide-react";

export const HelpDocsView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <h1 className="text-xl font-bold text-[#174C3A] flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-[#2D8C83]" />
          <span>Help & Scientific Documentation</span>
        </h1>
        <p className="text-xs text-[#52635C] mt-1">
          NutriNexa mathematical principles, food composition methodology, and data provenance guidelines.
        </p>
      </div>

      {/* Mathematical Principles */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-6 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-[#174C3A] flex items-center space-x-2">
          <Scale className="w-4 h-4 text-[#2D8C83]" />
          <span>Core Calculation Formulas</span>
        </h2>

        <div className="space-y-3 text-[#52635C]">
          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2]">
            <div className="font-bold text-[#192520] mb-1">1. Nutrient Amount Scaling (Per Food Item)</div>
            <code className="text-[#174C3A] font-bold">
              Nutrient Amount = (Nutrient Value per 100g) × (Edible Food Quantity in grams) ÷ 100
            </code>
            <p className="mt-1 text-[11px] text-[#7D9087]">
              Applied to each food item independently before summation. Source units (mg, µg, g) are preserved.
            </p>
          </div>

          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2]">
            <div className="font-bold text-[#192520] mb-1">2. Energy Conversions & General Atwater Factors</div>
            <code className="text-[#174C3A] font-bold">
              Energy (kJ) = Energy (kcal) × 4.184
            </code>
            <br />
            <code className="text-[#2D8C83] font-semibold mt-1 inline-block">
              Atwater General: Protein = 4 kcal/g | Carbohydrate = 4 kcal/g | Fat = 9 kcal/g | Dietary Fiber = 2 kcal/g
            </code>
          </div>

          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2]">
            <div className="font-bold text-[#192520] mb-1">3. Sodium vs. Salt Distinction</div>
            <code className="text-[#174C3A] font-bold">
              Salt (NaCl equivalent in grams) = Sodium (mg) × 2.54 ÷ 1,000
            </code>
          </div>

          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2]">
            <div className="font-bold text-[#192520] mb-1">4. Anthropometric Indices</div>
            <code className="text-[#174C3A] font-bold">
              BMI = Weight (kg) ÷ [Height (m)]² &nbsp;|&nbsp; WHtR = Waist (cm) ÷ Height (cm)
            </code>
            <p className="mt-1 text-[11px] text-[#7D9087]">
              Adult cutoff standard: WHO Technical Report Series 854. WHtR &lt; 0.5 designates healthy cardiometabolic range.
            </p>
          </div>
        </div>
      </div>

      {/* Missing Value Policy */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-6 shadow-xs space-y-3 text-xs">
        <h2 className="text-sm font-bold text-[#174C3A] flex items-center space-x-2">
          <Info className="w-4 h-4 text-[#2D8C83]" />
          <span>Missing Value vs. Zero Policy</span>
        </h2>
        <p className="text-[#52635C] leading-relaxed">
          In rigorous nutrition science, unanalyzed nutrients must never be treated as zero (0.0). NutriNexa distinguishes three states:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-[#52635C]">
          <li><strong>Quantified Numeric Value:</strong> Validated laboratory assay (e.g., 16.89 g protein).</li>
          <li><strong>Trace (TR):</strong> Present in amounts below the limit of quantification (LOQ). Counted as negligible in energy totals.</li>
          <li><strong>Missing / Not Analyzed (N/A):</strong> Flagged transparently in calculation summaries to avoid false research conclusions.</li>
        </ul>
      </div>

      {/* Data Source References */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-6 shadow-xs space-y-3 text-xs">
        <h2 className="text-sm font-bold text-[#174C3A] flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-[#2D8C83]" />
          <span>Configured Food Composition Authorities</span>
        </h2>
        <div className="space-y-2 text-[#52635C]">
          <div className="p-2.5 rounded-lg border border-[#E2E8E2]">
            <strong>USDA FoodData Central SR Legacy & Foundation:</strong> U.S. Department of Agriculture, Agricultural Research Service.
          </div>
          <div className="p-2.5 rounded-lg border border-[#E2E8E2]">
            <strong>ICMR-National Institute of Nutrition (NIN):</strong> Nutrient Requirements and Dietary Reference Intakes for Indians (2020).
          </div>
          <div className="p-2.5 rounded-lg border border-[#E2E8E2]">
            <strong>World Health Organization (WHO):</strong> Physical Status: The Use and Interpretation of Anthropometry (TRS 854).
          </div>
        </div>
      </div>
    </div>
  );
};
