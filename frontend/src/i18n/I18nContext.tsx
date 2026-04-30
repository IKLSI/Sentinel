import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import apiClient from '../services/client'

type Translations = Record<string, string>

interface I18nContextValue {
  t: (key: string, vars?: Record<string, string | number>) => string
  ready: boolean
  culture: string
}

const I18nContext = createContext<I18nContextValue>({
  t: (key) => key,
  ready: false,
  culture: 'fr-FR',
})

const DEFAULT_CULTURE = 'fr-FR'

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = vars[key]
    return value === undefined || value === null ? match : String(value)
  })
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [translations, setTranslations] = useState<Translations | null>(null)

  useEffect(() => {
    apiClient
      .get<Translations>(`/api/locales/${DEFAULT_CULTURE}`)
      .then((response) => setTranslations(response.data))
      .catch(() => setTranslations({}))
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      if (!translations) return ''
      const template = translations[key] ?? key
      return interpolate(template, vars)
    },
    [translations],
  )

  if (translations === null) return null

  return (
    <I18nContext.Provider value={{ t, ready: true, culture: DEFAULT_CULTURE }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useT = () => useContext(I18nContext).t

export const useI18n = () => useContext(I18nContext)
