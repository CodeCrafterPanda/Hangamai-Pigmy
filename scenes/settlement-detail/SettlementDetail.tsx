import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import NestedScreenHeader from '@/components/elements/NestedScreenHeader';
import { selectSettlementById } from '@/slices/settlements.slice';
import { selectAgentById } from '@/slices/settings.slice';
import { SettlementScope } from '@/types';

interface SettlementDetailProps {
  settlementId?: string;
}

/**
 * Read-only view of a historical day closure. Displays the persisted Settlement record
 * only — it never mutates the settlement or any collection.
 */
export default function SettlementDetail({ settlementId }: SettlementDetailProps) {
  const { theme } = useTheme();

  const settlement = useSelector((state: State) =>
    settlementId ? selectSettlementById(state, settlementId) : undefined
  );

  const agent = useSelector((state: State) =>
    settlement ? selectAgentById(state, settlement.agentId) : undefined
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      padding: spacing(theme, 'screenPadding'),
      gap: spacing(theme, 'md'),
    },
    headerCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      padding: spacing(theme, 'lg'),
      gap: spacing(theme, 'xs'),
    },
    dateLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    dateValue: {
      ...typography(theme, 'displayXL'),
      fontSize: 26,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      marginTop: spacing(theme, 'xxs'),
    },
    badge: {
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xxs'),
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
    },
    badgeText: {
      ...typography(theme, 'caption'),
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      padding: spacing(theme, 'lg'),
      gap: spacing(theme, 'sm'),
    },
    cardTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    value: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing(theme, 'sm'),
      borderTopWidth: 1,
      borderTopColor: theme.colors.background.divider,
    },
    totalLabel: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    totalValue: {
      ...typography(theme, 'pageTitle'),
      fontSize: 22,
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
    varianceValue: {
      ...typography(theme, 'sectionTitle'),
      fontWeight: '700',
    },
    notes: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
    },
    meta: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontSize: 11,
    },
    readOnlyHint: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
    emptyState: {
      padding: spacing(theme, 'xxl'),
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    emptyIcon: {
      fontSize: 48,
      opacity: 0.3,
    },
    emptyText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
  });

  if (!settlement) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <NestedScreenHeader title="Settlement Details" />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>Settlement not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isDelegated = settlement.scope === SettlementScope.DELEGATED;
  const scopeLabel = isDelegated ? 'Delegated' : 'Primary';
  const scopeColor = isDelegated ? theme.colors.brand.primary : theme.colors.status.success;
  const statusColor =
    settlement.status === 'APPROVED'
      ? theme.colors.status.success
      : settlement.status === 'REJECTED'
        ? theme.colors.status.error
        : settlement.status === 'SUBMITTED'
          ? theme.colors.brand.primary
          : theme.colors.status.warning;
  const varianceColor =
    settlement.variance === 0 ? theme.colors.status.success : theme.colors.status.error;

  const formatAmount = (amount: number) =>
    `₹ ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NestedScreenHeader title="Settlement Details" subtitle={scopeLabel} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Text style={styles.dateLabel}>BUSINESS DATE</Text>
          <Text style={styles.dateValue}>{settlement.businessDate}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { borderColor: scopeColor }]}>
              <Text style={[styles.badgeText, { color: scopeColor }]}>{settlement.scope}</Text>
            </View>
            <View style={[styles.badge, { borderColor: statusColor }]}>
              <Text style={[styles.badgeText, { color: statusColor }]}>{settlement.status}</Text>
            </View>
          </View>
          <Text style={styles.meta}>
            Agent: {agent?.name || settlement.agentId}
            {agent?.agentCode ? ` (${agent.agentCode})` : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Collections</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Cash collected</Text>
            <Text style={styles.value}>{formatAmount(settlement.cashTotal)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>UPI collected</Text>
            <Text style={styles.value}>{formatAmount(settlement.upiTotal)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total collection</Text>
            <Text style={styles.totalValue}>{formatAmount(settlement.totalCollection)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reconciliation</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Expected cash (system)</Text>
            <Text style={styles.value}>{formatAmount(settlement.cashTotal)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Declared physical cash</Text>
            <Text style={styles.value}>{formatAmount(settlement.cashInHand)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Variance</Text>
            <Text style={[styles.varianceValue, { color: varianceColor }]}>
              {formatAmount(settlement.variance)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Reason / Notes</Text>
          <Text style={styles.notes}>{settlement.notes || '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Record</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Submitted</Text>
            <Text style={styles.value}>
              {settlement.submittedAt
                ? new Date(settlement.submittedAt).toLocaleString('en-IN')
                : 'Not submitted'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Created</Text>
            <Text style={styles.value}>
              {new Date(settlement.createdAt).toLocaleString('en-IN')}
            </Text>
          </View>

          <Text style={styles.meta}>ID: {settlement.id}</Text>
        </View>

        <Text style={styles.readOnlyHint}>
          Historical settlement — read only. Collection history is never changed by a closure.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
