import type { Language } from './types';

/** Always 0-9, even when the selected language is Marathi. */
const LATIN_DIGITS = 'latn' as const;

function withLatinDigits<T extends Intl.DateTimeFormatOptions | Intl.NumberFormatOptions>(
  options?: T,
): T & { numberingSystem: typeof LATIN_DIGITS } {
  return { ...options, numberingSystem: LATIN_DIGITS };
}

/**
 * Locale tag for date/time labels (month and weekday names).
 * Digits stay Latin via the `nu-latn` Unicode extension — never Devanagari.
 */
export function dateLocale(language: Language): string {
  return language === 'mr' ? 'mr-IN-u-nu-latn' : 'en-IN-u-nu-latn';
}

export function formatDate(
  date: Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleDateString(dateLocale(language), withLatinDigits(options));
}

export function formatTime(
  date: Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleTimeString(dateLocale(language), withLatinDigits(options));
}

export function formatDateTime(
  date: Date,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleString(dateLocale(language), withLatinDigits(options));
}

/** Indian grouping (1,00,000) with Latin digits 0-9. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString('en-IN', withLatinDigits(options));
}
