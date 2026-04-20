import { CapacitorConfig } from '@capacitor/cli';
// MCF Super-Hybrid Version: 1.0.4 - 2026-04-15

const config: CapacitorConfig = {
  appId: 'my.cook.flex',
  appName: 'My Cook Flex',
  webDir: 'out',
  server: {
    url: 'https://app.mycookflex.com',
    allowNavigation: ['app.mycookflex.com'],
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0a",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#f97316",
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    }
  }
};

export default config;
