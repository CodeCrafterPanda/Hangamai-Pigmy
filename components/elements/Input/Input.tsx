import {
  TextInput,
  TextInputProps,
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme, typography, spacing } from '@/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  labelStyle,
  ...textInputProps
}: InputProps) {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: '100%',
    },
    label: {
      ...typography(theme, 'body'),
      fontWeight: '500',
      color: theme.colors.text.secondary,
      marginBottom: spacing(theme, 'xs'),
    },
    inputContainer: {
      height: theme.components.input.height,
      backgroundColor: theme.components.input.background,
      borderRadius: theme.radius.input,
      borderWidth: 1,
      borderColor: error ? theme.colors.status.error : theme.components.input.borderColor,
      paddingHorizontal: spacing(theme, 'md'),
      justifyContent: 'center',
    },
    input: {
      ...typography(theme, 'body'),
      color: theme.components.input.textColor,
      flex: 1,
    },
    error: {
      ...typography(theme, 'caption'),
      color: theme.colors.status.error,
      marginTop: spacing(theme, 'xxs'),
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, inputStyle]}
          placeholderTextColor={theme.components.input.placeholderColor}
          {...textInputProps}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

export default Input;
