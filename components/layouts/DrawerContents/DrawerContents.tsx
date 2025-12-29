import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, typography } from '@/theme';

export default function DrawerContents() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    root: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      backgroundColor: theme.colors.background.card,
    },
    text: {
      ...typography(theme, 'body'),
      color: theme.colors.text.primary,
    },
  });

  return (
    <SafeAreaView>
      <View style={styles.root}>
        <Text style={styles.text}>Side Menu Contents</Text>
      </View>
    </SafeAreaView>
  );
}
