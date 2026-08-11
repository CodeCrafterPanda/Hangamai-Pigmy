import { loadAsync } from 'expo-font';

export const fonts = {
  roboto: {
    thin: 'Roboto_Thin',
    thinItalic: 'Roboto_ThinItalic',
    extraLight: 'Roboto_ExtraLight',
    extraLightItalic: 'Roboto_ExtraLightItalic',
    light: 'Roboto_Light',
    lightItalic: 'Roboto_LightItalic',
    regular: 'Roboto_Regular',
    regularItalic: 'Roboto_Italic',
    medium: 'Roboto_Medium',
    mediumItalic: 'Roboto_MediumItalic',
    semiBold: 'Roboto_SemiBold',
    semiBoldItalic: 'Roboto_SemiBoldItalic',
    bold: 'Roboto_Bold',
    boldItalic: 'Roboto_BoldItalic',
    extraBold: 'Roboto_ExtraBold',
    extraBoldItalic: 'Roboto_ExtraBoldItalic',
    black: 'Roboto_Black',
    blackItalic: 'Roboto_BlackItalic',
  },
};

// preload fonts
export const loadFonts = () =>
  loadAsync({
    Roboto_Thin: require('@/assets/fonts/Roboto-Thin.ttf'),
    Roboto_ThinItalic: require('@/assets/fonts/Roboto-ThinItalic.ttf'),
    Roboto_ExtraLight: require('@/assets/fonts/Roboto-ExtraLight.ttf'),
    Roboto_ExtraLightItalic: require('@/assets/fonts/Roboto-ExtraLightItalic.ttf'),
    Roboto_Light: require('@/assets/fonts/Roboto-Light.ttf'),
    Roboto_LightItalic: require('@/assets/fonts/Roboto-LightItalic.ttf'),
    Roboto_Regular: require('@/assets/fonts/Roboto-Regular.ttf'),
    Roboto_Italic: require('@/assets/fonts/Roboto-Italic.ttf'),
    Roboto_Medium: require('@/assets/fonts/Roboto-Medium.ttf'),
    Roboto_MediumItalic: require('@/assets/fonts/Roboto-MediumItalic.ttf'),
    Roboto_SemiBold: require('@/assets/fonts/Roboto-SemiBold.ttf'),
    Roboto_SemiBoldItalic: require('@/assets/fonts/Roboto-SemiBoldItalic.ttf'),
    Roboto_Bold: require('@/assets/fonts/Roboto-Bold.ttf'),
    Roboto_BoldItalic: require('@/assets/fonts/Roboto-BoldItalic.ttf'),
    Roboto_ExtraBold: require('@/assets/fonts/Roboto-ExtraBold.ttf'),
    Roboto_ExtraBoldItalic: require('@/assets/fonts/Roboto-ExtraBoldItalic.ttf'),
    Roboto_Black: require('@/assets/fonts/Roboto-Black.ttf'),
    Roboto_BlackItalic: require('@/assets/fonts/Roboto-BlackItalic.ttf'),
  });
