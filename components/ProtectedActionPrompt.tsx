"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, LogIn, UserPlus, Compass, X } from "lucide-react";

export const ProtectedActionPrompt: React.FC = () => {
  const {
    authPromptOpen,
    authPromptReason,
    openAuthModal,
    continueAsGuest,
  } = useAuth();

  if (!authPromptOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8E2] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-prompt-title"
      >
        {/* Top Accent Header */}
        <div className="bg-gradient-to-r from-[#174C3A] via-[#1E5C47] to-[#2D8C83] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-[#84CC16] border border-white/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="auth-prompt-title" className="text-base font-bold tracking-tight">
                Authentication Required
              </h3>
              <p className="text-xs text-white/80">
                NutriNexa Research Workspace
              </p>
            </div>
          </div>
          <button
            onClick={continueAsGuest}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Close dialog and continue as guest"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#192520] leading-relaxed">
            {authPromptReason ||
              "Create an account or sign in to save your calculations, manage personal nutrition records, and access research tools."}
          </p>

          <div className="p-3.5 bg-[#F7F9F7] rounded-xl border border-[#E2E8E2] text-xs text-[#52635C] space-y-1.5">
            <div className="font-semibold text-[#174C3A] flex items-center gap-1.5">
              <span>Why an account is needed:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1">
              <li>Isolate and encrypt participant and dietary datasets</li>
              <li>Maintain timestamped historical calculation records</li>
              <li>Generate verified scientific reports with investigator credentials</li>
            </ul>
          </div>

          {/* Three Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => openAuthModal("login")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-[#174C3A] hover:bg-[#123C2E] text-white font-semibold text-xs rounded-xl shadow-xs transition active:scale-98 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>

            <button
              onClick={() => openAuthModal("register")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-[#2D8C83] text-[#174C3A] hover:bg-[#F1F5F2] font-semibold text-xs rounded-xl transition active:scale-98 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-[#2D8C83]" />
              <span>Create Account</span>
            </button>
          </div>

          <div className="pt-1 text-center">
            <button
              onClick={continueAsGuest}
              className="inline-flex items-center gap-1.5 text-xs text-[#7D9087] hover:text-[#192520] font-medium py-1.5 px-3 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Continue Exploring as Guest</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
