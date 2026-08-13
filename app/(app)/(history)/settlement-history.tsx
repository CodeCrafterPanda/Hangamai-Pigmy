/**
 * Settlement History Screen
 * Shows persisted day closures for the logged-in agent
 */
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation, formatDateTime, formatNumber } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { selectSettlementsByAgent } from '@/slices/settlements.slice';
import { selectSession } from '@/slices/settings.slice';
import { navigateToSettlementDetail } from '@/utils/navigation';
import { SettlementScope } from '@/types';

export default function SettlementHistory() {
  const { theme } = useTheme();
  const { t, language } = useTranslation();

  const session = useSelector(selectSession);
  const agentId = session.agentId || 'demo-agent';

  const settlements = useSelector((state: State) => selectSettlementsByAgent(state, agentId));

  const statusColor = (status: string) => {
    if (status === 'APPROVED') return theme.colors.status.success;
    if (status === 'REJECTED') return theme.colors.status.error;
    if (status === 'SUBMITTED') return theme.colors.brand.primary;
    return theme.colors.status.warning;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      padding: spacing(theme, 'screenPadding'),
      gap: spacing(theme, 'sm'),
    },
    card: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderLeftWidth: 4,
      padding: spacing(theme, 'sm'),
      gap: spacing(theme, 'xs'),
      overflow: 'hidden',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    businessDate: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    badgeRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'xxs'),
    },
    statusBadge: {
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xxs'),
      borderRadius: radius(theme, 'chip'),
    },
    statusText: {
      ...typography(theme, 'caption'),
      fontWeight: '700',
      letterSpacing: 0.5,
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
    varianceValue: {
      ...typography(theme, 'body'),
      fontWeight: '700',
    },
    meta: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    notes: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontStyle: 'italic',
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {settlements.length > 0 ? (
          settlements.map(settlement => {
            const color = statusColor(settlement.status);
            const submittedAt = settlement.submittedAt || settlement.updatedAt;

            const scopeColor =
              settlement.scope === SettlementScope.DELEGATED
                ? theme.colors.brand.primary
                : theme.colors.status.success;

            return (
              <Pressable
                key={settlement.id}
                onPress={() => navigateToSettlementDetail(settlement.id)}
                style={({ pressed }) => [
                  styles.card,
                  { borderLeftColor: color, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.businessDate}>{settlement.businessDate}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.statusBadge, { backgroundColor: `${scopeColor}26` }]}>
                      <Text style={[styles.statusText, { color: scopeColor }]}>
                        {t(`settlementScope.${settlement.scope}` as TranslationKey)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: `${color}26` }]}>
                      <Text style={[styles.statusText, { color }]}>
                        {t(`settlementStatus.${settlement.status}` as TranslationKey)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>{t('settlementHistory.cash')}</Text>
                  <Text style={styles.value}>₹{formatNumber(settlement.cashTotal)}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>{t('settlementHistory.upi')}</Text>
                  <Text style={styles.value}>₹{formatNumber(settlement.upiTotal)}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>{t('settlementHistory.totalCollection')}</Text>
                  <Text style={styles.value}>
                    ₹{formatNumber(settlement.totalCollection)}
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>{t('settlementHistory.declaredCashInHand')}</Text>
                  <Text style={styles.value}>₹{formatNumber(settlement.cashInHand)}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>{t('settlementHistory.variance')}</Text>
                  <Text
                    style={[
                      styles.varianceValue,
                      {
                        color:
                          settlement.variance === 0
                            ? theme.colors.status.success
                            : theme.colors.status.error,
                      },
                    ]}
                  >
                    ₹{formatNumber(settlement.variance)}
                  </Text>
                </View>

                {!!settlement.notes && <Text style={styles.notes}>{settlement.notes}</Text>}

                <Text style={styles.meta}>
                  {settlement.id.slice(0, 8)} • {formatDateTime(new Date(submittedAt), language)}
                </Text>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔒</Text>
            <Text style={styles.emptyText}>{t('settlementHistory.empty')}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
