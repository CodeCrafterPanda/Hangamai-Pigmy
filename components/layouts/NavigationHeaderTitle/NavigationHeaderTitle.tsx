import React from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme, images } from '@/theme';

export default function NavigationHeaderTitle() {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    logo: {
      width: theme.icons.primarySize + 8,
      height: theme.icons.primarySize + 8,
    },
  });

  return <Image source={images.logo} style={styles.logo} />;
}
