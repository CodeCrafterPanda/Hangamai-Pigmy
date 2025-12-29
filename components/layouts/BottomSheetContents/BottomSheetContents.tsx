import GradientButton from '@/components/elements/GradientButton';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme, typography, spacing } from '@/theme';
import { windowWidth } from '@/utils/deviceInfo';
import { fonts } from '@/theme';
import config from '@/utils/config';

type WelcomeBottomSheetContentsProps = {
  onClose: () => void;
};

export default function BottomSheetContents({ onClose }: WelcomeBottomSheetContentsProps) {
  const { theme } = useTheme();

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
      paddingHorizontal: spacing(theme, 'xl'),
      backgroundColor: theme.colors.background.card,
  },
  title: {
      ...typography(theme, 'sectionTitle'),
    fontFamily: fonts.openSan.bold,
      color: theme.colors.text.primary,
      marginTop: spacing(theme, 'md'),
      marginBottom: spacing(theme, 'xxl'),
    width: '100%',
    textAlign: 'center',
  },
  subtitle: {
      ...typography(theme, 'body'),
    fontFamily: fonts.openSan.regular,
      color: theme.colors.text.secondary,
    width: '100%',
  },
  buttonTitle: {
      ...typography(theme, 'body'),
      fontWeight: '600',
      color: theme.colors.text.primary,
    textAlign: 'center',
  },
  button: {
    width: windowWidth / 2,
      marginBottom: spacing(theme, 'xxl', 'xs'),
  },
  envContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  envTitle: {
      ...typography(theme, 'body'),
    fontFamily: fonts.openSan.bold,
      color: theme.colors.text.primary,
  },
  envValue: {
      ...typography(theme, 'body'),
    fontFamily: fonts.openSan.regular,
      color: theme.colors.text.secondary,
    },
    boldText: {
      fontFamily: fonts.openSan.bold,
  },
});

  return (
    <View style={styles.root}>
      <Text style={styles.title}>🎉 Congratulations! </Text>
      <Text style={[styles.subtitle, { marginBottom: spacing(theme, 'xxl') }]}>
        You have successfully spin up the React Native Boilerplate project in the
        <Text style={styles.boldText}>{` ${config.env} `}</Text>environment 🚀
      </Text>
      <Text style={[styles.subtitle, { marginBottom: spacing(theme, 'xs') }]}>
        Injected Environmental Variables:
      </Text>
      {Object.entries(config).map(([key, value]) => (
        <View key={key} style={styles.envContainer}>
          <Text style={styles.envTitle}>{`✅ ${key}: `}</Text>
          <Text style={styles.envValue}>{value}</Text>
        </View>
      ))}
      <Text style={[styles.subtitle, { marginVertical: spacing(theme, 'xxl') }]}>
        {`Your foundational setup is now complete, paving the way for seamless development and innovation. \n\nHappy coding!`}
      </Text>
      <GradientButton
        title="OK"
        titleStyle={styles.buttonTitle}
        style={styles.button}
        useThemeGradient
        onPress={onClose}
      />
    </View>
  );
}
