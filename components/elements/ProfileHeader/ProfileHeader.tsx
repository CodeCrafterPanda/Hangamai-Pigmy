import { View, Text, StyleSheet } from 'react-native';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { UserProfile } from '@/types/HomeData';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.background.cardElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.colors.status.success,
      borderWidth: 2,
      borderColor: theme.colors.background.app,
    },
    userInfo: {
      gap: spacing(theme, 'xxs'),
    },
    userName: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
    },
    branch: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
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
  });


  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.branch}>{profile.branch}</Text>
        </View>
      </View>

      {profile.isOnline && (
        <View style={styles.onlineStatus}>
          <View style={styles.onlineIcon} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      )}
    </View>
  );
}

