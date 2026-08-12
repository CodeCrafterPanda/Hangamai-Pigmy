import { View, Text, StyleSheet, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import CustomerProfileCard from '@/components/elements/CustomerProfileCard';
import AccountCard from '@/components/elements/AccountCard';
import BottomSheet from '@/components/elements/BottomSheet';
import CollectDeposit from '@/scenes/collect-deposit';
import Receipt from '@/scenes/receipt';
import {
  selectCustomerById,
  selectKYCDocsByCustomer,
} from '@/slices/customers.slice';
import { selectAccountsByCustomer } from '@/slices/accounts.slice';
import { selectAllRoutes, selectAllAgents, selectSession } from '@/slices/settings.slice';
import { selectTodayCollectionsByAgent } from '@/slices/collections.slice';
import { selectDelegationsBySecondaryAgent } from '@/slices/delegations.slice';
import { SchemeFrequency, KYCType } from '@/types';
import type { CustomerAccount, CustomerDetailData } from '@/types/CustomerDetailData';

interface CustomerDetailProps {
  customerId?: string;
}

function frequencyLabel(frequency?: SchemeFrequency): string {
  switch (frequency) {
    case SchemeFrequency.WEEKLY:
      return 'Weekly Collection';
    case SchemeFrequency.MONTHLY:
      return 'Monthly Collection';
    case SchemeFrequency.DAILY:
    default:
      return 'Daily Collection';
  }
}

function kycTypeLabel(kycType: KYCType): string {
  switch (kycType) {
    case KYCType.AADHAR:
      return 'Aadhaar';
    case KYCType.PAN:
      return 'PAN';
    case KYCType.VOTER_ID:
      return 'Voter ID';
    case KYCType.OTHER:
    default:
      return 'Other';
  }
}

export default function CustomerDetail({ customerId }: CustomerDetailProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const session = useSelector(selectSession);
  const timezone = useSelector((state: State) => state.settings.branchSettings.timezone);
  const agentId = session.agentId || 'demo-agent';

  const customer = useSelector((state: State) =>
    customerId ? selectCustomerById(state, customerId) : undefined,
  );
  const accounts = useSelector((state: State) =>
    customerId ? selectAccountsByCustomer(state, customerId) : [],
  );
  const kycDocs = useSelector((state: State) =>
    customerId ? selectKYCDocsByCustomer(state, customerId) : [],
  );
  const allRoutes = useSelector(selectAllRoutes);
  const allAgents = useSelector(selectAllAgents);
  const schemesById = useSelector((state: State) => state.accounts.schemes.byId);
  const todayCollections = useSelector((state: State) =>
    selectTodayCollectionsByAgent(state, agentId, timezone),
  );
  const myDelegations = useSelector((state: State) =>
    selectDelegationsBySecondaryAgent(state, agentId),
  );

  const route = useMemo(
    () => allRoutes.find(r => r.id === customer?.routeId),
    [allRoutes, customer?.routeId],
  );
  const agent = useMemo(
    () => allAgents.find(a => a.id === customer?.primaryAgentId),
    [allAgents, customer?.primaryAgentId],
  );

  // Same active-account + today's collection lookup used by Home / Route Details
  const activeAccount = useMemo(
    () => accounts.find(a => a.status === 'ACTIVE'),
    [accounts],
  );
  const todayCollection = useMemo(() => {
    if (!customer || !activeAccount) return undefined;
    return todayCollections.find(
      c =>
        c.customerId === customer.id &&
        c.accountId === activeAccount.id &&
        c.status !== 'REVERSED',
    );
  }, [customer, activeAccount, todayCollections]);
  const isCollectedToday = Boolean(todayCollection);
  const delegationId = useMemo(
    () => (customerId ? myDelegations.find(d => d.customerId === customerId)?.id : undefined),
    [myDelegations, customerId],
  );

  const customerData: CustomerDetailData | undefined = useMemo(() => {
    if (!customer) return undefined;

    const mappedAccounts: CustomerAccount[] = accounts.map(account => {
      const scheme = schemesById[account.schemeId];
      return {
        id: account.id,
        accountType: 'pigmy' as const,
        accountNumber: account.accountNumber,
        label: frequencyLabel(scheme?.frequency),
        amount: account.installmentAmount,
        dueToday: account.status === 'ACTIVE' ? account.installmentAmount : 0,
        status: account.status === 'ACTIVE' ? ('pending' as const) : ('paid' as const),
        progress: undefined,
      };
    });

    return {
      customer: {
        id: customer.id,
        name: customer.fullName,
        phone: customer.phone || '—',
        address: [
          customer.addressLine1,
          customer.addressLine2,
          customer.city,
          customer.state,
          customer.pincode,
        ]
          .filter(Boolean)
          .join(', '),
        avatarUrl: undefined,
        isOnline: customer.status === 'ACTIVE',
      },
      accounts: mappedAccounts,
    };
  }, [customer, accounts, schemesById]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    // Match RouteDetailsHeader spacing/alignment (single custom header; Stack header hidden)
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'xs'),
      paddingBottom: spacing(theme, 'xs'),
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      flex: 1,
    },
    backButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      fontSize: 20,
      color: theme.colors.text.primary,
    },
    title: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      flexShrink: 1,
    },
    syncButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceTint.successSoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    syncIcon: {
      fontSize: 16,
    },
    scrollContent: {
      paddingTop: spacing(theme, 'lg'),
      paddingBottom: spacing(theme, 'xxl') + 80,
    },
    metaSection: {
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'lg'),
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'sm'),
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing(theme, 'sm'),
    },
    metaLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '600',
    },
    metaValue: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '500',
      flexShrink: 1,
      textAlign: 'right',
    },
    accountsSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    accountsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(theme, 'md'),
    },
    accountsTitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    accountsCount: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    accountsList: {
      gap: spacing(theme, 'md'),
    },
    emptyAccounts: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
      paddingVertical: spacing(theme, 'lg'),
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing(theme, 'xl'),
      gap: spacing(theme, 'sm'),
    },
    emptyIcon: {
      fontSize: 40,
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
    actionButtons: {
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
    buttonRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    secondaryButtonIcon: {
      fontSize: 18,
      color: theme.colors.text.primary,
    },
    secondaryButtonText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    primaryButton: {
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    primaryButtonDisabled: {
      opacity: 0.5,
    },
    primaryButtonIcon: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    primaryButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  const handleBack = () => {
    router.back();
  };

  if (!customer || !customerData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <Text style={styles.title}>Customer Details</Text>
          </View>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👤</Text>
          <Text style={styles.emptyText}>Customer not found</Text>
          <Text style={styles.emptyHint}>
            This customer may have been removed or the link is invalid.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCallCustomer = () => {
    const phoneNumber = (customer.phone || '').replace(/\s/g, '');
    if (!phoneNumber) {
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleViewPassbook = () => {
    // Passbook / ledger owned by later MVP stories
  };

  const handlePrimaryCollectionAction = () => {
    if (!activeAccount) {
      return;
    }
    if (isCollectedToday && todayCollection) {
      setIsReceiptOpen(true);
      return;
    }
    setIsCollectOpen(true);
  };

  const handleCloseCollect = () => {
    setIsCollectOpen(false);
  };

  const handleAccountPress = (_accountId: string) => {
    // Account deep-dive owned by later stories
  };

  const primaryKyc = kycDocs[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            Customer Details
          </Text>
        </View>

        <Pressable style={styles.syncButton}>
          <Text style={styles.syncIcon}>☁️</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <CustomerProfileCard customer={customerData.customer} />

        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Customer Code</Text>
            <Text style={styles.metaValue}>{customer.customerCode}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>{customer.status}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Route</Text>
            <Text style={styles.metaValue}>
              {route ? `${route.routeCode} — ${route.name}` : '—'}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Agent</Text>
            <Text style={styles.metaValue}>{agent?.name || '—'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>KYC</Text>
            <Text style={styles.metaValue}>
              {primaryKyc
                ? `${kycTypeLabel(primaryKyc.kycType)} · ${primaryKyc.kycNumberMasked}`
                : 'Not captured'}
            </Text>
          </View>
        </View>

        <View style={styles.accountsSection}>
          <View style={styles.accountsHeader}>
            <Text style={styles.accountsTitle}>ACTIVE ACCOUNTS</Text>
            <Text style={styles.accountsCount}>
              {customerData.accounts.length} Account
              {customerData.accounts.length === 1 ? '' : 's'}
            </Text>
          </View>

          <View style={styles.accountsList}>
            {customerData.accounts.length === 0 ? (
              <Text style={styles.emptyAccounts}>No accounts linked to this customer.</Text>
            ) : (
              customerData.accounts.map(account => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onPress={handleAccountPress}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <View style={styles.buttonRow}>
          <Pressable
            onPress={handleCallCustomer}
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.secondaryButtonIcon}>📞</Text>
            <Text style={styles.secondaryButtonText}>Call Customer</Text>
          </Pressable>

          <Pressable
            onPress={handleViewPassbook}
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={styles.secondaryButtonIcon}>📖</Text>
            <Text style={styles.secondaryButtonText}>View Passbook</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={handlePrimaryCollectionAction}
          disabled={!activeAccount}
          style={({ pressed }) => [
            styles.primaryButton,
            !activeAccount && styles.primaryButtonDisabled,
            { opacity: !activeAccount ? 0.5 : pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={styles.primaryButtonIcon}>{isCollectedToday ? '🧾' : '💵'}</Text>
          <Text style={styles.primaryButtonText}>
            {isCollectedToday ? 'View Receipt' : 'Collect Deposit'}
          </Text>
        </Pressable>
      </View>

      <BottomSheet isOpen={isCollectOpen} onClose={handleCloseCollect}>
        {customer && activeAccount ? (
          <CollectDeposit
            onClose={handleCloseCollect}
            customer={customer}
            account={activeAccount}
            delegationId={delegationId}
          />
        ) : (
          <View style={{ padding: 20 }}>
            <Text style={{ color: theme.colors.text.primary }}>
              Customer or account data not found
            </Text>
          </View>
        )}
      </BottomSheet>

      <BottomSheet isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)}>
        {todayCollection && (
          <Receipt
            collectionId={todayCollection.id}
            onClose={() => setIsReceiptOpen(false)}
          />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
