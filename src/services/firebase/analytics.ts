import {
  getAnalytics,
  isSupported,
  logEvent,
  setUserId,
  setUserProperties,
  type Analytics,
} from 'firebase/analytics';
import { firebaseApp, isFirebaseConfigured } from '../../config/firebase';
import { UserRole } from '../../types/user';
import { sanitizeForLog, secureLogger } from '../../utils/logger';

let cachedAnalytics: Analytics | null = null;
let analyticsSupportChecked = false;

const resolveAnalytics = async (): Promise<Analytics | null> => {
  if (!isFirebaseConfigured || !firebaseApp) {
    return null;
  }
  if (analyticsSupportChecked) {
    return cachedAnalytics;
  }

  analyticsSupportChecked = true;
  try {
    const supported = await isSupported();
    if (supported) {
      cachedAnalytics = getAnalytics(firebaseApp);
    }
  } catch (err) {
    secureLogger.debug('firebaseAnalytics', 'Analytics unavailable in current runtime', err);
    cachedAnalytics = null;
  }
  return cachedAnalytics;
};

export const firebaseAnalyticsService = {
  async identifyUser(userId: string | null, role?: UserRole): Promise<void> {
    const analytics = await resolveAnalytics();
    if (!analytics) return;

    try {
      setUserId(analytics, userId);
      if (role) {
        setUserProperties(analytics, { account_role: role });
      }
    } catch (err) {
      secureLogger.debug('firebaseAnalytics', 'Failed to set analytics user context', err);
    }
  },

  async trackEvent(
    eventName: string,
    params: Record<string, string | number | boolean> = {}
  ): Promise<void> {
    const safeParams = sanitizeForLog(params) as Record<string, string | number | boolean>;
    const analytics = await resolveAnalytics();
    if (!analytics) {
      secureLogger.debug('firebaseAnalytics', `Queued analytics event: ${eventName}`, safeParams);
      return;
    }

    try {
      logEvent(analytics, eventName, safeParams);
    } catch (err) {
      secureLogger.debug('firebaseAnalytics', `Failed to log event ${eventName}`, err);
    }
  },

  async trackScreenView(screenName: string, role?: UserRole): Promise<void> {
    await this.trackEvent('screen_view', {
      screen_name: screenName,
      ...(role ? { account_role: role } : {}),
    });
  },

  async trackLoginSuccess(role: UserRole, method: 'password' | 'otp'): Promise<void> {
    await this.trackEvent('login', { method, account_role: role });
  },

  async trackSignUpSuccess(role: UserRole, method: string): Promise<void> {
    await this.trackEvent('sign_up', { method, account_role: role });
  },

  async trackAppointmentBooked(department: string): Promise<void> {
    await this.trackEvent('appointment_booked', { department });
  },

  async trackOpdTokenGenerated(department: string): Promise<void> {
    await this.trackEvent('opd_token_generated', { department });
  },
};

export default firebaseAnalyticsService;
