"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import {
  Lock, Mail, User as UserIcon, Building2, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const passwordScore = calculatePasswordStrength(password);

  const getStrengthLabel = (score: number) => {
    if (password.length === 0) return { label: "Required", color: "bg-gray-200 text-gray-500" };
    if (score <= 1) return { label: "Weak (Need 8+ chars & Uppercase)", color: "bg-rose-100 text-rose-700" };
    if (score === 2) return { label: "Fair (Add numbers/symbols)", color: "bg-amber-100 text-amber-700" };
    if (score === 3) return { label: "Good", color: "bg-teal-100 text-teal-800" };
    return { label: "Strong Academic Grade", color: "bg-emerald-100 text-emerald-800" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter confirm password.");
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError("Please acknowledge the research integrity and privacy terms.");
      setLoading(false);
      return;
    }

    try {
      await authApi.register(fullName, email, password, designation || "Researcher", institution);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please verify submitted details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9F7] flex flex-col justify-center items-center p-4 text-[#192520]">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8E2] shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#174C3A] to-[#2D8C83] flex items-center justify-center text-white mx-auto shadow-sm">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#174C3A]">NutriNexa</h1>
          <p className="text-xs text-[#52635C]">
            Academic Researcher & Investigator Registration
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-[#192520]">Full Legal / Academic Name *</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087]" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Full Name"
                className="w-full pl-9 pr-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#192520]">Designation (Optional)</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Clinical Dietitian / Faculty"
                className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#192520]">Institution (Optional)</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="University / Research Lab"
                className="w-full px-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#192520]">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@institution.edu"
                className="w-full pl-9 pr-3 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#192520]">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D9087] hover:text-[#192520]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#7D9087]">Password Strength:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getStrengthLabel(passwordScore).color}`}>
                    {getStrengthLabel(passwordScore).label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1">
                  <div className={`rounded-full h-full ${passwordScore >= 1 ? "bg-amber-500" : "bg-gray-200"}`} />
                  <div className={`rounded-full h-full ${passwordScore >= 2 ? "bg-amber-500" : "bg-gray-200"}`} />
                  <div className={`rounded-full h-full ${passwordScore >= 3 ? "bg-teal-500" : "bg-gray-200"}`} />
                  <div className={`rounded-full h-full ${passwordScore >= 4 ? "bg-emerald-600" : "bg-gray-200"}`} />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#192520]">Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087]" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D9087] hover:text-[#192520]"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-1 text-xs text-[#52635C] leading-tight">
            <input
              type="checkbox"
              id="terms"
              required
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-3.5 h-3.5 mt-0.5 text-[#174C3A] rounded border-gray-300 focus:ring-[#2D8C83]"
            />
            <label htmlFor="terms" className="cursor-pointer">
              I acknowledge research data integrity protocols, ISO/IEC standards, and institutional privacy safeguards.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#174C3A] hover:bg-[#123C2E] text-white font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating Account..." : "Create Academic Account"}
          </button>
        </form>

        <div className="text-center text-xs text-[#52635C] pt-2 border-t border-[#E2E8E2] space-y-2">
          <div>
            Already have an academic account?{" "}
            <Link href="/login" className="font-semibold text-[#2D8C83] hover:underline">
              Sign In here
            </Link>
          </div>
          <div>
            <Link href="/" className="inline-flex items-center gap-1.5 text-[#7D9087] hover:text-[#192520] hover:underline font-medium">
              <span>&larr; Continue Exploring as Guest</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
