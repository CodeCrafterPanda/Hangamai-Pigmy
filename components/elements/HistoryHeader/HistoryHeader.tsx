import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing } from '@/theme';
import { useTranslation } from '@/i18n';

export default function HistoryHeader() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'xs'),
      paddingBottom: spacing(theme, 'xs'),
    },
    leftSection: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    subtitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>{t('collectionsHistory.title')}</Text>
        <Text style={styles.subtitle}>{t('collectionsHistory.subtitle')}</Text>
      </View>
    </View>
  );
}

