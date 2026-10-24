"use client";

import React, { useEffect, useState } from "react";
import { authApi, systemApi } from "@/lib/api";
import { User } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { Sidebar, NavSection } from "@/components/Sidebar";
import { NewAnalysisModal } from "@/components/NewAnalysisModal";
import { AuthModal } from "@/components/AuthModal";
import { useTranslation } from "@/i18n/LanguageContext";
import { Database, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

// Views
import { DashboardView } from "@/components/views/DashboardView";
import { FoodsDatabaseView } from "@/components/views/FoodsDatabaseView";
import { CalculatorView } from "@/components/views/CalculatorView";
import { RecipeAnalysisView } from "@/components/views/RecipeAnalysisView";
import { DietaryAssessmentView } from "@/components/views/DietaryAssessmentView";
import { MealPlannerView } from "@/components/views/MealPlannerView";
import { AnthropometricsView } from "@/components/views/AnthropometricsView";
import { ResearchProjectsView } from "@/components/views/ResearchProjectsView";
import { ReportsView } from "@/components/views/ReportsView";
import { MyFoodsView } from "@/components/views/MyFoodsView";
import { SettingsView } from "@/components/views/SettingsView";
import { HelpDocsView } from "@/components/views/HelpDocsView";

export default function NutriNexaApp() {
  const { dir } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [currentSection, setCurrentSection] = useState<NavSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewAnalysisModal, setShowNewAnalysisModal] = useState(false);

  // Global search
  const [searchTerm, setSearchTerm] = useState("");

  // Database status banner
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    source: string;
    message: string;
  } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentUser();
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const res = await systemApi.getHealth();
      setDbStatus(res.database);
    } catch {
      setDbStatus({
        connected: false,
        source: "memory-mock",
        message: "Supabase DATABASE_URL not yet configured in .env.local",
      });
    }
  };

  const checkCurrentUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
    } catch {
      // Default to demo researcher user for immediate exploratory access
      try {
        const loginRes = await authApi.login("demo@nutrinexa.org", "NutriNexa2026!");
        setUser(loginRes.user);
      } catch {
        setUser(null);
      }
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const handleGlobalSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim().length > 0 && currentSection !== "foods") {
      setCurrentSection("foods");
    }
  };

  const handleTriggerSeed = async () => {
    setIsSeeding(true);
    setSeedNotice(null);
    try {
      const res = await systemApi.seedDatabase();
      setSeedNotice(res.message);
      await checkHealth();
    } catch (err: any) {
      setSeedNotice(`Seed error: ${err.message || String(err)}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const renderActiveView = () => {
    switch (currentSection) {
      case "dashboard":
        return (
          <DashboardView
            onNavigate={(sec) => setCurrentSection(sec)}
            onOpenNewAnalysis={() => setShowNewAnalysisModal(true)}
          />
        );
      case "foods":
        return <FoodsDatabaseView initialSearch={searchTerm} />;
      case "calculator":
        return <CalculatorView />;
      case "recipes":
        return <RecipeAnalysisView />;
      case "dietary":
        return <DietaryAssessmentView />;
      case "meal-planner":
        return <MealPlannerView />;
      case "anthropometrics":
        return <AnthropometricsView />;
      case "projects":
        return <ResearchProjectsView />;
      case "reports":
        return <ReportsView />;
      case "my-foods":
        return <MyFoodsView onNavigate={(sec) => setCurrentSection(sec)} />;
      case "settings":
        return <SettingsView user={user} />;
      case "help":
        return <HelpDocsView />;
      default:
        return (
          <DashboardView
            onNavigate={(sec) => setCurrentSection(sec)}
            onOpenNewAnalysis={() => setShowNewAnalysisModal(true)}
          />
        );
    }
  };

  return (
    <div dir={dir} className="min-h-screen flex flex-col bg-[#F7F9F7] text-[#192520]">
      {/* Top Database Sync Banner */}
      <div className="bg-white border-b border-[#E2E8E2] px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2 text-[#52635C]">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#174C3A]" />
          <span className="font-semibold text-[#174C3A]">NutriNexa Engine:</span>
          <span>Next.js 15 Full-Stack • Drizzle ORM</span>
          <span className="text-[#C3D2CA]">|</span>
          {dbStatus?.connected ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Supabase PostgreSQL Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              Active Local Fallback Store (Ready for Supabase credentials in .env.local)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {seedNotice && <span className="text-emerald-700 font-medium">{seedNotice}</span>}
          <button
            onClick={handleTriggerSeed}
            disabled={isSeeding}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F1F5F2] hover:bg-[#E2E8E2] text-[#174C3A] transition-colors disabled:opacity-50"
            title="Seed/Sync database with USDA reference foods and DRV standards"
          >
            <RefreshCw className={`w-3 h-3 ${isSeeding ? "animate-spin" : ""}`} />
            {isSeeding ? "Migrating DB..." : "Seed Supabase DB"}
          </button>
        </div>
      </div>

      {/* Top Navigation */}
      <Navbar
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenNewAnalysis={() => setShowNewAnalysisModal(true)}
        onSearch={handleGlobalSearch}
        searchTerm={searchTerm}
      />

      {/* Main Body with Sidebar and Content View */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentSection={currentSection}
          onSelectSection={(sec) => {
            setCurrentSection(sec);
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* Modals */}
      <NewAnalysisModal
        isOpen={showNewAnalysisModal}
        onClose={() => setShowNewAnalysisModal(false)}
        onNavigate={(sec) => {
          setCurrentSection(sec);
          setShowNewAnalysisModal(false);
        }}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(loggedUser) => {
          setUser(loggedUser);
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}
