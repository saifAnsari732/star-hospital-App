export type NotificationCategory =
  | 'opd_token'
  | 'appointment'
  | 'prescription'
  | 'lab_report'
  | 'billing'
  | 'general';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  read: boolean;
  createdAt: string;
  dataPayload?: Record<string, string>;
}

export interface RegisterPushTokenRequest {
  token: string; // FCM device token
  platform: 'android' | 'ios';
  userId: string;
}
