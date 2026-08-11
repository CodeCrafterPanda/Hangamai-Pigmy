import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';

interface RouteHeaderProps {
  date: string;
  isOnline: boolean;
}

export default function RouteHeader({ date, isOnline }: RouteHeaderProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'xs'),
      paddingBottom: spacing(theme, 'xs'),
    },
    leftSection: {
      gap: spacing(theme, 'xxs'),
    },
    title: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    date: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    onlineStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: theme.colors.surfaceTint.successSoft,
      borderRadius: radius(theme, 'chip'),
      borderWidth: 1,
      borderColor: theme.colors.status.success,
    },
    onlineIcon: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.status.success,
    },
    onlineText: {
      ...typography(theme, 'caption'),
      color: theme.colors.status.success,
      fontWeight: '600',
    },
    syncIcon: {
      fontSize: 18,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.title}>My Routes</Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <View style={styles.rightSection}>
        {isOnline && (
          <View style={styles.onlineStatus}>
            <View style={styles.onlineIcon} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        )}
      </View>
    </View>
  );
}

