import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useState } from 'react';
import { useTheme, typography, spacing, radius } from '@/theme';
import BottomSheet from '@/components/elements/BottomSheet';

interface DropdownPickerProps {
  label: string;
  value: string;
  placeholder?: string;
  options: string[];
  onSelect: (value: string) => void;
  required?: boolean;
}

export default function DropdownPicker({
  label,
  value,
  placeholder = 'Select an option',
  options,
  onSelect,
  required = false,
}: DropdownPickerProps) {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const styles = StyleSheet.create({
    field: {
      marginBottom: spacing(theme, 'md'),
    },
    label: {
      ...typography(theme, 'body'),
      color: theme.colors.text.secondary,
      fontWeight: '600',
      marginBottom: spacing(theme, 'xs'),
    },
    required: {
      color: theme.colors.status.error,
    },
    dropdown: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'sm'),
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dropdownText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
    },
    dropdownPlaceholder: {
      ...typography(theme, 'body'),
      color: theme.colors.text.muted,
    },
    dropdownIcon: {
      fontSize: 12,
      color: theme.colors.text.muted,
    },
    bottomSheetContent: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'md'),
      paddingBottom: spacing(theme, 'xl'),
    },
    bottomSheetTitle: {
      ...typography(theme, 'pageTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      marginBottom: spacing(theme, 'lg'),
      textAlign: 'center',
    },
    optionsList: {
      gap: spacing(theme, 'xs'),
    },
    option: {
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'md'),
    },
    optionSelected: {
      backgroundColor: theme.colors.surfaceTint.primarySoft,
      borderColor: theme.colors.brand.primary,
    },
    optionText: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      fontWeight: '500',
    },
    optionTextSelected: {
      color: theme.colors.brand.primary,
      fontWeight: '700',
    },
  });

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setIsOpen(false);
  };

  return (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>
          {label} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <Pressable onPress={() => setIsOpen(true)} style={styles.dropdown}>
          <Text style={value ? styles.dropdownText : styles.dropdownPlaceholder}>
            {value || placeholder}
          </Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </Pressable>
      </View>

      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <View style={styles.bottomSheetContent}>
          <Text style={styles.bottomSheetTitle}>{label}</Text>
          <View style={styles.optionsList}>
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => handleSelect(option)}
                style={({ pressed }) => [
                  styles.option,
                  value === option && styles.optionSelected,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    value === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

