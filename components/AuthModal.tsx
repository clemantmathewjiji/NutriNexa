"use client";
import React, { useState } from "react";
import { authApi } from "@/lib/api";
import { User } from "@/lib/types";
import { X, Lock, Mail, User as UserIcon, Building2, KeyRound, AlertCircle } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Researcher");
  const [institution, setInstitution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isRegister) {
        const res = await authApi.register(name, email, password, role, institution);
        onAuthSuccess(res.user);
      } else {
        const res = await authApi.login(email, password);
        onAuthSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login("demo@nutrinexa.org", "NutriNexa2026!");
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log in as demo researcher.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2E8E2] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F7F9F7]">
          <div>
            <h3 className="text-base font-bold text-[#174C3A]">
              {isRegister ? t("authRegisterTitle") : t("authSignInTitle")}
            </h3>
            <p className="text-xs text-[#52635C]">
              {isRegister
                ? "Academic & laboratory user registration"
                : "Enter credentials to access private research workspaces"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7D9087] hover:text-[#192520] hover:bg-[#E2E8E2] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-[#192520] mb-1">{t("name")}</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087] rtl:right-3 rtl:left-auto" />
                <input
                  type="text"
                  required
                  placeholder="Dr. Clemant Mathew Jiji"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 focus:border-[#2D8C83] rtl:pr-9 rtl:pl-3"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#192520] mb-1">{t("academicEmail")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087] rtl:right-3 rtl:left-auto" />
              <input
                type="email"
                required
                placeholder="researcher@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 focus:border-[#2D8C83] rtl:pr-9 rtl:pl-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#192520] mb-1">{t("password")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087] rtl:right-3 rtl:left-auto" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 focus:border-[#2D8C83] rtl:pr-9 rtl:pl-3"
              />
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#192520] mb-1">{t("academicRole")}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E2E8E2] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                >
                  <option value="Researcher">Researcher / Scientist</option>
                  <option value="Principal Investigator">Principal Investigator</option>
                  <option value="Clinical Dietitian">Clinical Dietitian</option>
                  <option value="Dietetics Student">Dietetics Student</option>
                  <option value="Lecturer / Faculty">Lecturer / Faculty</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#192520] mb-1">{t("institution")}</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087] rtl:right-3 rtl:left-auto" />
                  <input
                    type="text"
                    placeholder="SJCET Palai / Food Science Department"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 focus:border-[#2D8C83] rtl:pr-9 rtl:pl-3"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? t("loading") : isRegister ? t("authRegisterTitle") : t("authSignInTitle")}
          </button>

          {!isRegister && (
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              disabled={loading}
              className="w-full py-2 bg-[#2D8C83]/10 hover:bg-[#2D8C83]/20 text-[#174C3A] text-xs font-semibold rounded-lg border border-[#2D8C83]/30 flex items-center justify-center gap-1.5 transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{t("quickDemoLogin")}</span>
            </button>
          )}

          <div className="text-center pt-2 text-xs text-[#52635C]">
            {isRegister ? (
              <span>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="font-semibold text-[#2D8C83] hover:underline"
                >
                  {t("signIn")}
                </button>
              </span>
            ) : (
              <span>
                Don't have an account yet?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="font-semibold text-[#2D8C83] hover:underline"
                >
                  Register here
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
