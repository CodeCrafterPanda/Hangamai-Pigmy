import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';

interface InfoBannerProps {
  title: string;
  message: string;
  onClose?: () => void;
}

export default function InfoBanner({ title, message, onClose }: InfoBannerProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.components.banner.info.background,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.components.banner.info.borderColor,
      padding: spacing(theme, 'md'),
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.brand.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      fontSize: 16,
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    title: {
      ...typography(theme, 'sectionTitle'),
      color: theme.components.banner.info.textColor,
      fontWeight: '700',
    },
    message: {
      ...typography(theme, 'body'),
      color: theme.components.banner.info.textColor,
      opacity: 0.8,
      lineHeight: 20,
    },
    closeButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: spacing(theme, 'xs'),
    },
    closeIcon: {
      fontSize: 20,
      color: theme.colors.text.muted,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>ℹ️</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>

      {onClose && (
        <Pressable
          onPress={onClose}
          style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

