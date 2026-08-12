import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider, useTheme } from '@/theme';
import { LanguageProvider } from '@/i18n';
import store from '@/utils/store';
import 'react-native-reanimated';

function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { isDark, theme } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.brand.primary,
      background: theme.colors.background.app,
      card: theme.colors.background.card,
      text: theme.colors.text.primary,
      border: theme.colors.background.divider,
      notification: theme.colors.status.error,
    },
  };

  return <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>;
}

export default function Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <ThemeProvider>
          <LanguageProvider>
            <NavigationWrapper>{children}</NavigationWrapper>
          </LanguageProvider>
        </ThemeProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
