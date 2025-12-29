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
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { EditCustomerData } from '@/types/EditCustomerData';

export default function EditCustomer() {
  const router = useRouter();
  const { theme } = useTheme();

  // Mock data - replace with actual data from Redux/API/route params
  const [customerData, setCustomerData] = useState<EditCustomerData>({
    basicInfo: {
      id: 'CUST-8921',
      customerId: '#CUST-8921',
      name: 'Ramesh Kumar',
      idNumber: '89212003',
      avatarUrl: undefined,
      isVerified: true,
      assignedAgent: 'Suresh P.',
      activeAccountsCount: 3,
    },
    personalInfo: {
      fullName: 'Ramesh Kumar',
      mobileNumber: '+91 98765 43210',
      address: 'No. 24, 2nd Cross, Gandhi Nagar, Bengaluru, Karnataka 560009',
      customerId: '8921',
      currentBalance: 12500,
      accountNumber: '001239882',
      homeBranch: 'Main Br.',
    },
    collectionMapping: {
      assignedRoute: 'Industrial Area',
      routeId: 'RT-04',
      primaryAgent: 'Suresh P.',
      agentId: 'AG-102',
    },
    kycDocuments: [
      {
        id: '1',
        type: 'Aadhar Card',
        verifiedDate: 'Jan 12, 2023',
        isVerified: true,
      },
      {
        id: '2',
        type: 'PAN Card',
        verifiedDate: 'Jan 12, 2023',
        isVerified: true,
      },
    ],
    associatedAccounts: [
      {
        id: '1',
        type: 'Pigmy Daily Deposit',
        accountNumber: '001239882',
        status: 'Active',
        icon: '💰',
        iconColor: '#2ED47A',
      },
      {
        id: '2',
        type: 'Recurring Deposit',
        accountNumber: '992120012',
        status: 'Active',
        icon: '📅',
        iconColor: '#8E54E9',
      },
    ],
  });

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
    },
    headerTop: {
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
    headerTitles: {
      flex: 1,
    },
    title: {
      ...typography(theme, 'pageTitle'),
      fontSize: 18,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    subtitle: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    scrollContent: {
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xxl') + 80,
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
      paddingVertical: spacing(theme, 'xxs') - 2,
      backgroundColor: theme.colors.brand.primary,
      borderRadius: radius(theme, 'chip'),
    },
    agentIcon: {
      fontSize: 10,
      color: '#FFFFFF',
    },
    agentText: {
      ...typography(theme, 'micro'),
      color: '#FFFFFF',
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
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background.card,
      padding: spacing(theme, 'screenPadding'),
      borderTopWidth: 1,
      borderTopColor: theme.colors.background.divider,
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
  });

  const handleBack = () => {
    router.back();
  };

  const handleUpdate = () => {
    console.log('Update customer:', customerData);
    Alert.alert('Success', 'Customer updated successfully!');
  };

  const handleCancel = () => {
    router.back();
  };

  const handleAccountPress = (accountId: string) => {
    console.log('Account pressed:', accountId);
    // TODO: Navigate to account details
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Edit Customer</Text>
            <Text style={styles.subtitle}>{customerData.basicInfo.customerId}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Customer Card */}
        <View style={styles.customerCard}>
          <View style={styles.customerHeader}>
            <View style={styles.avatarContainer}>
              {customerData.basicInfo.avatarUrl ? (
                <Image
                  source={{ uri: customerData.basicInfo.avatarUrl }}
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
                        fontWeight: '700',
                      }}
                    >
                      {getInitials(customerData.basicInfo.name)}
                    </Text>
                  </View>
                </View>
              )}
              {customerData.basicInfo.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              )}
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customerData.basicInfo.name}</Text>
              <Text style={styles.customerId}>ID: {customerData.basicInfo.idNumber}</Text>
              <View style={styles.agentBadge}>
                <Text style={styles.agentIcon}>👤</Text>
                <Text style={styles.agentText}>
                  Agent: {customerData.basicInfo.assignedAgent}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>STATUS</Text>
            <Text style={styles.statusValue}>
              {customerData.basicInfo.activeAccountsCount} Active Accounts
            </Text>
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
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {customerData.collectionMapping.routeId}: {customerData.collectionMapping.assignedRoute}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Primary Agent</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {customerData.collectionMapping.primaryAgent} (ID: {customerData.collectionMapping.agentId})
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>
        </View>

        {/* KYC Documents */}
        <View style={styles.kycSection}>
          <View style={styles.kycHeader}>
            <Text style={styles.kycTitle}>KYC DOCUMENTS</Text>
            <Pressable>
              <Text style={styles.historyLink}>History</Text>
            </Pressable>
          </View>

          <View style={styles.kycList}>
            {customerData.kycDocuments.map((doc) => (
              <View key={doc.id} style={styles.kycItem}>
                <View style={styles.kycIconContainer}>
                  <Text style={styles.kycIcon}>📄</Text>
                </View>
                <View style={styles.kycInfo}>
                  <Text style={styles.kycType}>{doc.type}</Text>
                  <Text style={styles.kycDate}>Verified {doc.verifiedDate}</Text>
                </View>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            ))}
          </View>

          <Pressable style={styles.uploadButton}>
            <Text style={styles.uploadButtonIcon}>➕</Text>
            <Text style={styles.uploadButtonText}>Upload New Document</Text>
          </Pressable>
        </View>

        {/* Associated Accounts */}
        <Text style={styles.sectionHeader}>ASSOCIATED ACCOUNTS</Text>
        <View style={styles.accountsList}>
          {customerData.associatedAccounts.map((account) => (
            <Pressable
              key={account.id}
              onPress={() => handleAccountPress(account.id)}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={styles.accountItem}>
                <View style={[styles.accountIconContainer, { backgroundColor: `${account.iconColor}20` }]}>
                  <Text style={styles.accountIcon}>{account.icon}</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountType}>{account.type}</Text>
                  <Text style={styles.accountMeta}>
                    Acc: {account.accountNumber} •{' '}
                    <Text style={styles.accountStatus}>{account.status}</Text>
                  </Text>
                </View>
                <Text style={styles.arrowIcon}>›</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

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
    </SafeAreaView>
  );
}

