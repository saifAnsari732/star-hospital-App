export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'reserved';

export type BedCategory =
  | 'General'
  | 'ICU'
  | 'CCU'
  | 'Semi-Private'
  | 'Private'
  | 'Emergency';

export interface HospitalBed {
  id: string;
  bedNumber: string; // e.g. "B-101"
  roomNumber: string; // e.g. "Room 101"
  wardName: string; // e.g. "Medical Ward A"
  category: BedCategory;
  floor: string; // e.g. "1st Floor"
  dailyRate: number;
  status: BedStatus;
  currentPatient?: {
    patientId: string;
    patientName: string;
    mrn: string;
    admittedAt: string;
    doctorName: string;
  };
  features?: string[]; // e.g. ["Oxygen", "Monitor", "Adjustable"]
}

export interface WardSummary {
  wardName: string;
  category: BedCategory;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
}

export interface BedAdmissionRequest {
  patientId: string;
  bedId: string;
  doctorId: string;
  diagnosis: string;
  notes?: string;
}

export interface BedDischargeRequest {
  bedId: string;
  patientId: string;
  dischargeNotes?: string;
}
