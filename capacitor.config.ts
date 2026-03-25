import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.noorlearning.app',
  appName: 'Noor Learning',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
