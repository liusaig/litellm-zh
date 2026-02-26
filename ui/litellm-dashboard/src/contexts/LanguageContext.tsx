"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Locale, defaultLocale } from "@/i18n/locales";

// Translation type
type Translations = Record<string, any>;

// Context type
interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

// Create context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = "litellm-language";

// Provider props
interface LanguageProviderProps {
  children: ReactNode;
}

// Provider component
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [translations, setTranslations] = useState<Translations>({});

  // Load locale from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    console.log("[LanguageContext] loadLocaleFromStorage", { stored });
    if (stored && (stored === "zh-CN" || stored === "en-US")) {
      setLocaleState(stored);
      console.log("[LanguageContext] locale set from storage", stored);
    } else {
      console.log("[LanguageContext] using default locale", defaultLocale);
    }
  }, []);

  // Load translations when locale changes
  useEffect(() => {
    const loadTranslations = async () => {
      console.log(`[LanguageContext] loading translations for locale=${locale}`);
      try {
        const module = await import(`@/i18n/translations/${locale}.json`);
        const data = (module as any).default ?? module;
        setTranslations(data);
        console.log(`[LanguageContext] translations loaded for locale=${locale}, keys=${Object.keys(data || {})}`);
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error);
        setTranslations({});
      }
    };
    loadTranslations();
  }, [locale]);

  // Set locale and persist to localStorage
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  // Translation function with nested key support
  const t = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        // Translation missing for this key
        console.warn(`[LanguageContext] translation missing: key="${key}", locale="${locale}"`);
        return key; // Return key if translation not found
      }
    }

    const finalValue = typeof value === "string" ? value : key;
    console.log(`[LanguageContext] t() request: key="${key}", locale="${locale}" -> ${typeof finalValue === 'string' ? finalValue : 'NON-STRING'}`);
    return finalValue;
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
