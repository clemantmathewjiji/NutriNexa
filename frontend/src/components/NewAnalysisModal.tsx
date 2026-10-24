import React from "react";
import { NavSection } from "./Sidebar";
import {
  Calculator, UtensilsCrossed, CalendarCheck, Activity,
  FlaskConical, X, ArrowRight
} from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

interface NewAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: NavSection) => void;
}

export const NewAnalysisModal: React.FC<NewAnalysisModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const actions = [
    {
      title: t("calcTitle"),
      description: "Perform on-the-fly compound nutrient sums per 100g and serving portions.",
      section: "calculator" as NavSection,
      icon: Calculator,
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      title: t("recipeTitle"),
      description: "Standardize ingredients, compute cooked yield factor, and nutrients per serving.",
      section: "recipes" as NavSection,
      icon: UtensilsCrossed,
      color: "bg-teal-50 text-teal-800 border-teal-200",
    },
    {
      title: t("dietaryTitle"),
      description: "Log patient or research subject daily meals and benchmark against DRI/RDA targets.",
      section: "dietary" as NavSection,
      icon: CalendarCheck,
      color: "bg-blue-50 text-blue-800 border-blue-200",
    },
    {
      title: t("anthroTitle"),
      description: "Compute adult BMI, Asian cutoffs, WHtR, and log physical measurements.",
      section: "anthropometrics" as NavSection,
      icon: Activity,
      color: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      title: t("navProjects"),
      description: "Initialize an academic study, organize cohorts, and import research datasets.",
      section: "projects" as NavSection,
      icon: FlaskConical,
      color: "bg-purple-50 text-purple-800 border-purple-200",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#E2E8E2] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F7F9F7]">
          <div>
            <h3 className="text-base font-bold text-[#174C3A]">{t("newAnalysis")}</h3>
            <p className="text-xs text-[#52635C]">Select an analytical instrument to launch a new protocol.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7D9087] hover:text-[#192520] hover:bg-[#E2E8E2] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.section}
                onClick={() => {
                  onNavigate(act.section);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8E2] hover:border-[#2D8C83] hover:bg-[#F7F9F7] transition group text-left rtl:text-right"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-lg border shrink-0 ${act.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#192520] group-hover:text-[#174C3A] transition">
                      {act.title}
                    </h4>
                    <p className="text-xs text-[#52635C] mt-0.5">{act.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#7D9087] group-hover:text-[#174C3A] group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 transition shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
