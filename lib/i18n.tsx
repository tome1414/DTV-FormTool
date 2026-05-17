"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import en from "./locales/en";
import ja from "./locales/ja";
import zh from "./locales/zh";
import ko from "./locales/ko";
import hi from "./locales/hi";
import ru from "./locales/ru";

export type Lang = "en" | "ja" | "zh" | "ko" | "hi" | "ru";

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  ja: "JA",
  zh: "中",
  ko: "한",
  hi: "हि",
  ru: "RU",
};

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  ja: "日本語",
  zh: "中文",
  ko: "한국어",
  hi: "हिन्दी",
  ru: "Русский",
};

const LOCALES: Record<Lang, typeof en> = { en, ja, zh, ko, hi, ru };

const LS_KEY = "dtv_lang";

// Resolve dot-path in nested object
function resolvePath(obj: Record<string, unknown>, path: string): string | undefined {
  const result = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof result === "string" ? result : undefined;
}

interface I18nContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as Lang | null;
    if (saved && saved in LOCALES) setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LS_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      if (!key) return key ?? "";
      const locale = LOCALES[lang] as Record<string, unknown>;
      let value = resolvePath(locale, key) ?? resolvePath(LOCALES.en as Record<string, unknown>, key) ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        });
      }
      return value;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
