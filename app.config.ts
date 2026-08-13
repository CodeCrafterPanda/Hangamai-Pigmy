import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const expoProjectId = process.env.EXPO_PROJECT_ID;
  const expoConfig: ExpoConfig = {
    ...config,
    slug: process.env.EXPO_SLUG ?? 'hangamai',
    name: process.env.EXPO_NAME ?? 'Hangamai',
    owner: process.env.EXPO_OWNER ?? 'siyushs-team',
    ios: {
      ...config.ios,
      bundleIdentifier: process.env.EXPO_IOS_BUNDLE_IDENTIFIER ?? config.ios?.bundleIdentifier,
    },
    android: {
      ...config.android,
      package: process.env.EXPO_ANDROID_PACKAGE ?? config.android?.package,
    },
    web: {
      ...config.web,
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/playstore.png',
    },
    ...(expoProjectId
      ? {
          updates: {
            url: `https://u.expo.dev/${expoProjectId}`,
          },
        }
      : {}),
    extra: {
      ...config.extra,
      ...(expoProjectId ? { eas: { projectId: expoProjectId } } : {}),
      env: process.env.ENV ?? 'development',
      apiUrl: process.env.API_URL ?? 'https://example.com',
    },
    plugins: [
      'expo-router',
      'expo-asset',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#FFFFFF',
          dark: {
            backgroundColor: '#FFFFFF',
          },
          image: './assets/images/icon.png',
          imageWidth: 180,
          resizeMode: 'contain',
        },
      ],
      [
        'expo-font',
        {
          fonts: [
            './assets/fonts/OpenSans-Bold.ttf',
            './assets/fonts/OpenSans-BoldItalic.ttf',
            './assets/fonts/OpenSans-Italic.ttf',
            './assets/fonts/OpenSans-Regular.ttf',
            './assets/fonts/OpenSans-Semibold.ttf',
            './assets/fonts/OpenSans-SemiboldItalic.ttf',
          ],
        },
      ],
    ],
  };
  // console.log('[##] expo config', expoConfig);
  return expoConfig;
};
