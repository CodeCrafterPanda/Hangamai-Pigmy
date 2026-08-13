/**
 * Localization Type Definitions
 */

import type en from './translations/en';

/**
 * Registered display languages.
 * Adding a language: create `translations/<code>.ts`, add the code here, then register the
 * dictionary in `translations/index.ts`. No screen code changes are required.
 */
export type Language = 'en' | 'mr';

/** Shape every language dictionary must satisfy — English is the source of truth. */
export type TranslationDictionary = typeof en;

/** Dot paths of a nested dictionary, e.g. `'customerDetail.title'`. */
type DotPaths<T> = {
  [K in Extract<keyof T, string>]: T[K] extends string ? K : `${K}.${DotPaths<T[K]>}`;
}[Extract<keyof T, string>];

/** Every valid translation key, derived from the English dictionary. */
export type TranslationKey = DotPaths<TranslationDictionary>;

/** Values substituted into `{{placeholder}}` slots of a translated string. */
export type TranslationParams = Record<string, string | number>;

export interface LanguageOption {
  code: Language;
  /** Language name written in its own script — display data, never translated. */
  nativeName: string;
  /** Compact header label, e.g. EN / मरा. */
  shortLabel: string;
}

export interface LanguageContextValue {
  language: Language;
  /** Languages the app can currently be switched to. */
  languages: LanguageOption[];
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}
