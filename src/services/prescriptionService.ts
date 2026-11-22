import apiClient, { withMockFallback } from './apiClient';
import {
  Prescription,
  CreatePrescriptionRequest,
} from '../types/prescription';
import { MedicineStockItem } from '../types/pharmacy';
import { mockPrescriptions } from '../fixtures/mockPrescriptions';
import { mockMedicines } from '../fixtures/mockMedicines';
import { mockDoctors } from '../fixtures/mockDoctors';
import { mockPatients } from '../fixtures/mockPatients';

export const prescriptionService = {
  /**
   * Get list of prescriptions for a patient or all prescriptions
   */
  async getPrescriptions(patientId?: string): Promise<Prescription[]> {
    return withMockFallback(
      () =>
        apiClient.get<Prescription[]>('/api/v1/prescriptions', {
          params: { patientId },
        } as any),
      () => {
        if (!patientId) return mockPrescriptions;
        return mockPrescriptions.filter((p) => p.patientId === patientId);
      }
    );
  },

  /**
   * Get single prescription document (detailed Rx view) by ID
   */
  async getPrescriptionById(id: string): Promise<Prescription> {
    return withMockFallback(
      () => apiClient.get<Prescription>(`/api/v1/prescriptions/${id}`),
      () => {
        const found = mockPrescriptions.find(
          (p) => p.id === id || p.prescriptionNumber === id
        );
        return found || mockPrescriptions[0];
      }
    );
  },

  /**
   * Create a new structured prescription (from Doctor Prescription Builder)
   */
  async createPrescription(
    req: CreatePrescriptionRequest
  ): Promise<Prescription> {
    return withMockFallback(
      () =>
        apiClient.post<Prescription>('/api/v1/prescriptions', req),
      () => {
        const doc =
          mockDoctors.find((d) => d.id === req.doctorId) || mockDoctors[0];
        const pat =
          mockPatients.find((p) => p.id === req.patientId) || mockPatients[0];

        const nextNum = mockPrescriptions.length + 50;
        const newRx: Prescription = {
          id: `rx-${Date.now()}`,
          prescriptionNumber: `RX-2026-00${nextNum}`,
          date: req.date || new Date().toISOString().split('T')[0],
          patientId: pat.id,
          patientName: pat.name,
          patientAge: pat.age,
          patientGender: pat.gender === 'male' ? 'Male' : 'Female',
          patientMrn: pat.mrn,
          doctorId: doc.id,
          doctorName: doc.name,
          doctorDepartment: doc.department,
          doctorQualification: doc.qualification,
          diagnosis: req.diagnosis,
          symptoms: req.symptoms,
          advice: req.advice,
          notes: req.notes,
          validity: req.validity || '30 days',
          status: 'issued',
          items: req.items,
          qrCode: `STAR-RX-2026-00${nextNum}-${pat.mrn}-VERIFIED`,
        };

        mockPrescriptions.unshift(newRx);
        return newRx;
      }
    );
  },

  /**
   * Search hospital medicine formulary for Prescription Builder auto-complete
   */
  async searchMedicines(query: string): Promise<MedicineStockItem[]> {
    return withMockFallback(
      () =>
        apiClient.get<MedicineStockItem[]>('/api/v1/medicines/search', {
          params: { q: query },
        } as any),
      () => {
        if (!query || query.trim().length === 0) {
          return mockMedicines.slice(0, 8);
        }
        const q = query.toLowerCase();
        return mockMedicines.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.genericName.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        );
      }
    );
  },
};

export default prescriptionService;
