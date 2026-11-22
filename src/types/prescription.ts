export interface PrescriptionMedicineItem {
  id?: string;
  medicineId?: string;
  medicineName: string;
  genericName?: string;
  dosage: string; // e.g. "500mg" or "1 tablet"
  frequency: string; // e.g. "Twice a day (1-0-1)"
  duration: string; // e.g. "5 days"
  instructions: string; // e.g. "After meals"
}

export interface Prescription {
  id: string;
  prescriptionNumber: string; // e.g. "RX-2026-0042"
  date: string;
  patientId: string;
  patientName: string;
  patientAge: string;
  patientGender: string;
  patientMrn?: string;
  doctorId: string;
  doctorName: string;
  doctorDepartment: string;
  doctorQualification?: string;
  diagnosis?: string;
  symptoms?: string;
  advice?: string;
  notes?: string;
  validity?: string;
  status: 'issued' | 'dispensed' | 'cancelled';
  items: PrescriptionMedicineItem[];
  qrCode?: string;
}

export type PrescriptionDetail = Prescription;

export interface CreatePrescriptionRequest {
  patientId: string;
  doctorId: string;
  date: string;
  symptoms?: string;
  diagnosis?: string;
  advice?: string;
  notes?: string;
  validity?: string;
  items: PrescriptionMedicineItem[];
}
