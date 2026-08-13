/**
 * Translation registry — the only place that needs editing to register a new language.
 */

import type { Language, LanguageOption, TranslationDictionary } from '../types';
import en from './en';
import mr from './mr';

/** Language used when nothing is persisted yet, and as the fallback for a missing key. */
export const DEFAULT_LANGUAGE: Language = 'mr';

export const translations: Record<Language, TranslationDictionary> = {
  en,
  mr,
};

/** Options offered by the language selector, in display order. */
export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', nativeName: 'English' },
  { code: 'mr', nativeName: 'मराठी' },
];

export { en, mr };
