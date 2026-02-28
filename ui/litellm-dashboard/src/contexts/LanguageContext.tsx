"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, defaultLocale } from "@/i18n/locales";
import { Translations, buildTranslationsForLocale } from "@/i18n/translations";

// Context type
interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider props
interface LanguageProviderProps {
  children: ReactNode;
}

// Provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [translations, setTranslations] = useState<Translations>(() =>
    buildTranslationsForLocale(defaultLocale),
  );
  const [fallbackTranslations] = useState<Translations>(() => buildTranslationsForLocale("en-US"));

  useEffect(() => {
    setTranslations(buildTranslationsForLocale(locale));
  }, [locale]);

  // Keep locale fixed to default (zh-CN)
  const setLocale = (_newLocale: Locale) => {
    setLocaleState(defaultLocale);
  };

  // Translation function with nested key support
  const t = (key: string): string => {
    const resolveKey = (source: Translations): string | null => {
      const keys = key.split(".");
      let value: any = source;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return null;
        }
      }

      return typeof value === "string" ? value : null;
    };

    const localized = resolveKey(translations);
    if (localized) return localized;

    const fallback = resolveKey(fallbackTranslations);
    if (fallback) return fallback;

    return key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
