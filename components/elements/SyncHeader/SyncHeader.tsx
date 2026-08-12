import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing } from '@/theme';

/**
 * Root Sync tab header — same shell language as HistoryHeader / ProfileHeader.
 * No back arrow; Sync is a bottom-tab root destination.
 */
export default function SyncHeader() {
  const { theme } = useTheme();

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
    offlineIcon: {
      fontSize: 22,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>Offline Queue</Text>
        <Text style={styles.subtitle}>Pending transactions waiting to sync</Text>
      </View>
      <Text style={styles.offlineIcon}>📴</Text>
    </View>
  );
}
