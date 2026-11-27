export type AppointmentStatus =
  | 'scheduled'
  | 'arrived'
  | 'in consultation'
  | 'completed'
  | 'cancelled'
  | 'no show';

export type AppointmentMode = 'in_person' | 'video';

export interface AppointmentVitals {
  bloodPressure?: string; // e.g. "120/80 mmHg"
  pulse?: string; // e.g. "72 bpm"
  temperature?: string; // e.g. "98.6 °F"
  weight?: string; // e.g. "70 kg"
  oxygenSaturation?: string; // e.g. "98%"
  respiratoryRate?: string; // e.g. "16 /min"
  recordedBy?: string;
  recordedAt?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  doctorDepartment: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:30 AM" or "09:00 - 09:15"
  startTime: string; // ISO string or time string
  endTime: string;
  status: AppointmentStatus;
  mode: AppointmentMode;
  videoRoomUrl?: string;
  remarks?: string;
  tokenNo?: number;
  vitals?: AppointmentVitals;
  consultationFee?: number;
  paymentStatus?: 'pending' | 'paid' | 'waived';
  createdAt?: string;
}

export type AppointmentItem = Appointment;

export interface BookAppointmentRequest {
  patientId: string;
  patientName?: string;
  patientMrn?: string;
  patientPhone?: string;
  doctorId: string;
  doctorName?: string;
  doctorDepartment?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "10:30" or "10:30 AM"
  timeSlot?: string;
  durationMinutes?: number;
  mode: AppointmentMode;
  remarks?: string;
  paymentStatus?: 'pending' | 'paid' | 'waived';
  paymentId?: string;
  transactionId?: string;
}

export interface RescheduleAppointmentRequest {
  appointmentId: string;
  newDate: string;
  newTimeSlot: string;
  reason?: string;
}

export interface UpdateVitalsRequest {
  appointmentId: string;
  vitals: AppointmentVitals;
}
