/**
 * Theme Type Definitions
 */

import { darkTheme, lightTheme } from './tokens';

export type Theme = typeof darkTheme;
export type ThemeMode = 'light' | 'dark';

export type ColorTokens = Theme['colors'];
export type TypographyTokens = Theme['typography'];
export type SpacingTokens = Theme['spacing'];
export type RadiusTokens = Theme['radius'];
export type ComponentTokens = Theme['components'];
export type IconTokens = Theme['icons'];

export type SpacingKey = keyof SpacingTokens;
export type RadiusKey = keyof RadiusTokens;
export type TypographyVariant = keyof TypographyTokens['scale'];

export interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  mode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// Ensure both themes have the same structure
type AssertSameStructure = typeof darkTheme extends typeof lightTheme
  ? typeof lightTheme extends typeof darkTheme
    ? true
    : false
  : false;

const _typeCheck: AssertSameStructure = true;
