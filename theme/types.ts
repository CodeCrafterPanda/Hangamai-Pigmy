/**
 * Theme Type Definitions
 */

import { darkTheme, lightTheme } from './tokens';

export type ThemeMode = 'light' | 'dark';

/** Either theme variant — property access stays type-safe via shared keys */
export type Theme = typeof darkTheme | typeof lightTheme;

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
