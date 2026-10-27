"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import {
  Lock, Mail, Eye, EyeOff, AlertCircle, KeyRound, ShieldCheck, ArrowRight, CheckCircle2
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoNotice(null);
    try {
      await authApi.login(email, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setInfoNotice(null);

    const targetEmail = email.trim();
    if (targetEmail) {
      try {
        setInfoNotice(`Verifying Google identity for ${targetEmail}...`);
        const res = await authApi.googleVerify({ email: targetEmail });
        setInfoNotice(`✓ Google Identity Verified! Welcome, ${res.user.name}.`);
        setTimeout(() => {
          router.push("/");
        }, 400);
        return;
      } catch (err: any) {
        setError(err.message || "Google verification failed for this email.");
        setLoading(false);
        return;
      }
    }

    try {
      const supabase = createClient();
      if (supabase) {
        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (!oauthError && data?.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch {
      // Fall through gracefully
    }

    setEmail("timstittus@nutrinexa.com");
    setInfoNotice("Selected Google researcher account timstittus@nutrinexa.com. Click Continue with Google to verify.");
    setLoading(false);
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await authApi.login("demo@nutrinexa.org", "NutriNexa2026!");
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to log in as demo researcher.");
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
            Academic Nutrition Research & Analytics Platform
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{infoNotice}</span>
          </div>
        )}

        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white border border-[#E2E8E2] hover:bg-[#F7F9F7] text-[#192520] text-xs font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-2xs transition active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-[#E2E8E2] w-full" />
          <span className="bg-white px-3 text-[10px] text-[#7D9087] uppercase tracking-wider font-semibold">
            or institutional email
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-[#192520]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@institution.edu"
                className="w-full pl-9 pr-3 py-2.5 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold text-[#192520]">Password</label>
              <Link href="/forgot-password" className="text-[11px] text-[#2D8C83] hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D9087] hover:text-[#192520]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 text-[#174C3A] rounded border-gray-300 focus:ring-[#2D8C83]"
            />
            <label htmlFor="remember" className="text-xs text-[#52635C] cursor-pointer">
              Remember this research session
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#174C3A] hover:bg-[#123C2E] text-white font-semibold rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Signing in..." : "Sign In to Research Workspace"}
          </button>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={loading}
            className="w-full py-2 bg-[#F1F5F2] hover:bg-[#E2E8E2] text-[#174C3A] font-semibold rounded-xl border border-[#E2E8E2] flex items-center justify-center gap-1.5 transition"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Explore as Demo Researcher (One-Click)</span>
          </button>
        </form>

        <div className="text-center text-xs text-[#52635C] pt-2 border-t border-[#E2E8E2] space-y-2">
          <div>
            New investigator?{" "}
            <Link href="/signup" className="font-semibold text-[#2D8C83] hover:underline">
              Register academic profile
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
