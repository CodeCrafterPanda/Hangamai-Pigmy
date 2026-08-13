/**
 * Language Storage - Persist the user's selected display language
 *
 * Uses its own AsyncStorage key rather than the STORAGE_KEYS domain store: the selected
 * language is a device display preference, not branch/agent business data.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from './types';

const LANGUAGE_STORAGE_KEY = '@pigmy_language';

export async function saveLanguage(language: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.warn('Failed to save language:', error);
  }
}

/**
 * Returns the raw persisted value. The caller validates it against the registered
 * languages, so a code left behind by an older build can never select a missing dictionary.
 */
export async function loadLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to load language:', error);
    return null;
  }
}

export async function clearLanguage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear language:', error);
  }
}
