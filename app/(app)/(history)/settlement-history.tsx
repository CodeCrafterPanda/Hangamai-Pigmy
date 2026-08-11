/**
 * Settlement History Screen
 * Shows list of day closures/settlements
 */
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export default function SettlementHistory() {
  const { theme } = useTheme();

  // TODO: Implement settlement history list
  // Will show past settlements with status

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.app }]}>
      <Text style={[styles.text, { color: theme.colors.text.primary }]}>
        Settlement History Screen
      </Text>
      <Text style={[styles.subtext, { color: theme.colors.text.secondary }]}>
        Implementation pending - will show past day closures
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

