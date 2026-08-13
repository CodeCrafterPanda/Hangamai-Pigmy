import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import type { Dispatch, State } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import { useTranslation } from '@/i18n';
import {
  addRoute,
  persistSettings,
  selectSession,
  selectRoutesByBranch,
} from '@/slices/settings.slice';
import type { Route as RouteEntity } from '@/types/entities';
import { generateRouteCode } from '@/utils/businessLogic';
import { generateUUID } from '@/utils/uuid';

export default function AddRoute() {
  const router = useRouter();
  const dispatch = useDispatch<Dispatch>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const session = useSelector(selectSession);
  const branchRoutes = useSelector((state: State) =>
    selectRoutesByBranch(state, session.branchId || ''),
  );

  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.app,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing(theme, 'sm'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
      paddingTop: spacing(theme, 'xs'),
      paddingBottom: spacing(theme, 'xs'),
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
    title: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '700',
      flex: 1,
    },
    scrollContent: {
      paddingVertical: spacing(theme, 'lg'),
    },
    section: {
      marginBottom: spacing(theme, 'lg'),
      paddingHorizontal: spacing(theme, 'screenPadding'),
    },
    field: {
      marginBottom: spacing(theme, 'md'),
    },
    label: {
      ...typography(theme, 'caption'),
      color: theme.colors.text.secondary,
      marginBottom: spacing(theme, 'xs'),
      fontWeight: '600',
    },
    required: {
      color: theme.colors.status.error,
    },
    input: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
      backgroundColor: theme.colors.background.cardElevated,
      borderRadius: radius(theme, 'input'),
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingHorizontal: spacing(theme, 'md'),
      paddingVertical: spacing(theme, 'md'),
    },
    actionButtons: {
      paddingHorizontal: spacing(theme, 'screenPadding'),
      flexDirection: 'row',
      gap: spacing(theme, 'sm'),
    },
    cancelButton: {
      flex: 1,
      backgroundColor: 'transparent',
      borderRadius: theme.radius.button,
      borderWidth: 1,
      borderColor: theme.colors.background.divider,
      paddingVertical: spacing(theme, 'md'),
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: theme.colors.text.primary,
      fontWeight: '600',
    },
    saveButton: {
      flex: 2,
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.radius.button,
      paddingVertical: spacing(theme, 'md'),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing(theme, 'xs'),
    },
    saveButtonText: {
      ...typography(theme, 'sectionTitle'),
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  const saveRoute = async (branchId: string) => {
    const trimmedName = name.trim();

    const newRoute: RouteEntity = {
      id: generateUUID(),
      branchId,
      routeCode: generateRouteCode(trimmedName),
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };

    try {
      setIsSaving(true);
      dispatch(addRoute(newRoute));
      // unwrap so a failed device write surfaces as an error instead of navigating on to a
      // route the next restart would not have
      await dispatch(persistSettings()).unwrap();
      router.replace(`/(app)/(route)/route-customers/${newRoute.id}`);
    } catch {
      Alert.alert(t('common.error'), t('addRoute.addFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert(t('addRoute.validationTitle'), t('addRoute.enterName'));
      return;
    }
    if (!session.branchId) {
      Alert.alert(t('addRoute.validationTitle'), t('addRoute.noBranch'));
      return;
    }

    const branchId = session.branchId;
    const routeCode = generateRouteCode(trimmedName);
    const existingRoute = branchRoutes.find(
      r => r.routeCode.trim().toUpperCase() === routeCode,
    );

    if (existingRoute) {
      Alert.alert(
        t('addRoute.duplicateCode'),
        t('addRoute.duplicateCodeMessage', {
          name: existingRoute.name,
        }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.continueAnyway'),
            onPress: () => {
              void saveRoute(branchId);
            },
          },
        ],
      );
      return;
    }

    await saveRoute(branchId);
  };

  const handleCancel = () => {
    Alert.alert(t('addRoute.cancelTitle'), t('addRoute.cancelMessage'), [
      { text: t('common.continueEditing'), style: 'cancel' },
      {
        text: t('common.discard'),
        style: 'destructive',
        onPress: () => router.back(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.title}>{t('addRoute.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.field}>
            <Text style={styles.label}>
              {t('addRoute.routeName')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('addRoute.routeNamePlaceholder')}
              placeholderTextColor={theme.colors.text.muted}
              value={name}
              onChangeText={setName}
              editable={!isSaving}
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={handleCancel}
            disabled={isSaving}
            style={({ pressed }) => [styles.cancelButton, { opacity: pressed || isSaving ? 0.7 : 1 }]}
          >
            <Text style={styles.cancelButtonText}>{t('addRoute.cancel')}</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => [styles.saveButton, { opacity: pressed || isSaving ? 0.8 : 1 }]}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? t('addRoute.saving') : t('addRoute.saveRoute')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
