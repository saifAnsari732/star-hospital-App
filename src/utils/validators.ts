import { BLOOD_GROUPS } from '../constants/hospital';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const normalizePhoneDigits = (phone: string): string => {
  return (phone || '').replace(/\D/g, '');
};

export const formatE164Phone = (phone: string, defaultCountryCode = '+91'): string => {
  const trimmed = (phone || '').trim();
  if (trimmed.startsWith('+')) {
    return `+${normalizePhoneDigits(trimmed)}`;
  }
  const digits = normalizePhoneDigits(trimmed);
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits.length > 10 ? `+${digits}` : trimmed;
};

export const validatePhone = (phone: string): ValidationResult => {
  const digits = normalizePhoneDigits(phone);
  if (!digits) {
    return { valid: false, error: 'Mobile number is required.' };
  }
  if (digits.length < 10 || digits.length > 15) {
    return { valid: false, error: 'Please enter a valid 10 to 15 digit mobile number.' };
  }
  return { valid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return { valid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  return { valid: true };
};

export const validateOtpCode = (otp: string, expectedLength = 6): ValidationResult => {
  const cleaned = (otp || '').trim();
  if (!cleaned) {
    return { valid: false, error: 'Verification code is required.' };
  }
  if (!new RegExp(`^\\d{${expectedLength}}$`).test(cleaned)) {
    return { valid: false, error: `Please enter a valid ${expectedLength}-digit OTP code.` };
  }
  return { valid: true };
};

export const validatePassword = (password: string, minLength = 6): ValidationResult => {
  if (!password || password.trim().length === 0) {
    return { valid: false, error: 'Password is required.' };
  }
  if (password.length < minLength) {
    return { valid: false, error: `Password must be at least ${minLength} characters.` };
  }
  return { valid: true };
};

export const validateBloodGroup = (bloodGroup: string): ValidationResult => {
  if (!bloodGroup) {
    return { valid: false, error: 'Blood group is required.' };
  }
  const normalized = bloodGroup.trim().toUpperCase();
  if (!(BLOOD_GROUPS as readonly string[]).includes(normalized)) {
    return { valid: false, error: 'Select a valid blood group (e.g. A+, O-, AB+).' };
  }
  return { valid: true };
};

export interface VitalsInput {
  systolicBp?: number;
  diastolicBp?: number;
  pulse?: number;
  temperatureF?: number;
  spo2?: number;
  weightKg?: number;
}

export const validateVitals = (vitals: VitalsInput): ValidationResult => {
  if (vitals.systolicBp !== undefined && (vitals.systolicBp < 50 || vitals.systolicBp > 260)) {
    return { valid: false, error: 'Systolic BP must be between 50 and 260 mmHg.' };
  }
  if (vitals.diastolicBp !== undefined && (vitals.diastolicBp < 30 || vitals.diastolicBp > 160)) {
    return { valid: false, error: 'Diastolic BP must be between 30 and 160 mmHg.' };
  }
  if (
    vitals.systolicBp !== undefined &&
    vitals.diastolicBp !== undefined &&
    vitals.systolicBp <= vitals.diastolicBp
  ) {
    return { valid: false, error: 'Systolic BP must be higher than diastolic BP.' };
  }
  if (vitals.pulse !== undefined && (vitals.pulse < 30 || vitals.pulse > 220)) {
    return { valid: false, error: 'Pulse rate must be between 30 and 220 bpm.' };
  }
  if (vitals.temperatureF !== undefined && (vitals.temperatureF < 92 || vitals.temperatureF > 110)) {
    return { valid: false, error: 'Temperature must be between 92°F and 110°F.' };
  }
  if (vitals.spo2 !== undefined && (vitals.spo2 < 50 || vitals.spo2 > 100)) {
    return { valid: false, error: 'SpO2 saturation must be between 50% and 100%.' };
  }
  if (vitals.weightKg !== undefined && (vitals.weightKg <= 0 || vitals.weightKg > 350)) {
    return { valid: false, error: 'Weight must be between 0.5 and 350 kg.' };
  }
  return { valid: true };
};
