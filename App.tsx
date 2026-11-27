import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { OPDTokenProvider } from './src/context/OPDTokenContext';
import { RootNavigator } from './src/navigation/RootNavigator';

import { nativePushNotificationService } from './src/services/firebase/nativePushNotificationService';
import { RazorpayCheckoutModal } from './src/components/common/RazorpayCheckoutModal';

export default function App(): React.JSX.Element {
  useEffect(() => {
    void nativePushNotificationService.configureNotificationChannels();

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // 1. Google Fonts Link for Inter (crisp executive medical & fintech UI font)
      const fontId = 'star-hospital-pro-fonts';
      if (!document.getElementById(fontId)) {
        const link = document.createElement('link');
        link.id = fontId;
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
        document.head.appendChild(link);
      }

      // 2. Global CSS for Crisp Professional Typography & Smooth Interactions
      const styleId = 'star-hospital-global-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          * {
            font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            box-sizing: border-box;
          }
          button, input, textarea, select {
            font-family: inherit !important;
          }
          body {
            background-color: #F4F7FB;
            color: #0F172A;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OPDTokenProvider>
          <StatusBar style="dark" />
          <RootNavigator />
          <RazorpayCheckoutModal />
        </OPDTokenProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
