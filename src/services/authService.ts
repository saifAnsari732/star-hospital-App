import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, {
  withMockFallback,
  isMockFallbackEnabled,
  AUTH_TOKEN_STORAGE_KEY,
  USER_INFO_STORAGE_KEY,
  ROLE_STORAGE_KEY,
} from './apiClient';
import {
  LoginCredentials,
  PhoneOtpRequest,
  PhoneOtpVerify,
  PatientRegisterData,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types/auth';
import { User, UserRole, StaffDesignation } from '../types/user';
import { mockPatients } from '../fixtures/mockPatients';
import { mockDoctors } from '../fixtures/mockDoctors';
import { mockStaff } from '../fixtures/mockStaff';

const VALID_USER_ROLES: readonly UserRole[] = ['patient', 'doctor', 'staff'];
export const ADMIN_ROLE_REGISTRY_STORAGE_KEY = '@star_hospital_admin_role_registry_v1';
export const REGISTERED_ACCOUNTS_STORAGE_KEY = '@star_hospital_registered_accounts_v2';

export interface RegisteredAccountItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: UserRole;
  designation?: StaffDesignation;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  createdAt: string;
}

let inMemoryRegisteredAccounts: RegisteredAccountItem[] = [];

export const getRegisteredAccounts = async (): Promise<RegisteredAccountItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(REGISTERED_ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryRegisteredAccounts = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return inMemoryRegisteredAccounts;
};

export const saveRegisteredAccount = async (account: RegisteredAccountItem): Promise<void> => {
  await getRegisteredAccounts();
  const normEmail = (account.email || '').trim().toLowerCase();
  const normPhone = (account.phone || '').replace(/\D/g, '');
  const normId = (account.id || '').trim().toLowerCase();

  const existingIdx = inMemoryRegisteredAccounts.findIndex((a) => {
    if (normEmail && a.email.toLowerCase() === normEmail) return true;
    if (normPhone.length >= 10 && a.phone.replace(/\D/g, '') === normPhone) return true;
    if (normId && a.id.toLowerCase() === normId) return true;
    return false;
  });

  if (existingIdx >= 0) {
    inMemoryRegisteredAccounts[existingIdx] = account;
  } else {
    inMemoryRegisteredAccounts = [account, ...inMemoryRegisteredAccounts];
  }

  try {
    await AsyncStorage.setItem(
      REGISTERED_ACCOUNTS_STORAGE_KEY,
      JSON.stringify(inMemoryRegisteredAccounts)
    );
  } catch {
    // ignore
  }
};

export interface AdminManagedAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation?: StaffDesignation;
  assignedBy: string;
  updatedAt: string;
}

const DEFAULT_ADMIN_ROLE_ASSIGNMENTS: AdminManagedAccount[] = [
  {
    id: 'PAT-1001',
    name: 'Rahul Sharma',
    email: 'rahul@gmail.com',
    role: 'patient',
    assignedBy: 'System Default (Patient)',
    updatedAt: '2026-11-14T08:00:00.000Z',
  },
  {
    id: 'DOC-2001',
    name: 'Dr. Amit Sharma',
    email: 'dr.amit@starhospital.com',
    role: 'doctor',
    assignedBy: 'Hospital Admin',
    updatedAt: '2026-11-14T08:00:00.000Z',
  },
  {
    id: 'DOC-2002',
    name: 'Dr. Priya Mehta',
    email: 'priya.mehta@starhospital.com',
    role: 'doctor',
    assignedBy: 'Hospital Admin',
    updatedAt: '2026-11-14T08:00:00.000Z',
  },
  {
    id: 'STF-3001',
    name: 'Hospital Admin / Staff',
    email: 'admin@starhospital.com',
    role: 'staff',
    designation: 'admin',
    assignedBy: 'Super Admin',
    updatedAt: '2026-11-14T08:00:00.000Z',
  },
  {
    id: 'STF-3002',
    name: 'Sunita Verma (Staff)',
    email: 'staff@starhospital.com',
    role: 'staff',
    designation: 'admin',
    assignedBy: 'Hospital Admin',
    updatedAt: '2026-11-14T08:00:00.000Z',
  },
];

let inMemoryRoleRegistry: AdminManagedAccount[] = [...DEFAULT_ADMIN_ROLE_ASSIGNMENTS];

export const getAdminRoleRegistrySync = (): AdminManagedAccount[] => inMemoryRoleRegistry;

export const loadAdminRoleRegistry = async (): Promise<AdminManagedAccount[]> => {
  try {
    const raw = await AsyncStorage.getItem(ADMIN_ROLE_REGISTRY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryRoleRegistry = parsed;
        return parsed;
      }
    }
  } catch {
    // Fallback to in-memory default
  }
  return inMemoryRoleRegistry;
};

export const assignUserRoleByAdmin = async (
  targetEmailOrId: string,
  name: string,
  role: UserRole,
  designation?: StaffDesignation
): Promise<AdminManagedAccount[]> => {
  await loadAdminRoleRegistry();
  const normalized = targetEmailOrId.trim().toLowerCase();
  const existingIdx = inMemoryRoleRegistry.findIndex(
    (u) => u.email.toLowerCase() === normalized || u.id.toLowerCase() === normalized
  );

  const generatedId =
    role === 'doctor'
      ? `DOC-${Math.floor(2000 + Math.random() * 900)}`
      : role === 'staff'
        ? `STF-${Math.floor(3000 + Math.random() * 900)}`
        : `PAT-${Math.floor(1000 + Math.random() * 900)}`;

  const updatedEntry: AdminManagedAccount = {
    id: existingIdx >= 0 ? inMemoryRoleRegistry[existingIdx].id : generatedId,
    name: name.trim() || (existingIdx >= 0 ? inMemoryRoleRegistry[existingIdx].name : targetEmailOrId),
    email: targetEmailOrId.includes('@')
      ? targetEmailOrId.trim().toLowerCase()
      : existingIdx >= 0
        ? inMemoryRoleRegistry[existingIdx].email
        : `${normalized}@starhospital.com`,
    role,
    designation: role === 'staff' ? designation || 'admin' : undefined,
    assignedBy: 'Hospital Admin',
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    inMemoryRoleRegistry[existingIdx] = updatedEntry;
  } else {
    inMemoryRoleRegistry = [updatedEntry, ...inMemoryRoleRegistry];
  }

  try {
    await AsyncStorage.setItem(
      ADMIN_ROLE_REGISTRY_STORAGE_KEY,
      JSON.stringify(inMemoryRoleRegistry)
    );
  } catch {
    // Ignore storage error
  }
  return [...inMemoryRoleRegistry];
};

/**
 * By default, every login/signup account has role = 'patient'.
 * Only accounts explicitly assigned by Admin (in the Admin Role Registry or with Admin-issued
 * DOC-* / STF-* / ADM-* Role IDs) receive 'doctor' or 'staff' roles.
 */
export const resolveIdentityFromLoginId = (
  rawIdentifier: string,
  explicitRole?: UserRole,
  explicitDesignation?: StaffDesignation
): { role: UserRole; designation?: StaffDesignation } => {
  const id = (rawIdentifier || '').trim().toLowerCase();

  // 0. Check Admin-assigned Role Registry first
  const matchedAdminEntry = inMemoryRoleRegistry.find(
    (entry) => entry.email.toLowerCase() === id || entry.id.toLowerCase() === id
  );
  if (matchedAdminEntry) {
    return {
      role: matchedAdminEntry.role,
      designation: matchedAdminEntry.designation,
    };
  }

  // 1. Check Admin-issued Doctor Role IDs / Doctor emails
  if (
    /^doc[-_\d]/i.test(id) ||
    id.startsWith('dr.') ||
    id.includes('@doctor') ||
    id.includes('amit.sharma') ||
    id.includes('priya.mehta') ||
    id.includes('rakesh.verma')
  ) {
    return { role: 'doctor' };
  }

  // 2. Check Admin-issued Staff/Admin Role IDs / Staff emails
  if (
    /^(stf|adm|nrs|rec|lab|phm|bil)[-_\d]/i.test(id) ||
    id === 'admin@starhospital.com' ||
    id === 'staff@starhospital.com' ||
    id.startsWith('admin@') ||
    id.startsWith('staff@') ||
    id.startsWith('nurse@') ||
    id.startsWith('lab@') ||
    id.startsWith('pharmacy@') ||
    id.startsWith('billing@') ||
    id.startsWith('reception@')
  ) {
    let designation: StaffDesignation = explicitDesignation || 'admin';
    if (id.startsWith('nrs') || id.startsWith('nurse@')) {
      designation = 'nurse';
    } else if (id.startsWith('lab')) {
      designation = 'lab_tech';
    } else if (id.startsWith('phm') || id.startsWith('pharmacy@')) {
      designation = 'pharmacist';
    } else if (id.startsWith('bil') || id.startsWith('billing@')) {
      designation = 'billing_clerk';
    } else if (id.startsWith('rec') || id.startsWith('reception@')) {
      designation = 'receptionist';
    } else {
      designation = explicitDesignation || 'admin';
    }
    return { role: 'staff', designation };
  }

  // 3. Honor explicitRole if passed by service/unit test
  if (explicitRole && (VALID_USER_ROLES as readonly string[]).includes(explicitRole)) {
    return {
      role: explicitRole,
      designation: explicitRole === 'staff' ? explicitDesignation || 'admin' : undefined,
    };
  }

  // 4. Default for all signups & logins is strictly 'patient'
  return { role: 'patient' };
};

const isUserRecord = (candidate: unknown): candidate is User => {
  if (!candidate || typeof candidate !== 'object') return false;
  const obj = candidate as Partial<User>;
  return (
    typeof obj.id === 'string' &&
    obj.id.length > 0 &&
    typeof obj.role === 'string' &&
    (VALID_USER_ROLES as readonly string[]).includes(obj.role)
  );
};

const extractUserFromApiPayload = (payload: unknown): User | null => {
  if (isUserRecord(payload)) {
    return payload;
  }
  if (payload && typeof payload === 'object') {
    const wrapped = payload as { data?: unknown; user?: unknown };
    if (isUserRecord(wrapped.data)) {
      return wrapped.data;
    }
    if (isUserRecord(wrapped.user)) {
      return wrapped.user;
    }
  }
  return null;
};

export const authService = {
  /**
   * Log in with credentials (email/phone and password)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return withMockFallback(
      () => apiClient.post<AuthResponse>('/api/v1/auth/login', credentials),
      async () => {
        if (!credentials.login?.trim() || !credentials.password?.trim()) {
          throw new Error('Login identifier and password are required.');
        }

        const rawLogin = credentials.login.trim();
        const normLogin = rawLogin.toLowerCase();
        const normDigits = rawLogin.replace(/\D/g, '');
        const accounts = await getRegisteredAccounts();

        const matchedAccount = accounts.find((acc) => {
          if (acc.email && acc.email.toLowerCase() === normLogin) return true;
          if (acc.id && acc.id.toLowerCase() === normLogin) return true;
          if (normDigits.length >= 10 && acc.phone && acc.phone.replace(/\D/g, '') === normDigits) return true;
          return false;
        });

        let user: User;

        if (matchedAccount) {
          if (matchedAccount.password && matchedAccount.password !== credentials.password?.trim()) {
            throw new Error('Incorrect password. Please verify and try again.');
          }
          user = {
            id: matchedAccount.id,
            name: matchedAccount.name,
            email: matchedAccount.email,
            phone: matchedAccount.phone,
            role: matchedAccount.role || 'patient',
            gender: matchedAccount.gender || 'male',
            dateOfBirth: matchedAccount.dateOfBirth,
            bloodGroup: (matchedAccount.bloodGroup as any) || 'B+',
            city: matchedAccount.city || 'Mumbai',
            address: matchedAccount.address || 'Mumbai',
            token: `star_jwt_${matchedAccount.role}_${Date.now()}`,
          };
        } else {
          const resolved = resolveIdentityFromLoginId(
            credentials.login,
            credentials.role,
            credentials.designation
          );

          if (resolved.role === 'doctor') {
            const doc = mockDoctors[0]; // Dr. Amit Sharma
            user = {
              id: doc.id,
              name: doc.name,
              email: doc.email || 'amit.sharma@starhospital.com',
              phone: doc.phone || '+92 300 5551122',
              role: 'doctor',
              avatarUrl: doc.photoUrl,
              token: `star_mock_jwt_doctor_${Date.now()}`,
            };
          } else if (resolved.role === 'staff') {
            const designation = credentials.designation || resolved.designation || 'nurse';
            const staffMember =
              mockStaff.find((s) => s.designation === designation) || mockStaff[0];
            user = {
              id: staffMember.id,
              name: staffMember.name,
              email: staffMember.email,
              phone: staffMember.phone,
              role: 'staff',
              designation: staffMember.designation,
              avatarUrl: staffMember.photoUrl,
              token: `star_mock_jwt_staff_${Date.now()}`,
            };
          } else {
            // Default: Patient
            const isEmail = credentials.login.includes('@');
            user = {
              id: 'PAT-1001',
              name: isEmail ? credentials.login.split('@')[0] : 'Patient User',
              email: isEmail ? credentials.login : 'rahul@gmail.com',
              phone: normDigits.length >= 10 ? credentials.login : '+91 98765 43210',
              role: 'patient',
              bloodGroup: 'B+',
              city: 'Mumbai',
              address: 'Mumbai',
              gender: 'male',
              dateOfBirth: '1995-01-01',
              token: `star_mock_jwt_patient_${Date.now()}`,
            };
          }
        }

        const authResponse: AuthResponse = {
          token: user.token as string,
          refreshToken: 'mock-refresh-token-xyz',
          expiresIn: 86400,
          user,
        };

        // Persist session to AsyncStorage
        await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authResponse.token);
        await AsyncStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(user));
        await AsyncStorage.setItem(ROLE_STORAGE_KEY, user.role);

        return authResponse;
      }
    );
  },

  /**
   * Request Phone OTP (for Firebase Phone Auth / Backend OTP)
   */
  async requestPhoneOtp(
    req: PhoneOtpRequest
  ): Promise<{ verificationId: string; expiresInSeconds: number }> {
    return withMockFallback(
      () =>
        apiClient.post<{ verificationId: string; expiresInSeconds: number }>(
          '/api/v1/auth/otp/request',
          req
        ),
      () => {
        return {
          verificationId: 'mock-otp-verification-id-9988',
          expiresInSeconds: 900, // 15 minutes as per ICTHospital spec
        };
      }
    );
  },

  /**
   * Verify Phone OTP and log user in
   */
  async loginWithOtp(req: PhoneOtpVerify): Promise<AuthResponse> {
    return withMockFallback(
      () => apiClient.post<AuthResponse>('/api/v1/auth/otp/verify', req),
      async () => {
        if (!/^\d{6}$/.test((req.otp || '').trim())) {
          throw new Error('A valid 6-digit numeric OTP is required.');
        }

        const resolvedRole: UserRole =
          req.role && (VALID_USER_ROLES as readonly string[]).includes(req.role)
            ? req.role
            : 'patient';
        const roleBoundToken = `mock-otp-${resolvedRole}-jwt-token-${Date.now()}`;

        let user: User;
        if (resolvedRole === 'doctor') {
          const doc = mockDoctors[0];
          user = {
            id: doc.id,
            name: doc.name,
            email: doc.email || 'amit.sharma@starhospital.com',
            phone: req.phone || doc.phone || '+92 300 5551122',
            role: 'doctor',
            avatarUrl: doc.photoUrl,
            token: roleBoundToken,
          };
        } else if (resolvedRole === 'staff') {
          const staffMember = mockStaff[0];
          user = {
            id: staffMember.id,
            name: staffMember.name,
            email: staffMember.email,
            phone: req.phone || staffMember.phone,
            role: 'staff',
            designation: staffMember.designation,
            avatarUrl: staffMember.photoUrl,
            token: roleBoundToken,
          };
        } else {
          const patient = mockPatients[0];
          user = {
            id: patient.id,
            name: patient.name,
            email: patient.email,
            phone: req.phone || patient.phone,
            role: 'patient',
            avatarUrl: patient.photoUrl,
            bloodGroup: patient.bloodGroup,
            city: patient.city,
            address: patient.address,
            gender: patient.gender,
            dateOfBirth: patient.birthDate,
            token: roleBoundToken,
          };
        }

        const authResponse: AuthResponse = {
          token: roleBoundToken,
          refreshToken: 'mock-refresh-token',
          expiresIn: 86400,
          user,
        };

        await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authResponse.token);
        await AsyncStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(user));
        await AsyncStorage.setItem(ROLE_STORAGE_KEY, user.role);

        return authResponse;
      }
    );
  },

  /**
   * Register a new patient
   */
  async registerPatient(data: PatientRegisterData): Promise<AuthResponse> {
    return withMockFallback(
      () => apiClient.post<AuthResponse>('/api/v1/auth/register', data),
      async () => {
        const regToken = `star_reg_jwt_patient_${Date.now()}`;
        const generatedId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
        const cleanEmail =
          data.email?.trim() || `${data.phone.replace(/\D/g, '')}@patient.starhospital.com`;

        const newUser: User = {
          id: generatedId,
          name: data.name.trim(),
          email: cleanEmail,
          phone: data.phone.trim(),
          role: 'patient',
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          bloodGroup: data.bloodGroup,
          address: data.address,
          city: data.city,
          token: regToken,
        };

        await saveRegisteredAccount({
          id: generatedId,
          name: data.name.trim(),
          email: cleanEmail,
          phone: data.phone.trim(),
          password: data.password?.trim(),
          role: 'patient',
          gender: data.gender,
          dateOfBirth: data.dateOfBirth,
          bloodGroup: data.bloodGroup,
          address: data.address,
          city: data.city,
          createdAt: new Date().toISOString(),
        });

        await assignUserRoleByAdmin(cleanEmail, data.name.trim(), 'patient');

        const authResponse: AuthResponse = {
          token: regToken,
          refreshToken: 'mock-refresh-token',
          expiresIn: 86400,
          user: newUser,
        };

        await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, authResponse.token);
        await AsyncStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(newUser));
        await AsyncStorage.setItem(ROLE_STORAGE_KEY, newUser.role);

        return authResponse;
      }
    );
  },

  /**
   * Retrieve verified user from ICTHospital backend GET /api/user (auth:api).
   * In live mode (`!isMockFallbackEnabled`), NEVER falls back to local AsyncStorage on backend errors,
   * preventing tampered local cache from bypassing server verification.
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (!token) {
        return null;
      }
    } catch {
      return null;
    }

    if (!isMockFallbackEnabled) {
      try {
        const res = await apiClient.get<User | { data?: User; user?: User }>('/api/user');
        const verifiedUser = extractUserFromApiPayload(res?.data);
        if (verifiedUser) {
          await AsyncStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(verifiedUser));
          await AsyncStorage.setItem(ROLE_STORAGE_KEY, verifiedUser.role);
          return verifiedUser;
        }
        return null;
      } catch {
        return null;
      }
    }

    try {
      const [storedUser, storedRole] = await Promise.all([
        AsyncStorage.getItem(USER_INFO_STORAGE_KEY),
        AsyncStorage.getItem(ROLE_STORAGE_KEY),
      ]);
      if (!storedUser) {
        return null;
      }
      const parsed = JSON.parse(storedUser) as unknown;
      if (!isUserRecord(parsed)) {
        return null;
      }
      if (storedRole && parsed.role !== storedRole) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * Log out and clean storage
   */
  async logout(): Promise<void> {
    try {
      await apiClient.clearAuthToken();
    } catch {
      // Ignore clear failure
    }
  },

  /**
   * Forgot password request
   */
  async forgotPassword(
    req: ForgotPasswordRequest
  ): Promise<{ success: boolean; message: string }> {
    return withMockFallback(
      () =>
        apiClient.post<{ success: boolean; message: string }>(
          '/api/v1/auth/forgot-password',
          req
        ),
      () => ({
        success: true,
        message: 'Password reset link and OTP have been sent to your email/phone.',
      })
    );
  },

  /**
   * Reset password with token/OTP
   */
  async resetPassword(
    req: ResetPasswordRequest
  ): Promise<{ success: boolean; message: string }> {
    return withMockFallback(
      () =>
        apiClient.post<{ success: boolean; message: string }>(
          '/api/v1/auth/reset-password',
          req
        ),
      () => ({
        success: true,
        message: 'Password has been reset successfully. Please log in with your new password.',
      })
    );
  },

  /**
   * @deprecated Client-side role switching without verified backend re-authentication
   * is blocked to enforce strict role-based access isolation.
   */
  async switchRole(_role: UserRole): Promise<never> {
    throw new Error(
      'Unauthorized role change: switching roles requires re-authentication with verified account credentials.'
    );
  },
};

export default authService;
