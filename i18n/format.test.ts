import { dateLocale, formatDate, formatDateTime, formatNumber, formatTime } from './format';

const DEVANAGARI_DIGITS = /[०-९]/;

describe('display numbers stay Latin digits', () => {
  const sample = new Date(2026, 7, 13, 18, 45, 0);

  test('dateLocale pins the Latin numbering system for Marathi', () => {
    expect(dateLocale('mr')).toContain('nu-latn');
    expect(dateLocale('en')).toContain('nu-latn');
  });

  test('Marathi dates, times and date-times do not emit Devanagari digits', () => {
    expect(formatDate(sample, 'mr', { day: 'numeric', month: 'short', year: 'numeric' })).not.toMatch(
      DEVANAGARI_DIGITS,
    );
    expect(formatTime(sample, 'mr', { hour: '2-digit', minute: '2-digit' })).not.toMatch(
      DEVANAGARI_DIGITS,
    );
    expect(formatDateTime(sample, 'mr')).not.toMatch(DEVANAGARI_DIGITS);
  });

  test('amounts keep Latin digits', () => {
    expect(formatNumber(800)).toBe('800');
    expect(formatNumber(100000)).toBe('1,00,000');
    expect(formatNumber(800, { minimumFractionDigits: 2 })).toBe('800.00');
    expect(formatNumber(1234.5, { minimumFractionDigits: 2 })).not.toMatch(DEVANAGARI_DIGITS);
  });
});
