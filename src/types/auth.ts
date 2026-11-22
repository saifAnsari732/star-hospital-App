import { User, UserRole, StaffDesignation } from './user';

export interface LoginCredentials {
  login: string; // Role ID (PAT-1001, DOC-2001, STF-3001) or Email
  password?: string;
  role?: UserRole;
  designation?: StaffDesignation;
  rememberMe?: boolean;
}

export interface PhoneOtpRequest {
  phone: string;
  role?: UserRole;
}

export interface PhoneOtpVerify {
  phone: string;
  otp: string;
  verificationId?: string;
  role: UserRole;
}

export interface PatientRegisterData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string; // YYYY-MM-DD
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: string;
  city: string;
  cnic?: string;
  guardianName?: string;
  guardianRelation?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  user: User;
}

export interface ForgotPasswordRequest {
  emailOrPhone: string;
}

export interface ResetPasswordRequest {
  tokenOrOtp: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
