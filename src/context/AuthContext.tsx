import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, StaffDesignation } from '../types/user';
import { LoginCredentials, PatientRegisterData } from '../types/auth';
import apiClient, {
  AUTH_TOKEN_STORAGE_KEY,
  ROLE_STORAGE_KEY,
  USER_INFO_STORAGE_KEY,
  isMockFallbackEnabled,
} from '../services/apiClient';
import {
  authService,
  resolveIdentityFromLoginId,
  loadAdminRoleRegistry,
  assignUserRoleByAdmin,
} from '../services/authService';
import { validateEmail } from '../utils/validators';
import { secureLogger } from '../utils/logger';
import { firebaseAnalyticsService } from '../services/firebase/analytics';
import { firebaseCrashlyticsService } from '../services/firebase/crashlytics';

export type { User, UserRole, StaffDesignation, LoginCredentials, PatientRegisterData };

export interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOtp: (phone: string, otp: string, role: UserRole) => Promise<void>;
  registerPatient: (data: PatientRegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export const STORAGE_SESSION_KEY = '@star_hospital_auth_session_v1';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000;

const VALID_ROLES: readonly UserRole[] = ['patient', 'doctor', 'staff'];
const VALID_DESIGNATIONS: readonly StaffDesignation[] = [
  'nurse',
  'receptionist',
  'pharmacist',
  'laboratorist',
  'billing',
  'lab_tech',
  'billing_clerk',
  'admin',
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface StoredSessionData {
  user: User;
  token: string;
  role: UserRole;
  savedAt: number;
}

interface VerifiedSessionState {
  user: User;
  role: UserRole;
  token: string;
}

export const isValidUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && VALID_ROLES.includes(value as UserRole);

export const hasValidTokenRoleBinding = (
  token: string,
  role: UserRole,
  allowLiveBearerToken: boolean = !isMockFallbackEnabled
): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const trimmed = token.trim();
  if (trimmed.length === 0 || /\s/.test(trimmed)) {
    return false;
  }

  if (trimmed.startsWith('star_jwt_')) {
    const tokenRole = trimmed.slice('star_jwt_'.length).split('_')[0];
    return tokenRole === role;
  }

  if (trimmed.startsWith('star_mock_jwt_')) {
    const tokenRole = trimmed.slice('star_mock_jwt_'.length).split('_')[0];
    return tokenRole === role;
  }

  if (trimmed.startsWith('star_otp_jwt_')) {
    const tokenRole = trimmed.slice('star_otp_jwt_'.length).split('_')[0];
    return tokenRole === role;
  }

  if (trimmed.startsWith('star_reg_jwt_')) {
    return role === 'patient';
  }

  if (trimmed.startsWith('mock-otp-') && trimmed.includes('-jwt-token-')) {
    const tokenRole = trimmed.slice('mock-otp-'.length).split('-jwt-token-')[0];
    return tokenRole === role;
  }

  if (trimmed.startsWith('mock-') && trimmed.includes('-jwt-token-')) {
    const tokenRole = trimmed.slice('mock-'.length).split('-jwt-token-')[0];
    return tokenRole === role;
  }

  if (
    trimmed.startsWith('mock-reg-') ||
    trimmed.startsWith('mock-registered-token-')
  ) {
    return role === 'patient';
  }

  // Reject any unrecognized mock/demo/firebase local tokens to prevent cross-role spoofing
  if (
    trimmed.startsWith('star_') ||
    trimmed.startsWith('mock-') ||
    trimmed.startsWith('demo-') ||
    trimmed.startsWith('firebase-otp-')
  ) {
    return false;
  }

  // Real backend JWT / Laravel Passport / Sanctum bearer token (live mode only)
  return allowLiveBearerToken && trimmed.length >= 10;
};

export const validateStoredSession = (
  parsed: unknown,
  auxRole?: string | null,
  auxUserRaw?: string | null,
  auxToken?: string | null,
  nowMs: number = Date.now(),
  allowLiveBearerToken: boolean = !isMockFallbackEnabled
): parsed is StoredSessionData => {
  if (!parsed || typeof parsed !== 'object') {
    return false;
  }

  const candidate = parsed as Partial<StoredSessionData>;
  if (!candidate.user || typeof candidate.user !== 'object') {
    return false;
  }

  if (typeof candidate.user.id !== 'string' || candidate.user.id.trim().length === 0) {
    return false;
  }

  if (typeof candidate.token !== 'string' || candidate.token.trim().length === 0) {
    return false;
  }

  if (!isValidUserRole(candidate.role) || candidate.user.role !== candidate.role) {
    return false;
  }

  if (candidate.user.token && candidate.user.token !== candidate.token) {
    return false;
  }

  if (!hasValidTokenRoleBinding(candidate.token, candidate.role, allowLiveBearerToken)) {
    return false;
  }

  if (
    candidate.role === 'staff' &&
    candidate.user.designation !== undefined &&
    !VALID_DESIGNATIONS.includes(candidate.user.designation)
  ) {
    return false;
  }

  if (candidate.role !== 'staff' && candidate.user.designation !== undefined) {
    return false;
  }

  if (
    typeof candidate.savedAt !== 'number' ||
    !Number.isFinite(candidate.savedAt) ||
    nowMs - candidate.savedAt > SESSION_MAX_AGE_MS ||
    candidate.savedAt - nowMs > FUTURE_CLOCK_SKEW_MS
  ) {
    return false;
  }

  if (auxToken !== undefined && auxToken !== candidate.token) {
    return false;
  }

  if (auxRole && auxRole !== candidate.role) {
    return false;
  }

  if (auxUserRaw) {
    try {
      const auxUser = JSON.parse(auxUserRaw) as Partial<User>;
      if (!auxUser || auxUser.role !== candidate.role || auxUser.id !== candidate.user.id) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
};

const purgePersistedSession = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_SESSION_KEY,
      AUTH_TOKEN_STORAGE_KEY,
      USER_INFO_STORAGE_KEY,
      ROLE_STORAGE_KEY,
    ]);
  } catch {
    await AsyncStorage.removeItem(STORAGE_SESSION_KEY).catch(() => {});
  }
  await apiClient.clearAuthToken();
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<VerifiedSessionState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        await loadAdminRoleRegistry();
        const [rawSession, auxToken, auxRole, auxUserRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_SESSION_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
          AsyncStorage.getItem(ROLE_STORAGE_KEY),
          AsyncStorage.getItem(USER_INFO_STORAGE_KEY),
        ]);

        if (!rawSession || !auxToken) {
          if (rawSession || auxToken || auxRole || auxUserRaw) {
            await purgePersistedSession();
          }
          if (isMounted) setIsLoading(false);
          return;
        }

        const parsed: unknown = JSON.parse(rawSession);

        if (!validateStoredSession(parsed, auxRole, auxUserRaw, auxToken)) {
          secureLogger.warn('AuthContext', 'Detected corrupted or tampered session state; purging');
          await purgePersistedSession();
          if (isMounted) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        let verifiedUserRecord: User = parsed.user;

        // If connected to a live backend, verify the session role and identity against /api/user
        if (!isMockFallbackEnabled) {
          const remoteUser = await authService.getCurrentUser();
          if (
            !remoteUser ||
            !isValidUserRole(remoteUser.role) ||
            remoteUser.role !== parsed.role ||
            remoteUser.id !== parsed.user.id ||
            (remoteUser.role === 'staff' && remoteUser.designation !== parsed.user.designation)
          ) {
            secureLogger.warn('AuthContext', 'Backend role/identity verification mismatch; purging');
            await purgePersistedSession();
            if (isMounted) {
              setSession(null);
              setIsLoading(false);
            }
            return;
          }
          verifiedUserRecord = {
            ...remoteUser,
            role: remoteUser.role,
            designation: remoteUser.role === 'staff' ? remoteUser.designation : undefined,
            token: parsed.token,
          };
        }

        if (isMounted) {
          setSession({
            user: verifiedUserRecord,
            role: parsed.role,
            token: parsed.token,
          });
          setIsLoading(false);
          void firebaseAnalyticsService.identifyUser(verifiedUserRecord.id, parsed.role);
          void firebaseCrashlyticsService.setUserContext(verifiedUserRecord.id, parsed.role);
        }
      } catch (err) {
        secureLogger.error('AuthContext', 'Failed to restore session from storage', err);
        await purgePersistedSession().catch(() => {});
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistSession = async (newUser: User, verifiedRole: UserRole, token: string) => {
    if (!isValidUserRole(verifiedRole)) {
      throw new Error(`Unauthorized role assignment: ${verifiedRole}`);
    }

    if (newUser.role !== verifiedRole) {
      throw new Error('Verified account role mismatch detected.');
    }

    if (!hasValidTokenRoleBinding(token, verifiedRole)) {
      throw new Error('Authentication token role binding validation failed.');
    }

    if (
      verifiedRole === 'staff' &&
      newUser.designation !== undefined &&
      !VALID_DESIGNATIONS.includes(newUser.designation)
    ) {
      throw new Error(`Invalid staff designation: ${newUser.designation}`);
    }

    const sanitizedUser: User = {
      ...newUser,
      role: verifiedRole,
      designation: verifiedRole === 'staff' ? newUser.designation : undefined,
      token,
    };

    const payload: StoredSessionData = {
      user: sanitizedUser,
      role: verifiedRole,
      token,
      savedAt: Date.now(),
    };

    await Promise.all([
      AsyncStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(payload)),
      AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token),
      AsyncStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(sanitizedUser)),
      AsyncStorage.setItem(ROLE_STORAGE_KEY, verifiedRole),
    ]);

    setSession({
      user: sanitizedUser,
      role: verifiedRole,
      token,
    });

    void firebaseAnalyticsService.identifyUser(sanitizedUser.id, verifiedRole);
    void firebaseCrashlyticsService.setUserContext(sanitizedUser.id, verifiedRole);
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    await loadAdminRoleRegistry();
    const { login: identifier, password, role: explicitRole, designation: explicitDesignation } = credentials;

    if (!identifier || identifier.trim().length === 0) {
      throw new Error('Email address, Mobile Number, or Role ID is required.');
    }

    if (typeof password !== 'string' || password.trim().length === 0) {
      throw new Error('Password is required.');
    }

    const resolved = resolveIdentityFromLoginId(identifier, explicitRole, explicitDesignation);
    const selectedRole: UserRole =
      explicitRole && isValidUserRole(explicitRole) ? explicitRole : resolved.role;
    const resolvedDesignation = explicitDesignation || resolved.designation;

    if (!isValidUserRole(selectedRole)) {
      throw new Error('Invalid user role specified.');
    }

    const authResponse = await authService.login({
      ...credentials,
      role: selectedRole,
      designation: resolvedDesignation,
    });

    const verifiedUser = authResponse.user;
    const verifiedRole = verifiedUser?.role;
    if (!verifiedUser || !isValidUserRole(verifiedRole)) {
      throw new Error('Authentication response did not contain a valid user role.');
    }
    if (explicitRole && verifiedRole !== explicitRole) {
      throw new Error(
        `Your verified account role (${verifiedRole}) cannot access the ${explicitRole} portal.`
      );
    }

    await persistSession(verifiedUser, verifiedRole, authResponse.token);
    void firebaseAnalyticsService.trackLoginSuccess(verifiedRole, 'password');
  };

  const loginWithOtp = async (phone: string, otp: string, selectedRole: UserRole): Promise<void> => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    const cleanedOtp = (otp || '').trim();
    if (!/^\d{6}$/.test(cleanedOtp)) {
      throw new Error('Please enter the complete 6-digit OTP code.');
    }

    if (!isValidUserRole(selectedRole)) {
      throw new Error('Invalid user role specified.');
    }

    if (!isMockFallbackEnabled) {
      const authResponse = await authService.loginWithOtp({
        phone,
        otp: cleanedOtp,
        role: selectedRole,
      });
      if (!authResponse.user || authResponse.user.role !== selectedRole) {
        throw new Error(
          `Your verified account role (${authResponse.user?.role ?? 'unknown'}) cannot access the ${selectedRole} portal.`
        );
      }
      await persistSession(authResponse.user, authResponse.user.role, authResponse.token);
      void firebaseAnalyticsService.trackLoginSuccess(authResponse.user.role, 'otp');
      return;
    }

    const token = `star_otp_jwt_${selectedRole}_${Date.now()}`;
    const cleanPhone = phone.startsWith('+') ? phone : `+91 ${phone}`;

    let otpUser: User;
    if (selectedRole === 'patient') {
      otpUser = {
        id: 'pat-1002',
        name: 'Rahul Sharma',
        email: 'rahul.patient@starhospital.com',
        phone: cleanPhone,
        role: 'patient',
        gender: 'male',
        dateOfBirth: '1994-05-12',
        bloodGroup: 'O+',
        city: 'Mumbai',
        address: '42 Orchid Park, Bandra West',
        token,
        createdAt: new Date().toISOString(),
      };
    } else if (selectedRole === 'doctor') {
      otpUser = {
        id: 'doc-2002',
        name: 'Dr. Amit Sharma',
        email: 'dr.amit@starhospital.com',
        phone: cleanPhone,
        role: 'doctor',
        token,
        createdAt: new Date().toISOString(),
      };
    } else {
      otpUser = {
        id: 'stf-3002',
        name: 'Front-desk Staff',
        email: 'reception@starhospital.com',
        phone: cleanPhone,
        role: 'staff',
        designation: 'receptionist',
        token,
        createdAt: new Date().toISOString(),
      };
    }

    await persistSession(otpUser, selectedRole, token);
    void firebaseAnalyticsService.trackLoginSuccess(selectedRole, 'otp');
  };

  const registerPatient = async (data: PatientRegisterData): Promise<void> => {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Full Name is required.');
    }
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) {
      throw new Error('Valid mobile number is required.');
    }
    if (data.email && data.email.trim().length > 0) {
      const emailCheck = validateEmail(data.email);
      if (!emailCheck.valid) {
        throw new Error(emailCheck.error || 'Please enter a valid email address.');
      }
    }
    if (!data.password || data.password.trim().length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const authResponse = await authService.registerPatient(data);
    if (!authResponse.user || authResponse.user.role !== 'patient') {
      throw new Error('Patient registration must return a verified patient account.');
    }
    await persistSession(authResponse.user, 'patient', authResponse.token);
    void firebaseAnalyticsService.trackSignUpSuccess('patient', 'email_or_phone');
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      await purgePersistedSession();
    } catch (err) {
      secureLogger.error('AuthContext', 'Failed to clear storage on logout', err);
    } finally {
      setSession(null);
      void firebaseAnalyticsService.identifyUser(null);
      void firebaseCrashlyticsService.setUserContext(null);
    }
  };

  // Verified role and authentication are strictly derived from validated session state
  const verifiedUser: User | null = session?.user ?? null;
  const verifiedRole: UserRole | null =
    session && isValidUserRole(session.user.role) && session.role === session.user.role
      ? session.role
      : null;
  const isAuthenticated = Boolean(verifiedUser && session?.token && verifiedRole);

  return (
    <AuthContext.Provider
      value={{
        user: verifiedUser,
        role: verifiedRole,
        isAuthenticated,
        isLoading,
        login,
        loginWithOtp,
        registerPatient,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
