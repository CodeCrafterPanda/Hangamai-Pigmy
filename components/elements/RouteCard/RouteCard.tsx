import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation } from '@/i18n';
import ProgressBar from '@/components/elements/ProgressBar';
import type { Route, RouteStatus } from '@/types/RouteData';

interface RouteCardProps {
  route: Route;
  onPress?: (routeId: string) => void;
}

export default function RouteCard({ route, onPress }: RouteCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const getStatusConfig = (status: RouteStatus) => {
    switch (status) {
      case 'in_progress':
        return {
          label: t('routeCard.inProgress'),
          icon: '⏱',
          bgColor: 'rgba(244, 196, 48, 0.15)',
          textColor: '#D4834D',
          borderColor: 'rgba(212, 131, 77, 0.3)',
          leftBorderColor: '#D4834D',
        };
      case 'completed':
        return {
          label: t('routeCard.completed'),
          icon: '✓',
          bgColor: theme.colors.surfaceTint.successSoft,
          textColor: theme.colors.status.success,
          borderColor: theme.colors.status.success,
          leftBorderColor: theme.colors.status.success,
        };
      case 'not_started':
        return {
          label: t('routeCard.notStarted'),
          icon: '⏸',
          bgColor: theme.colors.background.cardElevated,
          textColor: theme.colors.text.muted,
          borderColor: theme.colors.background.divider,
          leftBorderColor: theme.colors.text.muted,
        };
    }
  };

  const statusConfig = getStatusConfig(route.status);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderLeftWidth: 4,
      borderLeftColor: statusConfig.leftBorderColor,
      overflow: 'hidden',
    },
    content: {
      padding: spacing(theme, 'sm'),
      gap: spacing(theme, 'xxs'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing(theme, 'sm'),
    },
    titleSection: {
      flex: 1,
      gap: 2,
    },
    routeName: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      fontSize: 16,
      lineHeight: 22,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: statusConfig.bgColor,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: statusConfig.borderColor,
    },
    statusIcon: {
      fontSize: 14,
      color: statusConfig.textColor,
    },
    statusText: {
      ...typography(theme, 'body'),
      color: statusConfig.textColor,
      fontWeight: '600',
    },
    progressSection: {
      gap: 2,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    progressLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    progressValue: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    statItem: {
      flex: 1,
      gap: 2,
    },
    statLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    pendingValue: {
      color: '#D4834D',
    },
  });

  const content = (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.routeName} numberOfLines={1}>
              {route.name}
            </Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{t('routeCard.collectionProgress')}</Text>
            <Text style={styles.progressValue}>{route.progress}%</Text>
          </View>
          <ProgressBar progress={route.progress} height={4} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('routeCard.totalCustomers')}</Text>
            <Text style={styles.statValue}>{route.totalCustomers}</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{t('routeCard.pending')}</Text>
            <Text style={[styles.statValue, styles.pendingValue]}>
              {route.pendingCustomers}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(route.id)}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

