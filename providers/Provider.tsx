import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as ReduxProvider } from 'react-redux';
import { ThemeProvider } from '@/theme';
import useColorScheme from '@/hooks/useColorScheme';
import store from '@/utils/store';
import 'react-native-reanimated';

function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useColorScheme();
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

export default function Provider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <ThemeProvider>
          <NavigationWrapper>{children}</NavigationWrapper>
        </ThemeProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
