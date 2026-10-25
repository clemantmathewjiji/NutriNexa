"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User } from "@/lib/types";
import { authApi, getStoredToken, setStoredToken } from "@/lib/api";
import { createClient } from "@/src/lib/supabase/client";

export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: string, institution?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  requireAuth: (callbackOrOptions?: (() => void) | { reason?: string; actionName?: string; onSuccess?: () => void }) => boolean;
  authPromptOpen: boolean;
  authPromptReason: string;
  openAuthPrompt: (reason?: string, onProceed?: () => void) => void;
  closeAuthPrompt: () => void;
  authModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register", reason?: string, onSuccess?: () => void) => void;
  closeAuthModal: () => void;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  // Prompt / Modal State for Protected Actions
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [authPromptReason, setAuthPromptReason] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Full Auth Modal
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      // 1. Try Supabase Browser Session
      const supabase = createClient();
      if (supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session?.user) {
          try {
            const meRes = await authApi.getMe();
            if (meRes?.user) {
              setUser(meRes.user);
              setStatus("authenticated");
              return meRes.user;
            }
          } catch {
            // Construct user from Supabase auth session
            const sbUser = session.user;
            const metadata = sbUser.user_metadata || {};
            const fallbackUser: User = {
              id: sbUser.id,
              name: metadata.full_name || metadata.name || sbUser.email?.split("@")[0] || "Researcher",
              displayName: metadata.display_name || metadata.full_name || sbUser.email?.split("@")[0] || "Researcher",
              email: sbUser.email || "",
              role: metadata.role || metadata.designation || "Researcher",
              institution: metadata.institution || "",
            };
            setUser(fallbackUser);
            setStatus("authenticated");
            return fallbackUser;
          }
        }
      }

      // 2. Try Internal / Stored Session Token
      const storedToken = getStoredToken();
      if (storedToken) {
        const meRes = await authApi.getMe();
        if (meRes?.user) {
          setUser(meRes.user);
          setStatus("authenticated");
          return meRes.user;
        }
      }

      // No active session exists
      setUser(null);
      setStatus("guest");
      return null;
    } catch {
      // Session invalid or expired: safely transition to guest mode
      setStoredToken(null);
      setUser(null);
      setStatus("guest");
      return null;
    }
  }, []);

  // Initialize and synchronize sessions
  useEffect(() => {
    refreshUser();

    // Supabase auth state change subscription
    const supabase = createClient();
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (session?.user) {
            refreshUser();
          }
        } else if (event === "SIGNED_OUT") {
          setStoredToken(null);
          setUser(null);
          setStatus("guest");
        }
      });
      authListener = data;
    }

    // Cross-tab synchronization via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nutrinexa_auth_token") {
        if (!e.newValue) {
          // Token removed in another tab
          setUser(null);
          setStatus("guest");
        } else {
          // New token saved in another tab
          refreshUser();
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login(email, password);
    setUser(res.user);
    setStatus("authenticated");
    setAuthModalOpen(false);
    setAuthPromptOpen(false);

    // Execute any pending protected action
    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      setTimeout(() => action(), 50);
    }

    return res.user;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role?: string,
    institution?: string
  ): Promise<User> => {
    const res = await authApi.register(name, email, password, role || "Researcher", institution || "");
    setUser(res.user);
    setStatus("authenticated");
    setAuthModalOpen(false);
    setAuthPromptOpen(false);

    if (pendingAction) {
      const action = pendingAction;
      setPendingAction(null);
      setTimeout(() => action(), 50);
    }

    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setStoredToken(null);
      setUser(null);
      setStatus("guest");
      setPendingAction(null);
    }
  };

  const openAuthPrompt = (reason?: string, onProceed?: () => void) => {
    setAuthPromptReason(
      reason || "Create an account or sign in to save your calculations, manage personal nutrition records, and access research tools."
    );
    if (onProceed) {
      setPendingAction(() => onProceed);
    }
    setAuthPromptOpen(true);
  };

  const closeAuthPrompt = () => {
    setAuthPromptOpen(false);
    setPendingAction(null);
  };

  const openAuthModal = (mode: "login" | "register" = "login", reason?: string, onSuccess?: () => void) => {
    setAuthModalMode(mode);
    if (reason) setAuthPromptReason(reason);
    if (onSuccess) setPendingAction(() => onSuccess);
    setAuthPromptOpen(false);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setPendingAction(null);
  };

  const continueAsGuest = () => {
    setAuthPromptOpen(false);
    setAuthModalOpen(false);
    setPendingAction(null);
  };

  /**
   * Guards protected actions. If user is authenticated, executes action and returns true.
   * If visitor is in guest mode, triggers the professional protected action prompt and returns false.
   */
  const requireAuth = (
    callbackOrOptions?: (() => void) | { reason?: string; actionName?: string; onSuccess?: () => void }
  ): boolean => {
    if (status === "authenticated" && user) {
      if (typeof callbackOrOptions === "function") {
        callbackOrOptions();
      } else if (callbackOrOptions?.onSuccess) {
        callbackOrOptions.onSuccess();
      }
      return true;
    }
    const reason = typeof callbackOrOptions === "object" ? callbackOrOptions?.reason : undefined;
    const onSuccess = typeof callbackOrOptions === "function" ? callbackOrOptions : callbackOrOptions?.onSuccess;
    openAuthPrompt(reason, onSuccess);
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated" && user !== null,
        isGuest: status === "guest" || user === null,
        login,
        register,
        logout,
        refreshUser,
        requireAuth,
        authPromptOpen,
        authPromptReason,
        openAuthPrompt,
        closeAuthPrompt,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
