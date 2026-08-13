/**
 * Translation registry — the only place that needs editing to register a new language.
 */

import type { Language, LanguageOption, TranslationDictionary } from '../types';
import en from './en';
import mr from './mr';

/** Language used when nothing is persisted yet. */
export const DEFAULT_LANGUAGE: Language = 'mr';

/** Dictionary used when a key is missing from the selected language. English is the source of truth. */
export const FALLBACK_LANGUAGE: Language = 'en';

export const translations: Record<Language, TranslationDictionary> = {
  en,
  mr,
};

/** Options offered by the language selector, in display order. */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', nativeName: 'English', shortLabel: 'EN' },
  { code: 'mr', nativeName: 'मराठी', shortLabel: 'म' },
];

export { en, mr };
