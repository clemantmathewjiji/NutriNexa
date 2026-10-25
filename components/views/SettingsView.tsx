"use client";
import React, { useEffect, useState } from "react";
import { dietaryApi, authApi } from "@/lib/api";
import { User } from "@/lib/types";
import { Sliders, User as UserIcon, Globe, Languages, Scale, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";

interface SettingsViewProps {
  user: User | null;
  onProfileUpdated?: (updatedUser: User) => void;
  onOpenAuth?: (mode?: "login" | "register") => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onProfileUpdated, onOpenAuth }) => {
  const { t, unitSystem, setUnitSystem } = useTranslation();
  const [profiles, setProfiles] = useState<any[]>([]);

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || user?.name || "");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [designation, setDesignation] = useState(user?.designation || user?.role || "");
  const [institution, setInstitution] = useState(user?.institution || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [email] = useState(user?.email || "");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || "");
      setDisplayName(user.displayName || "");
      setDesignation(user.designation || user.role || "");
      setInstitution(user.institution || "");
      setDepartment(user.department || "");
    }
  }, [user]);

  const loadProfiles = async () => {
    try {
      const res = await dietaryApi.listProfiles();
      setProfiles(res.profiles);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Create updated user object
      const updatedUser: User = {
        ...(user || { id: 1, email: "user@institution.edu", role: "Researcher", name: fullName }),
        name: displayName || fullName,
        fullName,
        displayName,
        designation,
        institution,
        department,
      };

      // Call profile update API endpoint
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          display_name: displayName,
          designation,
          institution,
          department,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to update profile on server.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);

      if (onProfileUpdated) {
        onProfileUpdated(updatedUser);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#2D8C83]" />
          <span>{t("settingsTitle")}</span>
        </h1>
        <p className="text-xs text-[#52635C] mt-1">
          {t("settingsSubtitle")}
        </p>
      </div>

      {/* Language & Localization Settings */}
      <div className="bg-white rounded-xl border border-emerald-900/15 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E2E8E2] gap-2">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-[#174C3A]" />
            <div>
              <h2 className="text-sm font-bold text-[#192520]">{t("languageSelection")}</h2>
              <p className="text-xs text-[#52635C]">{t("selectLanguagePrompt")}</p>
            </div>
          </div>
          <div className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 self-start sm:self-auto">
            12 Supported Languages &bull; RTL Arabic Ready
          </div>
        </div>

        <LanguageSelector variant="settings" />

        {/* Independent Unit Selection */}
        <div className="pt-4 border-t border-[#E2E8E2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-[#2D8C83]" />
            <div>
              <div className="text-xs font-bold text-[#192520]">Measurement Unit System</div>
              <div className="text-[11px] text-[#52635C]">
                Calculations retain full precision. Changes display formatting only.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F7F9F7] p-1 rounded-lg border border-[#E2E8E2]">
            <button
              type="button"
              onClick={() => setUnitSystem("metric")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                unitSystem === "metric"
                  ? "bg-[#174C3A] text-white shadow-xs"
                  : "text-[#52635C] hover:text-[#192520]"
              }`}
            >
              Metric (g, kg, cm, kcal)
            </button>
            <button
              type="button"
              onClick={() => setUnitSystem("imperial")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                unitSystem === "imperial"
                  ? "bg-[#174C3A] text-white shadow-xs"
                  : "text-[#52635C] hover:text-[#192520]"
              }`}
            >
              Imperial (oz, lb, in, kcal)
            </button>
          </div>
        </div>
      </div>

        {/* User Workspace Profile Form or Guest Mode Card */}
        {!user ? (
          <div className="bg-white rounded-xl border border-[#E2E8E2] p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-3.5">
            <div className="w-12 h-12 rounded-full bg-[#174C3A]/10 text-[#174C3A] flex items-center justify-center">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#192520]">Guest Mode Active</h3>
              <p className="text-xs text-[#52635C] mt-1 max-w-sm leading-relaxed">
                You are currently exploring NutriNexa as a Guest. Sign in or register an academic profile to customize your investigator credentials, institution, and department.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => onOpenAuth?.("login")}
                className="py-2 px-4 bg-[#174C3A] hover:bg-[#123C2E] text-white font-semibold text-xs rounded-lg transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth?.("register")}
                className="py-2 px-4 bg-white border border-[#2D8C83] text-[#174C3A] hover:bg-[#F1F5F2] font-semibold text-xs rounded-lg transition cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E2]">
              <h2 className="text-sm font-bold text-[#192520] flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#2D8C83]" />
                <span>{t("userProfile")}</span>
              </h2>
              {saveSuccess && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-[#192520] mb-1">Full Legal / Academic Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Full Name"
                  className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#192520] mb-1">Display Name (Header & Short Citations)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Dr. Amal K."
                  className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#7D9087] mb-1">{t("academicEmail")}</label>
                <input
                  type="email"
                  disabled
                  value={email || "investigator@institution.edu"}
                  className="w-full px-3 py-2 border border-[#E2E8E2] bg-[#F7F9F7] text-[#52635C] rounded-lg font-mono cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#192520] mb-1">Designation / Role</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="Principal Investigator / Clinical Dietitian"
                    className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#192520] mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Food Science & Clinical Nutrition"
                    className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#192520] mb-1">{t("institution")}</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="University / Medical Center / Research Lab"
                  className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2.5 bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "Saving Changes..." : "Save Profile Details"}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* DRV Profiles Matrix */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#192520] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#2D8C83]" />
            <span>{t("configuredDrvStandards")}</span>
          </h2>

          <div className="space-y-3">
            {profiles.map((p) => (
              <div key={p.id} className="p-3 rounded-lg border border-[#E2E8E2] bg-[#F7F9F7] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#174C3A]">{p.profile_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                    {p.authority}
                  </span>
                </div>
                <div className="text-[11px] text-[#52635C]">{p.target_group}</div>
                <div className="text-[10px] text-[#7D9087]">Energy Reference: {p.energy_kcal_target} kcal/day</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
