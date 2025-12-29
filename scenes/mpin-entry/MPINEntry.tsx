import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';

export default function MPINEntry() {
  const router = useRouter();
  const { theme } = useTheme();
  const [pin, setPin] = useState('');
  const [deviceInfo] = useState('Device linked to Agent: AGT-2024-X');

  const handleNumberPress = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Auto-verify when 4 digits entered
      if (newPin.length === 4) {
        setTimeout(() => {
          console.log('Verify PIN:', newPin);
          // TODO: Verify PIN and navigate
          router.replace('/(main)/(tabs)/home');
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleBiometric = () => {
    console.log('Biometric authentication');
    // TODO: Implement biometric auth
  };

  const handleForgotPIN = () => {
    console.log('Forgot MPIN');
    // TODO: Navigate to forgot PIN flow
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
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
      backgroundColor: 'rgba(18, 26, 43, 0.4)',
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
      backgroundColor: 'rgba(31, 42, 68, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(59, 111, 255, 0.1)',
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
      backgroundColor: 'rgba(31, 42, 68, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(59, 111, 255, 0.1)',
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
        colors={['#0B1220', '#1A2440', '#0B1220']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🏛</Text>
          </View>

          <Text style={styles.title}>Enter MPIN</Text>
          <Text style={styles.subtitle}>
            Please enter your 4-digit code to access the collection dashboard.
          </Text>

          <View style={styles.pinDotsContainer}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[styles.pinDot, index < pin.length && styles.pinDotFilled]}
              />
            ))}
          </View>

          <View style={styles.deviceInfo}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.deviceText}>{deviceInfo}</Text>
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
              <Pressable
                onPress={handleBiometric}
                style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.iconButtonIcon}>👆</Text>
              </Pressable>
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

          <Pressable onPress={handleForgotPIN} style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot MPIN?</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

