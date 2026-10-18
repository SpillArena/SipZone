import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { consentStorage, declareStoredKeys } from "./account/consent";
export type Language = "no" | "en";
export type Theme = "dark" | "light" | "system";
declareStoredKeys(["lang", "theme"]);
const Context = createContext<{
  language: Language;
  setLanguage: (value: Language) => void;
  theme: Theme;
  setTheme: (value: Theme) => void;
  t: (no: string, en?: string) => string;
} | null>(null);
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    consentStorage.get("lang") === "en" ? "en" : "no",
  );
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = consentStorage.get("theme");
    return saved === "light" || saved === "system" ? saved : "dark";
  });
  useEffect(() => {
    document.documentElement.lang = language === "no" ? "nb" : "en";
    consentStorage.set("lang", language);
  }, [language]);
  useEffect(() => {
    consentStorage.set("theme", theme);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.theme =
        theme === "system" ? (media.matches ? "dark" : "light") : theme;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === "lang")
        setLanguage(consentStorage.get("lang") === "en" ? "en" : "no");
      if (event.key === "theme") {
        const value = consentStorage.get("theme");
        if (value === "light" || value === "dark" || value === "system")
          setTheme(value);
      }
    };
    addEventListener("storage", sync);
    return () => removeEventListener("storage", sync);
  }, []);
  return (
    <Context.Provider
      value={{
        language,
        setLanguage,
        theme,
        setTheme,
        t: (no, en) => (language === "en" && en ? en : no),
      }}
    >
      {children}
    </Context.Provider>
  );
}
// Shared provider and hook, as in Hitline.
// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const context = useContext(Context);
  if (!context) throw new Error("Missing SipZone language provider");
  return context;
}
