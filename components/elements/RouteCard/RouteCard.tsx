import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import ProgressBar from '@/components/elements/ProgressBar';
import type { Route, RouteStatus } from '@/types/RouteData';

interface RouteCardProps {
  route: Route;
  onPress?: (routeId: string) => void;
}

export default function RouteCard({ route, onPress }: RouteCardProps) {
  const { theme } = useTheme();

  const getStatusConfig = (status: RouteStatus) => {
    switch (status) {
      case 'in_progress':
        return {
          label: 'In Progress',
          icon: '⏱',
          bgColor: 'rgba(244, 196, 48, 0.15)',
          textColor: '#D4834D',
          borderColor: 'rgba(212, 131, 77, 0.3)',
        };
      case 'completed':
        return {
          label: 'Completed',
          icon: '✓',
          bgColor: theme.colors.surfaceTint.successSoft,
          textColor: theme.colors.status.success,
          borderColor: theme.colors.status.success,
        };
      case 'not_started':
        return {
          label: 'Not Started',
          icon: '⏸',
          bgColor: theme.colors.background.cardElevated,
          textColor: theme.colors.text.muted,
          borderColor: theme.colors.background.divider,
        };
    }
  };

  const statusConfig = getStatusConfig(route.status);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'md'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing(theme, 'sm'),
    },
    titleSection: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    routeName: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      fontSize: 18,
    },
    routeId: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: statusConfig.bgColor,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: statusConfig.borderColor,
    },
    statusIcon: {
      fontSize: 12,
    },
    statusText: {
      ...typography(theme, 'caption'),
      color: statusConfig.textColor,
      fontWeight: '600',
    },
    progressSection: {
      gap: spacing(theme, 'xs'),
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
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'md'),
    },
    statItem: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    statLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: {
      ...typography(theme, 'pageTitle'),
      fontSize: 24,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    pendingValue: {
      color: '#D4834D',
    },
  });

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.routeName}>{route.name}</Text>
          <Text style={styles.routeId}>ID: {route.routeId}</Text>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
          <Text style={styles.statusText}>{statusConfig.label}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Collection Progress</Text>
          <Text style={styles.progressValue}>{route.progress}%</Text>
        </View>
        <ProgressBar progress={route.progress} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Customers</Text>
          <Text style={styles.statValue}>{route.totalCustomers}</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, styles.pendingValue]}>
            {route.pendingCustomers}
          </Text>
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

