/**
 * Theme Tokens - Dark and Light Mode
 * Source: THEME.md
 */

export const darkTheme = {
  meta: {
    name: 'Pigmy Agent Dark Theme',
    mode: 'dark' as const,
    description: 'Field-agent fintech UI optimized for offline usage and high contrast',
  },

  colors: {
    brand: {
      primary: '#3B6FFF',
      primaryDark: '#2F5AE8',
      primaryGradient: ['#3B6FFF', '#5A8CFF'] as [string, string],
    },

    background: {
      app: '#0B1220',
      card: '#121A2B',
      cardElevated: '#151F33',
      divider: '#1F2A44',
    },

    text: {
      primary: '#FFFFFF',
      secondary: '#B6C0D6',
      muted: '#7C89A8',
      disabled: '#5A657F',
    },

    status: {
      success: '#2ED47A',
      warning: '#F4C430',
      error: '#FF4D4F',
      info: '#4DA3FF',
      offline: '#FFC107',
    },

    financial: {
      cash: '#38D39F',
      penalty: '#FF6B6B',
    },

    // Add soft tints for dark mode (derived for consistency)
    surfaceTint: {
      primarySoft: '#1A2B4D',
      successSoft: '#1A2F25',
      warningSoft: '#332A14',
      errorSoft: '#331A1A',
      infoSoft: '#1A2B4D',
    },
  },

  typography: {
    fontFamily: {
      primary: 'Roboto',
      fallback: ['System UI', 'SF Pro', 'Inter'],
    },

    scale: {
      displayXL: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '600' as const,
      },
      pageTitle: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '600' as const,
      },
      sectionTitle: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500' as const,
      },
      body: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400' as const,
      },
      caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400' as const,
      },
      micro: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '500' as const,
      },
    },

    numeric: {
      amountWeight: '600' as const,
      currencyScale: 0.9,
      negativeColor: '#FF6B6B',
    },
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,

    screenPadding: 12,
    cardPadding: 12,
    listGap: 12,
  },

  radius: {
    button: 12,
    card: 14,
    chip: 12,
    input: 10,
    action: 8,
  },

  components: {
    button: {
      height: 48,
      primary: {
        background: '#3B6FFF',
        textColor: '#FFFFFF',
      },
      secondary: {
        background: '#1A2440',
        borderColor: '#2A3A66',
        textColor: '#FFFFFF',
      },
      danger: {
        background: '#FF4D4F',
        textColor: '#FFFFFF',
      },
    },

    card: {
      background: '#121A2B',
      borderColor: '#1F2A44',
      elevation: 2,
    },

    chip: {
      height: 24,
      paddingHorizontal: 12,
      fontSize: 11,
      background: '#1A2440',
      textColor: '#B6C0D6',
    },

    input: {
      height: 48,
      background: '#121A2B',
      borderColor: '#2A3A66',
      placeholderColor: '#7C89A8',
      textColor: '#FFFFFF',
      focusBorderColor: '#3B6FFF',
    },

    banner: {
      info: {
        background: '#1A2B4D',
        borderColor: '#2A3A66',
        textColor: '#FFFFFF',
        iconColor: '#4DA3FF',
      },
      warning: {
        background: '#332A14',
        borderColor: '#4D4014',
        textColor: '#FFFFFF',
        iconColor: '#F4C430',
      },
      success: {
        background: '#1A2F25',
        borderColor: '#2A4A35',
        textColor: '#FFFFFF',
        iconColor: '#2ED47A',
      },
      error: {
        background: '#331A1A',
        borderColor: '#4D2A2A',
        textColor: '#FFFFFF',
        iconColor: '#FF4D4F',
      },
    },
  },

  icons: {
    primarySize: 24,
    secondarySize: 20,
    inlineSize: 16,
    color: '#B6C0D6',
  },

  ux: {
    touchTargetMin: 48,
    offlineFirst: true,
    highContrast: true,
  },
} as const;

export const lightTheme = {
  meta: {
    name: 'Pigmy Agent Light Theme',
    mode: 'light' as const,
    description: 'High-contrast light theme designed to pair well with the Pigmy Agent Dark Theme',
  },

  colors: {
    brand: {
      primary: '#2F5AE8',
      primaryDark: '#244AD0',
      primaryGradient: ['#2F5AE8', '#4D7DFF'] as [string, string],
    },

    background: {
      app: '#F6F8FC',
      card: '#FFFFFF',
      cardElevated: '#FFFFFF',
      divider: '#E6ECF5',
    },

    text: {
      primary: '#0B1220',
      secondary: '#3E4B66',
      muted: '#6B7A99',
      disabled: '#A2AEC6',
    },

    status: {
      success: '#1FAE67',
      warning: '#C98A00',
      error: '#D92D20',
      info: '#2563EB',
      offline: '#B45309',
    },

    financial: {
      cash: '#148A57',
      penalty: '#D92D20',
    },

    surfaceTint: {
      primarySoft: '#EAF0FF',
      successSoft: '#EAF9F1',
      warningSoft: '#FFF6E0',
      errorSoft: '#FFE8E7',
      infoSoft: '#EAF2FF',
    },
  },

  typography: {
    fontFamily: {
      primary: 'Roboto',
      fallback: ['System UI', 'SF Pro', 'Inter'],
    },

    scale: {
      displayXL: {
        fontSize: 32,
        lineHeight: 40,
        fontWeight: '600' as const,
      },
      pageTitle: {
        fontSize: 20,
        lineHeight: 28,
        fontWeight: '600' as const,
      },
      sectionTitle: {
        fontSize: 16,
        lineHeight: 24,
        fontWeight: '500' as const,
      },
      body: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400' as const,
      },
      caption: {
        fontSize: 12,
        lineHeight: 16,
        fontWeight: '400' as const,
      },
      micro: {
        fontSize: 10,
        lineHeight: 14,
        fontWeight: '500' as const,
      },
    },

    numeric: {
      amountWeight: '600' as const,
      currencyScale: 0.9,
      negativeColor: '#D92D20',
    },
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,

    screenPadding: 12,
    cardPadding: 12,
    listGap: 12,
  },

  radius: {
    button: 12,
    card: 14,
    chip: 12,
    input: 10,
    action: 8,
  },

  components: {
    button: {
      height: 48,
      primary: {
        background: '#2F5AE8',
        textColor: '#FFFFFF',
      },
      secondary: {
        background: '#EEF3FF',
        borderColor: '#D6E2FF',
        textColor: '#0B1220',
      },
      danger: {
        background: '#D92D20',
        textColor: '#FFFFFF',
      },
    },

    card: {
      background: '#FFFFFF',
      borderColor: '#E6ECF5',
      elevation: 0,
    },

    chip: {
      height: 24,
      paddingHorizontal: 12,
      fontSize: 11,
      background: '#EEF3FF',
      textColor: '#244AD0',
    },

    input: {
      height: 48,
      background: '#FFFFFF',
      borderColor: '#D6DEEB',
      placeholderColor: '#6B7A99',
      textColor: '#0B1220',
      focusBorderColor: '#2F5AE8',
    },

    banner: {
      info: {
        background: '#EAF2FF',
        borderColor: '#CFE0FF',
        textColor: '#0B1220',
        iconColor: '#2563EB',
      },
      warning: {
        background: '#FFF6E0',
        borderColor: '#FFE2A8',
        textColor: '#0B1220',
        iconColor: '#C98A00',
      },
      success: {
        background: '#EAF9F1',
        borderColor: '#BDEFD1',
        textColor: '#0B1220',
        iconColor: '#1FAE67',
      },
      error: {
        background: '#FFE8E7',
        borderColor: '#FFC1BD',
        textColor: '#0B1220',
        iconColor: '#D92D20',
      },
    },
  },

  icons: {
    primarySize: 24,
    secondarySize: 20,
    inlineSize: 16,
    color: '#3E4B66',
  },

  ux: {
    touchTargetMin: 48,
    offlineFirst: true,
    highContrast: true,
    switchingNotes: {
      preserveBrandHue: true,
      keepPrimaryButtonsSolid: true,
      useSoftTintsForChipsAndBanners: true,
      keepAmountsHighEmphasis: true,
    },
  },
} as const;

export type ThemeMode = 'light' | 'dark';
