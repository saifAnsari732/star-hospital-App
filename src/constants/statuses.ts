import { AppointmentStatus } from '../types/appointment';
import { BedStatus } from '../types/bed';
import { InvoiceStatus } from '../types/billing';
import { NotificationCategory } from '../types/notification';
import { OPDTokenStatusType } from '../types/opdToken';

export const APPOINTMENT_STATUSES: Record<string, AppointmentStatus> = {
  SCHEDULED: 'scheduled',
  ARRIVED: 'arrived',
  IN_CONSULTATION: 'in consultation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no show',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'Scheduled',
  arrived: 'Arrived / Checked In',
  'in consultation': 'In Consultation',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'no show': 'No Show',
};

export const OPD_TOKEN_STATUSES: Record<string, OPDTokenStatusType> = {
  SCHEDULED: 'scheduled',
  ARRIVED: 'arrived',
  IN_CONSULTATION: 'in_consultation',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const OPD_TOKEN_STATUS_LABELS: Record<OPDTokenStatusType, string> = {
  scheduled: 'Token Issued',
  arrived: 'Waiting in OPD',
  in_consultation: 'In Consultation',
  completed: 'Consultation Completed',
  cancelled: 'Cancelled',
};

export const INVOICE_STATUSES: Record<string, InvoiceStatus> = {
  PAID: 'paid',
  PARTIAL: 'partial',
  UNPAID: 'unpaid',
};

export const BED_STATUSES: Record<string, BedStatus> = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
  RESERVED: 'reserved',
};

export const NOTIFICATION_CATEGORIES: Record<string, NotificationCategory> = {
  OPD_TOKEN: 'opd_token',
  APPOINTMENT: 'appointment',
  PRESCRIPTION: 'prescription',
  LAB_REPORT: 'lab_report',
  BILLING: 'billing',
  GENERAL: 'general',
};

export const LAB_REPORT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
} as const;

export const PRESCRIPTION_DISPENSE_STATUSES = {
  PENDING: 'pending',
  PARTIALLY_DISPENSED: 'partially_dispensed',
  DISPENSED: 'dispensed',
} as const;
