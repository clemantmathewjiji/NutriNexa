import React from "react";
import { HelpCircle, BookOpen, Scale, Info } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export const HelpDocsView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#2D8C83]" />
          <span>{t("helpTitle")}</span>
        </h1>
        <p className="text-xs text-[#52635C] mt-1">
          {t("helpSubtitle")}
        </p>
      </div>

      {/* Mathematical Principles */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-6 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-[#174C3A] flex items-center gap-2">
          <Scale className="w-4 h-4 text-[#2D8C83]" />
          <span>{t("coreFormulas")}</span>
        </h2>

        <div className="space-y-3 text-[#52635C]">
          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2]">
            <div className="font-bold text-[#192520] mb-1">1. Nutrient Amount Scaling (Per Food Item)</div>
            <code className="text-[#174C3A] font-bold ltr-only inline-block">
              Nutrient Amount = (Nutrient Value per 100g) × (Edible Food Quantity in grams) ÷ 100
            </code>
            <p className="mt-1 text-[11px] text-[#7D9087]">
              {t("formulaScalingText")}
            </p>
          </div>

          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2]">
            <div className="font-bold text-[#192520] mb-1">2. Energy Conversions & General Atwater Factors</div>
            <code className="text-[#174C3A] font-bold ltr-only inline-block">
              Energy (kJ) = Energy (kcal) × 4.184
            </code>
            <br />
            <code className="text-[#2D8C83] font-semibold mt-1 inline-block ltr-only">
              Atwater General: Protein = 4 kcal/g | Carbohydrate = 4 kcal/g | Fat = 9 kcal/g | Dietary Fiber = 2 kcal/g
            </code>
            <p className="mt-1 text-[11px] text-[#7D9087]">
              {t("energyConversionsText")}
            </p>
          </div>

          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2]">
            <div className="font-bold text-[#192520] mb-1">3. Sodium vs. Salt Distinction</div>
            <code className="text-[#174C3A] font-bold ltr-only inline-block">
              Salt (NaCl equivalent in grams) = Sodium (mg) × 2.54 ÷ 1,000
            </code>
            <p className="mt-1 text-[11px] text-[#7D9087]">
              {t("sodiumSaltText")}
            </p>
          </div>

          <div className="p-3 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2]">
            <div className="font-bold text-[#192520] mb-1">4. Anthropometric Indices</div>
            <code className="text-[#174C3A] font-bold ltr-only inline-block">
              BMI = Weight (kg) ÷ [Height (m)]² &nbsp;|&nbsp; WHtR = Waist (cm) ÷ Height (cm)
            </code>
            <p className="mt-1 text-[11px] text-[#7D9087]">
              {t("anthroIndicesText")}
            </p>
          </div>
        </div>
      </div>

      {/* Missing Value Policy */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-6 shadow-xs space-y-3 text-xs">
        <h2 className="text-sm font-bold text-[#174C3A] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#2D8C83]" />
          <span>{t("missingDataPolicyTitle")}</span>
        </h2>
        <p className="text-[#52635C] leading-relaxed">
          {t("missingDataPolicyText")}
        </p>
      </div>

      {/* Data Source References */}
      <div className="bg-white rounded-xl border border-[#E2E8E2] p-6 shadow-xs space-y-3 text-xs">
        <h2 className="text-sm font-bold text-[#174C3A] flex items-center gap-2">
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
