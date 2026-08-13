/**
 * LanguageProvider - Manages the selected display language and exposes the translator
 */

import React, { createContext, useCallback, useEffect, useMemo, useState, ReactNode } from 'react';
import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, LANGUAGE_OPTIONS, translations } from './translations';
import { loadLanguage, saveLanguage } from './storage';
import type {
  Language,
  LanguageContextValue,
  TranslationDictionary,
  TranslationKey,
  TranslationParams,
} from './types';

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isRegisteredLanguage(value: string | null): value is Language {
  return value !== null && Object.prototype.hasOwnProperty.call(translations, value);
}

function lookup(dictionary: TranslationDictionary, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((node, segment) => {
    if (node && typeof node === 'object' && segment in node) {
      return (node as Record<string, unknown>)[segment];
    }
    return undefined;
  }, dictionary);

  return typeof value === 'string' ? value : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage ?? DEFAULT_LANGUAGE);
  const [isReady, setIsReady] = useState(false);

  // Restore a saved choice, otherwise keep the provider default (Marathi).
  useEffect(() => {
    loadLanguage().then(saved => {
      if (isRegisteredLanguage(saved)) {
        setLanguageState(saved);
      } else if (initialLanguage && isRegisteredLanguage(initialLanguage)) {
        setLanguageState(initialLanguage);
      }
      setIsReady(true);
    });
  }, [initialLanguage]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    saveLanguage(next);
  }, []);

  // A key missing from the selected dictionary falls back to English, then to the key
  // itself, so a partially translated language can never blank out a screen.
  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const translated =
        lookup(translations[language], key) ?? lookup(translations[FALLBACK_LANGUAGE], key) ?? key;

      return interpolate(translated, params);
    },
    [language],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      languages: LANGUAGE_OPTIONS,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  // Don't render until we've loaded the persisted language
  if (!isReady) {
    return null;
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
