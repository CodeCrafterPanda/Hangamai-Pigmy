import { Text, View, StyleSheet } from 'react-native';
import GradientButton from '@/components/elements/GradientButton';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, typography, spacing } from '@/theme';
import { useTranslation } from '@/i18n';

export default function Details() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { from } = useLocalSearchParams();

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background.app,
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    title: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      marginBottom: spacing(theme, 'lg'),
    },
    button: {
      width: '50%',
    },
  });

  return (
    <View style={styles.root}>
      <Text style={styles.title}>
        {t('details.title', { from: String(from ?? '') })}
      </Text>
      <GradientButton
        title={t('details.goBack')}
        style={styles.button}
        useThemeGradient
        onPress={() => router.back()}
      />
    </View>
  );
}
