/**
 * useTranslation Hook - Access the translator and language selection in components
 */

import { useContext } from 'react';
import { LanguageContext } from './LanguageProvider';
import type { LanguageContextValue } from './types';

export function useTranslation(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  return context;
}

export default useTranslation;
