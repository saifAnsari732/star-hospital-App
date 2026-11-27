import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { secureLogger } from '../../utils/logger';
import { resolveNotificationRoute, STAR_NOTIFICATION_CHANNELS } from './messaging';
import { UserRole } from '../../types/user';
import { NotificationCategory } from '../../types/notification';

// Configure how notifications appear when app is in foreground or screen is woken (Native Android/iOS)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
}

export const nativePushNotificationService = {
  /**
   * Initializes notification channels on Android with MAX importance for Screen-Off wake & sound
   */
  async configureNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      for (const ch of STAR_NOTIFICATION_CHANNELS) {
        await Notifications.setNotificationChannelAsync(ch.id, {
          name: ch.name,
          importance:
            ch.importance === 'high'
              ? Notifications.AndroidImportance.MAX
              : Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0866C6',
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          bypassDnd: ch.importance === 'high',
          sound: 'default',
        });
      }
      secureLogger.info('nativePushNotification', 'Configured high-priority Android notification channels');
    } catch (err) {
      secureLogger.warn('nativePushNotification', 'Failed to configure Android notification channels', err);
    }
  },

  /**
   * Request device push token (FCM device token on Android, APNs on iOS)
   */
  async getDevicePushToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      if (!Device.isDevice) {
        secureLogger.info('nativePushNotification', 'Running in simulator/emulator; simulated push token active');
        return `simulator_device_token_${Platform.OS}_${Date.now()}`;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        secureLogger.warn('nativePushNotification', 'Push notification permissions not granted by user');
        return null;
      }

      const tokenData = await Notifications.getDevicePushTokenAsync();
      secureLogger.info('nativePushNotification', 'Acquired native device push token');
      return tokenData.data;
    } catch (err) {
      secureLogger.warn('nativePushNotification', 'Failed to acquire native device push token', err);
      return null;
    }
  },

  /**
   * Immediately trigger high-priority screen-wake alert with sound and heads-up banner
   */
  async scheduleHighPriorityWakeAlert(
    title: string,
    body: string,
    channelId: string = 'opd_tokens',
    data: Record<string, unknown> = {}
  ): Promise<string> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
          void Notification.requestPermission().then((perm) => {
            if (perm === 'granted') {
              new Notification(title, { body });
            }
          });
        }
      }

      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
          data,
        },
        trigger: null, // deliver immediately
      });
    } catch (err) {
      secureLogger.warn('nativePushNotification', 'Failed to schedule high priority alert', err);
      return '';
    }
  },

  /**
   * Listen for user tapping notification (handles navigation)
   */
  registerResponseListener(
    userRole: UserRole,
    onNavigate: (route: string) => void
  ): Notifications.EventSubscription | { remove: () => void } {
    if (Platform.OS === 'web') {
      return { remove: () => {} };
    }
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { category?: NotificationCategory };
      const category = data?.category || 'general';
      const route = resolveNotificationRoute(category, userRole);
      if (route) {
        onNavigate(route);
      }
    });
  },
};

export default nativePushNotificationService;
