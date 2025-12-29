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
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { AddCustomerFormData } from '@/types/AddCustomerData';

export default function AddNewCustomer() {
  const router = useRouter();
  const { theme } = useTheme();

  const [formData, setFormData] = useState<AddCustomerFormData>({
    personal: {
      fullName: '',
      mobileNumber: '',
      customerId: 'PENDING:GEN',
    },
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      state: 'Karnataka',
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
      fontSize: 18,
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    scrollContent: {
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xxl') + 80,
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

  const handleBack = () => {
    router.back();
  };

  const handleSave = () => {
    console.log('Save customer:', formData);
    // TODO: Validate and save customer
    Alert.alert('Success', 'Customer added successfully!');
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Add New Customer</Text>
      </View>

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
            <Text style={styles.helpText}>Used for transaction SMS alerts.</Text>
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
        </View>

        {/* Address Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={styles.sectionTitle}>Address Details</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Address Line 1 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="House No, Building Name"
              placeholderTextColor={theme.colors.text.muted}
              value={formData.address.addressLine1}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, addressLine1: text },
                })
              }
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              placeholder="Street, Area"
              placeholderTextColor={theme.colors.text.muted}
              value={formData.address.addressLine2}
              onChangeText={(text) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, addressLine2: text },
                })
              }
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfWidth]}>
              <Text style={styles.label}>City / Village</Text>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor={theme.colors.text.muted}
                value={formData.address.city}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, city: text },
                  })
                }
              />
            </View>

            <View style={[styles.field, styles.halfWidth]}>
              <Text style={styles.label}>Pincode</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor={theme.colors.text.muted}
                keyboardType="numeric"
                maxLength={6}
                value={formData.address.pincode}
                onChangeText={(text) =>
                  setFormData({
                    ...formData,
                    address: { ...formData.address, pincode: text },
                  })
                }
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>State</Text>
            <Pressable style={styles.dropdown}>
              <Text style={styles.dropdownText}>{formData.address.state}</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
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
            <Pressable style={styles.dropdown}>
              <Text style={formData.assignment.branch ? styles.dropdownText : styles.dropdownPlaceholder}>
                {formData.assignment.branch || 'Select Branch'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Route / Beat</Text>
            <Pressable style={styles.dropdown}>
              <Text style={formData.assignment.route ? styles.dropdownText : styles.dropdownPlaceholder}>
                {formData.assignment.route || 'Select Route'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Primary Agent</Text>
            <Pressable style={styles.dropdown}>
              <Text style={formData.assignment.primaryAgent ? styles.dropdownText : styles.dropdownPlaceholder}>
                {formData.assignment.primaryAgent || 'Select Agent'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </Pressable>

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
            <Pressable style={styles.dropdown}>
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

          <View style={styles.field}>
            <Text style={styles.label}>Upload Document</Text>
            <Pressable style={styles.uploadArea}>
              <Text style={styles.uploadIcon}>☁️</Text>
              <Text style={styles.uploadText}>
                <Text style={styles.uploadLink}>Click to upload</Text> or drag and drop
              </Text>
              <Text style={styles.uploadHint}>SVG, PNG, JPG or PDF (MAX. 5MB)</Text>
            </Pressable>
          </View>
        </View>

        {/* Create Pigmy Account */}
        <View style={styles.section}>
          <View style={styles.toggleSection}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleIcon}>💰</Text>
              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Create Pigmy Account</Text>
                <Text style={styles.toggleSubtitle}>
                  Start a collection scheme immediately
                </Text>
              </View>
            </View>
            <Switch
              value={formData.pigmyAccount.createAccount}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  pigmyAccount: { ...formData.pigmyAccount, createAccount: value },
                })
              }
              trackColor={{ false: theme.colors.background.divider, true: theme.colors.brand.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {formData.pigmyAccount.createAccount && (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Scheme Type</Text>
                <Pressable style={styles.dropdown}>
                  <Text style={styles.dropdownText}>{formData.pigmyAccount.schemeType}</Text>
                  <Text style={styles.dropdownIcon}>▼</Text>
                </Pressable>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.halfWidth]}>
                  <Text style={styles.label}>Daily Amount</Text>
                  <View style={styles.inputWithIcon}>
                    <Text style={[styles.inputIcon, { marginRight: spacing(theme, 'xs') }]}>₹</Text>
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="500"
                      placeholderTextColor={theme.colors.text.muted}
                      keyboardType="numeric"
                      value={formData.pigmyAccount.dailyAmount.toString()}
                      onChangeText={(text) =>
                        setFormData({
                          ...formData,
                          pigmyAccount: {
                            ...formData.pigmyAccount,
                            dailyAmount: parseInt(text) || 0,
                          },
                        })
                      }
                    />
                  </View>
                </View>

                <View style={[styles.field, styles.halfWidth]}>
                  <Text style={styles.label}>Start Date</Text>
                  <View style={styles.inputWithIcon}>
                    <TextInput
                      style={styles.inputFlex}
                      placeholder="10/27/2023"
                      placeholderTextColor={theme.colors.text.muted}
                      value={formData.pigmyAccount.startDate}
                      onChangeText={(text) =>
                        setFormData({
                          ...formData,
                          pigmyAccount: { ...formData.pigmyAccount, startDate: text },
                        })
                      }
                    />
                    <Text style={styles.inputIcon}>📅</Text>
                  </View>
                </View>
              </View>
            </>
          )}
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
          onPress={handleSave}
          style={({ pressed }) => [styles.saveButton, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.saveButtonIcon}>💾</Text>
          <Text style={styles.saveButtonText}>Save Customer</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

