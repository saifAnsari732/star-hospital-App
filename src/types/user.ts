export type UserRole = 'patient' | 'doctor' | 'staff';

export type StaffDesignation =
  | 'nurse'
  | 'receptionist'
  | 'pharmacist'
  | 'laboratorist'
  | 'billing'
  | 'lab_tech'
  | 'billing_clerk'
  | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  designation?: StaffDesignation;
  avatarUrl?: string;
  token?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  address?: string;
  city?: string;
  bloodGroup?: string;
  createdAt?: string;
  updatedAt?: string;
}
