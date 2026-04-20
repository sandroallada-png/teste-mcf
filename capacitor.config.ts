import { CapacitorConfig } from '@capacitor/cli';
// MCF iOS LOCAL BUILD — généré par scripts/prepare-ios.js
// NE PAS COMMITER CE FICHIER tel quel (il est temporaire)

const config: CapacitorConfig = {
  appId: 'my.cook.flex',
  appName: 'My Cook Flex',
  webDir: 'App/App/public',  // ← Correction du chemin pour le Mac
  // PAS de server.url → WebView charge les fichiers locaux (out/)
  // Mais on autorise la communication avec la PWA
  server: {
    allowNavigation: [
      'app.mycookflex.com',
      '*.mycookflex.com'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#f97316',
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    }
  }
};

export default config;
