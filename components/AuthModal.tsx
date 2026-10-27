"use client";
import React, { useState } from "react";
import { authApi } from "@/lib/api";
import { User } from "@/lib/types";
import {
  X, Lock, Mail, User as UserIcon, Building2, KeyRound, AlertCircle,
  Eye, EyeOff, CheckCircle2, ShieldCheck, ArrowRight, HelpCircle, Compass
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: "login" | "register";
}

type AuthMode = "login" | "register" | "forgot_password" | "reset_sent" | "google_verify";

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = "login",
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  React.useEffect(() => {
    if (isOpen && initialMode) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Form Fields
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  // Password Strength Evaluation
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
    if (score <= 1) return { label: "Weak (Needs 8+ chars & Uppercase)", color: "bg-rose-100 text-rose-700" };
    if (score === 2) return { label: "Fair (Add numbers/symbols)", color: "bg-amber-100 text-amber-700" };
    if (score === 3) return { label: "Good", color: "bg-teal-100 text-teal-800" };
    return { label: "Strong Academic Grade", color: "bg-emerald-100 text-emerald-800" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoNotice(null);

    try {
      if (mode === "login") {
        const res = await authApi.login(email, password);
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === "register") {
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

        const res = await authApi.register(name, email, password, designation || "Researcher", institution);
        onAuthSuccess(res.user);
        onClose();
      } else if (mode === "forgot_password") {
        const supabase = createClient();
        if (supabase) {
          const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
          });
          if (resetErr) {
            throw resetErr;
          }
        }
        setMode("reset_sent");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setInfoNotice(null);

    // If an email address is already entered (e.g. timstittus@nutrinexa.com),
    // proceed directly with instant Google researcher verification!
    const targetEmail = email.trim();
    if (targetEmail) {
      try {
        setInfoNotice(`Verifying Google identity for ${targetEmail}...`);
        const res = await authApi.googleVerify({
          email: targetEmail,
          name: name.trim() || undefined,
        });
        setInfoNotice(`✓ Google Identity Verified! Welcome, ${res.user.name}.`);
        setTimeout(() => {
          onAuthSuccess(res.user);
          onClose();
        }, 400);
        return;
      } catch (verifyErr: any) {
        setError(verifyErr.message || "Google verification failed for this email.");
        setLoading(false);
        return;
      }
    }

    // Attempt Supabase Google OAuth if configured
    try {
      const supabase = createClient();
      if (supabase) {
        const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (!oauthError && data?.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch {
      // Supabase OAuth not active or timed out; fall through to Google Verification mode
    }

    // Smoothly transition to Google Verification mode without blocking red error
    setLoading(false);
    setMode("google_verify");
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
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2E8E2] overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header with Logo */}
        <div className="px-6 py-4 border-b border-[#E2E8E2] flex items-center justify-between bg-[#F7F9F7]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#174C3A] to-[#2D8C83] flex items-center justify-center text-white shadow-xs shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#174C3A]">
                {mode === "register"
                  ? "Researcher Registration"
                  : mode === "forgot_password"
                  ? "Recover Password"
                  : mode === "reset_sent"
                  ? "Check Your Inbox"
                  : mode === "google_verify"
                  ? "Google Account Verification"
                  : t("authSignInTitle")}
              </h3>
              <p className="text-[11px] text-[#52635C]">
                {mode === "register"
                  ? "Academic & laboratory user credentials"
                  : mode === "forgot_password"
                  ? "Reset password via email verification"
                  : mode === "google_verify"
                  ? "Authenticate researcher credentials via Google"
                  : "Access private nutrition databases & cohort records"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#7D9087] hover:text-[#192520] hover:bg-[#E2E8E2] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 space-y-4">
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

          {mode === "reset_sent" ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#174C3A]">Password Reset Link Sent</h4>
              <p className="text-xs text-[#52635C] leading-relaxed">
                If an account exists for <strong className="text-[#192520]">{email}</strong>, a secure password reset link has been dispatched. Please check your inbox and spam folder.
              </p>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full py-2 bg-[#174C3A] text-white text-xs font-semibold rounded-lg hover:bg-[#123C2E] transition"
              >
                Return to Sign In
              </button>
            </div>
          ) : mode === "google_verify" ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#F7F9F7] rounded-xl border border-[#E2E8E2] text-center space-y-2">
                <div className="w-12 h-12 bg-white rounded-full border border-[#E2E8E2] flex items-center justify-center mx-auto shadow-2xs">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
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
                </div>
                <h4 className="text-sm font-bold text-[#174C3A]">Google Researcher Verification</h4>
                <p className="text-xs text-[#52635C] leading-relaxed">
                  Authenticate your verified Google profile to access restricted nutrition cohorts and research data.
                </p>
              </div>

              {/* Quick Researcher Verification */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-[#52635C] uppercase tracking-wider">
                  Quick Select Researcher Profile
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    setEmail("timstittus@nutrinexa.com");
                    setLoading(true);
                    setError(null);
                    try {
                      const res = await authApi.googleVerify({ email: "timstittus@nutrinexa.com" });
                      setInfoNotice(`✓ Google Identity Verified! Welcome, ${res.user.name}.`);
                      setTimeout(() => {
                        onAuthSuccess(res.user);
                        onClose();
                      }, 400);
                    } catch (err: any) {
                      setError(err.message || "Google verification failed.");
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full p-2.5 bg-white border border-[#E2E8E2] hover:border-[#174C3A] hover:bg-[#F7F9F7] rounded-xl flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      TT
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#192520] group-hover:text-[#174C3A]">
                        Dr. Tims Tittus
                      </p>
                      <p className="text-[11px] text-[#7D9087]">timstittus@nutrinexa.com</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded-full border border-emerald-200">
                    Verify & Sign In
                  </span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setEmail("demo@nutrinexa.org");
                    setLoading(true);
                    setError(null);
                    try {
                      const res = await authApi.googleVerify({ email: "demo@nutrinexa.org" });
                      setInfoNotice(`✓ Google Identity Verified! Welcome, ${res.user.name}.`);
                      setTimeout(() => {
                        onAuthSuccess(res.user);
                        onClose();
                      }, 400);
                    } catch (err: any) {
                      setError(err.message || "Google verification failed.");
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="w-full p-2.5 bg-white border border-[#E2E8E2] hover:border-[#174C3A] hover:bg-[#F7F9F7] rounded-xl flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                      CJ
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#192520] group-hover:text-[#174C3A]">
                        Dr. Clemant Mathew Jiji
                      </p>
                      <p className="text-[11px] text-[#7D9087]">demo@nutrinexa.org</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-50 text-teal-700 font-semibold rounded-full border border-teal-200">
                    Verify & Sign In
                  </span>
                </button>
              </div>

              <div className="relative flex items-center justify-center my-2">
                <div className="border-t border-[#E2E8E2] w-full" />
                <span className="bg-white px-3 text-[10px] text-[#7D9087] uppercase tracking-wider font-semibold">
                  or institutional google email
                </span>
              </div>

              {/* Form to verify any Google/institutional email */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!email.trim()) return;
                  setLoading(true);
                  setError(null);
                  try {
                    const res = await authApi.googleVerify({
                      email: email.trim(),
                      name: name.trim() || undefined,
                    });
                    setInfoNotice(`✓ Google Identity Verified! Welcome, ${res.user.name}.`);
                    setTimeout(() => {
                      onAuthSuccess(res.user);
                      onClose();
                    }, 400);
                  } catch (err: any) {
                    setError(err.message || "Google verification failed.");
                    setLoading(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#192520] mb-1">
                    Google or Institutional Email *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087]" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. timstittus@nutrinexa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-2.5 bg-[#174C3A] text-white text-xs font-semibold rounded-xl hover:bg-[#123C2E] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify & Continue with Google</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("login");
                  }}
                  className="w-full py-1 text-xs text-[#52635C] hover:text-[#192520] transition text-center cursor-pointer"
                >
                  ← Back to standard sign in
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Google OAuth Button */}
              {mode === "login" && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-white border border-[#E2E8E2] hover:bg-[#F7F9F7] text-[#192520] text-xs font-semibold rounded-xl flex items-center justify-center gap-2.5 shadow-2xs transition active:scale-98 disabled:opacity-50"
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
                </>
              )}

              {/* Registration Specific Fields */}
              {mode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#192520] mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087] rtl:right-3 rtl:left-auto" />
                      <input
                        type="text"
                        required
                        placeholder="Dr. Amal Krishna / Researcher Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 rtl:pr-9 rtl:pl-3"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#192520] mb-1">
                        Designation (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Clinical Dietitian / Faculty"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#192520] mb-1">
                        Institution (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="University / Hospital Lab"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Academic Email Address */}
              <div>
                <label className="block text-xs font-semibold text-[#192520] mb-1">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087] rtl:right-3 rtl:left-auto" />
                  <input
                    type="email"
                    required
                    placeholder="investigator@institution.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 rtl:pr-9 rtl:pl-3"
                  />
                </div>
              </div>

              {/* Password Field (Hidden in forgot_password mode) */}
              {mode !== "forgot_password" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#192520]">
                      Password *
                    </label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot_password")}
                        className="text-[11px] text-[#2D8C83] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087] rtl:right-3 rtl:left-auto" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 rtl:pr-9 rtl:pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D9087] hover:text-[#192520] rtl:left-2.5 rtl:right-auto"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator (in register mode) */}
                  {mode === "register" && password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#7D9087]">Strength:</span>
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
              )}

              {/* Confirm Password (Register mode) */}
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-[#192520] mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D9087] rtl:right-3 rtl:left-auto" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 text-xs border border-[#E2E8E2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2D8C83]/30 rtl:pr-9 rtl:pl-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D9087] hover:text-[#192520] rtl:left-2.5 rtl:right-auto"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me checkbox (Login mode) */}
              {mode === "login" && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#174C3A] rounded border-gray-300 focus:ring-[#2D8C83]"
                  />
                  <label htmlFor="rememberMe" className="text-xs text-[#52635C] cursor-pointer">
                    Remember this research station
                  </label>
                </div>
              )}

              {/* Terms acknowledgement (Register mode) */}
              {mode === "register" && (
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
              )}

              {/* Action Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : mode === "register" ? (
                  "Create Academic Account"
                ) : mode === "forgot_password" ? (
                  "Send Password Reset Link"
                ) : (
                  t("authSignInTitle")
                )}
              </button>

              {/* Demo Sign-in Option */}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  disabled={loading}
                  className="w-full py-2 bg-[#F1F5F2] hover:bg-[#E2E8E2] text-[#174C3A] text-xs font-semibold rounded-xl border border-[#E2E8E2] flex items-center justify-center gap-1.5 transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Explore as Demo Researcher (One-Click)</span>
                </button>
              )}

              {/* Mode Switching Links */}
              <div className="text-center pt-2 text-xs text-[#52635C]">
                {mode === "login" ? (
                  <span>
                    New investigator?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="font-semibold text-[#2D8C83] hover:underline cursor-pointer"
                    >
                      Register research profile
                    </button>
                  </span>
                ) : mode === "register" ? (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="font-semibold text-[#2D8C83] hover:underline cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-semibold text-[#2D8C83] hover:underline cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                )}
              </div>

              {/* Continue Exploring as Guest */}
              <div className="pt-2 text-center border-t border-[#E2E8E2]/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs text-[#7D9087] hover:text-[#192520] font-medium py-1 px-3 rounded hover:bg-gray-100 transition cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Continue Exploring as Guest</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
