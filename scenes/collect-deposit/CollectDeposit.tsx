import { View, Text, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import AmountSelector from '@/components/elements/AmountSelector';
import PaymentModeSelector from '@/components/elements/PaymentModeSelector';
import {
  commitCollection,
  selectCollectionsByAccount,
  selectDelegationCollectionAmountForDate,
  selectDelegationCollectionCountForDate,
} from '@/slices/collections.slice';
import { selectSession, selectBranchTimezone } from '@/slices/settings.slice';
import { selectSchemeForAccount } from '@/slices/accounts.slice';
import { selectActiveDelegations } from '@/slices/delegations.slice';
import {
  calculateMissedDaysForMonth,
  checkDelegationEligibility,
  getBusinessDate,
  getCurrentBusinessDate,
  resolvePenalty,
} from '@/utils/businessLogic';
import type { CollectDepositData, PaymentMode } from '@/types/CollectDepositData';
import type { Customer, Account } from '@/types';
import { CollectionMode } from '@/types';

interface CollectDepositProps {
  onClose?: () => void;
  customer?: Customer;
  account?: Account;
  delegationId?: string;
}

export default function CollectDeposit({ onClose, customer, account, delegationId }: CollectDepositProps) {
  const router = useRouter();
  const dispatch = useDispatch<Dispatch>();
  const { theme } = useTheme();
  const [amount, setAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');

  /**
   * Frozen for the lifetime of this sheet, because it is the only varying input of the
   * collection's idempotency key. Recomputing it per tap would give every tap its own
   * key and defeat the duplicate check in commitCollection.
   */
  const [collectedAt] = useState(() => new Date().toISOString());

  // Guards the commit against a second tap landing while the first is still in flight
  const isSubmittingRef = useRef(false);

  // Get session data — timezone from Branch entity, not BranchSettings cache
  const session = useSelector(selectSession);
  const timezone = useSelector(selectBranchTimezone);
  const scheme = useSelector((state: State) =>
    account ? selectSchemeForAccount(state, account.id) : undefined,
  );
  const accountCollections = useSelector((state: State) =>
    account ? selectCollectionsByAccount(state, account.id) : [],
  );
  const activeDelegations = useSelector(selectActiveDelegations);

  const todayBusinessDate = useMemo(
    () => getBusinessDate(collectedAt, timezone),
    [collectedAt, timezone],
  );
  const todayDelegationCount = useSelector((state: State) =>
    delegationId
      ? selectDelegationCollectionCountForDate(state, delegationId, todayBusinessDate)
      : 0,
  );
  const todayDelegationAmount = useSelector((state: State) =>
    delegationId
      ? selectDelegationCollectionAmountForDate(state, delegationId, todayBusinessDate)
      : 0,
  );

  // Real path: compute customer/month missed days, then resolve penalty separately
  const depositData: CollectDepositData = useMemo(() => {
    if (customer && account) {
      const currentBusinessDate = getCurrentBusinessDate(timezone);
      const [yearStr, monthStr] = currentBusinessDate.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);

      const missedDays =
        scheme != null
          ? calculateMissedDaysForMonth(
              account,
              scheme,
              accountCollections,
              year,
              month,
              currentBusinessDate,
              timezone,
            )
          : 0;

      const penaltyAmount = scheme != null ? resolvePenalty(scheme, missedDays) : 0;

      return {
        customer: {
          id: customer.id,
          name: customer.fullName,
          accountNumber: account.accountNumber,
          avatarUrl: undefined,
          isOnline: true,
        },
        depositInfo: {
          dueAmount: account.installmentAmount,
          missedDays,
          penaltyAmount,
        },
      };
    }

    return {
      customer: {
        id: 'CUST-001',
        name: 'Rajesh Kumar',
        accountNumber: '1029 3847 56',
        avatarUrl: undefined,
        isOnline: true,
      },
      depositInfo: {
        dueAmount: 500,
        missedDays: 2,
        penaltyAmount: 20,
      },
    };
  }, [customer, account, scheme, accountCollections, timezone]);

  const fullDueAmount =
    depositData.depositInfo.dueAmount + depositData.depositInfo.penaltyAmount;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.app,
    },
    content: {
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'md'),
    },
    customerCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
      padding: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.background.cardElevated,
    },
    avatarImage: {
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.status.success,
      borderWidth: 2,
      borderColor: theme.colors.background.card,
    },
    customerInfo: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    customerName: {
      ...typography(theme, 'sectionTitle'),
      fontSize: 18,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    accountNumber: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
    },
    infoCardsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'xl'),
    },
    amountSection: {
      marginBottom: spacing(theme, 'xl'),
    },
    paymentModeSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    actionButtonsContainer: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginTop: spacing(theme, 'md'),
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'sm'),
      borderRadius: radius(theme, 'button'),
      borderWidth: 1,
    },
    collectButton: {
      backgroundColor: theme.colors.status.success,
      borderColor: theme.colors.status.success,
    },
    cancelButton: {
      backgroundColor: theme.colors.background.cardElevated,
      borderColor: theme.colors.status.error,
    },
    buttonIcon: {
      fontSize: 20,
    },
    collectButtonIcon: {
      color: '#FFFFFF',
    },
    cancelButtonIcon: {
      color: theme.colors.status.error,
    },
    buttonText: {
      ...typography(theme, 'sectionTitle'),
      fontWeight: '600',
    },
    collectButtonText: {
      color: '#FFFFFF',
    },
    cancelButtonText: {
      color: theme.colors.status.error,
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleCollect = async () => {
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;

    try {
      if (amount <= 0) {
        Alert.alert('Invalid Amount', 'Please enter an amount greater than 0');
        return;
      }

      if (!customer || !account) {
        Alert.alert('Error', 'Customer or account data missing');
        return;
      }

      // Delegation eligibility before commitCollection (non-delegated path unchanged)
      if (delegationId) {
        const eligibility = checkDelegationEligibility(
          session.agentId || 'demo-agent',
          customer.id,
          account.id,
          activeDelegations,
          collectedAt,
          todayDelegationCount,
          todayDelegationAmount,
        );

        if (!eligibility.isEligible) {
          Alert.alert(
            'Not Eligible',
            eligibility.reason || 'This delegation is not eligible for collection',
          );
          return;
        }
      }

      // Collection, ledger entries and balance cache are committed as one unit
      const result = await dispatch(
        commitCollection({
          branchId: session.branchId || 'demo-branch',
          customerId: customer.id,
          accountId: account.id,
          primaryAgentId: customer.primaryAgentId,
          collectedByAgentId: session.agentId || 'demo-agent',
          delegationId: delegationId,
          amount: amount,
          penaltyAmount: depositData.depositInfo.penaltyAmount,
          mode: paymentMode === 'cash' ? CollectionMode.CASH : CollectionMode.UPI,
          collectedAt: collectedAt,
          timezone: timezone,
          deviceFingerprint: session.deviceFingerprint || 'demo-device',
        }),
      );

      if (commitCollection.rejected.match(result)) {
        Alert.alert('Error', 'Collection could not be saved. Please try again.');
        return;
      }

      Alert.alert('Success', `₹${amount} collected successfully!`, [
        {
          text: 'OK',
          onPress: () => {
            // Clear state and close
            setAmount(0);
            setPaymentMode('cash');
            if (onClose) {
              onClose();
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Collection error:', error);
      Alert.alert('Error', 'Failed to process collection');
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleCancel = () => {
    console.log('Cancel pressed');
    // Clear state
    setAmount(0);
    setPaymentMode('cash');
    // Close bottom sheet
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.customerCard}>
          <View style={styles.avatarContainer}>
            {depositData.customer.avatarUrl ? (
              <Image
                source={{ uri: depositData.customer.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      ...typography(theme, 'sectionTitle'),
                      color: theme.colors.text.secondary,
                      fontWeight: '600',
                    }}
                  >
                    {getInitials(depositData.customer.name)}
                  </Text>
                </View>
              </View>
            )}
            {depositData.customer.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{depositData.customer.name}</Text>
            <Text style={styles.accountNumber}>A/C: {depositData.customer.accountNumber}</Text>
          </View>
        </View>
        <View style={styles.amountSection}>
          <AmountSelector
            amount={amount}
            onAmountChange={setAmount}
            fullDueAmount={fullDueAmount}
          />
        </View>

        <View style={styles.paymentModeSection}>
          <PaymentModeSelector selectedMode={paymentMode} onModeChange={setPaymentMode} />
        </View>

        <View style={styles.actionButtonsContainer}>
          <View style={styles.actionButtons}>
            <Pressable
              onPress={handleCollect}
              style={({ pressed }) => [
                styles.actionButton,
                styles.collectButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.buttonIcon, styles.collectButtonIcon]}>✓</Text>
              <Text style={[styles.buttonText, styles.collectButtonText]}>Collect</Text>
            </Pressable>

            <Pressable
              onPress={handleCancel}
              style={({ pressed }) => [
                styles.actionButton,
                styles.cancelButton,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.buttonIcon, styles.cancelButtonIcon]}>✕</Text>
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
