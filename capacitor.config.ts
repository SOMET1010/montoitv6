import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mon.toit',
  appName: 'Mon Toit',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    // Configuration pour le live reload en développement
    url: process.env.NODE_ENV === 'development' ? 'http://20.86.60.204/' : undefined,
    cleartext: true,
    // Permettre les connexions depuis n'importe quelle source en développement
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#86B53E",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
      launchFadeOutDuration: 500
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#86B53E',
      overlaysWebView: false
    },
    App: {
      appendUserAgent: "MonToit/1.0",
      hideLogsOnRelease: true
    },
    Geolocation: {
      permissions: ["location", "fineLocation"],
      requestLocations: true
    },
    Camera: {
      permissions: ["camera", "readExternalStorage", "writeExternalStorage"],
      useLegacy: false
    },
    Filesystem: {
      permissions: ["readExternalStorage", "writeExternalStorage"]
    },
    Network: {
      permissions: ["networkState", "wifiState"]
    },
    ScreenOrientation: {
      permissions: ["orientation"],
      initialOrientation: 'portrait'
    },
    Preferences: {
      permissions: []
    }
  }
};

export default config;