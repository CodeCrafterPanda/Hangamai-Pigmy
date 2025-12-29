import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, typography, spacing } from '@/theme';
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
          <Text style={styles.title}>Theme Demo</Text>
          <Pressable onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={styles.themeToggleText}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </Text>
          </Pressable>
        </View>

        {/* Typography */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Typography</Text>
          <Card>
            <Text style={{ ...typography(theme, 'displayXL'), color: theme.colors.text.primary }}>
              Display XL
            </Text>
            <Text style={{ ...typography(theme, 'pageTitle'), color: theme.colors.text.primary }}>
              Page Title
            </Text>
            <Text style={{ ...typography(theme, 'sectionTitle'), color: theme.colors.text.primary }}>
              Section Title
            </Text>
            <Text style={{ ...typography(theme, 'body'), color: theme.colors.text.secondary }}>
              Body Text - Regular weight for content
            </Text>
            <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.muted }}>
              Caption Text - Smaller helper text
            </Text>
            <Text style={{ ...typography(theme, 'micro'), color: theme.colors.text.muted }}>
              MICRO TEXT
            </Text>
          </Card>
        </View>

        {/* Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buttons</Text>
          <Text style={styles.description}>Primary, Secondary, and Danger variants</Text>
          <Button title="Primary Button" variant="primary" />
          <Button title="Secondary Button" variant="secondary" />
          <Button title="Danger Button" variant="danger" />
          <GradientButton title="Gradient Button" useThemeGradient />
        </View>

        {/* Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cards</Text>
          <Card>
            <Text style={{ ...typography(theme, 'sectionTitle'), color: theme.colors.text.primary }}>
              Default Card
            </Text>
            <Text style={{ ...typography(theme, 'body'), color: theme.colors.text.secondary }}>
              This is a card component with theme-aware styling
            </Text>
          </Card>
          <Card elevated>
            <Text style={{ ...typography(theme, 'sectionTitle'), color: theme.colors.text.primary }}>
              Elevated Card
            </Text>
            <Text style={{ ...typography(theme, 'body'), color: theme.colors.text.secondary }}>
              This card has elevation for emphasis
            </Text>
          </Card>
        </View>

        {/* Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chips</Text>
          <Text style={styles.description}>Status indicators and tags</Text>
          <View style={styles.row}>
            <Chip label="Default" variant="default" />
            <Chip label="Primary" variant="primary" />
            <Chip label="Success" variant="success" />
            <Chip label="Warning" variant="warning" />
            <Chip label="Error" variant="error" />
            <Chip label="Info" variant="info" />
          </View>
        </View>

        {/* Inputs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inputs</Text>
          <Input
            label="Username"
            placeholder="Enter your username"
            value={inputValue}
            onChangeText={setInputValue}
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
          />
          <Input
            label="Email with error"
            placeholder="email@example.com"
            error="Please enter a valid email address"
          />
        </View>

        {/* Banners */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banners</Text>
          <Text style={styles.description}>Alert and notification components</Text>
          <Banner variant="info" message="This is an informational message" />
          <Banner variant="success" message="Operation completed successfully!" />
          <Banner variant="warning" message="Please review before proceeding" />
          <Banner variant="error" message="An error occurred during processing" />
        </View>

        {/* Colors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colors</Text>
          <Card>
            <View style={{ gap: spacing(theme, 'xs') }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.secondary }}>
                  Primary:
                </Text>
                <View style={{ width: 60, height: 24, backgroundColor: theme.colors.brand.primary, borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.secondary }}>
                  Success:
                </Text>
                <View style={{ width: 60, height: 24, backgroundColor: theme.colors.status.success, borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.secondary }}>
                  Warning:
                </Text>
                <View style={{ width: 60, height: 24, backgroundColor: theme.colors.status.warning, borderRadius: 4 }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ ...typography(theme, 'caption'), color: theme.colors.text.secondary }}>
                  Error:
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
