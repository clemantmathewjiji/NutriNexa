import React, { useEffect, useState } from "react";
import { dietaryApi } from "../api";
import { User } from "../types";
import { Sliders, ShieldCheck, User as UserIcon, Building2, CheckCircle2, Globe } from "lucide-react";

interface SettingsViewProps {
  user: User | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user }) => {
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
        <h1 className="text-xl font-bold text-[#174C3A] flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-[#2D8C83]" />
          <span>Settings & Dietary Reference Standards (DRV)</span>
        </h1>
        <p className="text-xs text-[#52635C] mt-1">
          Configure academic authority profiles, measurement units, and user account metadata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Workspace Profile */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#192520] flex items-center space-x-2">
            <UserIcon className="w-4 h-4 text-[#2D8C83]" />
            <span>Academic User Profile</span>
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-[#7D9087] mb-0.5">Full Name</label>
              <div className="p-2.5 bg-[#F7F9F7] rounded-lg border text-[#192520] font-medium">
                {user?.name || "Dr. Clemant Mathew Jiji"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#7D9087] mb-0.5">Email Address</label>
              <div className="p-2.5 bg-[#F7F9F7] rounded-lg border text-[#192520] font-mono">
                {user?.email || "demo@nutrinexa.org"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#7D9087] mb-0.5">Academic Role</label>
              <div className="p-2.5 bg-[#F7F9F7] rounded-lg border text-[#192520]">
                {user?.role || "Principal Investigator"}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#7D9087] mb-0.5">Institution / Department</label>
              <div className="p-2.5 bg-[#F7F9F7] rounded-lg border text-[#192520]">
                {user?.institution || "SJCET Palai / Food Science & Cybernetics Lab"}
              </div>
            </div>
          </div>
        </div>

        {/* DRV Profiles Matrix */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-[#192520] flex items-center space-x-2">
            <Globe className="w-4 h-4 text-[#2D8C83]" />
            <span>Configured Reference Standards (DRV / RDA / EAR)</span>
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
