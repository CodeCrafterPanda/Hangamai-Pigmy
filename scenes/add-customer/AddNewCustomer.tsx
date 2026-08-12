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
import {
  selectAllRoutes,
  selectAllBranches,
  selectAllAgents,
  selectSession,
} from '@/slices/settings.slice';
import {
  addCustomer,
  addKYCDocument,
  persistCustomers,
  selectPotentialDuplicates,
} from '@/slices/customers.slice';
import {
  addAccount,
  addScheme,
  persistAccounts,
  selectAllSchemes,
  selectAllAccounts,
} from '@/slices/accounts.slice';
import { createDelegation, persistDelegations } from '@/slices/delegations.slice';
import {
  CustomerStatus,
  AccountStatus,
  SchemeFrequency,
  KYCType,
} from '@/types';
import type { AddCustomerFormData } from '@/types/AddCustomerData';
import type { Scheme } from '@/types/entities';
import {
  createDefaultDelegationWindow,
  maskKYCNumber,
  validatePhone,
} from '@/utils/businessLogic';
import { generateUUID } from '@/utils/uuid';

const documentTypeOptions = [
  'Aadhaar Card',
  'PAN Card',
  'Voter ID',
  'Driving License',
  'Passport',
];

const frequencyOptions: { label: string; value: SchemeFrequency }[] = [
  { label: 'Daily', value: SchemeFrequency.DAILY },
  { label: 'Weekly', value: SchemeFrequency.WEEKLY },
  { label: 'Monthly', value: SchemeFrequency.MONTHLY },
];

function mapDocumentTypeToKYC(documentType: string): KYCType {
  switch (documentType) {
    case 'Aadhaar Card':
      return KYCType.AADHAR;
    case 'PAN Card':
      return KYCType.PAN;
    case 'Voter ID':
      return KYCType.VOTER_ID;
    case 'Driving License':
    case 'Passport':
    default:
      return KYCType.OTHER;
  }
}

function frequencyDisplayLabel(frequency: SchemeFrequency): string {
  return frequencyOptions.find(o => o.value === frequency)?.label ?? 'Daily';
}

function schemeNameFor(frequency: SchemeFrequency): string {
  switch (frequency) {
    case SchemeFrequency.WEEKLY:
      return 'Pigmy Weekly';
    case SchemeFrequency.MONTHLY:
      return 'Pigmy Monthly';
    case SchemeFrequency.DAILY:
    default:
      return 'Pigmy Daily';
  }
}

interface AddNewCustomerProps {
  /** Route the screen was opened from (Route Details); locks the Route selection */
  presetRouteId?: string;
}

export default function AddNewCustomer({ presetRouteId }: AddNewCustomerProps) {
  const router = useRouter();
  const dispatch = useDispatch<Dispatch>();
  const store = useStore<State>();
  const { theme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const allBranches = useSelector(selectAllBranches);
  const allRoutes = useSelector(selectAllRoutes);
  const allAgents = useSelector(selectAllAgents);
  const allSchemes = useSelector(selectAllSchemes);
  const session = useSelector(selectSession);

  // Same session fallback as Routes/RouteDetails so ownership matches the scope those
  // screens resolve customers with
  const sessionAgentId = session.agentId || 'demo-agent';

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
      // Route Details passes the route it was opened from; entering from anywhere else
      // leaves the normal route picker empty
      route: presetRouteId || '',
      // The customer belongs to the logged-in agent unless another primary agent is picked
      primaryAgent: sessionAgentId,
      delegatedAgent: '',
    },
    kyc: {
      documentType: 'Aadhaar Card',
      documentNumber: '',
      documentFile: null,
    },
    pigmyAccount: {
      createAccount: true,
      frequency: SchemeFrequency.DAILY,
      dailyAmount: 500,
      startDate: new Date().toLocaleDateString('en-US'),
    },
  });

  const isRouteLocked = Boolean(presetRouteId);
  const presetRoute = allRoutes.find(r => r.id === presetRouteId);

  // Another agent as primary agent means the customer is being delegated: the delegate has
  // to be named so the customer lands in someone's DELEGATED scope
  const requiresDelegation =
    Boolean(formData.assignment.primaryAgent) &&
    formData.assignment.primaryAgent !== sessionAgentId;

  const delegatedAgentOptions = useMemo(() => {
    return allAgents
      .filter(a => a.id !== formData.assignment.primaryAgent)
      .map(a => `${a.name || 'Agent'} (${a.id})`);
  }, [allAgents, formData.assignment.primaryAgent]);

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
      height: '100%',
    },
    inputIcon: {
      fontSize: 16,
      color: theme.colors.text.muted,
      marginLeft: spacing(theme, 'xs'),
    },
    readOnlyValue: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      flex: 1,
    },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      height: 48,
    },
    dropdownText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      flex: 1,
    },
    dropdownPlaceholder: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      flex: 1,
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
    toggleSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'sm'),
      marginBottom: spacing(theme, 'md'),
      gap: spacing(theme, 'sm'),
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

  const resolveOrCreateScheme = (
    branchId: string,
    frequency: SchemeFrequency,
    amount: number,
  ): Scheme => {
    const existing = allSchemes.find(
      s =>
        s.branchId === branchId &&
        s.frequency === frequency &&
        s.minAmount === amount,
    );
    if (existing) {
      return existing;
    }

    // Also check live store in case schemes were just added in this session
    const liveSchemes = selectAllSchemes(store.getState());
    const liveExisting = liveSchemes.find(
      s =>
        s.branchId === branchId &&
        s.frequency === frequency &&
        s.minAmount === amount,
    );
    if (liveExisting) {
      return liveExisting;
    }

    const scheme: Scheme = {
      id: generateUUID(),
      branchId,
      name: schemeNameFor(frequency),
      frequency,
      minAmount: amount,
      penaltyPerDay: 0,
      penaltyType: 'NONE',
      createdAt: new Date().toISOString(),
    };
    dispatch(addScheme(scheme));
    return scheme;
  };

  const proceedWithSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const addressParts = formData.address.fullAddress.split(',').map(s => s.trim());

      dispatch(
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
        }),
      );

      const stateAfterCustomer = store.getState();
      const customers = stateAfterCustomer.customers?.customers?.allIds || [];
      const lastCustomerId = customers[customers.length - 1];

      if (!lastCustomerId) {
        throw new Error('Customer ID was not created');
      }

      // Persist basic KYC when a document number is provided
      if (formData.kyc.documentNumber.trim()) {
        dispatch(
          addKYCDocument({
            customerId: lastCustomerId,
            kycType: mapDocumentTypeToKYC(formData.kyc.documentType),
            kycNumberMasked: maskKYCNumber(formData.kyc.documentNumber.trim()),
          }),
        );
      }

      // unwrap so a failed device write surfaces as an error instead of a success the
      // agent would trust and a restart would silently discard
      await dispatch(persistCustomers()).unwrap();

      if (requiresDelegation) {
        try {
          const { startAt, endAt } = createDefaultDelegationWindow();

          dispatch(
            createDelegation({
              customerId: lastCustomerId,
              accountId: undefined, // applies to all accounts of the customer
              primaryAgentId: formData.assignment.primaryAgent,
              secondaryAgentId: formData.assignment.delegatedAgent,
              startAt,
              endAt,
              maxAmountPerDay: undefined,
              maxCollectionsPerDay: undefined,
              createdBy: sessionAgentId,
            }),
          );
          await dispatch(persistDelegations()).unwrap();
        } catch (delegationError) {
          console.error('Error creating delegation:', delegationError);
          Alert.alert(
            'Partial Save',
            'Customer was saved, but recording the delegation failed. The delegated agent will not see this customer until it is set again from Edit Customer.',
            [
              {
                text: 'OK',
                onPress: () =>
                  router.replace(`/(app)/(route)/customer-detail/${lastCustomerId}`),
              },
            ],
          );
          return;
        }
      }

      if (formData.pigmyAccount.createAccount) {
        try {
          const scheme = resolveOrCreateScheme(
            formData.assignment.branch,
            formData.pigmyAccount.frequency,
            formData.pigmyAccount.dailyAmount,
          );

          const manualAccountNumber = formData.personal.accountNumber.trim();

          dispatch(
            addAccount({
              customerId: lastCustomerId,
              schemeId: scheme.id,
              installmentAmount: formData.pigmyAccount.dailyAmount,
              status: AccountStatus.ACTIVE,
              // left undefined so the reducer keeps generating the sequential number
              accountNumber: manualAccountNumber || undefined,
            }),
          );
          await dispatch(persistAccounts()).unwrap();
        } catch (accountError) {
          console.error('Error creating account/scheme:', accountError);
          Alert.alert(
            'Partial Save',
            'Customer was saved, but creating the Pigmy account failed. You can retry from Edit Customer later.',
            [
              {
                text: 'OK',
                onPress: () =>
                  router.replace(`/(app)/(route)/customer-detail/${lastCustomerId}`),
              },
            ],
          );
          return;
        }
      }

      Alert.alert('Success', 'Customer added successfully!', [
        {
          text: 'OK',
          onPress: () =>
            router.replace(`/(app)/(route)/customer-detail/${lastCustomerId}`),
        },
      ]);
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert('Error', 'Failed to add customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
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
    if (requiresDelegation && !formData.assignment.delegatedAgent) {
      Alert.alert(
        'Validation Error',
        'Please select the agent this customer is delegated to, or set yourself as primary agent',
      );
      return;
    }
    if (!validatePhone(formData.personal.mobileNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (
      formData.pigmyAccount.createAccount &&
      (!formData.pigmyAccount.dailyAmount || formData.pigmyAccount.dailyAmount <= 0)
    ) {
      Alert.alert('Validation Error', 'Please enter a valid installment amount');
      return;
    }

    // A manually entered account number must not collide with an existing one, including
    // numbers already minted by the generated series
    const manualAccountNumber = formData.personal.accountNumber.trim();
    if (manualAccountNumber) {
      const existingAccount = selectAllAccounts(store.getState()).find(
        a => a.accountNumber.trim().toLowerCase() === manualAccountNumber.toLowerCase(),
      );

      if (existingAccount) {
        Alert.alert(
          'Validation Error',
          `Account number ${existingAccount.accountNumber} is already in use. Enter a different number or leave the field blank to auto-generate one.`,
        );
        return;
      }
    }

    const addressParts = formData.address.fullAddress.split(',').map(s => s.trim());
    const duplicates = selectPotentialDuplicates(
      store.getState(),
      formData.assignment.branch,
      formData.personal.mobileNumber || undefined,
      formData.personal.fullName,
      addressParts[0] || formData.address.fullAddress,
    );

    if (duplicates.length > 0) {
      const summary = duplicates
        .slice(0, 3)
        .map(c => `${c.fullName}${c.phone ? ` (${c.phone})` : ''}`)
        .join('\n');

      Alert.alert(
        'Possible Duplicate',
        `A similar customer may already exist:\n\n${summary}${
          duplicates.length > 3 ? `\n…and ${duplicates.length - 3} more` : ''
        }\n\nYou can continue anyway if this is a different person.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue Anyway',
            onPress: () => {
              void proceedWithSave();
            },
          },
        ],
      );
      return;
    }

    await proceedWithSave();
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
      ],
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
      const branch = allBranches.find(b => (b.name || 'Hangamai Main Branch') === value);
      setFormData({
        ...formData,
        assignment: { ...formData.assignment, branch: branch?.id || value },
      });
    } else if (activeDropdown === 'route') {
      const routeCode = value.split(' - ')[0];
      const route = allRoutes.find(r => r.routeCode === routeCode);
      setFormData({
        ...formData,
        assignment: { ...formData.assignment, route: route?.id || value },
      });
    } else if (activeDropdown === 'agent') {
      const agentId = value.match(/\(([^)]+)\)/)?.[1] || '';
      const keepsDelegate =
        agentId !== sessionAgentId && agentId !== formData.assignment.delegatedAgent;
      setFormData({
        ...formData,
        assignment: {
          ...formData.assignment,
          primaryAgent: agentId,
          // a delegate is only meaningful for another primary agent, and can never be that
          // same agent
          delegatedAgent: keepsDelegate ? formData.assignment.delegatedAgent : '',
        },
      });
    } else if (activeDropdown === 'delegatedAgent') {
      const agentId = value.match(/\(([^)]+)\)/)?.[1] || '';
      setFormData({
        ...formData,
        assignment: { ...formData.assignment, delegatedAgent: agentId },
      });
    } else if (activeDropdown === 'documentType') {
      setFormData({ ...formData, kyc: { ...formData.kyc, documentType: value } });
    } else if (activeDropdown === 'frequency') {
      const selected = frequencyOptions.find(o => o.label === value);
      if (selected) {
        setFormData({
          ...formData,
          pigmyAccount: { ...formData.pigmyAccount, frequency: selected.value },
        });
      }
    }
    closeDropdown();
  };

  const getDropdownOptions = () => {
    switch (activeDropdown) {
      case 'branch':
        return branchOptions;
      case 'route':
        return routeOptions;
      case 'agent':
        return agentOptions;
      case 'delegatedAgent':
        return delegatedAgentOptions;
      case 'documentType':
        return documentTypeOptions;
      case 'frequency':
        return frequencyOptions.map(o => o.label);
      default:
        return [];
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
      case 'delegatedAgent': {
        const agent = allAgents.find(a => a.id === formData.assignment.delegatedAgent);
        return agent ? `${agent.name} (${agent.id})` : '';
      }
      case 'documentType':
        return formData.kyc.documentType;
      case 'frequency':
        return frequencyDisplayLabel(formData.pigmyAccount.frequency);
      default:
        return '';
    }
  };

  const getDropdownTitle = () => {
    switch (activeDropdown) {
      case 'branch':
        return 'Select Branch';
      case 'route':
        return 'Select Route';
      case 'agent':
        return 'Select Primary Agent';
      case 'delegatedAgent':
        return 'Select Delegated Agent';
      case 'documentType':
        return 'Select Document Type';
      case 'frequency':
        return 'Select Frequency';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AddCustomerHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
              onChangeText={text =>
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
                onChangeText={text =>
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
              placeholder="Leave blank to auto-generate"
              placeholderTextColor={theme.colors.text.muted}
              autoCapitalize="characters"
              value={formData.personal.accountNumber}
              onChangeText={text =>
                setFormData({
                  ...formData,
                  personal: { ...formData.personal, accountNumber: text },
                })
              }
            />
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                Enter the passbook account number to use it as-is. It stays separate from the
                Customer ID above.
              </Text>
            </View>
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
              onChangeText={text =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, fullAddress: text },
                })
              }
            />
          </View>
        </View>

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
              <Text
                style={
                  formData.assignment.branch ? styles.dropdownText : styles.dropdownPlaceholder
                }
              >
                {formData.assignment.branch
                  ? allBranches.find(b => b.id === formData.assignment.branch)?.name ||
                    'Hangamai Main Branch'
                  : 'Select Branch'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Route / Beat <Text style={styles.required}>*</Text>
            </Text>
            {isRouteLocked ? (
              <View style={styles.inputWithIcon}>
                <Text style={styles.readOnlyValue}>
                  {presetRoute
                    ? `${presetRoute.routeCode} - ${presetRoute.name}`
                    : 'Route selected on the previous screen'}
                </Text>
                <Text style={styles.inputIcon}>🔒</Text>
              </View>
            ) : (
              <Pressable onPress={() => openDropdown('route')} style={styles.dropdown}>
                <Text
                  style={
                    formData.assignment.route ? styles.dropdownText : styles.dropdownPlaceholder
                  }
                >
                  {formData.assignment.route
                    ? (() => {
                        const route = allRoutes.find(r => r.id === formData.assignment.route);
                        return route ? `${route.routeCode} - ${route.name}` : 'Select Route';
                      })()
                    : 'Select Route'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Primary Agent <Text style={styles.required}>*</Text>
            </Text>
            <Pressable onPress={() => openDropdown('agent')} style={styles.dropdown}>
              <Text
                style={
                  formData.assignment.primaryAgent
                    ? styles.dropdownText
                    : styles.dropdownPlaceholder
                }
              >
                {formData.assignment.primaryAgent
                  ? (() => {
                      const agent = allAgents.find(
                        a => a.id === formData.assignment.primaryAgent,
                      );
                      // the session agent may have no Agent record yet, so show the id
                      // rather than implying nothing is selected
                      return agent
                        ? `${agent.name} (${agent.id})`
                        : formData.assignment.primaryAgent;
                    })()
                  : 'Select Agent'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          {requiresDelegation && (
            <View style={styles.field}>
              <Text style={styles.label}>
                Delegated Agent <Text style={styles.required}>*</Text>
              </Text>
              <Pressable onPress={() => openDropdown('delegatedAgent')} style={styles.dropdown}>
                <Text
                  style={
                    formData.assignment.delegatedAgent
                      ? styles.dropdownText
                      : styles.dropdownPlaceholder
                  }
                >
                  {formData.assignment.delegatedAgent
                    ? (() => {
                        const agent = allAgents.find(
                          a => a.id === formData.assignment.delegatedAgent,
                        );
                        return agent ? `${agent.name} (${agent.id})` : 'Select Agent';
                      })()
                    : 'Select Agent'}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.field}>
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                {requiresDelegation
                  ? 'The customer stays owned by the primary agent and is delegated to the selected agent for collections.'
                  : 'The selected agent will be responsible for daily pigmy collections from this customer.'}
              </Text>
            </View>
          </View>
        </View>

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
              onChangeText={text =>
                setFormData({
                  ...formData,
                  kyc: { ...formData.kyc, documentNumber: text },
                })
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>💰</Text>
            <Text style={styles.sectionTitle}>Pigmy Account</Text>
          </View>

          <View style={styles.toggleSection}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>Create Pigmy Account</Text>
              <Text style={styles.toggleSubtitle}>
                Link a savings scheme with frequency and installment amount
              </Text>
            </View>
            <Switch
              value={formData.pigmyAccount.createAccount}
              onValueChange={value =>
                setFormData({
                  ...formData,
                  pigmyAccount: { ...formData.pigmyAccount, createAccount: value },
                })
              }
              trackColor={{
                false: theme.colors.background.divider,
                true: theme.colors.brand.primary,
              }}
            />
          </View>

          {formData.pigmyAccount.createAccount && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>
                  Frequency <Text style={styles.required}>*</Text>
                </Text>
                <Pressable onPress={() => openDropdown('frequency')} style={styles.dropdown}>
                  <Text style={styles.dropdownText}>
                    {frequencyDisplayLabel(formData.pigmyAccount.frequency)}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </Pressable>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  Installment Amount (₹) <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500"
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType="numeric"
                  value={String(formData.pigmyAccount.dailyAmount || '')}
                  onChangeText={text => {
                    const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
                    setFormData({
                      ...formData,
                      pigmyAccount: {
                        ...formData.pigmyAccount,
                        dailyAmount: Number.isFinite(parsed) ? parsed : 0,
                      },
                    });
                  }}
                />
              </View>
            </>
          )}
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
            disabled={isSaving}
            style={({ pressed }) => [
              styles.saveButton,
              { opacity: isSaving ? 0.5 : pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.saveButtonIcon}>💾</Text>
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving…' : 'Save Customer'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      <BottomSheet isOpen={isDropdownOpen} onClose={closeDropdown}>
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>{getDropdownTitle()}</Text>
          <View style={styles.optionsList}>
            {getDropdownOptions().map(option => (
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
