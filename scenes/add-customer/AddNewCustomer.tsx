import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch, useStore } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import AddCustomerHeader from '@/components/elements/AddCustomerHeader';
import BottomSheet from '@/components/elements/BottomSheet';
import { selectAllRoutes, selectAllBranches, selectAllAgents } from '@/slices/settings.slice';
import { addCustomer, persistCustomers } from '@/slices/customers.slice';
import { addAccount, persistAccounts } from '@/slices/accounts.slice';
import { CustomerStatus, AccountStatus } from '@/types';
import type { AddCustomerFormData } from '@/types/AddCustomerData';

const documentTypeOptions = [
  'Aadhaar Card',
  'PAN Card',
  'Voter ID',
  'Driving License',
  'Passport',
];

export default function AddNewCustomer() {
  const router = useRouter();
  const dispatch = useDispatch<Dispatch>();
  const store = useStore<State>();
  const { theme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Get dropdown options from Redux
  const allBranches = useSelector(selectAllBranches);
  const allRoutes = useSelector(selectAllRoutes);
  const allAgents = useSelector(selectAllAgents);

  // Format options for dropdowns
  const branchOptions = useMemo(() => {
    return allBranches.map(b => b.name || 'Hangamai Main Branch');
  }, [allBranches]);

  const routeOptions = useMemo(() => {
    return allRoutes.map(r => `${r.routeCode} - ${r.name}`);
  }, [allRoutes]);

  const agentOptions = useMemo(() => {
    return allAgents.map(a => `${a.name || 'Agent'} (${a.id})`);
  }, [allAgents]);

  const [formData, setFormData] = useState<AddCustomerFormData>({
    personal: {
      fullName: '',
      mobileNumber: '',
      customerId: 'PENDING:GEN',
      accountNumber: '',
    },
    address: {
      fullAddress: '',
    },
    assignment: {
      branch: '',
      route: '',
      primaryAgent: '',
    },
    kyc: {
      documentType: 'Aadhaar Card',
      documentNumber: '',
      documentFile: null,
    },
    pigmyAccount: {
      createAccount: true,
      schemeType: 'Daily Deposit (1 Year)',
      dailyAmount: 500,
      startDate: '10/27/2023',
    },
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    scrollContent: {
      paddingVertical: spacing(theme, 'lg'),
    },
    section: {
      marginBottom: spacing(theme, 'lg'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      marginBottom: spacing(theme, 'md'),
    },
    sectionIcon: {
      fontSize: 16,
      color: theme.colors.brand.primary,
    },
    sectionTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
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
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      height: 48,
    },
    inputFlex: {
      flex: 1,
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      paddingVertical: spacing(theme, 'sm'),
    },
    inputIcon: {
      fontSize: 16,
      color: theme.colors.text.muted,
    },
    helpText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      marginTop: spacing(theme, 'xxs'),
    },
    row: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    halfWidth: {
      flex: 1,
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
    dropdownPlaceholder: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
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
    infoBox: {
      flexDirection: 'row',
      gap: spacing(theme, 'xs'),
      padding: spacing(theme, 'sm'),
      backgroundColor: theme.colors.surfaceTint.infoSoft,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.brand.primary,
      marginTop: spacing(theme, 'xs'),
    },
    infoIcon: {
      fontSize: 14,
      color: theme.colors.brand.primary,
    },
    infoText: {
      ...typography(theme, 'caption'),
      color: theme.colors.brand.primary,
      flex: 1,
    },
    uploadArea: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 2,
      borderColor: theme.colors.background.divider,
      borderStyle: 'dashed',
      padding: spacing(theme, 'xl'),
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    uploadIcon: {
      fontSize: 32,
      color: theme.colors.text.muted,
    },
    uploadText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    uploadLink: {
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    uploadHint: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    toggleSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing(theme, 'md'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginBottom: spacing(theme, 'md'),
    },
    toggleLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      flex: 1,
    },
    toggleIcon: {
      fontSize: 18,
      color: theme.colors.status.success,
    },
    toggleContent: {
      flex: 1,
      gap: spacing(theme, 'xxs') - 2,
    },
    toggleTitle: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    toggleSubtitle: {
      ...typography(theme, 'caption'),
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
    saveButton: {
      flex: 1,
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    saveButtonIcon: {
      fontSize: 18,
      color: '#FFFFFF',
    },
    saveButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  const handleSave = async () => {
    // Validate required fields
    if (!formData.personal.fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter customer name');
      return;
    }
    if (!formData.address.fullAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter address');
      return;
    }
    if (!formData.assignment.branch) {
      Alert.alert('Validation Error', 'Please select a branch');
      return;
    }
    if (!formData.assignment.route) {
      Alert.alert('Validation Error', 'Please select a route');
      return;
    }
    if (!formData.assignment.primaryAgent) {
      Alert.alert('Validation Error', 'Please select primary agent');
      return;
    }

    try {
      console.log('Saving customer:', formData);

      // Parse address into components (simplified - using full address as addressLine1)
      const addressParts = formData.address.fullAddress.split(',').map(s => s.trim());

      // Add customer to Redux
      const customerAction = dispatch(
        addCustomer({
          branchId: formData.assignment.branch,
          routeId: formData.assignment.route,
          primaryAgentId: formData.assignment.primaryAgent,
          fullName: formData.personal.fullName,
          phone: formData.personal.mobileNumber,
          addressLine1: formData.address.fullAddress,
          addressLine2: '',
          city: addressParts[addressParts.length - 2] || 'Mumbai',
          pincode: addressParts[addressParts.length - 1] || '400001',
          state: 'Maharashtra',
          status: CustomerStatus.ACTIVE,
        })
      );

      // Persist customers
      await dispatch(persistCustomers());

      // Get the created customer ID from state after adding
      const state = store.getState();
      const customers = state.customers?.customers?.allIds || [];
      const lastCustomerId = customers[customers.length - 1];

      // Create account if requested
      if (formData.pigmyAccount.createAccount && lastCustomerId) {
        dispatch(
          addAccount({
            customerId: lastCustomerId,
            schemeId: 'scheme-pigmy-daily',
            installmentAmount: formData.pigmyAccount.dailyAmount,
            status: AccountStatus.ACTIVE,
          })
        );
        await dispatch(persistAccounts());
      }

      Alert.alert('Success', 'Customer added successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert('Error', 'Failed to add customer');
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel',
      'Are you sure you want to cancel? All data will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
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
    if (activeDropdown === 'branch') {
      // Find the branch ID from the name
      const branch = allBranches.find(b => (b.name || 'Hangamai Main Branch') === value);
      setFormData({
        ...formData,
        assignment: { ...formData.assignment, branch: branch?.id || value },
      });
    } else if (activeDropdown === 'route') {
      // Extract route ID from "CODE - Name" format
      const routeCode = value.split(' - ')[0];
      const route = allRoutes.find(r => r.routeCode === routeCode);
      setFormData({
        ...formData,
        assignment: { ...formData.assignment, route: route?.id || value },
      });
    } else if (activeDropdown === 'agent') {
      // Extract agent ID from "Name (ID)" format
      const agentId = value.match(/\(([^)]+)\)/)?.[1] || '';
      setFormData({
        ...formData,
        assignment: { ...formData.assignment, primaryAgent: agentId },
      });
    } else if (activeDropdown === 'documentType') {
      setFormData({ ...formData, kyc: { ...formData.kyc, documentType: value } });
    }
    closeDropdown();
  };

  const getDropdownOptions = () => {
    switch (activeDropdown) {
      case 'branch': return branchOptions;
      case 'route': return routeOptions;
      case 'agent': return agentOptions;
      case 'documentType': return documentTypeOptions;
      default: return [];
    }
  };

  const getDropdownValue = () => {
    switch (activeDropdown) {
      case 'branch': {
        const branch = allBranches.find(b => b.id === formData.assignment.branch);
        return branch?.name || 'Hangamai Main Branch';
      }
      case 'route': {
        const route = allRoutes.find(r => r.id === formData.assignment.route);
        return route ? `${route.routeCode} - ${route.name}` : '';
      }
      case 'agent': {
        const agent = allAgents.find(a => a.id === formData.assignment.primaryAgent);
        return agent ? `${agent.name} (${agent.id})` : '';
      }
      case 'documentType': return formData.kyc.documentType;
      default: return '';
    }
  };

  const getDropdownTitle = () => {
    switch (activeDropdown) {
      case 'branch': return 'Select Branch';
      case 'route': return 'Select Route';
      case 'agent': return 'Select Primary Agent';
      case 'documentType': return 'Select Document Type';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AddCustomerHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Personal Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>Personal Details</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rajesh Kumar"
              placeholderTextColor={theme.colors.text.muted}
              value={formData.personal.fullName}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  personal: { ...formData.personal, fullName: text },
                })
              }
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.inputFlex}
                placeholder="10-digit number"
                placeholderTextColor={theme.colors.text.muted}
                keyboardType="phone-pad"
                maxLength={10}
                value={formData.personal.mobileNumber}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    personal: { ...formData.personal, mobileNumber: text },
                  })
                }
              />
              <Text style={styles.inputIcon}>📱</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Customer ID / CIF</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.inputFlex}
                value={formData.personal.customerId}
                editable={false}
              />
              <Text style={styles.inputIcon}>🔒</Text>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PG-9902"
              placeholderTextColor={theme.colors.text.muted}
              value={formData.personal.accountNumber}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  personal: { ...formData.personal, accountNumber: text },
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
              placeholder="House No, Building, Street, Area, City, Pincode"
              placeholderTextColor={theme.colors.text.muted}
              multiline
              numberOfLines={3}
              value={formData.address.fullAddress}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, fullAddress: text },
                })
              }
            />
          </View>
        </View>
        {/* Assignment */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>Assignment</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Branch <Text style={styles.required}>*</Text>
            </Text>
            <Pressable onPress={() => openDropdown('branch')} style={styles.dropdown}>
              <Text style={formData.assignment.branch ? styles.dropdownText : styles.dropdownPlaceholder}>
                {formData.assignment.branch
                  ? allBranches.find(b => b.id === formData.assignment.branch)?.name || 'Hangamai Main Branch'
                  : 'Select Branch'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Route / Beat</Text>
            <Pressable onPress={() => openDropdown('route')} style={styles.dropdown}>
              <Text style={formData.assignment.route ? styles.dropdownText : styles.dropdownPlaceholder}>
                {formData.assignment.route
                  ? (() => {
                    const route = allRoutes.find(r => r.id === formData.assignment.route);
                    return route ? `${route.routeCode} - ${route.name}` : 'Select Route';
                  })()
                  : 'Select Route'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Primary Agent</Text>
            <Pressable onPress={() => openDropdown('agent')} style={styles.dropdown}>
              <Text style={formData.assignment.primaryAgent ? styles.dropdownText : styles.dropdownPlaceholder}>
                {formData.assignment.primaryAgent
                  ? (() => {
                    const agent = allAgents.find(a => a.id === formData.assignment.primaryAgent);
                    return agent ? `${agent.name} (${agent.id})` : 'Select Agent';
                  })()
                  : 'Select Agent'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                The selected agent will be responsible for daily pigmy collections from this customer.
              </Text>
            </View>
          </View>
        </View>

        {/* KYC Compliance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✓</Text>
            <Text style={styles.sectionTitle}>KYC Compliance</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Document Type</Text>
            <Pressable onPress={() => openDropdown('documentType')} style={styles.dropdown}>
              <Text style={styles.dropdownText}>{formData.kyc.documentType}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Document Number</Text>
            <TextInput
              style={styles.input}
              placeholder="XXXX XXXX 1234"
              placeholderTextColor={theme.colors.text.muted}
              value={formData.kyc.documentNumber}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  kyc: { ...formData.kyc, documentNumber: text },
                })
              }
            />
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
            onPress={handleSave}
            style={({ pressed }) => [styles.saveButton, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.saveButtonIcon}>💾</Text>
            <Text style={styles.saveButtonText}>Save Customer</Text>
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

