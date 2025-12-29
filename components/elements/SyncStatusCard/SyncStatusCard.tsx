import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';

interface SyncStatusCardProps {
  pendingCount: number;
  lastSyncTime: string;
}

export default function SyncStatusCard({ pendingCount, lastSyncTime }: SyncStatusCardProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
      padding: spacing(theme, 'lg'),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftSection: {
      flex: 1,
      gap: spacing(theme, 'sm'),
    },
    label: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      fontWeight: '500',
    },
    count: {
      ...typography(theme, 'displayXL'),
      fontSize: 36,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    lastSyncContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    clockIcon: {
      fontSize: 16,
      color: theme.colors.text.muted,
    },
    lastSyncText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    syncIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.background.cardElevated,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    syncIconInner: {
      fontSize: 28,
      color: theme.colors.brand.primary,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.label}>Sync Status</Text>
        <Text style={styles.count}>{pendingCount} Pending</Text>
        <View style={styles.lastSyncContainer}>
          <Text style={styles.clockIcon}>🕐</Text>
          <Text style={styles.lastSyncText}>Last successful sync: {lastSyncTime}</Text>
        </View>
      </View>

      <View style={styles.syncIcon}>
        <Text style={styles.syncIconInner}>🔄</Text>
      </View>
    </View>
  );
}

