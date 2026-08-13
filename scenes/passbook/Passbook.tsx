import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation, formatNumber } from '@/i18n';
import NestedScreenHeader from '@/components/elements/NestedScreenHeader';
import BottomSheet from '@/components/elements/BottomSheet';
import Receipt from '@/scenes/receipt';
import { selectAccountById, selectSchemeForAccount } from '@/slices/accounts.slice';
import { selectCustomerById } from '@/slices/customers.slice';
import { selectAccountBalance, selectLedgerEntriesByAccount } from '@/slices/ledger.slice';
import { selectBranchTimezone } from '@/slices/settings.slice';
import { calculateAccountBalance, getBusinessDate } from '@/utils/businessLogic';
import { LedgerType, type LedgerEntry } from '@/types';

interface PassbookProps {
  /** Account id — a passbook belongs to one account, not to the customer as a whole. */
  accountId?: string;
}

interface PassbookRow {
  entry: LedgerEntry;
  /** Branch business date the entry was posted on. */
  businessDate: string;
  /** Signed effect this entry had on the balance, per the ledger's own rules. */
  delta: number;
  /** Balance after this entry, replayed from the oldest entry forward. */
  balanceAfter: number;
  receiptNo?: string;
}

/**
 * Read-only ledger history for one account. Every figure on this screen is derived from the
 * persisted ledger entries through the existing balance primitives — nothing is recomputed
 * with its own rules, and no entry is created, edited or reordered in the store.
 */
export default function Passbook({ accountId }: PassbookProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [receiptCollectionId, setReceiptCollectionId] = useState<string | undefined>(undefined);

  const timezone = useSelector(selectBranchTimezone);
  const account = useSelector((state: State) =>
    accountId ? selectAccountById(state, accountId) : undefined,
  );
  const customer = useSelector((state: State) =>
    account ? selectCustomerById(state, account.customerId) : undefined,
  );
  const scheme = useSelector((state: State) =>
    accountId ? selectSchemeForAccount(state, accountId) : undefined,
  );
  const balance = useSelector((state: State) =>
    accountId ? selectAccountBalance(state, accountId) : 0,
  );
  // selectLedgerEntriesByAccount filters and sorts on every call, so shallowEqual keeps the
  // array identity stable while the (immutable) entries themselves are unchanged.
  const entries = useSelector(
    (state: State) => (accountId ? selectLedgerEntriesByAccount(state, accountId) : []),
    shallowEqual,
  );
  const collectionsById = useSelector((state: State) => state.collections.collections.byId);

  const rows = useMemo<PassbookRow[]>(() => {
    // selectLedgerEntriesByAccount hands back newest-first, but a running balance only makes
    // sense replayed oldest-first, so the ascending copy drives the totals and the result is
    // flipped back for newest-first display.
    let balanceAfter = 0;

    const ascendingRows = [...entries].reverse().map(entry => {
      // calculateAccountBalance owns the per-entry sign rules; feeding it one entry at a time
      // accumulates exactly the total it would produce over the whole array.
      const delta = calculateAccountBalance([entry]);
      balanceAfter += delta;

      return {
        entry,
        businessDate: getBusinessDate(entry.postedAt, timezone),
        delta,
        balanceAfter,
        receiptNo: entry.collectionId
          ? collectionsById[entry.collectionId]?.receiptNo
          : undefined,
      };
    });

    return ascendingRows.reverse();
  }, [entries, timezone, collectionsById]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      padding: spacing(theme, 'screenPadding'),
      gap: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xxl'),
    },
    card: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      padding: spacing(theme, 'lg'),
      gap: spacing(theme, 'sm'),
    },
    balanceCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderTopWidth: 3,
      borderTopColor: theme.colors.brand.primary,
      padding: spacing(theme, 'lg'),
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
    },
    balanceLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      letterSpacing: 1,
    },
    balanceValue: {
      ...typography(theme, 'displayXL'),
      fontSize: 34,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    balanceHint: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    customerName: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    customerCode: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.background.divider,
      marginVertical: spacing(theme, 'xxs'),
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    label: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    value: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      flexShrink: 1,
      textAlign: 'right',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    sectionCount: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    entryList: {
      gap: spacing(theme, 'sm'),
    },
    entryCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      borderLeftWidth: 4,
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'xs'),
      overflow: 'hidden',
    },
    entryTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    typeBadge: {
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xxs'),
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
    },
    typeBadgeText: {
      ...typography(theme, 'micro'),
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    entryAmount: {
      ...typography(theme, 'sectionTitle'),
      fontWeight: '700',
    },
    entryNarration: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    entryMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    entryMeta: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      flexShrink: 1,
    },
    entryBalance: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    listHint: {
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
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    emptyHint: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
  });

  const formatAmount = (amount: number) =>
    `₹ ${formatNumber(amount, { minimumFractionDigits: 2 })}`;

  if (!account) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <NestedScreenHeader title={t('passbook.title')} />
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyText}>{t('passbook.notFoundTitle')}</Text>
          <Text style={styles.emptyHint}>{t('passbook.notFoundHint')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const entryTypeColor = (entry: LedgerEntry) => {
    switch (entry.entryType) {
      case LedgerType.REVERSAL:
        return theme.colors.status.error;
      case LedgerType.PENALTY:
        return theme.colors.status.warning;
      case LedgerType.ADJUSTMENT:
        return theme.colors.status.info;
      default:
        return theme.colors.status.success;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NestedScreenHeader title={t('passbook.title')} subtitle={customer?.fullName} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('passbook.accountBalance')}</Text>
          <Text style={styles.balanceValue}>{formatAmount(balance)}</Text>
          <Text style={styles.balanceHint}>{t('passbook.balanceHint')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.customerName}>{customer?.fullName || '—'}</Text>
          <Text style={styles.customerCode}>{customer?.customerCode || '—'}</Text>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>{t('passbook.accountNumber')}</Text>
            <Text style={styles.value}>{account.accountNumber}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('passbook.scheme')}</Text>
            <Text style={styles.value}>
              {scheme ? `${scheme.name} · ${t(`schemeFrequency.${scheme.frequency}`)}` : '—'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('passbook.installment')}</Text>
            <Text style={styles.value}>{formatAmount(account.installmentAmount)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('passbook.accountStatus')}</Text>
            <Text style={styles.value}>{t(`accountStatus.${account.status}`)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('passbook.openedOn')}</Text>
            <Text style={styles.value}>{getBusinessDate(account.openedAt, timezone)}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('passbook.transactionsTitle')}</Text>
          <Text style={styles.sectionCount}>
            {t(
              rows.length === 1 ? 'passbook.transactionCountOne' : 'passbook.transactionCountOther',
              { count: rows.length },
            )}
          </Text>
        </View>

        {rows.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyHint}>{t('passbook.noTransactions')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.entryList}>
              {rows.map(row => {
                const typeColor = entryTypeColor(row.entry);
                const hasReceipt = Boolean(row.entry.collectionId);

                const content = (
                  <View style={[styles.entryCard, { borderLeftColor: typeColor }]}>
                    <View style={styles.entryTopRow}>
                      <View style={[styles.typeBadge, { borderColor: typeColor }]}>
                        <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                          {t(`ledgerEntryType.${row.entry.entryType}`)}
                        </Text>
                      </View>
                      <Text style={[styles.entryAmount, { color: typeColor }]}>
                        {formatAmount(row.delta)}
                      </Text>
                    </View>

                    <Text style={styles.entryNarration}>{row.entry.narration}</Text>

                    <View style={styles.entryMetaRow}>
                      <Text style={styles.entryMeta} numberOfLines={1}>
                        {row.businessDate}
                        {row.receiptNo ? ` · ${t('passbook.receiptReference')} ${row.receiptNo}` : ''}
                      </Text>
                      <Text style={styles.entryBalance}>
                        {t('passbook.runningBalance')} {formatAmount(row.balanceAfter)}
                      </Text>
                    </View>
                  </View>
                );

                if (!hasReceipt) {
                  return <View key={row.entry.id}>{content}</View>;
                }

                return (
                  <Pressable
                    key={row.entry.id}
                    onPress={() => setReceiptCollectionId(row.entry.collectionId)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
                    {content}
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.listHint}>
              {t('passbook.newestFirst')} · {t('passbook.receiptHint')}
            </Text>
          </>
        )}
      </ScrollView>

      <BottomSheet
        isOpen={Boolean(receiptCollectionId)}
        onClose={() => setReceiptCollectionId(undefined)}>
        {receiptCollectionId && (
          <Receipt
            collectionId={receiptCollectionId}
            onClose={() => setReceiptCollectionId(undefined)}
          />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
