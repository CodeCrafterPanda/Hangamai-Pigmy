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
import type { Dispatch } from '@/utils/store';
import { useTheme, typography, spacing, radius } from '@/theme';
import { addRoute, persistSettings, selectSession } from '@/slices/settings.slice';
import type { Route as RouteEntity } from '@/types/entities';
import { generateUUID } from '@/utils/uuid';

export default function AddRoute() {
  const router = useRouter();
  const dispatch = useDispatch<Dispatch>();
  const { theme } = useTheme();
  const session = useSelector(selectSession);

  const [name, setName] = useState('');
  const [routeCode, setRouteCode] = useState('');
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

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedCode = routeCode.trim();

    if (!trimmedName) {
      Alert.alert('Validation Error', 'Please enter a route name');
      return;
    }
    if (!trimmedCode) {
      Alert.alert('Validation Error', 'Please enter a route code');
      return;
    }
    if (!session.branchId) {
      Alert.alert('Validation Error', 'No branch is associated with the current session');
      return;
    }

    const newRoute: RouteEntity = {
      id: generateUUID(),
      branchId: session.branchId,
      routeCode: trimmedCode,
      name: trimmedName,
      createdAt: new Date().toISOString(),
    };

    try {
      setIsSaving(true);
      dispatch(addRoute(newRoute));
      await dispatch(persistSettings());
      router.replace(`/(app)/(route)/route-customers/${newRoute.id}`);
    } catch {
      Alert.alert('Error', 'Failed to add route');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert('Cancel', 'Are you sure you want to cancel? All data will be lost.', [
      { text: 'Continue Editing', style: 'cancel' },
      {
        text: 'Discard',
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
        <Text style={styles.title}>Add New Route</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.field}>
            <Text style={styles.label}>
              Route Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Market Road Route"
              placeholderTextColor={theme.colors.text.muted}
              value={name}
              onChangeText={setName}
              editable={!isSaving}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              Route Code <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. R-04"
              placeholderTextColor={theme.colors.text.muted}
              value={routeCode}
              onChangeText={setRouteCode}
              autoCapitalize="characters"
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
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => [styles.saveButton, { opacity: pressed || isSaving ? 0.8 : 1 }]}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Route'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
