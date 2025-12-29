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
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'md'),
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.background.cardElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      ...typography(theme, 'pageTitle'),
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
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
    },
    branch: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    onlineStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'sm'),
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

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
          </View>
          {profile.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.branch}>{profile.branch}</Text>
        </View>
      </View>

      <View style={styles.onlineStatus}>
        <View style={styles.onlineIcon} />
        <Text style={styles.onlineText}>Online</Text>
      </View>
    </View>
  );
}

