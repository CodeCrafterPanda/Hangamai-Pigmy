/**
 * Theme Creation Utilities
 * Provides helper functions to work with theme tokens
 */

import { TextStyle } from 'react-native';
import { Theme, SpacingKey, RadiusKey, TypographyVariant } from './types';

/**
 * Get spacing value from theme
 */
export function spacing(theme: Theme, ...keys: SpacingKey[]): number {
  if (keys.length === 0) return 0;
  if (keys.length === 1) return theme.spacing[keys[0]];
  return keys.reduce((acc, key) => acc + theme.spacing[key], 0);
}

/**
 * Get radius value from theme
 */
export function radius(theme: Theme, key: RadiusKey): number {
  return theme.radius[key];
}

/**
 * Get typography style from theme
 */
export function typography(theme: Theme, variant: TypographyVariant): TextStyle {
  const scale = theme.typography.scale[variant];
  return {
    fontFamily: theme.typography.fontFamily.primary,
    fontSize: scale.fontSize,
    lineHeight: scale.lineHeight,
    fontWeight: scale.fontWeight,
  };
}

/**
 * Create shadow styles based on elevation
 */
export function shadow(elevation: number) {
  if (elevation === 0) {
    return {};
  }

  return {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: elevation,
    },
    shadowOpacity: 0.1 + elevation * 0.02,
    shadowRadius: elevation * 2,
    elevation: elevation,
  };
}

/**
 * Get button variant styles
 */
export function buttonVariant(
  theme: Theme,
  variant: 'primary' | 'secondary' | 'danger' = 'primary',
) {
  const variantConfig = theme.components.button[variant];
  return {
    backgroundColor: variantConfig.background,
    borderColor: 'borderColor' in variantConfig ? variantConfig.borderColor : undefined,
    color: variantConfig.textColor,
  };
}

/**
 * Get banner variant styles
 */
export function bannerVariant(
  theme: Theme,
  variant: 'info' | 'warning' | 'success' | 'error' = 'info',
) {
  return theme.components.banner[variant];
}

/**
 * Helper to create numeric/amount text styles
 */
export function numericStyle(theme: Theme, isNegative: boolean = false): TextStyle {
  return {
    fontWeight: theme.typography.numeric.amountWeight,
    color: isNegative ? theme.typography.numeric.negativeColor : theme.colors.text.primary,
  };
}

/**
 * Helper to get common touch target size
 */
export function touchTarget(theme: Theme): number {
  return theme.ux.touchTargetMin;
}

/**
 * Convert hex color to rgba with alpha
 */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map(c => c + c)
          .join('')
      : clean;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Full-screen gradient stops derived from theme backgrounds
 */
export function screenGradient(theme: Theme): [string, string, string] {
  return [
    theme.colors.background.app,
    theme.colors.background.cardElevated,
    theme.colors.background.app,
  ];
}
