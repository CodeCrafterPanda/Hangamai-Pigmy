import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import { selectCollectionsNeedingSync, selectAllCollections } from '@/slices/collections.slice';
import { selectSession } from '@/slices/settings.slice';
import SyncStatusCard from '@/components/elements/SyncStatusCard';

export default function SyncStatus() {
  const router = useRouter();
  const { theme } = useTheme();

  // Get session
  const session = useSelector(selectSession);
  const timezone = useSelector((state: State) => state.settings.branchSettings.timezone);
  const agentId = session.agentId || 'demo-agent';

  // Get today's business date
  const today = new Date();
  const todayBusinessDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

  // Get collections needing sync (only TODAY's)
  const needsSyncCollections = useSelector(selectCollectionsNeedingSync);
  const allCollections = useSelector(selectAllCollections);

  // Filter for current agent and TODAY only
  const todayNeedsSyncCollections = useMemo(() => {
    return needsSyncCollections.filter(c => {
      const collectionDate = c.collectedAt.split('T')[0]; // Get YYYY-MM-DD
      return c.collectedByAgentId === agentId && collectionDate === todayBusinessDate;
    });
  }, [needsSyncCollections, agentId, todayBusinessDate]);

  const todayAllCollections = useMemo(() => {
    return allCollections.filter(c => {
      const collectionDate = c.collectedAt.split('T')[0];
      return c.collectedByAgentId === agentId && collectionDate === todayBusinessDate;
    });
  }, [allCollections, agentId, todayBusinessDate]);

  const syncedCount = todayAllCollections.filter(c => c.status === 'SYNCED').length;
  const pendingCount = todayNeedsSyncCollections.length;
  const totalCount = todayAllCollections.length;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      paddingVertical: spacing(theme, 'md'),
    },
    statsSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
    },
    statsGrid: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      padding: spacing(theme, 'md'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      gap: spacing(theme, 'xs'),
    },
    pendingCard: {
      backgroundColor: theme.colors.surfaceTint.warningSoft,
      borderColor: theme.colors.status.warning,
    },
    syncedCard: {
      backgroundColor: theme.colors.surfaceTint.successSoft,
      borderColor: theme.colors.status.success,
    },
    statLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
      textTransform: 'uppercase',
      fontSize: 10,
    },
    statValue: {
      ...typography(theme, 'displayXL'),
      fontSize: 32,
      fontWeight: '700',
    },
    pendingValue: {
      color: theme.colors.status.warning,
    },
    syncedValue: {
      color: theme.colors.status.success,
    },
    section: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(theme, 'md'),
    },
    sectionTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    viewAllButton: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    transactionsList: {
      gap: spacing(theme, 'sm'),
    },
    emptyState: {
      padding: spacing(theme, 'xxl'),
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    emptyIcon: {
      fontSize: 64,
      opacity: 0.3,
    },
    emptyTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    emptyText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
  });

  const handleViewAllPending = () => {
    router.push('/(app)/(history)/offline-queue');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.pendingCard]}>
              <Text style={styles.statLabel}>Pending Sync</Text>
              <Text style={[styles.statValue, styles.pendingValue]}>{pendingCount}</Text>
            </View>

            <View style={[styles.statCard, styles.syncedCard]}>
              <Text style={styles.statLabel}>Synced</Text>
              <Text style={[styles.statValue, styles.syncedValue]}>{syncedCount}</Text>
            </View>
          </View>
        </View>

        {/* Pending Transactions */}
        {pendingCount > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending Sync</Text>
              <Pressable onPress={handleViewAllPending}>
                <Text style={styles.viewAllButton}>View All</Text>
              </Pressable>
            </View>

            <View style={styles.transactionsList}>
              {todayNeedsSyncCollections.slice(0, 5).map(collection => (
                <SyncStatusCard key={collection.id} collection={collection} />
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>All Synced!</Text>
            <Text style={styles.emptyText}>
              All your collections have been synced to the server
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

