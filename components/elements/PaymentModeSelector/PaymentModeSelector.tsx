import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { PaymentMode } from '@/types/CollectDepositData';

interface PaymentModeSelectorProps {
  selectedMode: PaymentMode;
  onModeChange: (mode: PaymentMode) => void;
}

export default function PaymentModeSelector({
  selectedMode,
  onModeChange,
}: PaymentModeSelectorProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      gap: spacing(theme, 'md'),
    },
    label: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    modesContainer: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    modeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'sm'),
      borderRadius: radius(theme, 'button'),
      borderWidth: 1,
    },
    cashButton: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    cashButtonInactive: {
      backgroundColor: theme.colors.background.cardElevated,
      borderColor: theme.colors.background.divider,
    },
    upiButton: {
      backgroundColor: theme.colors.background.cardElevated,
      borderColor: theme.colors.background.divider,
    },
    upiButtonActive: {
      backgroundColor: theme.colors.brand.primary,
      borderColor: theme.colors.brand.primary,
    },
    icon: {
      fontSize: 20,
    },
    cashIconActive: {
      color: '#FFFFFF',
    },
    cashIconInactive: {
      color: theme.colors.text.muted,
    },
    upiIconActive: {
      color: '#FFFFFF',
    },
    upiIconInactive: {
      color: theme.colors.text.muted,
    },
    modeText: {
      ...typography(theme, 'sectionTitle'),
      fontWeight: '600',
    },
    cashTextActive: {
      color: '#FFFFFF',
    },
    cashTextInactive: {
      color: theme.colors.text.secondary,
    },
    upiTextActive: {
      color: '#FFFFFF',
    },
    upiTextInactive: {
      color: theme.colors.text.secondary,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>PAYMENT MODE</Text>

      <View style={styles.modesContainer}>
        <Pressable
          onPress={() => onModeChange('cash')}
          style={({ pressed }) => [
            styles.modeButton,
            selectedMode === 'cash' ? styles.cashButton : styles.cashButtonInactive,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text
            style={[
              styles.icon,
              selectedMode === 'cash' ? styles.cashIconActive : styles.cashIconInactive,
            ]}
          >
            💵
          </Text>
          <Text
            style={[
              styles.modeText,
              selectedMode === 'cash' ? styles.cashTextActive : styles.cashTextInactive,
            ]}
          >
            Cash
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onModeChange('upi')}
          style={({ pressed }) => [
            styles.modeButton,
            selectedMode === 'upi' ? styles.upiButtonActive : styles.upiButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text
            style={[
              styles.icon,
              selectedMode === 'upi' ? styles.upiIconActive : styles.upiIconInactive,
            ]}
          >
            📱
          </Text>
          <Text
            style={[
              styles.modeText,
              selectedMode === 'upi' ? styles.upiTextActive : styles.upiTextInactive,
            ]}
          >
            UPI
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

