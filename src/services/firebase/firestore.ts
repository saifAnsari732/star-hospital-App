import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type FieldValue,
  type Unsubscribe,
} from 'firebase/firestore';
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from '../../config/firebase';
import { UserRole } from '../../types/user';
import { NotificationItem } from '../../types/notification';
import { notificationService } from '../notificationService';
import { secureLogger } from '../../utils/logger';

export const ALLOWED_FIRESTORE_LANGUAGES = [
  'en',
  'ur',
  'hi',
  'mr',
  'gu',
  'bn',
  'ta',
] as const;

export type FirestoreLanguageCode = (typeof ALLOWED_FIRESTORE_LANGUAGES)[number];

export interface FirestoreUserDeviceSync {
  uid: string;
  role: UserRole;
  fcmToken?: string;
  platform?: 'android' | 'ios' | 'web';
  language?: string;
  notificationsEnabled?: boolean;
  displayName?: string;
  biometricLockEnabled?: boolean;
  onboardingCompleted?: boolean;
}

export interface FirestoreNotificationPreferencesInput {
  pushEnabled: boolean;
  opdTokenAlerts?: boolean;
  appointmentReminders?: boolean;
  labReportAlerts?: boolean;
  prescriptionAlerts?: boolean;
  billingAlerts?: boolean;
  generalAnnouncements?: boolean;
  doctorArrivedAlerts?: boolean;
  doctorUrgentAlerts?: boolean;
  chamberAudioChime?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface LiveQueueSnapshotDoc {
  doctorId: string;
  doctorName: string;
  department: string;
  roomNo?: string;
  date?: string;
  currentServingToken: string;
  nextToken?: string;
  totalTokens?: number;
  waitingCount: number;
  inConsultationCount?: number;
  completedCount?: number;
  estimatedWaitMinutes: number;
  estimatedWaitPerPatientMinutes?: number;
  queueStatus?: 'active' | 'paused' | 'closed';
  updatedAt?: string;
}

const normalizeLanguagePreference = (lang?: string): FirestoreLanguageCode | undefined => {
  if (!lang) return undefined;
  const trimmed = lang.trim().toLowerCase();
  if ((ALLOWED_FIRESTORE_LANGUAGES as readonly string[]).includes(trimmed)) {
    return trimmed as FirestoreLanguageCode;
  }
  return undefined;
};

/**
 * Builds a schema-exact payload for `users/{uid}` matching `firestore.rules`.
 * - On create: supplies required `uid`, `role`, `verified: false`, `createdAt`, `updatedAt`
 * - On update: omits immutable `uid`, `role`, `designation`, `verified`, `entityId`, `createdAt`
 */
export const buildUserProfileSyncPayload = (
  payload: FirestoreUserDeviceSync,
  exists: boolean,
  timestampValue: FieldValue | unknown = serverTimestamp()
): Record<string, unknown> => {
  const validLang = normalizeLanguagePreference(payload.language);
  const mutableFields: Record<string, unknown> = {
    updatedAt: timestampValue,
  };

  if (validLang) {
    mutableFields.languagePreference = validLang;
  }
  if (typeof payload.notificationsEnabled === 'boolean') {
    mutableFields.notificationsEnabled = payload.notificationsEnabled;
  }
  if (typeof payload.biometricLockEnabled === 'boolean') {
    mutableFields.biometricLockEnabled = payload.biometricLockEnabled;
  }
  if (typeof payload.onboardingCompleted === 'boolean') {
    mutableFields.onboardingCompleted = payload.onboardingCompleted;
  }
  if (
    payload.displayName &&
    payload.displayName.trim().length >= 1 &&
    payload.displayName.trim().length <= 80
  ) {
    mutableFields.displayName = payload.displayName.trim();
  }

  if (exists) {
    return mutableFields;
  }

  return {
    uid: payload.uid,
    role: payload.role,
    verified: false,
    ...mutableFields,
    createdAt: timestampValue,
  };
};

/**
 * Builds a schema-exact payload for `deviceTokens/{uid}` matching `firestore.rules`.
 */
export const buildDeviceTokenPayload = (
  uid: string,
  token: string,
  platform: 'android' | 'ios' | 'web',
  enabled: boolean,
  exists: boolean,
  timestampValue: FieldValue | unknown = serverTimestamp()
): Record<string, unknown> | null => {
  const trimmedToken = token.trim();
  if (trimmedToken.length < 20 || trimmedToken.length > 512) {
    return null;
  }

  const mutableFields: Record<string, unknown> = {
    token: trimmedToken,
    platform,
    enabled,
    updatedAt: timestampValue,
  };

  if (exists) {
    return mutableFields;
  }

  return {
    uid,
    ...mutableFields,
    createdAt: timestampValue,
  };
};

const normalizeQueueMirrorSnapshot = (
  doctorId: string,
  raw: Record<string, unknown>
): LiveQueueSnapshotDoc => {
  const waitingCount = typeof raw.waitingCount === 'number' ? raw.waitingCount : 0;
  const perPatient =
    typeof raw.estimatedWaitPerPatientMinutes === 'number'
      ? raw.estimatedWaitPerPatientMinutes
      : 10;
  const estimatedWaitMinutes =
    typeof raw.estimatedWaitMinutes === 'number'
      ? raw.estimatedWaitMinutes
      : waitingCount * perPatient;

  const updatedAtRaw = raw.updatedAt;
  const updatedAt =
    typeof updatedAtRaw === 'string'
      ? updatedAtRaw
      : updatedAtRaw &&
          typeof updatedAtRaw === 'object' &&
          'toDate' in updatedAtRaw &&
          typeof (updatedAtRaw as { toDate: () => Date }).toDate === 'function'
        ? (updatedAtRaw as { toDate: () => Date }).toDate().toISOString()
        : undefined;

  return {
    doctorId: typeof raw.doctorId === 'string' ? raw.doctorId : doctorId,
    doctorName: typeof raw.doctorName === 'string' ? raw.doctorName : '',
    department: typeof raw.department === 'string' ? raw.department : '',
    ...(typeof raw.roomNo === 'string' ? { roomNo: raw.roomNo } : {}),
    ...(typeof raw.date === 'string' ? { date: raw.date } : {}),
    currentServingToken:
      typeof raw.currentServingToken === 'string' ? raw.currentServingToken : '-',
    ...(typeof raw.nextToken === 'string' ? { nextToken: raw.nextToken } : {}),
    ...(typeof raw.totalTokens === 'number' ? { totalTokens: raw.totalTokens } : {}),
    waitingCount,
    ...(typeof raw.inConsultationCount === 'number'
      ? { inConsultationCount: raw.inConsultationCount }
      : {}),
    ...(typeof raw.completedCount === 'number'
      ? { completedCount: raw.completedCount }
      : {}),
    estimatedWaitMinutes,
    ...(typeof raw.estimatedWaitPerPatientMinutes === 'number'
      ? { estimatedWaitPerPatientMinutes: raw.estimatedWaitPerPatientMinutes }
      : {}),
    ...(raw.queueStatus === 'active' ||
    raw.queueStatus === 'paused' ||
    raw.queueStatus === 'closed'
      ? { queueStatus: raw.queueStatus }
      : {}),
    ...(updatedAt ? { updatedAt } : {}),
  };
};

/**
 * Scoped Firestore metadata helper aligned with `firestore.rules`.
 * IMPORTANT: Authoritative medical records and clinical/user notification alerts live
 * in the ICTHospital Laravel/MySQL backend. Firestore is restricted strictly to:
 * - `users/{uid}` (non-PHI user preferences & onboarding metadata)
 * - `deviceTokens/{uid}` (FCM registration tokens)
 * - `notificationPreferences/{uid}` (push category preferences)
 * - `queueMirror/{doctorId}` (read-only live OPD queue counter mirror)
 */
export const firestoreService = {
  isReady(): boolean {
    return Boolean(isFirebaseConfigured && firestoreDb);
  },

  async syncUserDeviceMetadata(payload: FirestoreUserDeviceSync): Promise<boolean> {
    if (!this.isReady() || !firestoreDb || !payload.uid) {
      return false;
    }

    const activeUid = firebaseAuth?.currentUser?.uid;
    if (activeUid && activeUid !== payload.uid) {
      secureLogger.warn('firestoreService', 'Blocked metadata sync for mismatched UID');
      return false;
    }

    try {
      const userRef = doc(firestoreDb, 'users', payload.uid);
      const userSnap = await getDoc(userRef);
      const userPayload = buildUserProfileSyncPayload(payload, userSnap.exists());

      if (userSnap.exists()) {
        await updateDoc(userRef, userPayload);
      } else {
        await setDoc(userRef, userPayload);
      }

      if (payload.fcmToken && payload.platform) {
        const tokenRef = doc(firestoreDb, 'deviceTokens', payload.uid);
        const tokenSnap = await getDoc(tokenRef);
        const tokenPayload = buildDeviceTokenPayload(
          payload.uid,
          payload.fcmToken,
          payload.platform,
          payload.notificationsEnabled ?? true,
          tokenSnap.exists()
        );

        if (tokenPayload) {
          if (tokenSnap.exists()) {
            await updateDoc(tokenRef, tokenPayload);
          } else {
            await setDoc(tokenRef, tokenPayload);
          }
        }
      }

      return true;
    } catch (err) {
      secureLogger.warn('firestoreService', 'Unable to sync user metadata to Firestore', err);
      return false;
    }
  },

  async syncNotificationPreferences(
    uid: string,
    prefs: FirestoreNotificationPreferencesInput
  ): Promise<boolean> {
    if (!this.isReady() || !firestoreDb || !uid) {
      return false;
    }

    const activeUid = firebaseAuth?.currentUser?.uid;
    if (activeUid && activeUid !== uid) {
      return false;
    }

    try {
      const prefRef = doc(firestoreDb, 'notificationPreferences', uid);
      const prefSnap = await getDoc(prefRef);
      const mutable: Record<string, unknown> = {
        pushEnabled: Boolean(prefs.pushEnabled),
        updatedAt: serverTimestamp(),
      };

      const optionalBoolKeys: Array<keyof FirestoreNotificationPreferencesInput> = [
        'opdTokenAlerts',
        'appointmentReminders',
        'labReportAlerts',
        'prescriptionAlerts',
        'billingAlerts',
        'generalAnnouncements',
        'doctorArrivedAlerts',
        'doctorUrgentAlerts',
        'chamberAudioChime',
        'quietHoursEnabled',
      ];
      for (const key of optionalBoolKeys) {
        if (typeof prefs[key] === 'boolean') {
          mutable[key] = prefs[key];
        }
      }
      if (prefs.quietHoursStart && /^([01]\d|2[0-3]):[0-5]\d$/.test(prefs.quietHoursStart)) {
        mutable.quietHoursStart = prefs.quietHoursStart;
      }
      if (prefs.quietHoursEnd && /^([01]\d|2[0-3]):[0-5]\d$/.test(prefs.quietHoursEnd)) {
        mutable.quietHoursEnd = prefs.quietHoursEnd;
      }

      if (prefSnap.exists()) {
        await updateDoc(prefRef, mutable);
      } else {
        await setDoc(prefRef, {
          uid,
          ...mutable,
          createdAt: serverTimestamp(),
        });
      }
      return true;
    } catch (err) {
      secureLogger.warn('firestoreService', 'Unable to sync notification preferences', err);
      return false;
    }
  },

  /**
   * Notification alerts live in ICTHospital Laravel API (`notificationService`),
   * not Firestore, to avoid duplicate sources of truth and comply with `firestore.rules`.
   */
  async getUserNotificationAlerts(userId: string, maxItems = 25): Promise<NotificationItem[]> {
    if (!userId) {
      return [];
    }

    try {
      const items = await notificationService.getNotifications(userId);
      return items.slice(0, maxItems);
    } catch (err) {
      secureLogger.warn('firestoreService', 'Failed to load notification alerts', err);
      return [];
    }
  },

  async markNotificationRead(notificationId: string): Promise<boolean> {
    if (!notificationId) {
      return false;
    }

    try {
      await notificationService.markAsRead(notificationId);
      return true;
    } catch (err) {
      secureLogger.warn('firestoreService', 'Failed to mark notification read', err);
      return false;
    }
  },

  async getLiveDoctorQueueSnapshot(doctorId: string): Promise<LiveQueueSnapshotDoc | null> {
    if (!this.isReady() || !firestoreDb || !doctorId) {
      return null;
    }

    try {
      const snap = await getDoc(doc(firestoreDb, 'queueMirror', doctorId));
      if (!snap.exists()) return null;
      return normalizeQueueMirrorSnapshot(doctorId, snap.data() as Record<string, unknown>);
    } catch (err) {
      secureLogger.warn('firestoreService', 'Failed to fetch live queue snapshot', err);
      return null;
    }
  },

  subscribeLiveDoctorQueue(
    doctorId: string,
    onUpdate: (snapshot: LiveQueueSnapshotDoc | null) => void
  ): Unsubscribe {
    if (!this.isReady() || !firestoreDb || !doctorId) {
      return () => {};
    }

    const queueRef = doc(firestoreDb, 'queueMirror', doctorId);
    return onSnapshot(
      queueRef,
      (snap) => {
        onUpdate(
          snap.exists()
            ? normalizeQueueMirrorSnapshot(doctorId, snap.data() as Record<string, unknown>)
            : null
        );
      },
      (err) => {
        secureLogger.warn('firestoreService', 'Live queue subscription error', err);
      }
    );
  },
};

export default firestoreService;
