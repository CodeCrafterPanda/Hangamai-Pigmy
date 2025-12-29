import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { SettlementData, DailySummary } from '@/types/SettlementData';

export default function Settlement() {
  const router = useRouter();
  const { theme } = useTheme();
  const [actualCash, setActualCash] = useState('12500');
  const [notes, setNotes] = useState('');

  // Mock data - replace with actual data from Redux/API
  const settlementData: SettlementData = {
    businessDate: 'Friday, Oct 24, 2023',
    dailySummary: {
      totalCash: 12500.0,
      upiDigital: 4200.0,
      totalCollection: 16700.0,
    },
    isOffline: true,
  };

  const expectedCash = settlementData.dailySummary.totalCash;
  const actualCashAmount = parseFloat(actualCash) || 0;
  const variance = actualCashAmount - expectedCash;
  const isPerfectMatch = variance === 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    header: {
      backgroundColor: theme.colors.background.cardElevated,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'md'),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.background.divider,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'md'),
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      fontSize: 24,
      color: theme.colors.text.primary,
    },
    title: {
      ...typography(theme, 'pageTitle'),
      fontSize: 20,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    offlineBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
      paddingHorizontal: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: 'rgba(255, 77, 79, 0.15)',
      borderRadius: radius(theme, 'chip') + 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 77, 79, 0.3)',
    },
    offlineIcon: {
      fontSize: 14,
      color: theme.colors.status.error,
    },
    offlineText: {
      ...typography(theme, 'caption'),
      color: theme.colors.status.error,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    scrollContent: {
      paddingTop: spacing(theme, 'lg'),
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
    notesInput: {
      backgroundColor: theme.colors.background.app,
      borderRadius: radius(theme, 'input'),
      padding: spacing(theme, 'md'),
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      minHeight: 100,
      textAlignVertical: 'top',
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

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = () => {
    console.log('Submit day close', {
      actualCash: actualCashAmount,
      variance,
      notes,
    });
    // TODO: Submit settlement
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.title}>Settlement</Text>
        </View>

        {settlementData.isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineIcon}>📴</Text>
            <Text style={styles.offlineText}>OFFLINE</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>BUSINESS DATE</Text>
          <Text style={styles.dateValue}>{settlementData.businessDate}</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon}>📊</Text>
            <Text style={styles.summaryTitle}>Daily Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Text style={styles.summaryRowIcon}>💵</Text>
              <Text style={styles.summaryLabel}>Total Cash</Text>
            </View>
            <Text style={styles.summaryAmount}>
              ₹ {settlementData.dailySummary.totalCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryLabelRow}>
              <Text style={styles.summaryRowIcon}>📱</Text>
              <Text style={styles.summaryLabel}>UPI / Digital</Text>
            </View>
            <Text style={styles.summaryAmount}>
              ₹ {settlementData.dailySummary.upiDigital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Collection</Text>
            <Text style={styles.totalAmount}>
              ₹ {settlementData.dailySummary.totalCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.reconciliationSection}>
          <Text style={styles.sectionTitle}>Reconciliation</Text>

          <View style={styles.reconciliationCard}>
            <View style={styles.inputSection}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Cash in Hand</Text>
                <Text style={styles.inputHint}>Enter actual amount</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  value={actualCash}
                  onChangeText={setActualCash}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={theme.colors.text.muted}
                />
                {actualCash && <Text style={styles.checkIcon}>✓</Text>}
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
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesOptional}>Optional</Text>
              </View>

              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add remarks for any discrepancies..."
                placeholderTextColor={theme.colors.text.muted}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.submitSection}>
        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [styles.submitButton, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.submitButtonIcon}>🔒</Text>
          <Text style={styles.submitButtonText}>Submit Day Close</Text>
        </Pressable>

        <Text style={styles.warningText}>
          Verify all amounts before submitting. This action cannot be undone.
        </Text>
      </View>
    </SafeAreaView>
  );
}

