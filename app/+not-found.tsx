import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';

export default function NotFoundScreen() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.app,
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    link: {
      paddingVertical: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'md'),
      borderRadius: radius(theme, 'button'),
      backgroundColor: theme.colors.brand.primary,
      height: theme.components.button.height,
      width: '50%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      marginBottom: spacing(theme, 'lg'),
    },
    linkText: {
      ...typography(theme, 'body'),
      fontWeight: '600',
      color: theme.colors.text.primary,
    },
  });

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <Text style={styles.title}>This screen doesn't exist.</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go to home screen!</Text>
      </Link>
    </View>
  );
}
