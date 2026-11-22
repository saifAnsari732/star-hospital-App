import apiClient, { withMockFallback } from './apiClient';
import {
  NotificationItem,
  RegisterPushTokenRequest,
} from '../types/notification';
import { mockNotifications } from '../fixtures/mockNotifications';

export const notificationService = {
  /**
   * Get user notification feed (OPD tokens, appointments, reports, prescriptions)
   */
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    return withMockFallback(
      () =>
        apiClient.get<NotificationItem[]>('/api/v1/notifications', {
          params: { userId },
        } as any),
      () => mockNotifications
    );
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    return withMockFallback(
      () =>
        apiClient.put<void>(`/api/v1/notifications/${notificationId}/read`),
      () => {
        const notif = mockNotifications.find((n) => n.id === notificationId);
        if (notif) {
          notif.read = true;
        }
      }
    );
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    return withMockFallback(
      () => apiClient.put<void>('/api/v1/notifications/read-all'),
      () => {
        mockNotifications.forEach((n) => {
          n.read = true;
        });
      }
    );
  },

  /**
   * Register Firebase Cloud Messaging device token with backend
   */
  async registerPushToken(
    req: RegisterPushTokenRequest
  ): Promise<{ success: boolean }> {
    return withMockFallback(
      () =>
        apiClient.post<{ success: boolean }>(
          '/api/v1/notifications/push-token',
          req
        ),
      () => ({ success: true })
    );
  },
};

export default notificationService;
