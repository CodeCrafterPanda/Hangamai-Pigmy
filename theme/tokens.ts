/**
 * Theme Tokens - Dark and Light Mode
 *
 * Source:
 * - Reference React Native dashboard theme
 * - Dark mode follows the reference UI directly
 * - Light mode is a derived companion theme
 */

export const darkTheme = {
  meta: {
    name: 'Pigmy Agent Emerald Dark Theme',
    mode: 'dark' as const,
    description:
      'Deep emerald fintech theme based on the reference dashboard UI, optimized for field-agent usage and high contrast',
  },

  colors: {
    brand: {
      primary: '#34D399',
      primaryDark: '#10B981',
      primaryGradient: ['#34D399', '#10B981'] as [string, string],
    },

    background: {
      app: '#07120D',
      card: '#0C1C16',
      cardElevated: '#10241C',
      divider: '#173328',
    },

    text: {
      primary: '#FFFFFF',
      secondary: '#E6F2EC',
      muted: '#6FAF95',
      disabled: '#466B5A',
    },

    status: {
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
      offline: '#FBBF24',
    },

    financial: {
      cash: '#34D399',
      penalty: '#F87171',
    },

    surfaceTint: {
      primarySoft: '#123326',
      successSoft: '#123326',
      warningSoft: '#332B12',
      errorSoft: '#351A1A',
      infoSoft: '#13283A',
    },
  },

  typography: {
    fontFamily: {
      primary: 'System',
      fallback: ['Roboto', 'SF Pro', 'Inter'],
    },

    scale: {
      displayXL: {
        fontSize: 30,
        lineHeight: 38,
        fontWeight: '800' as const,
      },

      pageTitle: {
        fontSize: 24,
        lineHeight: 32,
        fontWeight: '800' as const,
      },

      sectionTitle: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '700' as const,
      },

      body: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600' as const,
      },

      caption: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600' as const,
      },

      micro: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700' as const,
      },
    },

    numeric: {
      amountWeight: '800' as const,
      currencyScale: 0.9,
      negativeColor: '#F87171',
    },
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 24,
    xxl: 32,

    screenPadding: 22,
    cardPadding: 16,
    listGap: 10,
  },

  radius: {
    button: 14,
    card: 16,
    chip: 12,
    input: 14,
    action: 12,
  },

  components: {
    button: {
      height: 48,

      primary: {
        background: '#34D399',
        textColor: '#07120D',
      },

      secondary: {
        background: '#0C1C16',
        borderColor: '#214638',
        textColor: '#E6F2EC',
      },

      danger: {
        background: '#F87171',
        textColor: '#07120D',
      },
    },

    card: {
      background: '#0C1C16',
      borderColor: '#173328',
      elevation: 0,
    },

    chip: {
      height: 28,
      paddingHorizontal: 12,
      fontSize: 13,
      background: '#123326',
      textColor: '#34D399',
    },

    input: {
      height: 48,
      background: '#0B1813',
      borderColor: '#214638',
      placeholderColor: '#6FAF95',
      textColor: '#E6F2EC',
      focusBorderColor: '#34D399',
    },

    banner: {
      info: {
        background: '#13283A',
        borderColor: '#21445F',
        textColor: '#E6F2EC',
        iconColor: '#60A5FA',
      },

      warning: {
        background: '#332B12',
        borderColor: '#5A491A',
        textColor: '#FFFFFF',
        iconColor: '#FBBF24',
      },

      success: {
        background: '#123326',
        borderColor: '#205B43',
        textColor: '#FFFFFF',
        iconColor: '#34D399',
      },

      error: {
        background: '#351A1A',
        borderColor: '#5B2929',
        textColor: '#FFFFFF',
        iconColor: '#F87171',
      },
    },
  },

  icons: {
    primarySize: 24,
    secondarySize: 20,
    inlineSize: 16,
    color: '#6FAF95',
  },

  ux: {
    touchTargetMin: 48,
    offlineFirst: true,
    highContrast: true,
  },
} as const;

/**
 * Light companion theme.
 *
 * Derived from the emerald dark reference while maintaining
 * the same brand identity and semantic status colors.
 */

export const lightTheme = {
  meta: {
    name: 'Pigmy Agent Emerald Light Theme',
    mode: 'light' as const,
    description:
      'Clean emerald fintech light theme designed as the companion to the reference-inspired dark theme',
  },

  colors: {
    brand: {
      primary: '#059669',
      primaryDark: '#047857',
      primaryGradient: ['#059669', '#34D399'] as [string, string],
    },

    background: {
      app: '#F5FAF7',
      card: '#FFFFFF',
      cardElevated: '#FFFFFF',
      divider: '#DCEAE3',
    },

    text: {
      primary: '#07120D',
      secondary: '#29483A',
      muted: '#668476',
      disabled: '#9AAEA4',
    },

    status: {
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#2563EB',
      offline: '#D97706',
    },

    financial: {
      cash: '#059669',
      penalty: '#DC2626',
    },

    surfaceTint: {
      primarySoft: '#E5F7EF',
      successSoft: '#E7F8F0',
      warningSoft: '#FFF7E0',
      errorSoft: '#FEECEC',
      infoSoft: '#EAF2FF',
    },
  },

  typography: {
    fontFamily: {
      primary: 'System',
      fallback: ['Roboto', 'SF Pro', 'Inter'],
    },

    scale: {
      displayXL: {
        fontSize: 30,
        lineHeight: 38,
        fontWeight: '800' as const,
      },

      pageTitle: {
        fontSize: 24,
        lineHeight: 32,
        fontWeight: '800' as const,
      },

      sectionTitle: {
        fontSize: 18,
        lineHeight: 26,
        fontWeight: '700' as const,
      },

      body: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '600' as const,
      },

      caption: {
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '600' as const,
      },

      micro: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '700' as const,
      },
    },

    numeric: {
      amountWeight: '800' as const,
      currencyScale: 0.9,
      negativeColor: '#DC2626',
    },
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 22,
    xl: 24,
    xxl: 32,

    screenPadding: 22,
    cardPadding: 16,
    listGap: 10,
  },

  radius: {
    button: 14,
    card: 16,
    chip: 12,
    input: 14,
    action: 12,
  },

  components: {
    button: {
      height: 48,

      primary: {
        background: '#059669',
        textColor: '#FFFFFF',
      },

      secondary: {
        background: '#E5F7EF',
        borderColor: '#BCE5D2',
        textColor: '#047857',
      },

      danger: {
        background: '#DC2626',
        textColor: '#FFFFFF',
      },
    },

    card: {
      background: '#FFFFFF',
      borderColor: '#DCEAE3',
      elevation: 0,
    },

    chip: {
      height: 28,
      paddingHorizontal: 12,
      fontSize: 13,
      background: '#E5F7EF',
      textColor: '#047857',
    },

    input: {
      height: 48,
      background: '#FFFFFF',
      borderColor: '#CFE0D7',
      placeholderColor: '#668476',
      textColor: '#07120D',
      focusBorderColor: '#059669',
    },

    banner: {
      info: {
        background: '#EAF2FF',
        borderColor: '#C9DCFF',
        textColor: '#07120D',
        iconColor: '#2563EB',
      },

      warning: {
        background: '#FFF7E0',
        borderColor: '#F5D992',
        textColor: '#07120D',
        iconColor: '#D97706',
      },

      success: {
        background: '#E7F8F0',
        borderColor: '#B6E7CF',
        textColor: '#07120D',
        iconColor: '#059669',
      },

      error: {
        background: '#FEECEC',
        borderColor: '#F8C5C5',
        textColor: '#07120D',
        iconColor: '#DC2626',
      },
    },
  },

  icons: {
    primarySize: 24,
    secondarySize: 20,
    inlineSize: 16,
    color: '#668476',
  },

  ux: {
    touchTargetMin: 48,
    offlineFirst: true,
    highContrast: true,
  },
} as const;
