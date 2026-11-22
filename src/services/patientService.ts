import apiClient, { withMockFallback } from './apiClient';
import {
  Patient,
  PatientProfile,
  MedicalHistoryItem,
  AllergyItem,
  HealthRecordItem,
  PatientAdmission,
} from '../types/patient';
import {
  mockPatients,
  mockMedicalHistory,
  mockAllergies,
  mockHealthRecords,
  mockAdmissions,
} from '../fixtures/mockPatients';

export const patientService = {
  /**
   * Get patient profile by ID or current logged in patient
   */
  async getProfile(patientId: string = 'pat-1'): Promise<PatientProfile> {
    return withMockFallback(
      () => apiClient.get<PatientProfile>(`/api/v1/patients/${patientId}`),
      () => {
        const found = mockPatients.find((p) => p.id === patientId);
        return found || mockPatients[0];
      }
    );
  },

  /**
   * Get list of all registered patients (for Doctor & Staff lookups)
   */
  async getAllPatients(search?: string): Promise<Patient[]> {
    return withMockFallback(
      () =>
        apiClient.get<Patient[]>('/api/v1/patients', {
          params: { search },
        } as any),
      () => {
        if (!search) return mockPatients;
        const q = search.toLowerCase();
        return mockPatients.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.mrn.toLowerCase().includes(q) ||
            p.phone.includes(q)
        );
      }
    );
  },

  /**
   * Get patient medical history items
   */
  async getMedicalHistory(patientId: string = 'pat-1'): Promise<MedicalHistoryItem[]> {
    return withMockFallback(
      () =>
        apiClient.get<MedicalHistoryItem[]>(
          `/api/v1/patients/${patientId}/history`
        ),
      () => {
        return mockMedicalHistory.filter((mh) => mh.patientId === patientId);
      }
    );
  },

  /**
   * Get patient allergy list
   */
  async getAllergies(patientId: string = 'pat-1'): Promise<AllergyItem[]> {
    return withMockFallback(
      () =>
        apiClient.get<AllergyItem[]>(`/api/v1/patients/${patientId}/allergies`),
      () => {
        return mockAllergies.filter((a) => a.patientId === patientId);
      }
    );
  },

  /**
   * Get health records & summaries
   */
  async getHealthRecords(
    patientId: string = 'pat-1'
  ): Promise<HealthRecordItem[]> {
    return withMockFallback(
      () =>
        apiClient.get<HealthRecordItem[]>(
          `/api/v1/patients/${patientId}/records`
        ),
      () => {
        return mockHealthRecords.filter((hr) => hr.patientId === patientId);
      }
    );
  },

  /**
   * Get patient hospital admission history
   */
  async getAdmissions(patientId: string = 'pat-1'): Promise<PatientAdmission[]> {
    return withMockFallback(
      () =>
        apiClient.get<PatientAdmission[]>(
          `/api/v1/patients/${patientId}/admissions`
        ),
      () => {
        return mockAdmissions.filter((adm) => adm.patientId === patientId);
      }
    );
  },

  /**
   * Update patient profile information
   */
  async updateProfile(
    patientId: string,
    updates: Partial<Patient>
  ): Promise<Patient> {
    return withMockFallback(
      () =>
        apiClient.put<Patient>(`/api/v1/patients/${patientId}`, updates),
      () => {
        const found = mockPatients.find((p) => p.id === patientId) || mockPatients[0];
        return { ...found, ...updates };
      }
    );
  },

  /**
   * Add a new medical history record
   */
  async addMedicalHistory(
    item: Omit<MedicalHistoryItem, 'id'>
  ): Promise<MedicalHistoryItem> {
    return withMockFallback(
      () =>
        apiClient.post<MedicalHistoryItem>(
          `/api/v1/patients/${item.patientId}/history`,
          item
        ),
      () => {
        const newItem: MedicalHistoryItem = {
          ...item,
          id: `mh-${Date.now()}`,
        };
        mockMedicalHistory.unshift(newItem);
        return newItem;
      }
    );
  },
};

export default patientService;
