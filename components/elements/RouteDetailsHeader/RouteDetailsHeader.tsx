import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, typography, spacing } from '@/theme';
import { useRouter } from 'expo-router';
import { useTranslation } from '@/i18n';

interface RouteDetailsHeaderProps {
  routeName: string;
  totalStops: number;
  onSyncPress?: () => void;
}

export default function RouteDetailsHeader({
  routeName,
  totalStops,
  onSyncPress,
}: RouteDetailsHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

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
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      flex: 1,
    },
    backButton: {
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      fontSize: 20,
      color: theme.colors.text.primary,
    },
    titleSection: {
      flex: 1,
    },
    routeName: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    routeInfo: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
      letterSpacing: 0.3,
      marginTop: 2,
    },
    syncButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surfaceTint.successSoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    syncIcon: {
      fontSize: 16,
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleSync = () => {
    if (onSyncPress) {
      onSyncPress();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>

        <View style={styles.titleSection}>
          <Text style={styles.routeName} numberOfLines={1}>
            {routeName}
          </Text>
          <Text style={styles.routeInfo}>
            {t(
              totalStops === 1 ? 'routeDetails.stopsOne' : 'routeDetails.stopsOther',
              { count: totalStops },
            )}
          </Text>
        </View>
      </View>

      <Pressable onPress={handleSync} style={styles.syncButton}>
        <Text style={styles.syncIcon}>☁️</Text>
      </Pressable>
    </View>
  );
}

