import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '@/theme';
import BottomSheet from '@/components/elements/BottomSheet';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttons: AlertButton[];
}

export default function AlertBottomSheet({
  isOpen,
  onClose,
  title,
  message,
  buttons,
}: AlertBottomSheetProps) {
  const { theme } = useTheme();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen}>
      <View style={[styles.container, { backgroundColor: theme.colors.background.card }]}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          {title}
        </Text>
        
        <Text style={[styles.message, { color: theme.colors.text.secondary }]}>
          {message}
        </Text>
        
        <View style={styles.buttons}>
          {buttons.map((button, index) => (
            <Pressable
              key={index}
              onPress={() => handleButtonPress(button)}
              style={({ pressed }) => [
                styles.button,
                button.style === 'cancel' && { 
                  borderWidth: 1, 
                  borderColor: theme.colors.background.divider 
                },
                button.style === 'destructive' && { 
                  backgroundColor: theme.colors.status.error 
                },
                button.style === 'default' && { 
                  backgroundColor: theme.colors.brand.primary 
                },
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  button.style === 'cancel'
                    ? { color: theme.colors.text.primary }
                    : { color: '#FFFFFF' },
                ]}
              >
                {button.text}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

