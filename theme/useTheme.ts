/**
 * useTheme Hook - Access theme context in components
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';
import { ThemeContextValue } from './types';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

export default useTheme;
