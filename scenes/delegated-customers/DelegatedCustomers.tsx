import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import type { State } from '@/utils/store';
import { useTheme, typography, spacing } from '@/theme';
import { useTranslation, formatDate } from '@/i18n';
import InfoBanner from '@/components/elements/InfoBanner';
import DelegatedCustomerCard from '@/components/elements/DelegatedCustomerCard';
import { selectSession, selectAllAgents } from '@/slices/settings.slice';
import { selectAllCustomers } from '@/slices/customers.slice';
import { selectAllAccounts } from '@/slices/accounts.slice';
import { selectDelegationsBySecondaryAgent } from '@/slices/delegations.slice';
import type { DelegatedCustomer, DelegationInfo } from '@/types/DelegatedData';

export default function DelegatedCustomers() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t, language } = useTranslation();
  const [showBanner, setShowBanner] = useState(true);

  const session = useSelector(selectSession);
  const agentId = session.agentId || 'demo-agent';

  // Same pattern as RouteDetails: real delegations where logged-in agent is secondary
  const myDelegations = useSelector((state: State) =>
    selectDelegationsBySecondaryAgent(state, agentId),
  );
  const allCustomersData = useSelector(selectAllCustomers);
  const allAccounts = useSelector(selectAllAccounts);
  const allAgents = useSelector(selectAllAgents);

  const delegatedCustomers: DelegatedCustomer[] = useMemo(() => {
    const results: DelegatedCustomer[] = [];

    for (const delegation of myDelegations) {
      const customer = allCustomersData.find(c => c.id === delegation.customerId);
      if (!customer) {
        continue;
      }

      const account =
        allAccounts.find(
          a =>
            a.customerId === customer.id &&
            a.status === 'ACTIVE' &&
            (!delegation.accountId || a.id === delegation.accountId),
        ) ?? allAccounts.find(a => a.customerId === customer.id);

      const primaryAgent = allAgents.find(a => a.id === delegation.primaryAgentId);
      const endDate = new Date(delegation.endAt);
      const validTill = formatDate(endDate, language, {
        month: 'short',
        day: 'numeric',
      });
      const accountNumber = account?.accountNumber ?? '';
      const accountNumberMasked =
        accountNumber.length >= 4 ? `•••• ${accountNumber.slice(-4)}` : accountNumber;

      results.push({
        id: delegation.id,
        customerId: customer.id,
        customerName: customer.fullName,
        accountNumber,
        accountNumberMasked,
        primaryAgent: primaryAgent?.name ?? 'Unknown',
        validTill,
        delegatedDate: delegation.startAt,
        avatarUrl: undefined,
      });
    }

    return results;
  }, [myDelegations, allCustomersData, allAccounts, allAgents, language]);

  const delegationInfo: DelegationInfo = {
    showBanner: true,
    title: t('delegatedCustomers.temporaryAssignment'),
    message: t('delegatedCustomers.bannerBody'),
  };

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
      flex: 1,
    },
    scrollContent: {
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xxl'),
    },
    customersList: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      gap: spacing(theme, 'md'),
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
    floatingInfo: {
      position: 'absolute',
      bottom: spacing(theme, 'xl'),
      right: spacing(theme, 'md'),
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.brand.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    },
    floatingInfoIcon: {
      fontSize: 24,
      color: '#FFFFFF',
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleCollectDeposit = (customerId: string) => {
    router.push(`/(app)/(route)/customer-detail/${customerId}`);
  };

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  const handleInfoPress = () => {
    setShowBanner(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>{t('delegatedCustomers.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {showBanner && (
          <InfoBanner
            title={delegationInfo.title}
            message={delegationInfo.message}
            onClose={handleCloseBanner}
          />
        )}

        <View style={styles.customersList}>
          {delegatedCustomers.length > 0 ? (
            delegatedCustomers.map(customer => (
              <DelegatedCustomerCard
                key={customer.id}
                customer={customer}
                onCollectDeposit={handleCollectDeposit}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>{t('delegatedCustomers.empty')}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleInfoPress}
        style={({ pressed }) => [styles.floatingInfo, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={styles.floatingInfoIcon}>ℹ️</Text>
      </Pressable>
    </SafeAreaView>
  );
}
