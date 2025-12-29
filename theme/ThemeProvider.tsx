/**
 * ThemeProvider - Manages theme state and provides theme context
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { darkTheme, lightTheme } from './tokens';
import { Theme, ThemeMode, ThemeContextValue } from './types';
import { saveThemeMode, loadThemeMode } from './storage';

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export function ThemeProvider({ children, initialMode }: ThemeProviderProps) {
  const systemColorScheme = useRNColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode || systemColorScheme || 'light');
  const [isReady, setIsReady] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    loadThemeMode().then(savedMode => {
      if (savedMode) {
        setMode(savedMode);
      } else if (systemColorScheme) {
        setMode(systemColorScheme);
      }
      setIsReady(true);
    });
  }, []);

  // Sync with system theme if no preference is saved
  useEffect(() => {
    if (isReady && systemColorScheme && !mode) {
      setMode(systemColorScheme);
    }
  }, [systemColorScheme, isReady]);

  const theme: Theme = mode === 'dark' ? darkTheme : lightTheme;
  const isDark = mode === 'dark';

  const toggleTheme = () => {
    const newMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    saveThemeMode(newMode);
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
    saveThemeMode(newMode);
  };

  const value: ThemeContextValue = {
    theme,
    isDark,
    mode,
    toggleTheme,
    setThemeMode,
  };

  // Don't render until we've loaded the persisted theme
  if (!isReady) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
