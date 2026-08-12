import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import EditCustomerHeader from '@/components/elements/EditCustomerHeader';
import BottomSheet from '@/components/elements/BottomSheet';
import { selectAllRoutes, selectAllAgents, selectCurrentBranch } from '@/slices/settings.slice';
import { updateCustomer, persistCustomers } from '@/slices/customers.slice';
import type { EditCustomerData } from '@/types/EditCustomerData';

interface EditCustomerProps {
  customerId?: string;
}

/**
 * Placeholder shape used only to satisfy the form state hook before the "customer not
 * found" guard renders. It is never displayed and never saved — an unresolved customer
 * must not be shown as an editable record.
 */
const EMPTY_CUSTOMER_DATA: EditCustomerData = {
  basicInfo: {
    id: '',
    customerId: '',
    name: '',
    idNumber: '',
    avatarUrl: undefined,
    isVerified: false,
    assignedAgent: '',
    activeAccountsCount: 0,
  },
  personalInfo: {
    fullName: '',
    mobileNumber: '',
    address: '',
    customerId: '',
    currentBalance: 0,
    accountNumber: '',
    homeBranch: '',
  },
  collectionMapping: {
    assignedRoute: '',
    routeId: '',
    primaryAgent: '',
    agentId: '',
  },
  kycDocuments: [],
  associatedAccounts: [],
};

export default function EditCustomer({ customerId }: EditCustomerProps) {
  const router = useRouter();
  const dispatch = useDispatch<Dispatch>();
  const { theme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Get dropdown options from Redux
  const allRoutes = useSelector(selectAllRoutes);
  const allAgents = useSelector(selectAllAgents);
  const branch = useSelector(selectCurrentBranch);

  // Get actual customer data from Redux if customerId is provided
  const actualCustomer = useSelector((state: State) =>
    customerId ? state.customers.customers.byId[customerId] : null
  );
  const allAccountsData = useSelector((state: State) => state.accounts.accounts);
  const customerAccounts = useMemo(() => {
    if (!customerId) return [];
    return allAccountsData.allIds
      .map(id => allAccountsData.byId[id])
      .filter(a => a?.customerId === customerId);
  }, [customerId, allAccountsData]);

  // Format options for dropdowns
  const routeOptions = useMemo(() => {
    return allRoutes.map(r => `${r.routeCode} - ${r.name}`);
  }, [allRoutes]);

  const agentOptions = useMemo(() => {
    return allAgents.map(a => `${a.name || 'Agent'} (${a.id})`);
  }, [allAgents]);

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initialData: EditCustomerData = actualCustomer ? {
    basicInfo: {
      id: actualCustomer.id,
      customerId: actualCustomer.customerCode,
      name: actualCustomer.fullName,
      idNumber: actualCustomer.customerCode.replace('CUST-', ''),
      avatarUrl: undefined,
      isVerified: true,
      assignedAgent: allAgents.find(a => a.id === actualCustomer.primaryAgentId)?.name || 'Agent',
      activeAccountsCount: customerAccounts.length,
    },
    personalInfo: {
      fullName: actualCustomer.fullName,
      mobileNumber: actualCustomer.phone || '',
      address: actualCustomer.addressLine1,
      customerId: actualCustomer.customerCode.replace('CUST-', ''),
      currentBalance: customerAccounts[0]?.currentBalance || 0,
      accountNumber: customerAccounts[0]?.accountNumber || 'N/A',
      homeBranch: branch?.name || '—',
    },
    collectionMapping: {
      assignedRoute: allRoutes.find(r => r.id === actualCustomer.routeId)?.name || 'Unknown',
      routeId: allRoutes.find(r => r.id === actualCustomer.routeId)?.routeCode || '',
      primaryAgent: allAgents.find(a => a.id === actualCustomer.primaryAgentId)?.name || 'Agent',
      agentId: actualCustomer.primaryAgentId,
    },
    kycDocuments: [],
    associatedAccounts: customerAccounts.map((acc, idx) => ({
      id: acc.id,
      type: 'Pigmy Daily Deposit',
      accountNumber: acc.accountNumber,
      status: acc.status === 'ACTIVE' ? 'Active' : 'Inactive',
      icon: '💰',
      iconColor: '#2ED47A',
    })),
  } : EMPTY_CUSTOMER_DATA;

  const [customerData, setCustomerData] = useState<EditCustomerData>(initialData);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      paddingVertical: spacing(theme, 'xl'),
    },
    customerCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'sm'),
    },
    customerHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
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
    verifiedBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.colors.status.success,
      borderWidth: 2,
      borderColor: theme.colors.background.card,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkIcon: {
      fontSize: 10,
      color: '#FFFFFF',
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
    customerId: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    agentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: theme.colors.surfaceTint.primarySoft,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: theme.colors.brand.primary,
    },
    agentIcon: {
      fontSize: 10,
      color: theme.colors.brand.primary,
    },
    agentText: {
      ...typography(theme, 'caption'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
      fontSize: 10,
    },
    statusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    statusLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      fontSize: 10,
    },
    statusValue: {
      ...typography(theme, 'caption'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    sectionHeader: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'sm'),
      marginTop: spacing(theme, 'xs'),
    },
    section: {
      marginBottom: spacing(theme, 'lg'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    field: {
      marginBottom: spacing(theme, 'md'),
    },
    label: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
      marginBottom: spacing(theme, 'xs'),
    },
    required: {
      color: theme.colors.status.error,
    },
    input: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'sm'),
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      height: 48,
    },
    multilineInput: {
      height: 80,
      textAlignVertical: 'top',
      paddingTop: spacing(theme, 'sm'),
    },
    row: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    halfWidth: {
      flex: 1,
    },
    readOnlyField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      height: 48,
    },
    readOnlyIcon: {
      fontSize: 14,
      color: theme.colors.text.muted,
    },
    readOnlyText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      flex: 1,
    },
    warningBanner: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      padding: spacing(theme, 'sm'),
      backgroundColor: 'rgba(244, 196, 48, 0.15)',
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: 'rgba(244, 196, 48, 0.3)',
      marginBottom: spacing(theme, 'md'),
    },
    warningIcon: {
      fontSize: 16,
      color: '#D4A62E',
    },
    warningText: {
      ...typography(theme, 'caption'),
      color: '#D4A62E',
      flex: 1,
      lineHeight: 18,
    },
    dropdown: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'sm'),
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
    },
    dropdownIcon: {
      fontSize: 12,
      color: theme.colors.text.muted,
    },
    bottomSheetContent: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xl'),
    },
    bottomSheetTitle: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing(theme, 'lg'),
      textAlign: 'center',
    },
    optionsList: {
      gap: spacing(theme, 'xs'),
    },
    option: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'md'),
    },
    optionSelected: {
      backgroundColor: theme.colors.surfaceTint.primarySoft,
      borderColor: theme.colors.brand.primary,
    },
    optionText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
    kycSection: {
      marginBottom: spacing(theme, 'lg'),
    },
    kycHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'sm'),
    },
    kycTitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    historyLink: {
      ...typography(theme, 'caption'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    kycList: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      gap: spacing(theme, 'sm'),
    },
    kycItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      padding: spacing(theme, 'sm'),
    },
    kycIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: theme.colors.brand.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    kycIcon: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    kycInfo: {
      flex: 1,
      gap: spacing(theme, 'xxs') - 2,
    },
    kycType: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    kycDate: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontSize: 11,
    },
    lockIcon: {
      fontSize: 16,
      color: theme.colors.text.muted,
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
      backgroundColor: 'transparent',
      borderRadius: radius(theme, 'input'),
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.colors.background.divider,
      paddingVertical: spacing(theme, 'md'),
      marginHorizontal: spacing(theme, 'screenPadding'),
    },
    uploadButtonIcon: {
      fontSize: 16,
      color: theme.colors.text.secondary,
    },
    uploadButtonText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
    accountsList: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      gap: spacing(theme, 'sm'),
    },
    accountItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      padding: spacing(theme, 'sm'),
    },
    accountIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    accountIcon: {
      fontSize: 20,
    },
    accountInfo: {
      flex: 1,
      gap: spacing(theme, 'xxs') - 2,
    },
    accountType: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    accountMeta: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontSize: 11,
    },
    accountStatus: {
      color: theme.colors.status.success,
      fontWeight: '600',
    },
    arrowIcon: {
      fontSize: 16,
      color: theme.colors.text.muted,
    },
    actionButtons: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    cancelButton: {
      flex: 1,
      backgroundColor: 'transparent',
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingVertical: spacing(theme, 'md'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    updateButton: {
      flex: 1,
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    updateButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
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
  });

  const handleUpdate = async () => {
    // Validate required fields
    if (!customerData.personalInfo.fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter customer name');
      return;
    }
    if (!customerData.personalInfo.address.trim()) {
      Alert.alert('Validation Error', 'Please enter address');
      return;
    }
    if (!customerData.personalInfo.mobileNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter mobile number');
      return;
    }

    try {
      console.log('Updating customer:', customerData);

      // Find route ID from route code
      const route = allRoutes.find(
        r => r.routeCode === customerData.collectionMapping.routeId ||
        r.name === customerData.collectionMapping.assignedRoute
      );

      // Update customer in Redux
      dispatch(
        updateCustomer({
          id: customerData.basicInfo.id,
          updates: {
            fullName: customerData.personalInfo.fullName,
            phone: customerData.personalInfo.mobileNumber,
            addressLine1: customerData.personalInfo.address,
            routeId: route?.id,
            primaryAgentId: customerData.collectionMapping.agentId,
          },
        })
      );

      // unwrap so a failed device write surfaces as an error instead of a success the
      // agent would trust and a restart would silently discard
      await dispatch(persistCustomers()).unwrap();

      Alert.alert('Success', 'Customer updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert('Error', 'Failed to update customer');
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleAccountPress = (accountId: string) => {
    console.log('Account pressed:', accountId);
    // TODO: Navigate to account details
  };

  const openDropdown = (dropdownName: string) => {
    setActiveDropdown(dropdownName);
    setIsDropdownOpen(true);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
    setActiveDropdown(null);
  };

  const handleDropdownSelect = (value: string) => {
    if (activeDropdown === 'route') {
      const routeCode = value.split(' - ')[0];
      const route = allRoutes.find(r => r.routeCode === routeCode);
      const routeName = value.split(' - ')[1] || value;
      setCustomerData({
        ...customerData,
        collectionMapping: {
          ...customerData.collectionMapping,
          routeId: route?.routeCode || routeCode,
          assignedRoute: routeName,
        },
      });
    } else if (activeDropdown === 'agent') {
      const agentName = value.split(' (')[0];
      const agentId = value.match(/\(([^)]+)\)/)?.[1] || '';
      setCustomerData({
        ...customerData,
        collectionMapping: {
          ...customerData.collectionMapping,
          primaryAgent: agentName,
          agentId: agentId,
        },
      });
    }
    closeDropdown();
  };

  const getDropdownOptions = () => {
    switch (activeDropdown) {
      case 'route': return routeOptions;
      case 'agent': return agentOptions;
      default: return [];
    }
  };

  const getDropdownValue = () => {
    switch (activeDropdown) {
      case 'route': return customerData.collectionMapping.assignedRoute;
      case 'agent': return customerData.collectionMapping.primaryAgent;
      default: return '';
    }
  };

  const getDropdownTitle = () => {
    switch (activeDropdown) {
      case 'route': return 'Select Route';
      case 'agent': return 'Select Primary Agent';
      default: return '';
    }
  };

  // Without the persisted customer there is nothing to edit: an editable form here would
  // show invented details and its save would report success while updating no record.
  if (!actualCustomer) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <EditCustomerHeader customerId={customerData.basicInfo.customerId} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Customer Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customerData.basicInfo.name}</Text>
              <Text style={styles.customerId}>ID: {customerData.basicInfo.idNumber}</Text>
            </View>

            <View style={styles.agentBadge}>
              <Text style={styles.agentIcon}>👤</Text>
              <Text style={styles.agentText}>{customerData.basicInfo.assignedAgent}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <Text style={styles.sectionHeader}>PERSONAL INFORMATION</Text>
        <View style={styles.section}>
          <View style={styles.field}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={customerData.personalInfo.fullName}
              onChangeText={(text) =>
                setCustomerData({
                  ...customerData,
                  personalInfo: { ...customerData.personalInfo, fullName: text },
                })
              }
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Mobile Number <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={customerData.personalInfo.mobileNumber}
              keyboardType="phone-pad"
              onChangeText={(text) =>
                setCustomerData({
                  ...customerData,
                  personalInfo: { ...customerData.personalInfo, mobileNumber: text },
                })
              }
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Address <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={customerData.personalInfo.address}
              multiline
              numberOfLines={3}
              onChangeText={(text) =>
                setCustomerData({
                  ...customerData,
                  personalInfo: { ...customerData.personalInfo, address: text },
                })
              }
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfWidth]}>
              <Text style={styles.label}>Customer ID</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyIcon}>🔒</Text>
                <Text style={styles.readOnlyText}>{customerData.personalInfo.customerId}</Text>
              </View>
            </View>

            <View style={[styles.field, styles.halfWidth]}>
              <Text style={styles.label}>Home Branch</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyIcon}>🏛</Text>
                <Text style={styles.readOnlyText}>{customerData.personalInfo.homeBranch}</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfWidth]}>
              <Text style={styles.label}>Current Balance</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyIcon}>₹</Text>
                <Text style={styles.readOnlyText}>
                  {customerData.personalInfo.currentBalance.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <View style={[styles.field, styles.halfWidth]}>
              <Text style={styles.label}>Account Number</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyIcon}>🔢</Text>
                <Text style={styles.readOnlyText}>{customerData.personalInfo.accountNumber}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Collection Mapping */}
        <Text style={styles.sectionHeader}>COLLECTION MAPPING</Text>
        <View style={styles.section}>
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Changes to Route or Agent will only apply to future collection cycles. Historical data remains unchanged.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Assigned Route</Text>
            <Pressable onPress={() => openDropdown('route')} style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {customerData.collectionMapping.routeId}: {customerData.collectionMapping.assignedRoute}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Primary Agent</Text>
            <Pressable onPress={() => openDropdown('agent')} style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {customerData.collectionMapping.primaryAgent} (ID: {customerData.collectionMapping.agentId})
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleUpdate}
            style={({ pressed }) => [styles.updateButton, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.updateButtonText}>Update Customer</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomSheet isOpen={isDropdownOpen} onClose={closeDropdown}>
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>{getDropdownTitle()}</Text>
          <View style={styles.optionsList}>
            {getDropdownOptions().map((option) => (
              <Pressable
                key={option}
                onPress={() => handleDropdownSelect(option)}
                style={({ pressed }) => [
                  styles.option,
                  getDropdownValue() === option && styles.optionSelected,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    getDropdownValue() === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

