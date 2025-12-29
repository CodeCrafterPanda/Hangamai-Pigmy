/**
 * Theme Storage - Persist user's theme preference
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from './types';

const THEME_STORAGE_KEY = '@pigmy_theme_mode';

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (error) {
    console.warn('Failed to save theme mode:', error);
  }
}

export async function loadThemeMode(): Promise<ThemeMode | null> {
  try {
    const mode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return mode as ThemeMode | null;
  } catch (error) {
    console.warn('Failed to load theme mode:', error);
    return null;
  }
}

export async function clearThemeMode(): Promise<void> {
  try {
    await AsyncStorage.removeItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear theme mode:', error);
  }
}
