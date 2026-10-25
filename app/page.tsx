"use client";

import React, { useEffect, useState } from "react";
import { authApi } from "@/lib/api";
import { User } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { Sidebar, NavSection } from "@/components/Sidebar";
import { NewAnalysisModal } from "@/components/NewAnalysisModal";
import { AuthModal } from "@/components/AuthModal";
import { useTranslation } from "@/i18n/LanguageContext";

// Academic Domain Views
import { DashboardView } from "@/components/views/DashboardView";
import { FoodsDatabaseView } from "@/components/views/FoodsDatabaseView";
import { VisualPortionView } from "@/components/views/VisualPortionView";
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

  // Global search query
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
    } catch {
      // Default to demo researcher profile for immediate exploratory access
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
      case "portions":
        return (
          <VisualPortionView
            onSendToCalculator={(foodName, edibleGrams) => {
              setCurrentSection("calculator");
            }}
            onSendToRecall={(foodName, edibleGrams, portionDesc) => {
              setCurrentSection("dietary");
            }}
          />
        );
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
        return <ReportsView user={user} />;
      case "my-foods":
        return <MyFoodsView onNavigate={(sec) => setCurrentSection(sec)} />;
      case "settings":
        return (
          <SettingsView
            user={user}
            onProfileUpdated={(updatedUser) => {
              setUser(updatedUser);
            }}
          />
        );
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
      {/* Top Navigation */}
      <Navbar
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onOpenNewAnalysis={() => setShowNewAnalysisModal(true)}
        onSearch={handleGlobalSearch}
        searchTerm={searchTerm}
      />

      {/* Main Body with Sidebar and Active Module */}
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
