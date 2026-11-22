export type { ChangePasswordRequest } from './auth';

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  photoUrl?: string;
  photoBase64?: string;
  languagePreference?: 'en' | 'ur';
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
}
