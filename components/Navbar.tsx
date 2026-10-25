"use client";
import React from "react";
import { User } from "@/lib/types";
import {
  Search, Plus, LogOut, LogIn, UserPlus, UserCircle
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";

interface NavbarProps {
  user: User | null;
  isLoading?: boolean;
  onOpenAuth: (mode?: "login" | "register") => void;
  onLogout: () => void;
  onOpenNewAnalysis: () => void;
  onSearch: (term: string) => void;
  searchTerm: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isLoading = false,
  onOpenAuth,
  onLogout,
  onOpenNewAnalysis,
  onSearch,
  searchTerm,
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e2e8e2] px-4 lg:px-8 py-3 flex items-center justify-between shadow-xs">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#174C3A] to-[#2D8C83] flex items-center justify-center text-white shadow-sm ring-1 ring-[#174C3A]/20 shrink-0">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {/* Minimalist scientific leaf + molecular node */}
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <circle cx="16" cy="11" r="2" fill="#84CC16" stroke="none" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#174C3A]">NutriNexa</span>
            <span className="text-[10px] tracking-wider uppercase font-semibold bg-[#174C3A]/10 text-[#174C3A] px-2 py-0.5 rounded-full">
              {t("researchAndAnalytics")}
            </span>
          </div>
          <p className="text-xs text-[#52635C] hidden sm:block">{t("brandTagline")}</p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-3 lg:mx-6 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087]" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#F7F9F7] border border-[#E2E8E2] rounded-lg text-sm text-[#192520] placeholder-[#7D9087] focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 focus:border-[#2D8C83] transition"
          />
        </div>
      </div>

      {/* Action Area & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Selector Dropdown */}
        <LanguageSelector variant="header" />

        {/* New Analysis Button */}
        <button
          onClick={onOpenNewAnalysis}
          className="flex items-center gap-1.5 bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs sm:text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="font-semibold hidden sm:inline">{t("newAnalysis")}</span>
        </button>

        {/* Access State Area */}
        {isLoading ? (
          /* Loading State: Subtle Skeleton */
          <div className="flex items-center gap-2 border-l border-[#E2E8E2] pl-2.5 rtl:border-l-0 rtl:border-r rtl:pr-2.5 rtl:pl-0">
            <div className="w-24 h-4 bg-gray-200 animate-pulse rounded hidden lg:block"></div>
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
          </div>
        ) : user ? (
          /* Authenticated State: Displays actual logged-in user profile */
          <div className="flex items-center gap-2 border-l border-[#E2E8E2] pl-2.5 rtl:border-l-0 rtl:border-r rtl:pr-2.5 rtl:pl-0">
            <div className="text-right rtl:text-left hidden lg:block">
              <div className="text-xs font-semibold text-[#192520]">{user.displayName || user.name}</div>
              <div className="text-[11px] text-[#52635C]">
                {user.designation || user.role || "Investigator"} &bull; {user.institution || "Research Institution"}
              </div>
            </div>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#2D8C83]/15 text-[#174C3A] font-bold flex items-center justify-center text-sm border border-[#2D8C83]/30"
              title={`${user.displayName || user.name} (${user.designation || user.role || "Investigator"})`}
            >
              {(user.displayName || user.name || "U").charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              title={t("signOut")}
              className="p-1.5 sm:p-2 text-[#7D9087] hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Guest State: Neutral indicator with Login & Sign Up */
          <div className="flex items-center gap-2 border-l border-[#E2E8E2] pl-2.5 rtl:border-l-0 rtl:border-r rtl:pr-2.5 rtl:pl-0">
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#174C3A]/10 text-[#174C3A] text-xs font-medium">
              <UserCircle className="w-3.5 h-3.5 text-[#2D8C83]" />
              <span>Guest User</span>
            </div>
            <button
              onClick={() => onOpenAuth("login")}
              className="flex items-center gap-1 text-xs font-semibold text-[#174C3A] hover:bg-[#174C3A]/10 px-3 py-2 rounded-lg transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{t("signIn") || "Log In"}</span>
            </button>
            <button
              onClick={() => onOpenAuth("register")}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-[#2D8C83] hover:bg-[#236F68] text-white px-3 py-2 rounded-lg shadow-2xs transition active:scale-98 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
