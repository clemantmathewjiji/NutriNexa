import React, { useEffect, useState } from "react";
import { dashboardApi } from "../api";
import { NavSection } from "../components/Sidebar";
import {
  Database, Calculator, UtensilsCrossed, FlaskConical,
  CalendarCheck, Activity, ArrowRight, ShieldCheck,
  TrendingUp, Clock, Info, CheckCircle2
} from "lucide-react";

interface DashboardViewProps {
  onNavigate: (section: NavSection) => void;
  onOpenNewAnalysis: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewAnalysis,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-2 text-[#52635C]">
          <div className="w-8 h-8 border-3 border-[#2D8C83] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium">Loading research analytics...</span>
        </div>
      </div>
    );
  }

  const summary = stats?.summary || {
    total_foods: 0,
    user_calculations: 0,
    user_recipes: 0,
    active_projects: 0,
    dietary_assessments: 0,
    anthropometric_records: 0,
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#174C3A] via-[#1E5C47] to-[#2D8C83] text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 bg-white/15 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#84CC16]" />
            <span>NutriNexa Scientific Research Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Connecting Food Science with Better Insights.
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mt-2 leading-relaxed">
            Standardized nutrient calculation engine, food composition repository, recipe batch modeling, dietary recall assessments, and longitudinal research project management.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate("calculator")}
              className="bg-white text-[#174C3A] hover:bg-[#F7F9F7] font-semibold text-xs px-4 py-2 rounded-lg shadow-xs transition active:scale-95"
            >
              Open Nutrient Calculator
            </button>
            <button
              onClick={() => onNavigate("foods")}
              className="bg-white/20 hover:bg-white/30 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
            >
              Explore Food Database
            </button>
            <button
              onClick={() => onNavigate("projects")}
              className="bg-white/20 hover:bg-white/30 text-white font-medium text-xs px-4 py-2 rounded-lg transition"
            >
              Research Projects
            </button>
          </div>
        </div>
        {/* Subtle background graphic */}
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 pointer-events-none">
          <svg className="w-80 h-80" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          </svg>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div
          onClick={() => onNavigate("foods")}
          className="bg-white p-4 rounded-xl border border-[#E2E8E2] hover:border-[#2D8C83] shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#52635C] uppercase">Foods DB</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-[#174C3A]">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#192520] mt-2">{summary.total_foods}</div>
          <div className="text-[10px] text-[#7D9087] mt-0.5">USDA & FCT Verified</div>
        </div>

        <div
          onClick={() => onNavigate("calculator")}
          className="bg-white p-4 rounded-xl border border-[#E2E8E2] hover:border-[#2D8C83] shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#52635C] uppercase">Calculations</span>
            <div className="p-1.5 rounded-lg bg-teal-50 text-[#2D8C83]">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#192520] mt-2">{summary.user_calculations}</div>
          <div className="text-[10px] text-[#7D9087] mt-0.5">Saved Composites</div>
        </div>

        <div
          onClick={() => onNavigate("recipes")}
          className="bg-white p-4 rounded-xl border border-[#E2E8E2] hover:border-[#2D8C83] shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#52635C] uppercase">Recipes</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#192520] mt-2">{summary.user_recipes}</div>
          <div className="text-[10px] text-[#7D9087] mt-0.5">Cooked Yield Models</div>
        </div>

        <div
          onClick={() => onNavigate("dietary")}
          className="bg-white p-4 rounded-xl border border-[#E2E8E2] hover:border-[#2D8C83] shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#52635C] uppercase">Food Recalls</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#192520] mt-2">{summary.dietary_assessments}</div>
          <div className="text-[10px] text-[#7D9087] mt-0.5">DRI Benchmark Recalls</div>
        </div>

        <div
          onClick={() => onNavigate("anthropometrics")}
          className="bg-white p-4 rounded-xl border border-[#E2E8E2] hover:border-[#2D8C83] shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#52635C] uppercase">Physical Data</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#192520] mt-2">{summary.anthropometric_records}</div>
          <div className="text-[10px] text-[#7D9087] mt-0.5">BMI / WHtR Subjects</div>
        </div>

        <div
          onClick={() => onNavigate("projects")}
          className="bg-white p-4 rounded-xl border border-[#E2E8E2] hover:border-[#2D8C83] shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#52635C] uppercase">Projects</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-[#192520] mt-2">{summary.active_projects}</div>
          <div className="text-[10px] text-[#7D9087] mt-0.5">Active Academic Studies</div>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Calculations */}
          <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#192520]">Recent Nutrient Calculations</h2>
                <p className="text-xs text-[#52635C]">Formulated food composites and scaled dietary items.</p>
              </div>
              <button
                onClick={() => onNavigate("calculator")}
                className="text-xs font-semibold text-[#2D8C83] hover:text-[#174C3A] flex items-center space-x-1"
              >
                <span>View Calculator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats?.recent_calculations?.length > 0 ? (
              <div className="divide-y divide-[#E2E8E2]">
                {stats.recent_calculations.map((calc: any) => (
                  <div
                    key={calc.id}
                    onClick={() => onNavigate("calculator")}
                    className="py-3 flex items-center justify-between hover:bg-[#F7F9F7] px-2 rounded-lg cursor-pointer transition"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[#192520]">{calc.name}</div>
                      <div className="text-[11px] text-[#52635C] mt-0.5 line-clamp-1">{calc.description || "No description"}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#7D9087]">
                        {new Date(calc.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#7D9087] text-xs">
                No calculations recorded yet. Start with "+ New Analysis".
              </div>
            )}
          </div>

          {/* Active Research Projects */}
          <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#192520]">Active Research Projects</h2>
                <p className="text-xs text-[#52635C]">University and clinical dietary assessment cohorts.</p>
              </div>
              <button
                onClick={() => onNavigate("projects")}
                className="text-xs font-semibold text-[#2D8C83] hover:text-[#174C3A] flex items-center space-x-1"
              >
                <span>View All Projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats?.active_projects?.length > 0 ? (
              <div className="space-y-3">
                {stats.active_projects.map((proj: any) => (
                  <div
                    key={proj.id}
                    onClick={() => onNavigate("projects")}
                    className="p-3.5 border border-[#E2E8E2] hover:border-[#2D8C83] rounded-xl hover:bg-[#F7F9F7] cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#174C3A]">{proj.code}</span>
                      <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        {proj.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#192520] mt-1">{proj.title}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#7D9087] text-xs">
                No research projects created.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Quick Actions & Audit Trail */}
        <div className="space-y-6">
          {/* Quick Launch Panel */}
          <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs">
            <h2 className="text-sm font-bold text-[#192520] mb-3">Quick Scientific Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate("calculator")}
                className="w-full py-2.5 px-3 bg-[#174C3A] hover:bg-[#123C2E] text-white rounded-lg text-xs font-medium flex items-center justify-between transition"
              >
                <div className="flex items-center space-x-2">
                  <Calculator className="w-4 h-4 text-[#84CC16]" />
                  <span>New Nutrient Calculation</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate("recipes")}
                className="w-full py-2.5 px-3 bg-[#2D8C83] hover:bg-[#237069] text-white rounded-lg text-xs font-medium flex items-center justify-between transition"
              >
                <div className="flex items-center space-x-2">
                  <UtensilsCrossed className="w-4 h-4 text-emerald-200" />
                  <span>Analyze Recipe / Batch</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate("dietary")}
                className="w-full py-2.5 px-3 bg-[#F1F5F2] hover:bg-[#E2E8E2] text-[#192520] rounded-lg text-xs font-medium flex items-center justify-between transition border border-[#E2E8E2]"
              >
                <div className="flex items-center space-x-2">
                  <CalendarCheck className="w-4 h-4 text-[#174C3A]" />
                  <span>Log 24-Hour Food Recall</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#52635C]" />
              </button>

              <button
                onClick={() => onNavigate("anthropometrics")}
                className="w-full py-2.5 px-3 bg-[#F1F5F2] hover:bg-[#E2E8E2] text-[#192520] rounded-lg text-xs font-medium flex items-center justify-between transition border border-[#E2E8E2]"
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-[#2D8C83]" />
                  <span>Record BMI & Waist Ratio</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#52635C]" />
              </button>
            </div>
          </div>

          {/* Audit Trail & Reproducibility */}
          <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#192520]">Research Audit Trail</h2>
              <span className="text-[10px] text-[#7D9087]">Provenance Log</span>
            </div>
            {stats?.recent_activity?.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recent_activity.map((act: any, idx: number) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2D8C83] mt-1.5 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-[#192520] text-[11px]">{act.details}</div>
                      <div className="text-[10px] text-[#7D9087]">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-[#7D9087] text-xs">No recent actions logged.</div>
            )}
          </div>

          {/* Scientific Disclaimer Card */}
          <div className="p-4 bg-[#F1F5F2] rounded-xl border border-[#E2E8E2] text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-[#174C3A]">
              <Info className="w-4 h-4 text-[#2D8C83]" />
              <span>Scientific & Academic Standard</span>
            </div>
            <p className="text-[#52635C] text-[11px] leading-relaxed">
              All nutrient calculations execute the exact standard proportion: <code>(Value / 100g) × Quantity (g)</code>. Food entries derive from validated reference data sources (USDA SR Legacy / FoodData Central).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
