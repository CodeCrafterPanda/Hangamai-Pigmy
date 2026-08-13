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
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch, useStore } from 'react-redux';
import type { State, Dispatch } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation } from '@/i18n';
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

const frequencyOptions: SchemeFrequency[] = [
  SchemeFrequency.DAILY,
  SchemeFrequency.WEEKLY,
  SchemeFrequency.MONTHLY,
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
  const { t } = useTranslation();
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

  const unnamedBranch = t('common.unnamedBranch');
  const unnamedAgent = t('common.unnamedAgent');

  const documentTypeLabel = (documentType: string) => {
    switch (documentType) {
      case 'Aadhaar Card':
        return t('addCustomer.documentTypes.aadhaar');
      case 'PAN Card':
        return t('addCustomer.documentTypes.pan');
      case 'Voter ID':
        return t('addCustomer.documentTypes.voterId');
      case 'Driving License':
        return t('addCustomer.documentTypes.drivingLicense');
      case 'Passport':
        return t('addCustomer.documentTypes.passport');
      default:
        return documentType;
    }
  };

  const branchOptions = useMemo(() => {
    return allBranches.map(b => b.name || unnamedBranch);
  }, [allBranches, unnamedBranch]);

  const routeOptions = useMemo(() => {
    return allRoutes.map(r => r.name);
  }, [allRoutes]);

  const agentOptions = useMemo(() => {
    return allAgents.map(a => a.name || unnamedAgent);
  }, [allAgents, unnamedAgent]);

  const soleBranchId = allBranches.length === 1 ? allBranches[0].id : undefined;

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
      branch: soleBranchId || '',
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

  useEffect(() => {
    if (!soleBranchId) return;
    setFormData(prev => {
      if (prev.assignment.branch === soleBranchId) return prev;
      return {
        ...prev,
        assignment: { ...prev.assignment, branch: soleBranchId },
      };
    });
  }, [soleBranchId]);

  const isBranchLocked = Boolean(soleBranchId);
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
      .map(a => a.name || unnamedAgent);
  }, [allAgents, formData.assignment.primaryAgent, unnamedAgent]);

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
            t('addCustomer.partialSave'),
            t('addCustomer.partialDelegation'),
            [
              {
                text: t('common.ok'),
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
            t('addCustomer.partialSave'),
            t('addCustomer.partialAccount'),
            [
              {
                text: t('common.ok'),
                onPress: () =>
                  router.replace(`/(app)/(route)/customer-detail/${lastCustomerId}`),
              },
            ],
          );
          return;
        }
      }

      Alert.alert(t('common.success'), t('addCustomer.addedSuccess'), [
        {
          text: t('common.ok'),
          onPress: () =>
            router.replace(`/(app)/(route)/customer-detail/${lastCustomerId}`),
        },
      ]);
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert(t('common.error'), t('addCustomer.addFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!formData.personal.fullName.trim()) {
      Alert.alert(t('addCustomer.validationTitle'), t('addCustomer.enterName'));
      return;
    }
    if (!formData.address.fullAddress.trim()) {
      Alert.alert(t('addCustomer.validationTitle'), t('addCustomer.enterAddress'));
      return;
    }
    if (!formData.assignment.branch) {
      Alert.alert(t('addCustomer.validationTitle'), t('addCustomer.selectBranchError'));
      return;
    }
    if (!formData.assignment.route) {
      Alert.alert(t('addCustomer.validationTitle'), t('addCustomer.selectRouteError'));
      return;
    }
    if (!formData.assignment.primaryAgent) {
      Alert.alert(t('addCustomer.validationTitle'), t('addCustomer.selectPrimaryAgentError'));
      return;
    }
    if (requiresDelegation && !formData.assignment.delegatedAgent) {
      Alert.alert(
        t('addCustomer.validationTitle'),
        t('addCustomer.selectDelegatedAgentError'),
      );
      return;
    }
    if (!validatePhone(formData.personal.mobileNumber)) {
      Alert.alert(t('addCustomer.validationTitle'), t('addCustomer.invalidMobile'));
      return;
    }
    if (
      formData.pigmyAccount.createAccount &&
      (!formData.pigmyAccount.dailyAmount || formData.pigmyAccount.dailyAmount <= 0)
    ) {
      Alert.alert(t('addCustomer.validationTitle'), t('addCustomer.invalidInstallment'));
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
          t('addCustomer.validationTitle'),
          t('addCustomer.accountInUse', { accountNumber: existingAccount.accountNumber }),
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

      const extra =
        duplicates.length > 3 ? `\n${t('addCustomer.andMore', { count: duplicates.length - 3 })}` : '';

      Alert.alert(
        t('addCustomer.possibleDuplicate'),
        t('addCustomer.possibleDuplicateMessage', { summary: `${summary}${extra}` }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.continueAnyway'),
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
      t('addCustomer.cancelTitle'),
      t('addCustomer.cancelMessage'),
      [
        { text: t('common.continueEditing'), style: 'cancel' },
        {
          text: t('common.discard'),
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
      const branch = allBranches.find(b => (b.name || unnamedBranch) === value);
      setFormData({
        ...formData,
        assignment: { ...formData.assignment, branch: branch?.id || value },
      });
    } else if (activeDropdown === 'route') {
      const route = allRoutes.find(r => r.name === value);
      setFormData({
        ...formData,
        assignment: { ...formData.assignment, route: route?.id || value },
      });
    } else if (activeDropdown === 'agent') {
      const agent = allAgents.find(a => (a.name || unnamedAgent) === value);
      const agentId = agent?.id || '';
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
      const agent = allAgents.find(a => (a.name || unnamedAgent) === value);
      setFormData({
        ...formData,
        assignment: { ...formData.assignment, delegatedAgent: agent?.id || '' },
      });
    } else if (activeDropdown === 'documentType') {
      setFormData({ ...formData, kyc: { ...formData.kyc, documentType: value } });
    } else if (activeDropdown === 'frequency') {
      if (
        value === SchemeFrequency.DAILY ||
        value === SchemeFrequency.WEEKLY ||
        value === SchemeFrequency.MONTHLY
      ) {
        setFormData({
          ...formData,
          pigmyAccount: { ...formData.pigmyAccount, frequency: value },
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
        return frequencyOptions;
      default:
        return [];
    }
  };

  const getDropdownValue = () => {
    switch (activeDropdown) {
      case 'branch': {
        const branch = allBranches.find(b => b.id === formData.assignment.branch);
        return branch?.name || unnamedBranch;
      }
      case 'route': {
        const route = allRoutes.find(r => r.id === formData.assignment.route);
        return route ? route.name : '';
      }
      case 'agent': {
        const agent = allAgents.find(a => a.id === formData.assignment.primaryAgent);
        return agent ? agent.name || unnamedAgent : '';
      }
      case 'delegatedAgent': {
        const agent = allAgents.find(a => a.id === formData.assignment.delegatedAgent);
        return agent ? agent.name || unnamedAgent : '';
      }
      case 'documentType':
        return formData.kyc.documentType;
      case 'frequency':
        return formData.pigmyAccount.frequency;
      default:
        return '';
    }
  };

  const getDropdownTitle = () => {
    switch (activeDropdown) {
      case 'branch':
        return t('addCustomer.selectBranch');
      case 'route':
        return t('addCustomer.selectRoute');
      case 'agent':
        return t('addCustomer.selectPrimaryAgent');
      case 'delegatedAgent':
        return t('addCustomer.selectDelegatedAgent');
      case 'documentType':
        return t('addCustomer.selectDocumentType');
      case 'frequency':
        return t('addCustomer.selectFrequency');
      default:
        return '';
    }
  };

  const getOptionLabel = (option: string) => {
    if (activeDropdown === 'documentType') {
      return documentTypeLabel(option);
    }
    if (activeDropdown === 'frequency') {
      return t(`schemeFrequency.${option as SchemeFrequency}`);
    }
    return option;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AddCustomerHeader />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>👤</Text>
            <Text style={styles.sectionTitle}>{t('addCustomer.personalDetails')}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {t('addCustomer.fullName')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('addCustomer.fullNamePlaceholder')}
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
            <Text style={styles.label}>{t('addCustomer.mobileNumber')}</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.inputFlex}
                placeholder={t('addCustomer.mobilePlaceholder')}
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
            <Text style={styles.label}>{t('addCustomer.customerIdCif')}</Text>
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
            <Text style={styles.label}>{t('addCustomer.accountNumber')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addCustomer.accountNumberPlaceholder')}
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
              <Text style={styles.infoText}>{t('addCustomer.accountNumberHint')}</Text>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>
              {t('addCustomer.address')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder={t('addCustomer.addressPlaceholder')}
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
            <Text style={styles.sectionTitle}>{t('addCustomer.assignment')}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {t('addCustomer.branch')} <Text style={styles.required}>*</Text>
            </Text>
            {isBranchLocked ? (
              <View style={styles.inputWithIcon}>
                <Text style={styles.readOnlyValue}>
                  {allBranches[0]?.name || unnamedBranch}
                </Text>
                <Text style={styles.inputIcon}>🔒</Text>
              </View>
            ) : (
              <Pressable onPress={() => openDropdown('branch')} style={styles.dropdown}>
                <Text
                  style={
                    formData.assignment.branch ? styles.dropdownText : styles.dropdownPlaceholder
                  }
                >
                  {formData.assignment.branch
                    ? allBranches.find(b => b.id === formData.assignment.branch)?.name ||
                      unnamedBranch
                    : t('addCustomer.selectBranch')}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {t('addCustomer.routeBeat')} <Text style={styles.required}>*</Text>
            </Text>
            {isRouteLocked ? (
              <View style={styles.inputWithIcon}>
                <Text style={styles.readOnlyValue}>
                  {presetRoute
                    ? presetRoute.name
                    : t('addCustomer.routeLockedHint')}
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
                        return route ? route.name : t('addCustomer.selectRoute');
                      })()
                    : t('addCustomer.selectRoute')}
                </Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {t('addCustomer.primaryAgent')} <Text style={styles.required}>*</Text>
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
                        ? agent.name || unnamedAgent
                        : unnamedAgent;
                    })()
                  : t('addCustomer.selectAgent')}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          {requiresDelegation && (
            <View style={styles.field}>
              <Text style={styles.label}>
                {t('addCustomer.delegatedAgent')} <Text style={styles.required}>*</Text>
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
                        return agent
                          ? agent.name || unnamedAgent
                          : t('addCustomer.selectAgent');
                      })()
                    : t('addCustomer.selectAgent')}
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
                  ? t('addCustomer.delegatedHint')
                  : t('addCustomer.primaryHint')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>✓</Text>
            <Text style={styles.sectionTitle}>{t('addCustomer.kycCompliance')}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('addCustomer.documentType')}</Text>
            <Pressable onPress={() => openDropdown('documentType')} style={styles.dropdown}>
              <Text style={styles.dropdownText}>
                {documentTypeLabel(formData.kyc.documentType)}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>{t('addCustomer.documentNumber')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addCustomer.documentNumberPlaceholder')}
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
            <Text style={styles.sectionTitle}>{t('addCustomer.pigmyAccount')}</Text>
          </View>

          <View style={styles.toggleSection}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>{t('addCustomer.createPigmyAccount')}</Text>
              <Text style={styles.toggleSubtitle}>
                {t('addCustomer.createPigmyAccountHint')}
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
                  {t('addCustomer.frequency')} <Text style={styles.required}>*</Text>
                </Text>
                <Pressable onPress={() => openDropdown('frequency')} style={styles.dropdown}>
                  <Text style={styles.dropdownText}>
                    {t(`schemeFrequency.${formData.pigmyAccount.frequency}`)}
                  </Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </Pressable>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  {t('addCustomer.installmentAmount')} <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('addCustomer.installmentPlaceholder')}
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
            <Text style={styles.cancelButtonText}>{t('addCustomer.cancel')}</Text>
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
              {isSaving ? t('addCustomer.saving') : t('addCustomer.saveCustomer')}
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
                  {getOptionLabel(option)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}
