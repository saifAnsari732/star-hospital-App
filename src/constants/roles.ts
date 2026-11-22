import { StaffDesignation, UserRole } from '../types/user';

export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  STAFF: 'staff',
} as const satisfies Record<string, UserRole>;

export const ALL_USER_ROLES: readonly UserRole[] = [
  USER_ROLES.PATIENT,
  USER_ROLES.DOCTOR,
  USER_ROLES.STAFF,
];

export const STAFF_DESIGNATIONS = {
  NURSE: 'nurse',
  RECEPTIONIST: 'receptionist',
  PHARMACIST: 'pharmacist',
  LABORATORIST: 'laboratorist',
  BILLING: 'billing',
  LAB_TECH: 'lab_tech',
  BILLING_CLERK: 'billing_clerk',
  ADMIN: 'admin',
} as const satisfies Record<string, StaffDesignation>;

export const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  staff: 'Hospital Staff',
};

export const STAFF_DESIGNATION_LABELS: Record<StaffDesignation, string> = {
  nurse: 'Nurse',
  receptionist: 'Front-Desk Receptionist',
  pharmacist: 'Pharmacist',
  laboratorist: 'Lab Technician',
  lab_tech: 'Lab Technician',
  billing: 'Billing Desk',
  billing_clerk: 'Billing Clerk',
  admin: 'Hospital Admin',
};

export type StaffModulePermission =
  | 'tokens'
  | 'vitals'
  | 'lab_entry'
  | 'pharmacy_dispense'
  | 'billing_invoice'
  | 'bed_management';

export const STAFF_PERMISSIONS_BY_DESIGNATION: Record<
  StaffDesignation,
  readonly StaffModulePermission[]
> = {
  nurse: ['vitals', 'bed_management', 'tokens'],
  receptionist: ['tokens'],
  pharmacist: ['pharmacy_dispense'],
  laboratorist: ['lab_entry'],
  lab_tech: ['lab_entry'],
  billing: ['billing_invoice'],
  billing_clerk: ['billing_invoice'],
  admin: [
    'tokens',
    'vitals',
    'lab_entry',
    'pharmacy_dispense',
    'billing_invoice',
    'bed_management',
  ],
};

export const hasStaffPermission = (
  designation: StaffDesignation | undefined,
  permission: StaffModulePermission
): boolean => {
  if (!designation) return false;
  return STAFF_PERMISSIONS_BY_DESIGNATION[designation]?.includes(permission) ?? false;
};
