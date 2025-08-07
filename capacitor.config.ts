import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4d8fb79d59674df2b9fa0eece4330513',
  appName: 'food-buddies',
  webDir: 'dist',
  server: {
    url: 'https://4d8fb79d-5967-4df2-b9fa-0eece4330513.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#280f3b",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#e91e63",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#280f3b'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark'
    }
  },
};

export default config;