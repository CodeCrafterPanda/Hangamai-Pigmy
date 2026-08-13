import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation } from '@/i18n';
import type { AttentionAlert } from '@/types/HomeData';

interface AttentionBannerProps {
  alert: AttentionAlert;
  onPress?: () => void;
}

export default function AttentionBanner({ alert, onPress }: AttentionBannerProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    container: {
      marginHorizontal: spacing(theme, 'screenPadding'),
      backgroundColor: theme.components.banner.warning.background,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.components.banner.warning.borderColor,
      borderLeftWidth: 4,
      borderLeftColor: theme.components.banner.warning.iconColor,
      padding: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      overflow: 'hidden',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: 'rgba(244, 196, 48, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      fontSize: 20,
    },
    content: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    title: {
      ...typography(theme, 'sectionTitle'),
      color: theme.components.banner.warning.textColor,
      fontWeight: '600',
    },
    description: {
      ...typography(theme, 'body'),
      color: theme.components.banner.warning.iconColor,
      fontWeight: '700',
      fontSize: 16,
      lineHeight: 20,
    },
    arrow: {
      ...typography(theme, 'pageTitle'),
      color: theme.components.banner.warning.iconColor,
      opacity: 0.6,
    },
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.8 : 1 }]}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>⚠️</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('attentionBanner.title')}</Text>
        <Text style={styles.description}>
          {t('attentionBanner.description', {
            overdue: alert.overdueCustomers,
            pendingSync: alert.pendingSync,
          })}
        </Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

