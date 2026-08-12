import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import { selectSession, selectBranchTimezone } from '@/slices/settings.slice';
import {
  createSettlement,
  submitSettlement,
  revertSettlementSubmission,
  updateSettlement,
  persistSettlements,
  selectSettlementByAgentAndDate,
  selectScopedDayCollections,
  selectCashInHand,
} from '@/slices/settlements.slice';
import { calculateSettlementSummary, calculateVariance, getCurrentBusinessDate } from '@/utils/businessLogic';
import { SettlementScope } from '@/types';
import NestedScreenHeader from '@/components/elements/NestedScreenHeader';

interface SettlementProps {
  scope?: SettlementScope;
}

export default function Settlement({ scope = SettlementScope.PRIMARY }: SettlementProps) {
  const router = useRouter();
  const dispatch = useDispatch<Dispatch>();
  const store = useStore<State>();
  const { theme } = useTheme();
  const [actualCash, setActualCash] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Guards the day closure against a second tap landing while the first is still in flight
  const isSubmittingRef = useRef(false);

  const session = useSelector(selectSession);
  const timezone = useSelector(selectBranchTimezone);
  const agentId = session.agentId || 'demo-agent';
  const branchId = session.branchId || 'demo-branch';

  // Settlement is whole-business-day closure keyed by agentId + businessDate, always
  // resolved from the branch timezone rather than device-local "today".
  const businessDate = getCurrentBusinessDate(timezone);

  // Only this scope's collections are closed by this settlement; PRIMARY and DELEGATED
  // books are never merged into one closure.
  const dayCollections = useSelector((state: State) =>
    selectScopedDayCollections(state, agentId, businessDate, scope)
  );

  const existingSettlement = useSelector((state: State) =>
    selectSettlementByAgentAndDate(state, agentId, businessDate, scope)
  );

  const unsettledCashInHand = useSelector((state: State) =>
    selectCashInHand(state, agentId, businessDate, scope)
  );

  const summary = useMemo(() => calculateSettlementSummary(dayCollections), [dayCollections]);

  const isClosed = !!existingSettlement && existingSettlement.status !== 'DRAFT';

  // Declared physical cash count — Settlement.cashInHand, not the dashboard cash-in-hand
  const actualCashAmount = isClosed
    ? existingSettlement!.cashInHand
    : parseFloat(actualCash) || 0;
  // Variance is a physical-cash figure only: declared cash vs system-expected CASH.
  // UPI never becomes physical cash and must never enter this calculation.
  const variance = isClosed
    ? existingSettlement!.variance
    : calculateVariance(actualCashAmount, summary.cashTotal);
  const isPerfectMatch = variance === 0;
  const requiresReason = variance !== 0 && !reason.trim();

  // System-generated informational prefix, held separately from the agent's own reason so
  // re-renders and repeated submits can never duplicate it inside the text the agent edits.
  const upiNotePrefix =
    summary.upiTotal > 0
      ? `UPI transaction of ₹${summary.upiTotal.toLocaleString('en-IN')}.`
      : '';

  const composeNotes = () => [upiNotePrefix, reason.trim()].filter(Boolean).join(' ');

  const scopeLabel = scope === SettlementScope.DELEGATED ? 'Delegated' : 'Primary';

  const formattedBusinessDate = useMemo(() => {
    const parsed = new Date(`${businessDate}T00:00:00`);
    return parsed.toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [businessDate]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xxl') + 80,
    },
    dateSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
      gap: spacing(theme, 'xxs'),
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
      fontSize: 28,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    closedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
      padding: spacing(theme, 'md'),
      borderRadius: radius(theme, 'input'),
      backgroundColor: 'rgba(56, 211, 159, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(56, 211, 159, 0.3)',
    },
    closedBannerText: {
      ...typography(theme, 'caption'),
      color: theme.colors.status.success,
      fontWeight: '600',
      flex: 1,
    },
    offlineIcon: {
      fontSize: 14,
    },
    summaryCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
      padding: spacing(theme, 'lg'),
      gap: spacing(theme, 'md'),
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    summaryIcon: {
      fontSize: 24,
      color: theme.colors.brand.primary,
    },
    summaryTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      fontSize: 18,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing(theme, 'xs'),
    },
    summaryLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    summaryRowIcon: {
      fontSize: 16,
      color: theme.colors.text.muted,
    },
    summaryLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    summaryAmount: {
      ...typography(theme, 'sectionTitle'),
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
    totalAmount: {
      ...typography(theme, 'pageTitle'),
      fontSize: 24,
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
    metaText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    reconciliationSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    sectionTitle: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing(theme, 'md'),
    },
    reconciliationCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      padding: spacing(theme, 'lg'),
      gap: spacing(theme, 'lg'),
    },
    inputSection: {
      gap: spacing(theme, 'xs'),
    },
    inputHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    inputLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    inputHint: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.app,
      borderRadius: radius(theme, 'input'),
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'sm'),
      gap: spacing(theme, 'sm'),
    },
    currencySymbol: {
      ...typography(theme, 'displayXL'),
      fontSize: 32,
      color: theme.colors.text.muted,
      fontWeight: '600',
    },
    input: {
      ...typography(theme, 'displayXL'),
      fontSize: 32,
      color: theme.colors.text.primary,
      fontWeight: '700',
      flex: 1,
      padding: 0,
    },
    checkIcon: {
      fontSize: 24,
      color: theme.colors.status.success,
    },
    varianceCard: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      padding: spacing(theme, 'md'),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    varianceLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    varianceRight: {
      alignItems: 'flex-end',
      gap: spacing(theme, 'xxs'),
    },
    varianceAmount: {
      ...typography(theme, 'pageTitle'),
      fontSize: 24,
      fontWeight: '700',
    },
    varianceAmountMatch: {
      color: theme.colors.status.success,
    },
    varianceAmountMismatch: {
      color: theme.colors.status.error,
    },
    varianceStatus: {
      ...typography(theme, 'micro'),
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    varianceStatusMatch: {
      color: theme.colors.status.success,
    },
    varianceStatusMismatch: {
      color: theme.colors.status.error,
    },
    notesSection: {
      gap: spacing(theme, 'xs'),
    },
    notesHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    notesLabel: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    notesOptional: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontStyle: 'italic',
    },
    notesRequired: {
      ...typography(theme, 'caption'),
      color: theme.colors.status.error,
      fontWeight: '700',
    },
    notesPrefix: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xs'),
    },
    notesInput: {
      backgroundColor: theme.colors.background.app,
      borderRadius: radius(theme, 'input'),
      padding: spacing(theme, 'md'),
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    notesValue: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
    },
    submitSection: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background.card,
      padding: spacing(theme, 'screenPadding'),
      borderTopWidth: 1,
      borderTopColor: theme.colors.background.divider,
      gap: spacing(theme, 'sm'),
    },
    submitButton: {
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonIcon: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    submitButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    warningText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
  });

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      if (!actualCash.trim()) {
        Alert.alert('Cash in Hand Required', 'Enter the actual cash amount you are carrying.');
        return;
      }

      // submitSettlement rejects a non-zero variance without notes; validate first so a
      // failed submit never leaves an orphan DRAFT behind.
      if (variance !== 0 && !reason.trim()) {
        Alert.alert(
          'Reason Required',
          'Add a reason explaining the cash variance before closing the day.'
        );
        return;
      }

      const notes = composeNotes();

      // Duplicate guard runs synchronously with the write - no await between the check and
      // the dispatch, mirroring commitCollection's discipline for collections. Keyed by
      // agentId + businessDate + scope, so a PRIMARY attempt never blocks or touches
      // DELEGATED for the same date, and vice versa.
      const existing = selectSettlementByAgentAndDate(
        store.getState(),
        agentId,
        businessDate,
        scope
      );

      if (existing && existing.status !== 'DRAFT') {
        Alert.alert(
          'Already Settled',
          `The ${scope.toLowerCase()} day closure for ${businessDate} has already been submitted.`
        );
        return;
      }

      let settlementId: string;

      if (existing) {
        // A DRAFT left by an earlier refused submit or rolled-back failed write is the one
        // case still to finish - refresh its figures instead of writing a second
        // settlement for the same day.
        dispatch(
          updateSettlement({
            id: existing.id,
            updates: {
              cashTotal: summary.cashTotal,
              upiTotal: summary.upiTotal,
              totalCollection: summary.totalCollection,
              cashInHand: actualCashAmount,
              notes: notes || undefined,
            },
          })
        );
        settlementId = existing.id;
      } else {
        dispatch(
          createSettlement({
            agentId,
            branchId,
            businessDate,
            scope,
            cashTotal: summary.cashTotal,
            upiTotal: summary.upiTotal,
            totalCollection: summary.totalCollection,
            cashInHand: actualCashAmount,
            notes: notes || undefined,
          })
        );

        const created = selectSettlementByAgentAndDate(
          store.getState(),
          agentId,
          businessDate,
          scope
        );
        if (!created) {
          Alert.alert('Error', 'Settlement could not be created. Please try again.');
          return;
        }
        settlementId = created.id;
      }

      dispatch(submitSettlement(settlementId));

      const settlementsState = store.getState().settlements;
      const submitted = settlementsState.settlements.byId[settlementId];

      // Still DRAFT means the reducer refused the submit. It stays DRAFT, so cash in hand
      // is untouched and the agent can correct the input and retry.
      if (!submitted || submitted.status === 'DRAFT') {
        Alert.alert(
          'Cannot Close Day',
          settlementsState.error || 'Settlement could not be submitted.'
        );
        return;
      }

      const persistResult = await dispatch(persistSettlements());
      if (persistSettlements.rejected.match(persistResult)) {
        // Nothing reached storage, so the submission is rolled back to DRAFT. An unsaved
        // day closure must not reduce cash in hand, and the record is kept so this same
        // settlement can be retried instead of a second one being written for the day.
        dispatch(revertSettlementSubmission(settlementId));
        Alert.alert(
          'Not Saved',
          'The day closure could not be written to this device, so it was not applied. Cash in hand is unchanged — please try again.'
        );
        return;
      }

      Alert.alert(
        'Day Closed',
        `${scopeLabel} settlement for ${businessDate} submitted. Cash handed over: ₹${summary.cashTotal.toLocaleString('en-IN')}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('[Settlement] Day close failed:', error);
      Alert.alert('Error', 'Failed to submit settlement');
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <NestedScreenHeader title="Settlement" subtitle={scopeLabel} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>BUSINESS DATE</Text>
          <Text style={styles.dateValue}>{formattedBusinessDate}</Text>
        </View>

        {isClosed && (
          <View style={styles.closedBanner}>
            <Text style={styles.offlineIcon}>🔒</Text>
            <Text style={styles.closedBannerText}>
              {scopeLabel} book already closed ({existingSettlement!.status.toLowerCase()}).
              Collections stay in history; only new collections add to cash in hand.
            </Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.summaryTitle}>Daily Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Text style={styles.summaryRowIcon}>💵</Text>
              <Text style={styles.summaryLabel}>Cash Collected</Text>
            </View>
            <Text style={styles.summaryAmount}>
              ₹ {summary.cashTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Text style={styles.summaryRowIcon}>📱</Text>
              <Text style={styles.summaryLabel}>UPI Collected</Text>
            </View>
            <Text style={styles.summaryAmount}>
              ₹ {summary.upiTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Text style={styles.summaryRowIcon}>🧾</Text>
              <Text style={styles.summaryLabel}>Unsettled Cash in Hand</Text>
            </View>
            <Text style={styles.summaryAmount}>
              ₹ {unsettledCashInHand.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Collection</Text>
            <Text style={styles.totalAmount}>
              ₹ {summary.totalCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <Text style={styles.metaText}>
            {summary.collectionCount} {scopeLabel.toLowerCase()} collection
            {summary.collectionCount === 1 ? '' : 's'} on this business date
          </Text>
        </View>

        <View style={styles.reconciliationSection}>
          <Text style={styles.sectionTitle}>Reconciliation</Text>

          <View style={styles.reconciliationCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Expected Cash (system)</Text>
              <Text style={styles.summaryAmount}>
                ₹ {summary.cashTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Declared Physical Cash</Text>
                <Text style={styles.inputHint}>
                  {isClosed ? 'Declared at closure' : 'Enter actual amount'}
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                {isClosed ? (
                  <Text style={styles.input}>
                    {existingSettlement!.cashInHand.toLocaleString('en-IN')}
                  </Text>
                ) : (
                  <TextInput
                    style={styles.input}
                    value={actualCash}
                    onChangeText={setActualCash}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={theme.colors.text.muted}
                  />
                )}
                {!!actualCash && !isClosed && <Text style={styles.checkIcon}>✓</Text>}
              </View>
            </View>

            <View style={styles.varianceCard}>
              <Text style={styles.varianceLabel}>Variance</Text>
              <View style={styles.varianceRight}>
                <Text
                  style={[
                    styles.varianceAmount,
                    isPerfectMatch ? styles.varianceAmountMatch : styles.varianceAmountMismatch,
                  ]}
                >
                  ₹ {Math.abs(variance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
                <Text
                  style={[
                    styles.varianceStatus,
                    isPerfectMatch ? styles.varianceStatusMatch : styles.varianceStatusMismatch,
                  ]}
                >
                  {isPerfectMatch ? 'PERFECT MATCH' : variance > 0 ? 'EXCESS' : 'SHORT'}
                </Text>
              </View>
            </View>

            <View style={styles.notesSection}>
              <View style={styles.notesHeader}>
                <Text style={styles.notesLabel}>Reason</Text>
                {isClosed ? null : requiresReason ? (
                  <Text style={styles.notesRequired}>Required for variance</Text>
                ) : (
                  <Text style={styles.notesOptional}>Optional</Text>
                )}
              </View>

              {isClosed ? (
                <Text style={styles.notesValue}>{existingSettlement!.notes || '—'}</Text>
              ) : (
                <>
                  {!!upiNotePrefix && (
                    <Text style={styles.notesPrefix}>{upiNotePrefix}</Text>
                  )}
                  <TextInput
                    style={styles.notesInput}
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Add remarks for any discrepancies..."
                    placeholderTextColor={theme.colors.text.muted}
                    multiline
                    numberOfLines={4}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.submitSection}>
        <Pressable
          onPress={handleSubmit}
          disabled={isClosed || isSaving}
          style={({ pressed }) => [
            styles.submitButton,
            (isClosed || isSaving) && styles.submitButtonDisabled,
            { opacity: pressed && !isClosed && !isSaving ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.submitButtonIcon}>🔒</Text>
          <Text style={styles.submitButtonText}>
            {isClosed ? 'Day Closed' : isSaving ? 'Closing...' : 'Submit Day Close'}
          </Text>
        </Pressable>

        <Text style={styles.warningText}>
          {isClosed
            ? `${scopeLabel} collections for this business date have already been settled.`
            : 'Verify all amounts before submitting. This action cannot be undone.'}
        </Text>
      </View>
    </SafeAreaView>
  );
}
