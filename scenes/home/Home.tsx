import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing } from '@/theme';
import ProfileHeader from '@/components/elements/ProfileHeader';
import CollectedTodayCard from '@/components/elements/CollectedTodayCard';
import StatCard from '@/components/elements/StatCard';
import AttentionBanner from '@/components/elements/AttentionBanner';
import CustomerCard from '@/components/elements/CustomerCard';
import type { UserProfile, DailyStats, AttentionAlert, Customer } from '@/types/HomeData';

export default function Home() {
  const router = useRouter();
  const { theme } = useTheme();

  // Mock data - replace with actual data from Redux/API
  const userProfile: UserProfile = {
    name: 'Rahul K.',
    branch: 'Shivaji Nagar Branch',
    isOnline: true,
  };

  const dailyStats: DailyStats = {
    collectedToday: 12500,
    pendingCount: 14,
    inHandAmount: 45000,
  };

  const attentionAlert: AttentionAlert = {
    overdueCustomers: 3,
    pendingSync: 2,
  };

  const upNextCustomers: Customer[] = [
    {
      id: '1',
      name: 'Suresh Patil',
      accountNumber: '...8892',
      location: 'Shop #4',
      initials: 'SP',
    },
    {
      id: '2',
      name: 'Anita Desai',
      accountNumber: '...4102',
      location: 'Market Ln',
      initials: 'AD',
    },
    {
      id: '3',
      name: 'Rajesh Kumar',
      accountNumber: '...9921',
      location: 'Home',
      initials: 'RK',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      paddingBottom: spacing(theme, 'xxl'),
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    startRouteButton: {
      flex: 1,
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    searchButton: {
      flex: 1,
      backgroundColor: theme.colors.background.card,
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    buttonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
    searchButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    buttonIcon: {
      fontSize: 18,
    },
    attentionSection: {
      marginBottom: spacing(theme, 'md'),
    },
    upNextSection: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    upNextHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(theme, 'md'),
    },
    upNextTitle: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    viewAllButton: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    customerList: {
      gap: spacing(theme, 'sm'),
    },
  });

  const handleStartRoute = () => {
    console.log('Start Route pressed');
    // TODO: Navigate to route screen
  };

  const handleSearch = () => {
    console.log('Search pressed');
    // TODO: Navigate to search screen
  };

  const handleCollect = (customerId: string) => {
    console.log('Collect pressed for customer:', customerId);
    // TODO: Navigate to collection screen
  };

  const handleViewAll = () => {
    console.log('View All pressed');
    // TODO: Navigate to customers list
  };

  const handleAttentionPress = () => {
    console.log('Attention banner pressed');
    // TODO: Navigate to attention details
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ProfileHeader profile={userProfile} />

        <CollectedTodayCard amount={dailyStats.collectedToday} />

        <View style={styles.statsRow}>
          <StatCard type="pending" value={dailyStats.pendingCount} />
          <StatCard type="inHand" value={dailyStats.inHandAmount} />
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={handleStartRoute}
            style={({ pressed }) => [
              styles.startRouteButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.buttonIcon}>▶</Text>
            <Text style={styles.buttonText}>Start Route</Text>
          </Pressable>

          <Pressable
            onPress={handleSearch}
            style={({ pressed }) => [styles.searchButton, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.buttonIcon}>🔍</Text>
            <Text style={styles.searchButtonText}>Search</Text>
          </Pressable>
        </View>

        <View style={styles.attentionSection}>
          <AttentionBanner alert={attentionAlert} onPress={handleAttentionPress} />
        </View>

        <View style={styles.upNextSection}>
          <View style={styles.upNextHeader}>
            <Text style={styles.upNextTitle}>Up Next</Text>
            <Pressable onPress={handleViewAll}>
              <Text style={styles.viewAllButton}>View All</Text>
            </Pressable>
          </View>

          <View style={styles.customerList}>
            {upNextCustomers.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} onCollect={handleCollect} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
