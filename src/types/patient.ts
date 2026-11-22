export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number e.g. "P-00102"
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  gender: 'male' | 'female' | 'other';
  birthDate: string; // YYYY-MM-DD
  age: string;
  bloodGroup: BloodGroup;
  address: string;
  city: string;
  cnic?: string;
  fatherName?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianMrn?: string;
  photoUrl?: string;
  registeredAt: string;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
}

export type PatientProfile = Patient;

export interface MedicalHistoryItem {
  id: string;
  patientId: string;
  title: string;
  description: string;
  category: 'allergy' | 'condition' | 'surgery' | 'general' | 'immunization';
  date: string;
  doctorName?: string;
  attachmentUrl?: string;
}

export interface AllergyItem {
  id: string;
  patientId: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  diagnosedDate?: string;
}

export interface HealthRecordItem {
  id: string;
  patientId: string;
  title: string;
  recordType: 'consultation' | 'discharge_summary' | 'vaccination' | 'referral';
  doctorName: string;
  department: string;
  date: string;
  summary: string;
  fileUrl?: string;
}

export interface PatientAdmission {
  id: string;
  patientId: string;
  patientName: string;
  mrn: string;
  bedId: string;
  bedNumber: string;
  wardCategory: string;
  doctorId: string;
  doctorName: string;
  admittedAt: string;
  dischargedAt?: string;
  status: 'admitted' | 'discharged';
  diagnosis?: string;
  notes?: string;
}
