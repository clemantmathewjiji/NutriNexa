import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { LanguageCode, LanguageInfo, SUPPORTED_LANGUAGES, TranslationDictionary } from "./types";
import { getTranslation, translations } from "./locales";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  languageInfo: LanguageInfo;
  supportedLanguages: LanguageInfo[];
  t: (key: keyof TranslationDictionary) => string;
  dir: "ltr" | "rtl";
  unitSystem: "metric" | "imperial";
  setUnitSystem: (unit: "metric" | "imperial") => void;
  formatNumber: (value: number | null | undefined, decimals?: number) => string;
  formatDate: (date: string | Date | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_LANG_KEY = "nutrinexa_lang";
const STORAGE_UNIT_KEY = "nutrinexa_unit_system";

function detectInitialLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      return saved as LanguageCode;
    }
    // Browser language detection
    const browserLang = navigator.language?.toLowerCase() || "";
    const primary = browserLang.split("-")[0];
    const match = SUPPORTED_LANGUAGES.find((l) => l.code === primary);
    if (match) return match.code;
  } catch (err) {
    console.warn("Could not access localStorage for language:", err);
  }
  return "en";
}

function detectInitialUnitSystem(): "metric" | "imperial" {
  try {
    const saved = localStorage.getItem(STORAGE_UNIT_KEY);
    if (saved === "metric" || saved === "imperial") return saved;
  } catch {}
  return "metric";
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(detectInitialLanguage);
  const [unitSystem, setUnitSystemState] = useState<"metric" | "imperial">(detectInitialUnitSystem);

  const languageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch (e) {
      console.warn("Failed to persist language:", e);
    }
  };

  const setUnitSystem = (unit: "metric" | "imperial") => {
    setUnitSystemState(unit);
    try {
      localStorage.setItem(STORAGE_UNIT_KEY, unit);
    } catch {}
  };

  // Keep HTML document lang & dir in sync
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = languageInfo.dir;
    // Set a class on body to enable font adjustments if needed
    document.body.setAttribute("data-lang", language);
  }, [language, languageInfo.dir]);

  const t = (key: keyof TranslationDictionary): string => {
    return getTranslation(language, key);
  };

  const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined || isNaN(value)) return "0";
    try {
      return new Intl.NumberFormat(languageInfo.locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      }).format(value);
    } catch {
      return value.toFixed(decimals);
    }
  };

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "—";
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      return new Intl.DateTimeFormat(languageInfo.locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(d);
    } catch {
      return String(date);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languageInfo,
        supportedLanguages: SUPPORTED_LANGUAGES,
        t,
        dir: languageInfo.dir,
        unitSystem,
        setUnitSystem,
        formatNumber,
        formatDate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};
