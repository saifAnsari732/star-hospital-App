import apiClient, { withMockFallback } from './apiClient';
import {
  HospitalBed,
  WardSummary,
  BedAdmissionRequest,
  BedDischargeRequest,
} from '../types/bed';
import { mockBeds, mockWardSummaries } from '../fixtures/mockBeds';
import { mockPatients } from '../fixtures/mockPatients';
import { mockDoctors } from '../fixtures/mockDoctors';

export const bedService = {
  /**
   * Get all hospital beds, optionally filtered by category or status
   */
  async getBeds(
    wardCategory?: string,
    status?: string
  ): Promise<HospitalBed[]> {
    return withMockFallback(
      () =>
        apiClient.get<HospitalBed[]>('/api/v1/beds', {
          params: { wardCategory, status },
        } as any),
      () => {
        let results = [...mockBeds];
        if (wardCategory && wardCategory !== 'All') {
          results = results.filter((b) => b.category === wardCategory);
        }
        if (status) {
          results = results.filter((b) => b.status === status);
        }
        return results;
      }
    );
  },

  /**
   * Get ward summary with bed occupancy rates
   */
  async getWardSummaries(): Promise<WardSummary[]> {
    return withMockFallback(
      () => apiClient.get<WardSummary[]>('/api/v1/beds/wards'),
      () => mockWardSummaries
    );
  },

  /**
   * Admit a patient into a bed
   */
  async admitPatient(req: BedAdmissionRequest): Promise<HospitalBed> {
    return withMockFallback(
      () =>
        apiClient.post<HospitalBed>('/api/v1/beds/admit', req),
      () => {
        const bed = mockBeds.find((b) => b.id === req.bedId) || mockBeds[0];
        const pat =
          mockPatients.find((p) => p.id === req.patientId) || mockPatients[0];
        const doc =
          mockDoctors.find((d) => d.id === req.doctorId) || mockDoctors[0];

        bed.status = 'occupied';
        bed.currentPatient = {
          patientId: pat.id,
          patientName: pat.name,
          mrn: pat.mrn,
          admittedAt: new Date().toISOString(),
          doctorName: doc.name,
        };

        return { ...bed };
      }
    );
  },

  /**
   * Discharge a patient from a bed
   */
  async dischargePatient(req: BedDischargeRequest): Promise<HospitalBed> {
    return withMockFallback(
      () =>
        apiClient.post<HospitalBed>('/api/v1/beds/discharge', req),
      () => {
        const bed = mockBeds.find((b) => b.id === req.bedId) || mockBeds[0];
        bed.status = 'available';
        bed.currentPatient = undefined;
        return { ...bed };
      }
    );
  },
};

export default bedService;
