import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import type { AgentProfile } from '@/types/ProfileData';

export default function Profile() {
  const router = useRouter();
  const { theme } = useTheme();

  // Mock data - replace with actual data from Redux/API
  const agentProfile: AgentProfile = {
    id: 'AGT-001',
    name: 'Rajesh Kumar',
    agentId: 'AGT-8821',
    role: 'Senior Field Agent',
    avatarUrl: undefined,
    isOnline: true,
    branch: 'Main St. Branch',
    branchCode: '001',
    lastSyncTime: 'Today, 10:42 AM',
    appVersion: 'v2.4.1',
    buildNumber: '202',
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    header: {
      backgroundColor: theme.colors.background.cardElevated,
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'md'),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.background.divider,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'md'),
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backIcon: {
      fontSize: 24,
      color: theme.colors.text.primary,
    },
    title: {
      ...typography(theme, 'pageTitle'),
      fontSize: 20,
      color: theme.colors.text.primary,
      fontWeight: '700',
      flex: 1,
    },
    scrollContent: {
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xxl'),
    },
    profileCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
      padding: spacing(theme, 'xl'),
      alignItems: 'center',
      gap: spacing(theme, 'md'),
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.colors.background.cardElevated,
      borderWidth: 4,
      borderColor: theme.colors.brand.primary,
    },
    avatarImage: {
      width: 140,
      height: 140,
      borderRadius: 70,
    },
    onlineIndicator: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.status.success,
      borderWidth: 4,
      borderColor: theme.colors.background.card,
    },
    agentName: {
      ...typography(theme, 'displayXL'),
      fontSize: 28,
      color: theme.colors.text.primary,
      fontWeight: '700',
      textAlign: 'center',
    },
    agentIdBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'xs'),
      backgroundColor: theme.colors.brand.primary,
      borderRadius: radius(theme, 'chip') + 8,
    },
    badgeIcon: {
      fontSize: 16,
      color: '#FFFFFF',
    },
    agentIdText: {
      ...typography(theme, 'body'),
      color: '#FFFFFF',
      fontWeight: '700',
    },
    roleText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
    },
    infoCard: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
      overflow: 'hidden',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing(theme, 'md'),
      gap: spacing(theme, 'sm'),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.background.divider,
    },
    infoRowLast: {
      borderBottomWidth: 0,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.background.cardElevated,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconBank: {
      fontSize: 20,
      color: theme.colors.brand.primary,
    },
    iconSync: {
      fontSize: 20,
      color: theme.colors.status.success,
    },
    iconApp: {
      fontSize: 20,
      color: '#8E54E9',
    },
    infoContent: {
      flex: 1,
      gap: spacing(theme, 'xxs'),
    },
    infoLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 10,
    },
    infoValue: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    infoValueSecondary: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
    },
    syncCheckmark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.colors.status.success,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkIcon: {
      fontSize: 14,
      color: '#FFFFFF',
    },
    helpButton: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'button'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    helpIcon: {
      fontSize: 24,
    },
    helpText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    logoutButton: {
      backgroundColor: 'transparent',
      borderRadius: radius(theme, 'button'),
      marginHorizontal: spacing(theme, 'screenPadding'),
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    logoutIcon: {
      fontSize: 20,
      color: theme.colors.status.error,
    },
    logoutText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.status.error,
      fontWeight: '600',
    },
  });

  const handleBack = () => {
    router.back();
  };

  const handleHelpSupport = () => {
    console.log('Help & Support pressed');
    // TODO: Navigate to help screen or open support
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            console.log('User logged out');
            // TODO: Clear auth and navigate to login
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {agentProfile.avatarUrl ? (
              <Image source={{ uri: agentProfile.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <View
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 70,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      ...typography(theme, 'displayXL'),
                      fontSize: 48,
                      color: theme.colors.text.secondary,
                      fontWeight: '700',
                    }}
                  >
                    {getInitials(agentProfile.name)}
                  </Text>
                </View>
              </View>
            )}
            {agentProfile.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          <Text style={styles.agentName}>{agentProfile.name}</Text>

          <View style={styles.agentIdBadge}>
            <Text style={styles.badgeIcon}>🆔</Text>
            <Text style={styles.agentIdText}>{agentProfile.agentId}</Text>
          </View>

          <Text style={styles.roleText}>{agentProfile.role}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconBank}>🏛</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>BRANCH</Text>
              <Text style={styles.infoValue}>
                {agentProfile.branch}{' '}
                <Text style={styles.infoValueSecondary}>({agentProfile.branchCode})</Text>
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconSync}>🔄</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>LAST SYNCED</Text>
              <Text style={styles.infoValue}>{agentProfile.lastSyncTime}</Text>
            </View>
            <View style={styles.syncCheckmark}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          </View>

          <View style={[styles.infoRow, styles.infoRowLast]}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconApp}>📱</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>APP VERSION</Text>
              <Text style={styles.infoValue}>
                {agentProfile.appVersion}{' '}
                <Text style={styles.infoValueSecondary}>Build {agentProfile.buildNumber}</Text>
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleHelpSupport}
          style={({ pressed }) => [styles.helpButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.helpIcon}>🎧</Text>
          <Text style={styles.helpText}>Help & Support</Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
