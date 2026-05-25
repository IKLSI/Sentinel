import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import apiClient from "../services/client";
import { Language } from "../types/enums";

type Translations = Record<string, string>;

interface I18nContextValue {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ready: boolean;
  culture: Language;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  ready: false,
  culture: Language.Fr,
  setLanguage: () => {},
});

const STORAGE_KEY = "sentinel_language";

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export const I18nProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: Language;
}> = ({ children, initialLanguage }) => {
  const [language, setLanguageState] = useState<Language>(
    initialLanguage ??
      (localStorage.getItem(STORAGE_KEY) as Language) ??
      Language.Fr,
  );
  const [translations, setTranslations] = useState<Translations | null>(null);

  useEffect(() => {
    setTranslations(null);
    apiClient
      .get<Translations>(`/api/locales/${language}`)
      .then((response) => setTranslations(response.data))
      .catch(() => setTranslations({}));
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem(STORAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      if (!translations) return "";
      const template = translations[key] ?? key;
      return interpolate(template, vars);
    },
    [translations],
  );

  if (translations === null) return null;

  return (
    <I18nContext.Provider
      value={{ t, ready: true, culture: language, setLanguage }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useT = () => useContext(I18nContext).t;
export const useI18n = () => useContext(I18nContext);
