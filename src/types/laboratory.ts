export type LabReportType = 'lab' | 'radiology';

export interface LabTestResultParameter {
  parameter: string; // e.g. "Hemoglobin", "WBC Count", "Platelets"
  value: string; // e.g. "14.2", "7,500"
  unit: string; // e.g. "g/dL", "/mcL"
  referenceRange: string; // e.g. "13.5 - 17.5", "4,500 - 11,000"
  isAbnormal: boolean;
  flag?: 'Normal' | 'High' | 'Low' | 'Critical';
}

export interface DiagnosticReportItem {
  id: string;
  reportNumber: string; // e.g. "REP-8821"
  type: LabReportType;
  testName: string; // e.g. "Complete Blood Count (CBC)", "Chest X-Ray PA View"
  category: string; // e.g. "Hematology", "Radiology", "Biochemistry"
  date: string;
  patientId: string;
  patientName: string;
  patientMrn?: string;
  doctorId: string;
  doctorName: string;
  technicianName?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  resultSummary?: string;
  results?: LabTestResultParameter[];
  downloadUrl?: string;
  fileUrl?: string;
  fileSize?: string;
}

export interface LabTest {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  turnaroundHours: number;
  description?: string;
  preparationInstructions?: string;
}

export interface RadiologyOrder {
  id: string;
  patientId: string;
  doctorId: string;
  examType: string;
  modality: 'X-Ray' | 'CT' | 'MRI' | 'Ultrasound';
  urgency: 'routine' | 'urgent' | 'emergency';
  notes?: string;
  status: 'ordered' | 'in_progress' | 'completed' | 'reported';
  createdAt: string;
}

export interface SaveLabResultRequest {
  reportId: string;
  testId?: string;
  results: LabTestResultParameter[];
  resultSummary?: string;
  technicianNotes?: string;
  markCompleted?: boolean;
}
