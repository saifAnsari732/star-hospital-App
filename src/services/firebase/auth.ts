import {
  onAuthStateChanged,
  signOut,
  type ApplicationVerifier,
  type ConfirmationResult,
  type Unsubscribe,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  confirmFirebasePhoneOtp,
  firebaseAuth,
  isFirebaseConfigured,
  sendFirebasePhoneOtp,
} from '../../config/firebase';
import { isMockFallbackEnabled } from '../apiClient';
import { secureLogger } from '../../utils/logger';
import { formatE164Phone, validateOtpCode, validatePhone } from '../../utils/validators';

export interface FirebasePhoneOtpDispatchResult {
  mode: 'firebase' | 'demo';
  verificationHandle: ConfirmationResult | string;
  formattedPhone: string;
}

export interface FirebaseOtpVerifyResult {
  uid: string;
  phoneNumber: string | null;
  idToken: string;
  mode: 'firebase' | 'demo';
}

export const firebaseAuthService = {
  isReady(): boolean {
    return Boolean(isFirebaseConfigured && firebaseAuth);
  },

  getCurrentUid(): string | null {
    return firebaseAuth?.currentUser?.uid ?? null;
  },

  async requestPhoneOtp(
    phoneNumber: string,
    recaptchaVerifier?: ApplicationVerifier
  ): Promise<FirebasePhoneOtpDispatchResult> {
    const phoneCheck = validatePhone(phoneNumber);
    if (!phoneCheck.valid) {
      throw new Error(phoneCheck.error);
    }

    const formattedPhone = formatE164Phone(phoneNumber);

    if (this.isReady() && recaptchaVerifier) {
      try {
        const result = await sendFirebasePhoneOtp(formattedPhone, recaptchaVerifier);
        secureLogger.info('firebaseAuth', 'Dispatched Firebase Phone OTP');
        return {
          mode: 'firebase',
          verificationHandle: result.confirmationResult,
          formattedPhone,
        };
      } catch (err) {
        secureLogger.error('firebaseAuth', 'Firebase Phone OTP dispatch failed', err);
        throw err;
      }
    }

    if (!isMockFallbackEnabled) {
      throw new Error(
        'Live Firebase Phone Auth requires configured Firebase credentials and an ApplicationVerifier.'
      );
    }

    secureLogger.debug('firebaseAuth', 'Using demo OTP dispatch fallback');
    return {
      mode: 'demo',
      verificationHandle: `demo-verification-${Date.now()}`,
      formattedPhone,
    };
  },

  async verifyPhoneOtp(
    verificationHandle: ConfirmationResult | string,
    otpCode: string
  ): Promise<FirebaseOtpVerifyResult> {
    const otpCheck = validateOtpCode(otpCode, 6);
    if (!otpCheck.valid) {
      throw new Error(otpCheck.error);
    }

    const cleanedOtp = otpCode.trim();

    if (
      typeof verificationHandle === 'object' &&
      verificationHandle !== null &&
      'confirm' in verificationHandle &&
      typeof verificationHandle.confirm === 'function'
    ) {
      const confirmed = await confirmFirebasePhoneOtp(verificationHandle, cleanedOtp);
      return {
        uid: confirmed.uid || firebaseAuth?.currentUser?.uid || `fb-uid-${Date.now()}`,
        phoneNumber: firebaseAuth?.currentUser?.phoneNumber || null,
        idToken: confirmed.token,
        mode: 'firebase',
      };
    }

    if (
      typeof verificationHandle === 'string' &&
      verificationHandle.startsWith('demo-verification-') &&
      isMockFallbackEnabled
    ) {
      if (cleanedOtp !== '123456' && cleanedOtp !== '000000') {
        throw new Error('Incorrect verification code. Please try again.');
      }

      return {
        uid: `demo-uid-${Date.now()}`,
        phoneNumber: null,
        idToken: `demo-firebase-id-token-${Date.now()}`,
        mode: 'demo',
      };
    }

    throw new Error('Invalid or expired OTP verification session.');
  },

  async signOut(): Promise<void> {
    if (!firebaseAuth || typeof firebaseAuth.app === 'undefined') return;
    try {
      await signOut(firebaseAuth);
      secureLogger.info('firebaseAuth', 'Signed out of Firebase Auth');
    } catch (err) {
      secureLogger.warn('firebaseAuth', 'Failed to sign out of Firebase Auth', err);
    }
  },

  subscribeAuthState(callback: (user: FirebaseUser | null) => void): Unsubscribe {
    if (!this.isReady() || typeof firebaseAuth.app === 'undefined') {
      callback(null);
      return () => {};
    }
    return onAuthStateChanged(firebaseAuth, callback);
  },
};

export default firebaseAuthService;
