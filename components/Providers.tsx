"use client";

import React, { ReactNode } from "react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedActionPrompt } from "@/components/ProtectedActionPrompt";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
        <ProtectedActionPrompt />
      </AuthProvider>
    </LanguageProvider>
  );
}
