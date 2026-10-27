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
import { readStorage, readStoredValue, writeStorage } from "@/helpers/storage";
import { buildUrl } from "@/helpers/url";

type Translations = Record<string, string>;

export type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

interface I18nContextValue {
  t: Translate;
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

const loadedTranslations = new Map<Language, Translations>();

const translationsStorageKey = (language: Language) =>
  `${STORAGE_KEYS.TRANSLATIONS}:${language}`;

type CachedTranslations = { raw: string; translations: Translations };

const cachedTranslations = new Map<Language, CachedTranslations | null>();

function parseTranslations(raw: string | null): CachedTranslations | null {
  if (!raw) return null;
  try {
    return { raw, translations: JSON.parse(raw) as Translations };
  } catch {
    return null;
  }
}

function readCachedTranslations(language: Language): CachedTranslations | null {
  if (!cachedTranslations.has(language))
    cachedTranslations.set(
      language,
      parseTranslations(readStorage(translationsStorageKey(language))),
    );
  return cachedTranslations.get(language) ?? null;
}

async function fetchTranslations(
  language: Language,
  cached: CachedTranslations | null,
): Promise<Translations> {
  const response = await apiClient.get<string>(
    buildUrl(ROUTES_API.api.locales[":culture"].__path, {
      culture: language,
    }),
    { responseType: "text" },
  );
  const fresh =
    cached?.raw === response.data ? cached : parseTranslations(response.data);
  if (!fresh) throw new Error();
  if (fresh !== cached) {
    writeStorage(translationsStorageKey(language), fresh.raw);
    cachedTranslations.set(language, fresh);
  }
  loadedTranslations.set(language, fresh.translations);
  return fresh.translations;
}

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

function detectBrowserLanguage(): Language {
  const preferred = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of preferred) {
    const base = tag.toLowerCase().split("-")[0];
    if (base === "fr") return Language.Fr;
    if (base === "en") return Language.En;
  }
  return Language.Fr;
}

export const I18nProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: Language;
}> = ({ children, initialLanguage }) => {
  const [language, setLanguageState] = useState<Language>(
    initialLanguage ??
      readStoredValue(STORAGE_KEY, Language) ??
      detectBrowserLanguage(),
  );
  const [translations, setTranslations] = useState<Translations | null>(
    () =>
      loadedTranslations.get(language) ??
      readCachedTranslations(language)?.translations ??
      null,
  );

  useEffect(() => {
    const loaded = loadedTranslations.get(language);
    if (loaded) {
      setTranslations(loaded);
      return;
    }
    const cached = readCachedTranslations(language);
    if (cached) setTranslations(cached.translations);
    let cancelled = false;
    fetchTranslations(language, cached)
      .then((fresh) => {
        if (!cancelled) setTranslations(fresh);
      })
      .catch(() => {
        if (!cancelled) setTranslations((previous) => previous ?? {});
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    writeStorage(STORAGE_KEY, lang);
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
