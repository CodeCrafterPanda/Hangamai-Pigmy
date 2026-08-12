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
  // App is dark-first (emerald dark theme). Prefer explicit initialMode, else dark.
  const [mode, setMode] = useState<ThemeMode>('dark');
  const [isReady, setIsReady] = useState(false);

  // Load persisted theme on mount
  useEffect(() => {
    loadThemeMode().then(savedMode => {
      if (savedMode === 'dark' || savedMode === 'light') {
        setMode(savedMode);
      } else if (initialMode) {
        setMode(initialMode);
      } else if (systemColorScheme === 'dark' || systemColorScheme === 'light') {
        // No saved preference — follow system, but only once at boot
        setMode(systemColorScheme);
      } else {
        setMode('dark');
      }
      setIsReady(true);
    });
  }, []);

  const theme = (mode === 'dark' ? darkTheme : lightTheme) as Theme;
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
