import React, { memo, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import RNBottomSheet, {
  BottomSheetProps as RNBottomSheetProps,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { isWeb, windowHeight } from '@/utils/deviceInfo';
import { useTheme } from '@/theme';

export interface BottomSheetProps extends RNBottomSheetProps {
  isOpen: boolean;
  initialOpen?: boolean;
  children: React.ReactNode;
}

const BottomSheet = memo(function BottomSheet({
  isOpen,
  initialOpen: _initialOpen,
  children,
  ...others
}: BottomSheetProps) {
  const { theme } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          width: '100%',
        },
        container: {
          width: '100%',
        },
        webContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.colors.background.card,
          borderTopLeftRadius: theme.radius.card,
          borderTopRightRadius: theme.radius.card,
          maxHeight: '80%',
          zIndex: 1000,
        },
        webBackdrop: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        },
      }),
    [theme],
  );

  const renderBackdropComponent = (backdropProps: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...backdropProps} disappearsOnIndex={-1} appearsOnIndex={0} />
  );

  if (!isOpen) {
    return null;
  }

  if (isWeb) {
    return (
      <>
        <View style={styles.webBackdrop} />
        <View style={styles.webContainer}>
          <ScrollView contentContainerStyle={styles.container} style={styles.root}>
            {children}
          </ScrollView>
        </View>
      </>
    );
  }

  return (
    <RNBottomSheet
      animateOnMount
      enableDynamicSizing
      maxDynamicContentSize={Math.round(windowHeight * 0.9)}
      enablePanDownToClose
      backdropComponent={renderBackdropComponent}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      index={0}
      backgroundStyle={{ backgroundColor: theme.colors.background.card }}
      handleIndicatorStyle={{ backgroundColor: theme.colors.text.muted }}
      {...others}>
      <BottomSheetScrollView contentContainerStyle={styles.container} style={styles.root}>
        {children}
      </BottomSheetScrollView>
    </RNBottomSheet>
  );
});

export default BottomSheet;
