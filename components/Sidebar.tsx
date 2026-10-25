"use client";
import React from "react";
import {
  LayoutDashboard,
  Database,
  Camera,
  Calculator,
  UtensilsCrossed,
  CalendarCheck,
  CalendarDays,
  Activity,
  FlaskConical,
  FileText,
  BookOpen,
  Sliders,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { TranslationDictionary } from "@/i18n/types";

export type NavSection =
  | "dashboard"
  | "foods"
  | "portions"
  | "calculator"
  | "recipes"
  | "dietary"
  | "meal-planner"
  | "anthropometrics"
  | "projects"
  | "reports"
  | "my-foods"
  | "settings"
  | "help";

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItemConfig {
  id: NavSection;
  key: keyof TranslationDictionary;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

const NAV_CONFIGS: NavItemConfig[] = [
  { id: "dashboard", key: "navDashboard", icon: LayoutDashboard },
  { id: "foods", key: "navFoods", icon: Database, tag: "TKPI/USDA" },
  { id: "portions", key: "navPortions", icon: Camera, tag: "Buku Foto" },
  { id: "calculator", key: "navCalculator", icon: Calculator },
  { id: "recipes", key: "navRecipes", icon: UtensilsCrossed },
  { id: "dietary", key: "navDietary", icon: CalendarCheck, tag: "Recall" },
  { id: "meal-planner", key: "navMealPlanner", icon: CalendarDays },
  { id: "anthropometrics", key: "navAnthropometrics", icon: Activity, tag: "BMI/WHtR" },
  { id: "projects", key: "navProjects", icon: FlaskConical },
  { id: "reports", key: "navReports", icon: FileText },
  { id: "my-foods", key: "navMyFoods", icon: BookOpen },
  { id: "settings", key: "navSettings", icon: Sliders },
  { id: "help", key: "navHelp", icon: HelpCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
}) => {
  const { t, dir } = useTranslation();

  return (
    <aside
      className={`bg-white border-r rtl:border-r-0 rtl:border-l border-[#E2E8E2] flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Navigation Links */}
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7D9087]">
          {!collapsed && <span>{t("academicModules")}</span>}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1 rounded-md hover:bg-[#F1F5F2] text-[#52635C] transition ml-auto rtl:ml-0 rtl:mr-auto"
          >
            {collapsed ? (
              dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              dir === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {NAV_CONFIGS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          const label = t(item.key);

          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center ${
                collapsed ? "justify-center px-2" : "justify-between px-3"
              } py-2.5 rounded-lg text-sm font-medium transition group ${
                isActive
                  ? "bg-[#174C3A] text-white shadow-xs"
                  : "text-[#52635C] hover:bg-[#F1F5F2] hover:text-[#192520]"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition ${
                    isActive ? "text-[#84CC16]" : "text-[#7D9087] group-hover:text-[#174C3A]"
                  }`}
                />
                {!collapsed && <span className="truncate">{label}</span>}
              </div>

              {!collapsed && item.tag && (
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[#E2E8E2] text-[#52635C]"
                  }`}
                >
                  {item.tag}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status & Scientific Version Badge */}
      <div className="p-3 border-t border-[#E2E8E2] bg-[#F7F9F7]/80">
        {!collapsed ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#174C3A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2D8C83]" />
              <span>{t("scientificCore")} v2.0</span>
            </div>
            <div className="text-[10px] text-[#7D9087]">
              USDA SR Legacy &bull; ICMR 2020 &bull; WHO
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="NutriNexa Engine Online">
            <div className="w-2.5 h-2.5 rounded-full bg-[#84CC16] ring-2 ring-[#84CC16]/30"></div>
          </div>
        )}
      </div>
    </aside>
  );
};
