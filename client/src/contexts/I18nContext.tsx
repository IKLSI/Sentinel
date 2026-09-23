import type React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { ROUTES_API } from "@/configs/api-routes.gen";
import apiClient from "@/configs/apiClient";
import { Language } from "@/enums";
import { STORAGE_KEYS } from "@/constants/storage";
import { buildUrl } from "@/helpers/url";

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

const STORAGE_KEY = STORAGE_KEYS.LANGUAGE;

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
      .get<Translations>(
        buildUrl(ROUTES_API.api.locales[":culture"].__path, {
          culture: language,
        }),
      )
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

  const value = useMemo(
    () => ({
      t,
      ready: translations !== null,
      culture: language,
      setLanguage,
    }),
    [t, translations, language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useT = () => useContext(I18nContext).t;
export const useI18n = () => useContext(I18nContext);
