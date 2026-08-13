import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, typography, spacing, radius, withAlpha } from '@/theme';
import { useTranslation } from '@/i18n';
import type { Language } from '@/i18n';

function LanguageSwitcher() {
  const { theme } = useTheme();
  const { language, languages, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(option => option.code === language);
  const currentLabel = currentLanguage?.shortLabel ?? language.toUpperCase();

  const handleSelect = (next: Language) => {
    setLanguage(next);
    setIsOpen(false);
  };

  const styles = StyleSheet.create({
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'xxs'),
      marginRight: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'xs'),
      paddingVertical: spacing(theme, 'xxs'),
      backgroundColor: theme.colors.surfaceTint.primarySoft,
      borderRadius: radius(theme, 'chip') + 8,
      borderWidth: 1,
      borderColor: withAlpha(theme.colors.brand.primary, 0.35),
    },
    triggerLabel: {
      ...typography(theme, 'caption'),
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
    backdropDismiss: {
      ...StyleSheet.absoluteFillObject,
    },
    sheet: {
      zIndex: 1,
      backgroundColor: theme.colors.background.card,
      borderTopLeftRadius: radius(theme, 'card') + 8,
      borderTopRightRadius: radius(theme, 'card') + 8,
      paddingHorizontal: spacing(theme, 'lg'),
      paddingTop: spacing(theme, 'md'),
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.text.muted,
      marginBottom: spacing(theme, 'md'),
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      marginBottom: spacing(theme, 'xs'),
    },
    sheetTitle: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
    },
    sheetMessage: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      marginBottom: spacing(theme, 'md'),
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      paddingVertical: spacing(theme, 'md'),
      paddingHorizontal: spacing(theme, 'sm'),
      borderRadius: radius(theme, 'card'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      marginBottom: spacing(theme, 'sm'),
    },
    optionSelected: {
      borderColor: theme.colors.brand.primary,
      backgroundColor: theme.colors.surfaceTint.primarySoft,
    },
    optionText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '600',
      flex: 1,
    },
    cancel: {
      alignItems: 'center',
      paddingVertical: spacing(theme, 'md'),
      marginTop: spacing(theme, 'xs'),
    },
    cancelText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
    },
  });

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('language.switcherA11y')}
        style={({ pressed }) => [styles.trigger, { opacity: pressed ? 0.7 : 1 }]}>
        <Ionicons name="language" size={18} color={theme.colors.brand.primary} />
        <Text style={styles.triggerLabel}>{currentLabel}</Text>
        <Ionicons name="chevron-down" size={14} color={theme.colors.brand.primary} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable
            style={styles.backdropDismiss}
            onPress={() => setIsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          />
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <Ionicons name="language" size={22} color={theme.colors.brand.primary} />
              <Text style={styles.sheetTitle}>{t('language.selectTitle')}</Text>
            </View>
            <Text style={styles.sheetMessage}>{t('language.selectMessage')}</Text>

            {languages.map(option => {
              const isSelected = option.code === language;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => handleSelect(option.code)}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <Ionicons
                    name="language"
                    size={20}
                    color={isSelected ? theme.colors.brand.primary : theme.colors.text.secondary}
                  />
                  <Text style={styles.optionText}>{option.nativeName}</Text>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={20} color={theme.colors.brand.primary} />
                  ) : null}
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => setIsOpen(false)}
              style={({ pressed }) => [styles.cancel, { opacity: pressed ? 0.7 : 1 }]}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

export default LanguageSwitcher;
