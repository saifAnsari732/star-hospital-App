import type { StaffDesignation } from '../../types/user';

export type CanonicalStaffDesignation =
  | 'nurse'
  | 'receptionist'
  | 'laboratorist'
  | 'pharmacist'
  | 'billing'
  | 'admin';

export type StaffPermission =
  | 'patients:view'
  | 'patients:search'
  | 'patients:register'
  | 'appointments:view'
  | 'appointments:book'
  | 'appointments:checkin'
  | 'appointments:checkout'
  | 'opd:token_generate'
  | 'queue:view'
  | 'queue:manage'
  | 'vitals:record'
  | 'vitals:view'
  | 'beds:view'
  | 'beds:admit'
  | 'beds:discharge'
  | 'lab:worklist'
  | 'lab:details'
  | 'lab:results_enter'
  | 'lab:reports_upload'
  | 'lab:reports_release'
  | 'pharmacy:dashboard'
  | 'pharmacy:worklist'
  | 'pharmacy:inventory'
  | 'pharmacy:dispense'
  | 'prescriptions:view'
  | 'billing:dashboard'
  | 'billing:invoices_list'
  | 'billing:invoice_create'
  | 'billing:payments_record'
  | 'billing:payment_history'
  | 'billing:receipts'
  | 'payments:transactions'
  | 'payments:refund'
  | 'tasks:view'
  | 'notifications:view'
  | 'settings:view';

export type StaffDashboardKpiKey =
  | 'total_patients'
  | 'today_opd'
  | 'today_appointments'
  | 'pending_patients'
  | 'pending_lab_requests'
  | 'billing_summary'
  | 'bed_availability'
  | 'pending_prescriptions';

const COMMON_PERMISSIONS: StaffPermission[] = [
  'patients:view',
  'tasks:view',
  'notifications:view',
  'settings:view',
];

export const STAFF_DESIGNATION_PERMISSIONS: Record<
  CanonicalStaffDesignation,
  StaffPermission[]
> = {
  nurse: [
    ...COMMON_PERMISSIONS,
    'patients:search',
    'vitals:record',
    'vitals:view',
    'beds:view',
    'queue:view',
  ],
  receptionist: [
    ...COMMON_PERMISSIONS,
    'patients:search',
    'patients:register',
    'appointments:view',
    'appointments:book',
    'appointments:checkin',
    'appointments:checkout',
    'opd:token_generate',
    'queue:view',
    'queue:manage',
  ],
  laboratorist: [
    ...COMMON_PERMISSIONS,
    'patients:search',
    'lab:worklist',
    'lab:details',
    'lab:results_enter',
    'lab:reports_upload',
    'lab:reports_release',
  ],
  pharmacist: [
    ...COMMON_PERMISSIONS,
    'patients:search',
    'pharmacy:dashboard',
    'pharmacy:worklist',
    'pharmacy:inventory',
    'pharmacy:dispense',
    'prescriptions:view',
  ],
  billing: [
    ...COMMON_PERMISSIONS,
    'patients:search',
    'billing:dashboard',
    'billing:invoices_list',
    'billing:invoice_create',
    'billing:payments_record',
    'billing:payment_history',
    'billing:receipts',
    'payments:transactions',
    'payments:refund',
  ],
  admin: [
    ...COMMON_PERMISSIONS,
    'patients:search',
    'patients:register',
    'appointments:view',
    'appointments:book',
    'appointments:checkin',
    'appointments:checkout',
    'opd:token_generate',
    'queue:view',
    'queue:manage',
    'vitals:record',
    'vitals:view',
    'beds:view',
    'beds:admit',
    'beds:discharge',
    'lab:worklist',
    'lab:details',
    'lab:results_enter',
    'lab:reports_upload',
    'lab:reports_release',
    'pharmacy:dashboard',
    'pharmacy:worklist',
    'pharmacy:inventory',
    'pharmacy:dispense',
    'prescriptions:view',
    'billing:dashboard',
    'billing:invoices_list',
    'billing:invoice_create',
    'billing:payments_record',
    'billing:payment_history',
    'billing:receipts',
    'payments:transactions',
    'payments:refund',
  ],
};

export function normalizeStaffDesignation(
  designation?: StaffDesignation | string | null
): CanonicalStaffDesignation | null {
  if (!designation) return null;
  const raw = String(designation).toLowerCase().trim();
  if (raw === 'lab_tech' || raw === 'laboratorist') return 'laboratorist';
  if (raw === 'billing_clerk' || raw === 'billing') return 'billing';
  if (
    raw === 'nurse' ||
    raw === 'receptionist' ||
    raw === 'pharmacist' ||
    raw === 'admin'
  ) {
    return raw;
  }
  return null;
}

export function getPermissionsForDesignation(
  designation?: StaffDesignation | string | null
): StaffPermission[] {
  const canonical = normalizeStaffDesignation(designation);
  if (!canonical) return [];
  return STAFF_DESIGNATION_PERMISSIONS[canonical];
}

export function hasStaffPermission(
  designation: StaffDesignation | string | null | undefined,
  permission: StaffPermission
): boolean {
  return getPermissionsForDesignation(designation).includes(permission);
}

export function getDesignationLabel(
  designation?: StaffDesignation | string | null
): string {
  const canonical = normalizeStaffDesignation(designation);
  switch (canonical) {
    case 'nurse':
      return 'Nursing Officer';
    case 'receptionist':
      return 'Front Desk Receptionist';
    case 'laboratorist':
      return 'Laboratory Technologist';
    case 'pharmacist':
      return 'Hospital Pharmacist';
    case 'billing':
      return 'Billing & Accounts Clerk';
    case 'admin':
      return 'Hospital Administrator';
    default:
      return 'Hospital Staff';
  }
}

export const STAFF_ROUTE_PERMISSIONS: Record<string, StaffPermission> = {
  StaffDashboardTab: 'tasks:view',
  StaffPatientsTab: 'patients:view',
  StaffAppointmentsTab: 'tasks:view',
  StaffMoreTab: 'settings:view',
  StaffPatientReg: 'patients:register',
  StaffPatientSearch: 'patients:view',
  StaffPatientDetails: 'patients:view',
  StaffAppointmentManage: 'appointments:view',
  StaffBookAppointment: 'appointments:book',
  TokenGeneration: 'opd:token_generate',
  StaffOPDQueue: 'queue:view',
  NurseVitals: 'vitals:record',
  LabEntry: 'lab:worklist',
  StaffLabTestDetail: 'lab:details',
  PharmacyDispense: 'pharmacy:worklist',
  BillingInvoice: 'billing:invoices_list',
  StaffPaymentHistory: 'billing:payment_history',
  StaffPaymentTransactions: 'payments:transactions',
  AdmissionBed: 'beds:view',
  StaffDischarge: 'beds:discharge',
  StaffNotifications: 'notifications:view',
  StaffSettings: 'settings:view',
  StaffProfile: 'settings:view',
};

export function canAccessStaffRoute(
  designation: StaffDesignation | string | null | undefined,
  routeName: string
): boolean {
  const reqPermission = STAFF_ROUTE_PERMISSIONS[routeName];
  if (!reqPermission) return false;
  return hasStaffPermission(designation, reqPermission);
}

export function canViewBillingSummary(
  designation?: StaffDesignation | string | null
): boolean {
  const canonical = normalizeStaffDesignation(designation);
  return canonical === 'billing' || canonical === 'admin';
}

export function getDashboardKpisForDesignation(
  designation?: StaffDesignation | string | null
): StaffDashboardKpiKey[] {
  const canonical = normalizeStaffDesignation(designation);
  switch (canonical) {
    case 'admin':
      return [
        'total_patients',
        'today_opd',
        'today_appointments',
        'pending_patients',
        'pending_lab_requests',
        'billing_summary',
      ];
    case 'receptionist':
      return [
        'total_patients',
        'today_opd',
        'today_appointments',
        'pending_patients',
      ];
    case 'nurse':
      return [
        'today_opd',
        'pending_patients',
        'bed_availability',
        'total_patients',
      ];
    case 'laboratorist':
      return ['pending_lab_requests', 'today_opd', 'total_patients'];
    case 'pharmacist':
      return ['pending_prescriptions', 'today_opd', 'total_patients'];
    case 'billing':
      return ['billing_summary', 'today_opd', 'total_patients'];
    default:
      return [];
  }
}

export function getHumanReadablePermissions(
  designation?: StaffDesignation | string | null
): string[] {
  const canonical = normalizeStaffDesignation(designation);
  switch (canonical) {
    case 'nurse':
      return [
        'Patient Vitals Recording & Triage',
        'Live OPD Queue Monitoring (View Only)',
        'Ward & Bed Availability Overview',
        'Nursing Shift Task Management',
      ];
    case 'receptionist':
      return [
        'New Patient Registration & MRN Issuance',
        'Patient Directory Search & Profile View',
        'Appointment Booking, Reschedule & Cancellation',
        'OPD Token Generation, Check-in & Check-out',
      ];
    case 'laboratorist':
      return [
        'Diagnostic Lab & Radiology Worklist',
        'Lab Test Specimen & Parameter Details',
        'Clinical Lab Result Entry & Validation',
        'Diagnostic Report PDF Upload & Release',
      ];
    case 'pharmacist':
      return [
        'Pharmacy Dashboard & Stock Alerts',
        'Issued Prescription Worklist Queue',
        'Medicine Dispensing & Stock Deduction',
        'Pharmacy Inventory & Expiry Audit',
      ];
    case 'billing':
      return [
        'Hospital Billing & Revenue Dashboard',
        'Itemized OPD / IPD Invoice Generation',
        'Cash, Card, Online & Insurance Payment Collection',
        'Payment History Ledger & Receipt Issuance',
      ];
    case 'admin':
      return [
        'Full Hospital Operational & Billing Oversight',
        'Front Desk Registration, Appointments & OPD Queue',
        'Nursing Vitals, Ward Admission & Discharge Management',
        'Laboratory Reporting & Pharmacy Dispensing Access',
      ];
    default:
      return ['Standard Hospital Staff Account'];
  }
}
