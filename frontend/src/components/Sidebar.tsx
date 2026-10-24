import React from "react";
import {
  LayoutDashboard,
  Database,
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

export type NavSection =
  | "dashboard"
  | "foods"
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

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "foods", label: "Food Database", icon: Database, tag: "USDA FDC" },
  { id: "calculator", label: "Nutrient Calculator", icon: Calculator },
  { id: "recipes", label: "Recipe Analysis", icon: UtensilsCrossed },
  { id: "dietary", label: "Dietary Assessment", icon: CalendarCheck, tag: "Recall" },
  { id: "meal-planner", label: "Meal Planner", icon: CalendarDays },
  { id: "anthropometrics", label: "Anthropometrics", icon: Activity, tag: "BMI/WHtR" },
  { id: "projects", label: "Research Projects", icon: FlaskConical },
  { id: "reports", label: "Reports & Exports", icon: FileText },
  { id: "my-foods", label: "My Foods & Recipes", icon: BookOpen },
  { id: "settings", label: "Settings & DRVs", icon: Sliders },
  { id: "help", label: "Help & Documentation", icon: HelpCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  collapsed,
  onToggleCollapse,
}) => {
  return (
    <aside
      className={`bg-white border-r border-[#E2E8E2] flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        collapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Navigation Links */}
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7D9087]">
          {!collapsed && <span>Academic Modules</span>}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1 rounded-md hover:bg-[#F1F5F2] text-[#52635C] transition ml-auto"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                collapsed ? "justify-center px-2" : "justify-between px-3"
              } py-2.5 rounded-lg text-sm font-medium transition group ${
                isActive
                  ? "bg-[#174C3A] text-white shadow-xs"
                  : "text-[#52635C] hover:bg-[#F1F5F2] hover:text-[#192520]"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition ${
                    isActive ? "text-[#84CC16]" : "text-[#7D9087] group-hover:text-[#174C3A]"
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.tag && (
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
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
            <div className="flex items-center space-x-2 text-[11px] font-semibold text-[#174C3A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2D8C83]" />
              <span>Scientific Core v2.0</span>
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
