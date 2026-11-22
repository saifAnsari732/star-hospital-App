import { Platform } from 'react-native';
import {
  DOCTOR_ROUTES,
  PATIENT_ROUTES,
  STAFF_ROUTES,
} from '../../constants/routes';
import { NotificationCategory, NotificationItem } from '../../types/notification';
import { UserRole } from '../../types/user';
import { notificationService } from '../notificationService';
import { firestoreService } from './firestore';
import { secureLogger } from '../../utils/logger';

export interface NotificationChannelConfig {
  id: string;
  name: string;
  category: NotificationCategory;
  importance: 'high' | 'default';
  description: string;
}

export const STAR_NOTIFICATION_CHANNELS: readonly NotificationChannelConfig[] = [
  {
    id: 'opd_tokens',
    name: 'OPD Token & Live Queue',
    category: 'opd_token',
    importance: 'high',
    description: 'Real-time alerts when your OPD token is called or up next.',
  },
  {
    id: 'appointments',
    name: 'Appointment Reminders',
    category: 'appointment',
    importance: 'high',
    description: 'Confirmations, reminders, and schedule updates for doctor visits.',
  },
  {
    id: 'prescriptions',
    name: 'Prescription Alerts',
    category: 'prescription',
    importance: 'default',
    description: 'Digital prescriptions and pharmacy dispensing readiness.',
  },
  {
    id: 'lab_reports',
    name: 'Lab Report Availability',
    category: 'lab_report',
    importance: 'high',
    description: 'Alerts as soon as diagnostic or radiology reports are ready.',
  },
  {
    id: 'general',
    name: 'Hospital Announcements & Billing',
    category: 'general',
    importance: 'default',
    description: 'General hospital updates, invoices, and payment receipts.',
  },
];

export type PushNotificationListener = (notification: NotificationItem) => void;

const foregroundListeners = new Set<PushNotificationListener>();

const getPlatformType = (): 'android' | 'ios' =>
  Platform.OS === 'ios' ? 'ios' : 'android';

export const resolveNotificationRoute = (
  category: NotificationCategory,
  role: UserRole
): string => {
  if (role === 'doctor') {
    if (category === 'opd_token') return DOCTOR_ROUTES.OPD_QUEUE_CALLER;
    return DOCTOR_ROUTES.NOTIFICATIONS;
  }

  if (role === 'staff') {
    if (category === 'opd_token') return STAFF_ROUTES.TOKEN_GENERATION;
    if (category === 'lab_report') return STAFF_ROUTES.LAB_ENTRY;
    if (category === 'prescription') return STAFF_ROUTES.PHARMACY_DISPENSE;
    if (category === 'billing') return STAFF_ROUTES.BILLING_INVOICE;
    return STAFF_ROUTES.NOTIFICATIONS;
  }

  switch (category) {
    case 'opd_token':
      return PATIENT_ROUTES.OPD_TOKEN;
    case 'appointment':
      return PATIENT_ROUTES.APPOINTMENT_DETAILS;
    case 'prescription':
      return PATIENT_ROUTES.PRESCRIPTIONS_LIST;
    case 'lab_report':
      return PATIENT_ROUTES.REPORTS_LIST;
    case 'billing':
      return PATIENT_ROUTES.BILLS;
    default:
      return PATIENT_ROUTES.NOTIFICATIONS;
  }
};

export const firebaseMessagingService = {
  async registerDeviceForPushNotifications(
    userId: string,
    role: UserRole,
    nativeFcmToken?: string
  ): Promise<{ token: string; registered: boolean }> {
    const platform = getPlatformType();
    const candidateFallback = `fcm_device_${platform}_${userId}_${Date.now().toString(36)}`;
    const resolvedToken =
      nativeFcmToken?.trim() ||
      (candidateFallback.length >= 20
        ? candidateFallback
        : candidateFallback.padEnd(20, '0'));

    if (!userId || resolvedToken.length < 20 || resolvedToken.length > 512) {
      return { token: resolvedToken, registered: false };
    }

    try {
      await notificationService.registerPushToken({
        token: resolvedToken,
        platform,
        userId,
      });

      await firestoreService.syncUserDeviceMetadata({
        uid: userId,
        role,
        fcmToken: resolvedToken,
        platform,
        notificationsEnabled: true,
      });

      secureLogger.info('firebaseMessaging', 'Registered push notification token', {
        platform,
        role,
      });

      return { token: resolvedToken, registered: true };
    } catch (err) {
      secureLogger.warn('firebaseMessaging', 'Failed to register FCM device token', err);
      return { token: resolvedToken, registered: false };
    }
  },

  subscribeForegroundMessages(listener: PushNotificationListener): () => void {
    foregroundListeners.add(listener);
    return () => {
      foregroundListeners.delete(listener);
    };
  },

  dispatchLocalNotificationPreview(notification: NotificationItem): void {
    for (const listener of foregroundListeners) {
      try {
        listener(notification);
      } catch (err) {
        secureLogger.warn('firebaseMessaging', 'Notification listener threw error', err);
      }
    }
  },
};

export default firebaseMessagingService;
