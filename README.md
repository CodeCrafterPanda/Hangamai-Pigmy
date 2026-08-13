# Hangamai

Pigmy collection app for Hangamai Mahila Gramin Bigar Sheti Sahakari Patsanstha.

Built with Expo SDK 54, React Native, Expo Router, and Redux Toolkit. Supports Marathi and English.

## Requirements

- Node 20.x or higher
- Expo CLI
- EAS CLI (for APK / store builds)

## Quick start

```bash
npm install
npm run dev
```

## Android APK

```bash
npm install --global eas-cli
eas login
eas whoami
npm run build:apk
```

The `preview` profile in `eas.json` produces an APK. EAS project ID and Android package come from `.env.dev`.

## License

MIT
