import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme, typography, spacing, radius, screenGradient, withAlpha } from '@/theme';
import { useTranslation } from '@/i18n';
import { useSettingsSlice } from '@/slices';
import { useDispatch } from 'react-redux';
import { setLoggedIn } from '@/slices/app.slice';
import type { Dispatch } from '@/utils/store';
import { generateUUID } from '@/utils/uuid';
import AlertBottomSheet from '@/components/elements/AlertBottomSheet';

// Simple hash function for MPIN (in production, use proper crypto)
function hashMPIN(mpin: string): string {
  return `hash_${mpin}_${Date.now()}`; // Simplified - use proper hashing in production
}

export default function MPINEntry() {
  const router = useRouter();
  const dispatch = useDispatch<Dispatch>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ phoneNumber?: string; isSetup?: string }>();
  const { session, updateSession, persistSettings } = useSettingsSlice();

  const isSetupMode = params?.isSetup === 'true';
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    buttons: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    buttons: [],
  });

  const handleNumberPress = async (num: number) => {
    if (pin.length < 4 && step === 'enter') {
      const newPin = pin + num;
      setPin(newPin);

      // Auto-verify when 4 digits entered
      if (newPin.length === 4) {
        setTimeout(async () => {
          if (isSetupMode) {
            // Setup mode: Ask for confirmation
            setStep('confirm');
            setConfirmPin('');
          } else {
            // Login mode: Verify against stored hash
            await verifyMPIN(newPin);
          }
        }, 300);
      }
    } else if (confirmPin.length < 4 && step === 'confirm') {
      const newConfirmPin = confirmPin + num;
      setConfirmPin(newConfirmPin);

      if (newConfirmPin.length === 4) {
        setTimeout(() => {
          if (newConfirmPin === pin) {
            // MPINs match - save and login
            saveMPIN(pin);
          } else {
            // MPINs don't match
            setAlertConfig({
              isOpen: true,
              title: t('auth.mismatchTitle'),
              message: t('auth.mismatchMessage'),
              buttons: [
                {
                  text: t('common.ok'),
                  style: 'default',
                  onPress: () => {
                    setPin('');
                    setConfirmPin('');
                    setStep('enter');
                  },
                },
              ],
            });
          }
        }, 300);
      }
    }
  };

  const verifyMPIN = async (enteredPin: string) => {
    // In production, compare hashed values
    const storedHash = session?.mpinHash;
    const enteredHash = hashMPIN(enteredPin);

    // Simple verification (in production, use proper crypto comparison)
    if (storedHash && storedHash.includes(enteredPin)) {
      console.log('[MPIN] Verification successful');

      // Update session
      updateSession({
        loggedInAt: new Date().toISOString(),
      });

      await persistSettings();

      // Set logged in state
      dispatch(setLoggedIn(true));

      // Navigate to app
      router.replace('/(app)/(home)');
    } else {
      setAlertConfig({
        isOpen: true,
        title: t('auth.invalidTitle'),
        message: t('auth.invalidMessage'),
        buttons: [
          {
            text: t('common.ok'),
            style: 'default',
            onPress: () => setPin(''),
          },
        ],
      });
    }
  };

  const saveMPIN = async (mpin: string) => {
    console.log('[MPIN] Saving MPIN...');

    // Generate device fingerprint if not exists
    const deviceFingerprint = session?.deviceFingerprint || generateUUID();

    // Hash the MPIN
    const mpinHash = hashMPIN(mpin);

    // Update session with MPIN and temporary agent data
    updateSession({
      agentId: `agent-${phoneNumber}`, // Temporary - replace with API response
      branchId: 'branch-001', // Temporary - replace with API response
      deviceFingerprint,
      mpinHash,
      mpinSetAt: new Date().toISOString(),
      loggedInAt: new Date().toISOString(),
    });

    await persistSettings();

    // Set logged in state
    dispatch(setLoggedIn(true));

    // Navigate to app
    router.replace('/(app)/(home)');
  };

  const phoneNumber = params?.phoneNumber || session?.agentId?.replace('agent-', '') || '****';
  const displayDeviceInfo = isSetupMode
    ? t('auth.settingUpFor', { phone: phoneNumber })
    : t('auth.deviceLinked');

  const handleDelete = () => {
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleBiometric = () => {
    console.log('Biometric authentication');
    // TODO: Implement biometric auth
  };

  const handleForgotPIN = () => {
    setAlertConfig({
      isOpen: true,
      title: t('auth.resetTitle'),
      message: t('auth.resetMessage'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.reset'),
          style: 'destructive',
          onPress: async () => {
            // Clear MPIN from session
            updateSession({ mpinHash: undefined, mpinSetAt: undefined });
            await persistSettings();
            router.replace('/(auth)/login');
          },
        },
      ],
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    gradient: {
      flex: 1,
      paddingVertical: spacing(theme, 'xxl'),
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'xxl') * 2,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceTint.primarySoft,
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
      marginBottom: spacing(theme, 'sm'),
    },
    subtitle: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing(theme, 'xxl'),
      paddingHorizontal: spacing(theme, 'lg'),
    },
    pinDotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing(theme, 'md'),
      marginBottom: spacing(theme, 'xl'),
    },
    pinDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.colors.text.muted,
      backgroundColor: 'transparent',
    },
    pinDotFilled: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    deviceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
      marginBottom: spacing(theme, 'xxl'),
    },
    lockIcon: {
      fontSize: 12,
      color: theme.colors.text.muted,
    },
    deviceText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontSize: 11,
    },
    numpadContainer: {
      backgroundColor: withAlpha(theme.colors.background.card, 0.55),
      borderRadius: radius(theme, 'card') + 8,
      padding: spacing(theme, 'lg'),
      marginHorizontal: spacing(theme, 'md'),
    },
    numpadRow: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      marginBottom: spacing(theme, 'md'),
    },
    numButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: withAlpha(theme.colors.background.cardElevated, 0.9),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.brand.primary, 0.15),
    },
    numButtonText: {
      ...typography(theme, 'displayXL'),
      fontSize: 24,
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    iconButton: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor: withAlpha(theme.colors.background.cardElevated, 0.9),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.brand.primary, 0.15),
    },
    iconButtonIcon: {
      fontSize: 24,
      color: theme.colors.brand.primary,
    },
    deleteIcon: {
      fontSize: 20,
      color: theme.colors.text.secondary,
    },
    forgotLink: {
      alignSelf: 'center',
      marginTop: spacing(theme, 'lg'),
      paddingVertical: spacing(theme, 'sm'),
    },
    forgotText: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={screenGradient(theme)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏛</Text>
          </View>

          <Text style={styles.title}>
            {isSetupMode
              ? (step === 'enter' ? t('auth.setYourMpin') : t('auth.confirmMpin'))
              : t('auth.enterYourMpin')}
          </Text>
          <Text style={styles.subtitle}>
            {isSetupMode
              ? (step === 'enter'
                ? t('auth.createMpinHint')
                : t('auth.confirmMpinHint'))
              : t('auth.enterMpinHint')}
          </Text>

          <View style={styles.pinDotsContainer}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  index < (step === 'enter' ? pin.length : confirmPin.length) && styles.pinDotFilled
                ]}
              />
            ))}
          </View>

          <View style={styles.deviceInfo}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.deviceText}>{displayDeviceInfo}</Text>
          </View>

          <View style={styles.numpadContainer}>
            <View style={styles.numpadRow}>
              <Pressable
                onPress={() => handleNumberPress(1)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>1</Text>
              </Pressable>
              <Pressable
                onPress={() => handleNumberPress(2)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>2</Text>
              </Pressable>
              <Pressable
                onPress={() => handleNumberPress(3)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>3</Text>
              </Pressable>
            </View>

            <View style={styles.numpadRow}>
              <Pressable
                onPress={() => handleNumberPress(4)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>4</Text>
              </Pressable>
              <Pressable
                onPress={() => handleNumberPress(5)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>5</Text>
              </Pressable>
              <Pressable
                onPress={() => handleNumberPress(6)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>6</Text>
              </Pressable>
            </View>

            <View style={styles.numpadRow}>
              <Pressable
                onPress={() => handleNumberPress(7)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>7</Text>
              </Pressable>
              <Pressable
                onPress={() => handleNumberPress(8)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>8</Text>
              </Pressable>
              <Pressable
                onPress={() => handleNumberPress(9)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>9</Text>
              </Pressable>
            </View>

            <View style={styles.numpadRow}>
              {!isSetupMode ? (
                <Pressable
                  onPress={handleBiometric}
                  accessibilityLabel={t('auth.useBiometric')}
                  style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={styles.iconButtonIcon}>👆</Text>
                </Pressable>
              ) : (
                <View style={{ width: 70 }} />
              )}
              <Pressable
                onPress={() => handleNumberPress(0)}
                style={({ pressed }) => [styles.numButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.numButtonText}>0</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.deleteIcon}>⌫</Text>
              </Pressable>
            </View>
          </View>

          {!isSetupMode && (
            <Pressable onPress={handleForgotPIN} style={styles.forgotLink}>
              <Text style={styles.forgotText}>{t('auth.forgotMpin')}</Text>
            </Pressable>
          )}
        </View>
      </LinearGradient>

      <AlertBottomSheet
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
      />
    </SafeAreaView>
  );
}

