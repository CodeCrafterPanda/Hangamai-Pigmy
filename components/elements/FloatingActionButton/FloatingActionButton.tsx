import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme, spacing } from '@/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
}

export default function FloatingActionButton({ onPress, icon = '+' }: FloatingActionButtonProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    fab: {
      position: 'absolute',
      bottom: spacing(theme, 'xl') + 60, // Above tab bar
      right: spacing(theme, 'md'),
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.brand.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    },
    icon: {
      fontSize: 28,
      color: '#FFFFFF',
      fontWeight: '300',
    },
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, { opacity: pressed ? 0.8 : 1 }]}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

