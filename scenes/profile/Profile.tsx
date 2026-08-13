import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation } from '@/i18n';
import { useSettingsSlice } from '@/slices';
import { useDispatch } from 'react-redux';
import { setLoggedIn } from '@/slices/app.slice';
import type { Dispatch } from '@/utils/store';
import type { AgentProfile } from '@/types/ProfileData';
import AlertBottomSheet from '@/components/elements/AlertBottomSheet';

export default function Profile() {
  const router = useRouter();
  const dispatch = useDispatch<Dispatch>();
  const { theme, isDark, toggleTheme } = useTheme();
  const { language, languages, setLanguage, t } = useTranslation();
  const { clearSession, persistSettings } = useSettingsSlice();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  // Mock data - replace with actual data from Redux/API
  const agentProfile: AgentProfile = {
    id: 'AGT-001',
    name: 'Rajesh Kumar',
    agentId: 'AGT-8821',
    role: t('profile.roleSeniorFieldAgent'),
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
      color: theme.colors.brand.primary,
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
    themeButton: {
      backgroundColor: theme.colors.background.card,
      borderRadius: radius(theme, 'button'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginHorizontal: spacing(theme, 'screenPadding'),
      marginBottom: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'md'),
      paddingHorizontal: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    themeButtonLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    themeIcon: {
      fontSize: 24,
    },
    themeText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    themeModeLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
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

  const handleSelectLanguage = () => {
    setShowLanguagePicker(true);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    console.log('[Profile] User logging out');

    // Clear session (but keep MPIN for next login)
    clearSession();
    await persistSettings();

    // Set logged out state
    dispatch(setLoggedIn(false));

    // Navigate to MPIN screen (not login, since MPIN is already set)
    router.replace('/(auth)/mpin');
  };

  const activeLanguageName =
    languages.find(option => option.code === language)?.nativeName || language;

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

          <Text style={styles.roleText}>{agentProfile.role}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconBank}>🏛</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.branch')}</Text>
              <Text style={styles.infoValue}>
                {agentProfile.branch}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconSync}>🔄</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('profile.lastSynced')}</Text>
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
              <Text style={styles.infoLabel}>{t('profile.appVersion')}</Text>
              <Text style={styles.infoValue}>
                {agentProfile.appVersion}{' '}
                <Text style={styles.infoValueSecondary}>
                  {t('profile.build', { buildNumber: agentProfile.buildNumber })}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [styles.themeButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={styles.themeButtonLeft}>
            <Text style={styles.themeIcon}>{isDark ? '🌙' : '☀️'}</Text>
            <Text style={styles.themeText}>{t('profile.appearance')}</Text>
          </View>
          <Text style={styles.themeModeLabel}>
            {isDark ? t('profile.themeDark') : t('profile.themeLight')}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSelectLanguage}
          style={({ pressed }) => [styles.themeButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={styles.themeButtonLeft}>
            <Text style={styles.themeIcon}>🌐</Text>
            <Text style={styles.themeText}>{t('language.label')}</Text>
          </View>
          <Text style={styles.themeModeLabel}>{activeLanguageName}</Text>
        </Pressable>

        <Pressable
          onPress={handleHelpSupport}
          style={({ pressed }) => [styles.helpButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.helpIcon}>🎧</Text>
          <Text style={styles.helpText}>{t('profile.helpSupport')}</Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>{t('profile.logOut')}</Text>
        </Pressable>
      </ScrollView>

      <AlertBottomSheet
        isOpen={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        title={t('language.selectTitle')}
        message={t('language.selectMessage')}
        buttons={[
          // Language names stay in their own script, so they are never run through t().
          ...languages.map(option => ({
            text: option.code === language ? `${option.nativeName} ✓` : option.nativeName,
            style: 'default' as const,
            onPress: () => setLanguage(option.code),
          })),
          { text: t('profile.cancel'), style: 'cancel' as const },
        ]}
      />

      <AlertBottomSheet
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title={t('profile.logOut')}
        message={t('profile.logOutMessage')}
        buttons={[
          { text: t('profile.cancel'), style: 'cancel' },
          { text: t('profile.logOut'), style: 'destructive', onPress: confirmLogout },
        ]}
      />
    </View>
  );
}
