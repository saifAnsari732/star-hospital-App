export type DoctorSpecialty =
  | 'General Physician'
  | 'Cardiologist'
  | 'Orthopedic'
  | 'Pediatrician'
  | 'Neurologist'
  | 'Dermatologist'
  | 'Gynecologist'
  | 'ENT Specialist'
  | 'Ophthalmologist'
  | 'Radiologist'
  | 'General'
  | 'Specialist'
  | 'Other';

export interface Doctor {
  id: string;
  name: string;
  department: string; // specialty e.g. "General Physician", "Cardiologist", "Orthopedic"
  qualification: string; // e.g. "MBBS, MD - General Medicine"
  experienceYears: number;
  consultationFee: number;
  rating: number; // e.g. 4.8
  reviewCount: number; // e.g. 1250
  photoUrl?: string;
  phone?: string;
  email?: string;
  isAvailableToday: boolean;
  bio?: string;
  roomNo?: string;
  workingHours?: string;
  languages?: string[];
}

export type DoctorSummary = Doctor;

export interface DoctorScheduleSlot {
  dayOfWeek: number; // 0 Sunday .. 6 Saturday
  dayName: string; // 'Monday', 'Tuesday', etc.
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDurationMinutes: number;
  isActive: boolean;
}

export interface DoctorFreeSlotsResponse {
  doctorId: string;
  date: string;
  availableSlots: string[]; // ["09:00", "09:15", "09:30", "10:00", ...]
}

export interface DoctorReview {
  id: string;
  doctorId: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}
