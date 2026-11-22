import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  signInWithPhoneNumber,
  Auth,
  Persistence,
  ApplicationVerifier,
  ConfirmationResult,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare const process: {
  env?: Record<string, string | undefined>;
};
declare const require: (id: string) => unknown;

export interface FirebaseEnvConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

const KNOWN_PLACEHOLDER_VALUES = new Set<string>([
  'aizasydemostarhospitalkey1234567890',
  'your_firebase_web_api_key',
  'star-hospital-app',
  'star-hospital-app.firebaseapp.com',
  'star-hospital-app.appspot.com',
  '123456789012',
  '1:123456789012:web:abcdef1234567890',
  '1:123456789012:web:abcdef1234567890abcdef',
  'g-xxxxxxxxxx',
]);

export const isPlaceholderFirebaseValue = (value?: string): boolean => {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  const normalized = trimmed.toLowerCase();
  if (KNOWN_PLACEHOLDER_VALUES.has(normalized)) return true;
  if (
    normalized.startsWith('your_') ||
    normalized.startsWith('your-') ||
    normalized.startsWith('placeholder') ||
    normalized.startsWith('replace_') ||
    normalized.startsWith('<') ||
    normalized.includes('xxxxxxxx')
  ) {
    return true;
  }
  return false;
};

export const isFirebaseConfigComplete = (config: FirebaseEnvConfig): boolean =>
  !isPlaceholderFirebaseValue(config.apiKey) &&
  !isPlaceholderFirebaseValue(config.projectId) &&
  !isPlaceholderFirebaseValue(config.appId);

const env = typeof process !== 'undefined' && process.env ? process.env : {};

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY?.trim() || '',
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || '',
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim() || '',
  databaseURL:
    env.EXPO_PUBLIC_FIREBASE_DATABASE_URL?.trim() ||
    'https://star-f3312-default-rtdb.firebaseio.com',
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || '',
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID?.trim() || '',
  ...(env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim()
    ? { measurementId: env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID.trim() }
    : {}),
};

const hasRealFirebaseConfig = isFirebaseConfigComplete(firebaseConfig);

let app: FirebaseApp = {} as FirebaseApp;
let auth: Auth = {} as Auth;
let firestore: Firestore = {} as Firestore;
let rtdb: Database = {} as Database;
let storage: FirebaseStorage = {} as FirebaseStorage;
let isConfigured = false;

if (hasRealFirebaseConfig) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    // Initialize Auth with AsyncStorage persistence for React Native
    try {
      let rnPersistence: Persistence | undefined;
      try {
        const authModule = require('firebase/auth') as {
          getReactNativePersistence?: (storageEngine: typeof AsyncStorage) => Persistence;
        };
        if (typeof authModule.getReactNativePersistence === 'function') {
          rnPersistence = authModule.getReactNativePersistence(AsyncStorage);
        }
      } catch {
        // Fallback if running outside React Native native bridge
      }

      if (rnPersistence) {
        auth = initializeAuth(app, {
          persistence: rnPersistence,
        });
      } else {
        auth = getAuth(app);
      }
    } catch {
      auth = getAuth(app);
    }

    firestore = getFirestore(app);
    try {
      rtdb = getDatabase(app);
    } catch {
      rtdb = {} as Database;
    }
    storage = getStorage(app);
    isConfigured = true;
  } catch {
    app = {} as FirebaseApp;
    auth = {} as Auth;
    firestore = {} as Firestore;
    rtdb = {} as Database;
    storage = {} as FirebaseStorage;
    isConfigured = false;
  }
}

export const firebaseApp = app;
export const firebaseAuth = auth;
export const firestoreDb = firestore;
export const firebaseRtdb = rtdb;
export const firebaseStorage = storage;
export const isFirebaseConfigured = isConfigured;
export const hasExplicitFirebaseEnv = hasRealFirebaseConfig;

/**
 * Live Firebase Phone OTP dispatch helper.
 * Requires configured live Firebase credentials and an ApplicationVerifier / RecaptchaVerifier.
 */
export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  recaptchaVerifier?: ApplicationVerifier
): Promise<{ verificationId: string; confirmationResult: ConfirmationResult }> {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length < 10) {
    throw new Error('A valid 10+ digit phone number is required for OTP delivery.');
  }

  if (!isConfigured) {
    throw new Error(
      'Firebase Phone Auth is not configured. Populate EXPO_PUBLIC_FIREBASE_* env variables or use mock/demo mode.'
    );
  }

  if (!recaptchaVerifier) {
    throw new Error(
      'Firebase Phone Auth requires a RecaptchaVerifier or native Firebase ConfirmationResult in live mode.'
    );
  }

  const confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber.startsWith('+') ? phoneNumber : `+${digits}`,
    recaptchaVerifier
  );

  return {
    verificationId: confirmationResult.verificationId,
    confirmationResult,
  };
}

/**
 * Confirm live Firebase Phone OTP using an active ConfirmationResult handle.
 */
export async function confirmFirebasePhoneOtp(
  verificationHandle: ConfirmationResult | string,
  otpCode: string
): Promise<{ success: boolean; token: string; uid?: string }> {
  const trimmedOtp = otpCode.trim();
  if (!/^\d{6}$/.test(trimmedOtp)) {
    throw new Error('Invalid OTP code. Please enter the 6-digit numeric verification code.');
  }

  if (
    typeof verificationHandle === 'object' &&
    verificationHandle !== null &&
    'confirm' in verificationHandle &&
    typeof verificationHandle.confirm === 'function'
  ) {
    const credential = await verificationHandle.confirm(trimmedOtp);
    const token = await credential.user.getIdToken();
    return {
      success: true,
      token,
      uid: credential.user.uid,
    };
  }

  throw new Error(
    'Live Firebase OTP confirmation requires a valid ConfirmationResult handle.'
  );
}

export default {
  app: firebaseApp,
  auth: firebaseAuth,
  firestore: firestoreDb,
  storage: firebaseStorage,
  isConfigured: isFirebaseConfigured,
  hasExplicitFirebaseEnv,
  sendFirebasePhoneOtp,
  confirmFirebasePhoneOtp,
};
