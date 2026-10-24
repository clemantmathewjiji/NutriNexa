import React, { useEffect, useState } from "react";
import { authApi } from "./api";
import { User } from "./types";
import { Navbar } from "./components/Navbar";
import { Sidebar, NavSection } from "./components/Sidebar";
import { NewAnalysisModal } from "./components/NewAnalysisModal";
import { AuthModal } from "./components/AuthModal";

// Views
import { DashboardView } from "./views/DashboardView";
import { FoodsDatabaseView } from "./views/FoodsDatabaseView";
import { CalculatorView } from "./views/CalculatorView";
import { RecipeAnalysisView } from "./views/RecipeAnalysisView";
import { DietaryAssessmentView } from "./views/DietaryAssessmentView";
import { MealPlannerView } from "./views/MealPlannerView";
import { AnthropometricsView } from "./views/AnthropometricsView";
import { ResearchProjectsView } from "./views/ResearchProjectsView";
import { ReportsView } from "./views/ReportsView";
import { MyFoodsView } from "./views/MyFoodsView";
import { SettingsView } from "./views/SettingsView";
import { HelpDocsView } from "./views/HelpDocsView";

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentSection, setCurrentSection] = useState<NavSection>("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNewAnalysisModal, setShowNewAnalysisModal] = useState(false);

  // Global search
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res.user);
    } catch {
      // Default to demo user if not logged in yet for immediate interactive experience
      try {
        const loginRes = await authApi.login("demo@nutrinexa.org", "NutriNexa2026!");
        setUser(loginRes.user);
      } catch (e) {
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
    <div className="min-h-screen flex flex-col bg-[#F7F9F7] text-[#192520]">
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
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Modals */}
      <NewAnalysisModal
        isOpen={showNewAnalysisModal}
        onClose={() => setShowNewAnalysisModal(false)}
        onNavigate={(sec) => setCurrentSection(sec)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={(u) => setUser(u)}
      />
    </div>
  );
};

export default App;
