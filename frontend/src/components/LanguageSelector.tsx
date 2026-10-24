import React, { useState, useRef, useEffect } from "react";
import { Globe2, Search, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { LanguageCode } from "../i18n/types";

interface LanguageSelectorProps {
  variant?: "header" | "settings" | "compact";
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "header",
  className = "",
}) => {
  const { language, setLanguage, languageInfo, supportedLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Focus search input on open
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredLanguages = supportedLanguages.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  if (variant === "settings") {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative">
          <Search className="w-4 h-4 text-emerald-700/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search language / ഭാഷ തിരയുക / ابحث عن لغة..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-emerald-900/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700/30 text-emerald-950 placeholder:text-emerald-950/40"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredLanguages.map((item) => {
            const isSelected = item.code === language;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => handleSelect(item.code)}
                className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "bg-emerald-900 text-white border-emerald-900 shadow-sm"
                    : "bg-white text-emerald-950 border-emerald-900/10 hover:border-emerald-700/30 hover:bg-emerald-50/50"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{item.nativeName}</span>
                  <span
                    className={`text-xs ${
                      isSelected ? "text-emerald-200" : "text-emerald-900/60"
                    }`}
                  >
                    {item.name} ({item.code.toUpperCase()})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.dir === "rtl" && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                        isSelected
                          ? "bg-emerald-800 text-emerald-200"
                          : "bg-emerald-100/70 text-emerald-900"
                      }`}
                    >
                      RTL
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4 text-emerald-300" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Select language"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs md:text-sm font-medium bg-emerald-900/5 hover:bg-emerald-900/10 text-emerald-950 border border-emerald-900/15 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-700/30"
      >
        <Globe2 className="w-4 h-4 text-emerald-800 shrink-0" />
        <span className="font-semibold">{languageInfo.nativeName}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-emerald-800/70 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 w-72 rounded-xl bg-white shadow-xl border border-emerald-900/15 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 ${
            languageInfo.dir === "rtl" ? "left-0" : "right-0"
          }`}
        >
          {/* Search box inside dropdown */}
          <div className="px-3 pb-2 pt-1 border-b border-emerald-900/10">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-emerald-700/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search / തിരയുക / ابحث..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-emerald-50/40 border border-emerald-900/15 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-700/30 text-emerald-950 placeholder:text-emerald-900/40"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="max-h-64 overflow-y-auto py-1">
            {filteredLanguages.length === 0 ? (
              <div className="px-4 py-3 text-xs text-center text-emerald-900/50">
                No languages found
              </div>
            ) : (
              filteredLanguages.map((item) => {
                const isSelected = item.code === language;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelect(item.code)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? "bg-emerald-900/10 text-emerald-950 font-bold"
                        : "text-emerald-900/80 hover:bg-emerald-50 hover:text-emerald-950"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{item.nativeName}</span>
                      <span className="text-[11px] text-emerald-900/60 font-normal">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.dir === "rtl" && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono">
                          RTL
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-emerald-700" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
