import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, typography, spacing } from '@/theme';
import { useTranslation } from '@/i18n';
import {
  Button,
  GradientButton,
  Card,
  Chip,
  Input,
  Banner,
} from '@/components/elements';
import { useState } from 'react';

export default function ThemeDemo() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    container: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingVertical: spacing(theme, 'lg'),
      gap: spacing(theme, 'xl'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing(theme, 'md'),
    },
    title: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
    },
    sectionTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      marginBottom: spacing(theme, 'sm'),
    },
    section: {
      gap: spacing(theme, 'md'),
    },
    row: {
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
      flexWrap: 'wrap',
    },
    themeToggle: {
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'xs'),
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: theme.radius.button,
    },
    themeToggleText: {
      ...typography(theme, 'caption'),
      fontWeight: '600',
      color: theme.colors.brand.primary,
    },
    description: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      marginBottom: spacing(theme, 'sm'),
    },
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('themeDemo.title')}</Text>
          <Pressable onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={styles.themeToggleText}>
              {isDark ? `☀️ ${t('themeDemo.light')}` : `🌙 ${t('themeDemo.dark')}`}
            </Text>
          </Pressable>
        </View>

        {/* Typography */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('themeDemo.typography')}</Text>
          <Card>
            <Text style={{ ...typography(theme, 'displayXL'), color: theme.colors.text.primary }}>
              {t('themeDemo.displayXL')}
            </Text>
            <Text style={{ ...typography(theme, 'pageTitle'), color: theme.colors.text.primary }}>
              {t('themeDemo.pageTitle')}
            </Text>
            <Text style={{ ...typography(theme, 'sectionTitle'), color: theme.colors.text.primary }}>
              {t('themeDemo.sectionTitle')}
            </Text>
            <Text style={{ ...typography(theme, 'body'), color: theme.colors.text.secondary }}>
              {t('themeDemo.bodyText')}
            </Text>
            <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.muted }}>
              {t('themeDemo.captionText')}
            </Text>
            <Text style={{ ...typography(theme, 'micro'), color: theme.colors.text.muted }}>
              {t('themeDemo.microText')}
            </Text>
          </Card>
        </View>

        {/* Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('themeDemo.buttons')}</Text>
          <Text style={styles.description}>{t('themeDemo.buttonsHint')}</Text>
          <Button title={t('themeDemo.primaryButton')} variant="primary" />
          <Button title={t('themeDemo.secondaryButton')} variant="secondary" />
          <Button title={t('themeDemo.dangerButton')} variant="danger" />
          <GradientButton title={t('themeDemo.gradientButton')} useThemeGradient />
        </View>

        {/* Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('themeDemo.cards')}</Text>
          <Card>
            <Text style={{ ...typography(theme, 'sectionTitle'), color: theme.colors.text.primary }}>
              {t('themeDemo.defaultCard')}
            </Text>
            <Text style={{ ...typography(theme, 'body'), color: theme.colors.text.secondary }}>
              {t('themeDemo.defaultCardBody')}
            </Text>
          </Card>
          <Card elevated>
            <Text style={{ ...typography(theme, 'sectionTitle'), color: theme.colors.text.primary }}>
              {t('themeDemo.elevatedCard')}
            </Text>
            <Text style={{ ...typography(theme, 'body'), color: theme.colors.text.secondary }}>
              {t('themeDemo.elevatedCardBody')}
            </Text>
          </Card>
        </View>

        {/* Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('themeDemo.chips')}</Text>
          <Text style={styles.description}>{t('themeDemo.chipsHint')}</Text>
          <View style={styles.row}>
            <Chip label={t('themeDemo.defaultChip')} variant="default" />
            <Chip label={t('themeDemo.primaryChip')} variant="primary" />
            <Chip label={t('themeDemo.successChip')} variant="success" />
            <Chip label={t('themeDemo.warningChip')} variant="warning" />
            <Chip label={t('themeDemo.errorChip')} variant="error" />
            <Chip label={t('themeDemo.infoChip')} variant="info" />
          </View>
        </View>

        {/* Inputs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('themeDemo.inputs')}</Text>
          <Input
            label={t('themeDemo.username')}
            placeholder={t('themeDemo.usernamePlaceholder')}
            value={inputValue}
            onChangeText={setInputValue}
          />
          <Input
            label={t('themeDemo.password')}
            placeholder={t('themeDemo.passwordPlaceholder')}
            secureTextEntry
          />
          <Input
            label={t('themeDemo.emailError')}
            placeholder={t('themeDemo.emailPlaceholder')}
            error={t('themeDemo.emailErrorMessage')}
          />
        </View>

        {/* Banners */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('themeDemo.banners')}</Text>
          <Text style={styles.description}>{t('themeDemo.bannersHint')}</Text>
          <Banner variant="info" message={t('themeDemo.bannerInfo')} />
          <Banner variant="success" message={t('themeDemo.bannerSuccess')} />
          <Banner variant="warning" message={t('themeDemo.bannerWarning')} />
          <Banner variant="error" message={t('themeDemo.bannerError')} />
        </View>

        {/* Colors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('themeDemo.colors')}</Text>
          <Card>
            <View style={{ gap: spacing(theme, 'xs') }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.secondary }}>
                  {t('themeDemo.colorPrimary')}
                </Text>
                <View style={{ width: 60, height: 24, backgroundColor: theme.colors.brand.primary, borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.secondary }}>
                  {t('themeDemo.colorSuccess')}
                </Text>
                <View style={{ width: 60, height: 24, backgroundColor: theme.colors.status.success, borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.secondary }}>
                  {t('themeDemo.colorWarning')}
                </Text>
                <View style={{ width: 60, height: 24, backgroundColor: theme.colors.status.warning, borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.secondary }}>
                  {t('themeDemo.colorError')}
                </Text>
                <View style={{ width: 60, height: 24, backgroundColor: theme.colors.status.error, borderRadius: 4 }} />
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
