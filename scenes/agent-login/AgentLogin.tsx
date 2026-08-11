import { View, Text, StyleSheet, Pressable, TextInput, Keyboard } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';

export default function AgentLogin() {
  const router = useRouter();
  const { theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSendOTP = () => {
    if (phoneNumber.length === 10) {
      console.log('Send OTP to:', phoneNumber);
      Keyboard.dismiss();
      // Navigate to MPIN setup (first time)
      router.push({
        pathname: '/(auth)/mpin',
        params: { phoneNumber, isSetup: 'true' },
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      justifyContent: 'space-between',
      paddingVertical: spacing(theme, 'xxl'),
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 16,
      backgroundColor: 'rgba(11, 18, 32, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      marginBottom: spacing(theme, 'xl'),
    },
    icon: {
      fontSize: 40,
      color: theme.colors.brand.primary,
    },
    title: {
      ...typography(theme, 'displayXL'),
      fontSize: 28,
      color: theme.colors.text.primary,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: spacing(theme, 'xs'),
    },
    subtitle: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
      marginBottom: spacing(theme, 'xxl'),
    },
    loginCard: {
      backgroundColor: 'rgba(18, 26, 43, 0.6)',
      borderRadius: radius(theme, 'card') + 8,
      padding: spacing(theme, 'xl'),
      borderWidth: 1,
      borderColor: 'rgba(59, 111, 255, 0.2)',
      gap: spacing(theme, 'lg'),
    },
    instructionText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing(theme, 'sm'),
    },
    inputSection: {
      gap: spacing(theme, 'xs'),
    },
    inputLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 10,
    },
    phoneInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      height: 52,
      paddingHorizontal: spacing(theme, 'md'),
      gap: spacing(theme, 'sm'),
    },
    countryCode: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    phoneInput: {
      flex: 1,
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      height: '100%',
      fontSize: 16,
    },
    phoneIcon: {
      fontSize: 18,
      color: theme.colors.text.muted,
    },
    sendOTPButton: {
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
      marginTop: spacing(theme, 'sm'),
    },
    sendOTPButtonDisabled: {
      opacity: 0.5,
    },
    sendOTPButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
    sendOTPButtonIcon: {
      fontSize: 16,
      color: '#FFFFFF',
    },
    helpSection: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
      marginTop: spacing(theme, 'lg'),
    },
    helpIcon: {
      fontSize: 14,
      color: theme.colors.text.muted,
    },
    helpText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    bottomSection: {
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    securityText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 10,
    },
  });

  const isPhoneValid = phoneNumber.length === 10;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#0B1220', '#1A2440', '#0B1220']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏛</Text>
          </View>

          <Text style={styles.title}>Agent Login</Text>
          <Text style={styles.subtitle}>Co-operative Bank Pigmy Collection</Text>

          <View style={styles.loginCard}>
            <Text style={styles.instructionText}>
              Enter your registered mobile number to access your collection dashboard.
            </Text>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 00000"
                  placeholderTextColor={theme.colors.text.muted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
                <Text style={styles.phoneIcon}>📱</Text>
              </View>
            </View>

            <Pressable
              onPress={handleSendOTP}
              disabled={!isPhoneValid}
              style={({ pressed }) => [
                styles.sendOTPButton,
                !isPhoneValid && styles.sendOTPButtonDisabled,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.sendOTPButtonText}>Send OTP</Text>
              <Text style={styles.sendOTPButtonIcon}>→</Text>
            </Pressable>

            <View style={styles.helpSection}>
              <Text style={styles.helpIcon}>ℹ️</Text>
              <Text style={styles.helpText}>Need help? Contact branch</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.securityText}>SECURED • ENCRYPTED • OFFLINE</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

