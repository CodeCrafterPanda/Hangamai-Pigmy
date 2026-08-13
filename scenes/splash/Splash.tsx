import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { useTheme, images, typography, spacing, radius, screenGradient, withAlpha } from '@/theme';
import { useTranslation } from '@/i18n';
import Image from '@/components/elements/Image';
import ProgressBar from '@/components/elements/ProgressBar';
import { windowWidth } from '@/utils/deviceInfo';

export default function Splash() {
  const router = useRouter();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) {
      return;
    }

    if (progress < 100) {
      const timeoutId = setTimeout(() => {
        setProgress(current => Math.min(current + 4, 100));
      }, 40);
      return () => clearTimeout(timeoutId);
    }

    hasNavigated.current = true;
    const timeoutId = setTimeout(() => {
      router.replace('/(app)/(home)');
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [progress, router]);

  const loadingText =
    progress < 30
      ? t('auth.verifyingDevice')
      : progress < 60
        ? t('auth.loadingData')
        : progress < 90
          ? t('auth.syncing')
          : t('auth.almostReady');

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    gradient: {
      flex: 1,
      justifyContent: 'space-between',
      paddingVertical: spacing(theme, 'xxl') * 2,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing(theme, 'screenPadding'),
      gap: spacing(theme, 'lg'),
    },
    logo: {
      width: Math.min(220, windowWidth * 0.56),
      height: Math.min(220, windowWidth * 0.56),
      backgroundColor: 'transparent',
    },
    logoCard: {
      backgroundColor: withAlpha(theme.colors.background.card, 0.85),
      borderRadius: radius(theme, 'card') + 8,
      padding: spacing(theme, 'xl'),
      alignItems: 'center',
      gap: spacing(theme, 'lg'),
      width: '100%',
      maxWidth: 360,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.brand.primary, 0.25),
    },
    appName: {
      ...typography(theme, 'displayXL'),
      fontSize: 24,
      color: theme.colors.text.primary,
      fontWeight: '700',
      textAlign: 'center',
    },
    tagline: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
      textAlign: 'center',
      marginBottom: spacing(theme, 'md'),
    },
    loadingSection: {
      width: '100%',
      gap: spacing(theme, 'xs'),
    },
    loadingTextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(theme, 'xs'),
    },
    loadingText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
    },
    progressPercent: {
      ...typography(theme, 'body'),
      color: theme.colors.brand.primary,
      fontWeight: '600',
    },
    bottomSection: {
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
    },
    securityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xs'),
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'xs'),
      backgroundColor: theme.colors.surfaceTint.primarySoft,
      borderRadius: radius(theme, 'chip') + 8,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.brand.primary, 0.3),
    },
    securityIcon: {
      fontSize: 12,
      color: theme.colors.brand.primary,
    },
    securityText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 10,
    },
    versionText: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.muted,
      fontSize: 11,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={screenGradient(theme)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <View style={styles.centerContent}>
          <Image
            source={images.logo}
            contentFit="contain"
            style={styles.logo}
            accessibilityLabel={t('auth.appName')}
          />

          <View style={styles.logoCard}>
            <Text style={styles.appName}>{t('auth.appName')}</Text>
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>

            <View style={styles.loadingSection}>
              <View style={styles.loadingTextRow}>
                <Text style={styles.loadingText}>{loadingText}</Text>
                <Text style={styles.progressPercent}>{progress}%</Text>
              </View>
              <ProgressBar progress={progress} height={6} />
            </View>
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.securityBadge}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>{t('auth.securedApp')}</Text>
          </View>
          <Text style={styles.versionText}>
            {t('auth.version', { version: '2.8.1', build: '402' })}
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
