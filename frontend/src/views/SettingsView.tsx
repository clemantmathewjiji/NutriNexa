import React, { useEffect, useState } from "react";
import { dietaryApi } from "../api";
import { User } from "../types";
import { Sliders, User as UserIcon, Globe, Languages, Scale } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { LanguageSelector } from "../components/LanguageSelector";

interface SettingsViewProps {
  user: User | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
  const { t, language, unitSystem, setUnitSystem } = useTranslation();
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const res = await dietaryApi.listProfiles();
      setProfiles(res.profiles);
    } catch (err) {
      console.error(err);
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

      {/* Language & Localization Settings (Section 19 Requirement) */}
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
            12 Supported Languages &bull; RTL Ready
          </div>
        </div>

        <LanguageSelector variant="settings" />

        {/* Independent Unit Selection (Section E Requirement) */}
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
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
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Workspace Profile */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#192520] flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-[#2D8C83]" />
            <span>{t("userProfile")}</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-[#7D9087] mb-0.5">{t("name")}</label>
              <div className="p-2.5 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2] text-[#192520] font-medium">
                {user?.name || "Dr. Clemant Mathew Jiji"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#7D9087] mb-0.5">{t("academicEmail")}</label>
              <div className="p-2.5 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2] text-[#192520] font-mono">
                {user?.email || "demo@nutrinexa.org"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#7D9087] mb-0.5">{t("academicRole")}</label>
              <div className="p-2.5 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2] text-[#192520]">
                {user?.role || "Principal Investigator"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#7D9087] mb-0.5">{t("institution")}</label>
              <div className="p-2.5 bg-[#F7F9F7] rounded-lg border border-[#E2E8E2] text-[#192520]">
                {user?.institution || "SJCET Palai / Food Science & Cybernetics Lab"}
              </div>
            </div>
          </div>
        </div>

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
    </div>
  );
};
