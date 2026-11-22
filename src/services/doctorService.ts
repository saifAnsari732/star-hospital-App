import apiClient, { withMockFallback } from './apiClient';
import {
  Doctor,
  DoctorScheduleSlot,
  DoctorReview,
} from '../types/doctor';
import {
  mockDoctors,
  mockDoctorSlots,
  mockDoctorSchedules,
  mockDoctorReviews,
} from '../fixtures/mockDoctors';

export const doctorService = {
  /**
   * Get all doctors with optional department filter or text search
   */
  async getAllDoctors(filters?: {
    department?: string;
    search?: string;
    availableToday?: boolean;
  }): Promise<Doctor[]> {
    return withMockFallback(
      () =>
        apiClient.get<Doctor[]>('/api/v1/doctors', {
          params: filters,
        } as any),
      () => {
        let results = [...mockDoctors];

        if (filters?.department && filters.department !== 'All') {
          results = results.filter((d) =>
            d.department.toLowerCase().includes(filters.department!.toLowerCase())
          );
        }

        if (filters?.search) {
          const q = filters.search.toLowerCase();
          results = results.filter(
            (d) =>
              d.name.toLowerCase().includes(q) ||
              d.department.toLowerCase().includes(q) ||
              d.qualification.toLowerCase().includes(q)
          );
        }

        if (filters?.availableToday !== undefined) {
          results = results.filter((d) => d.isAvailableToday === filters.availableToday);
        }

        return results;
      }
    );
  },

  /**
   * Get doctor profile and details by ID
   */
  async getDoctorById(doctorId: string): Promise<Doctor> {
    return withMockFallback(
      () => apiClient.get<Doctor>(`/api/v1/doctors/${doctorId}`),
      () => {
        const found = mockDoctors.find((d) => d.id === doctorId);
        if (!found) {
          return mockDoctors[0]; // fallback to Dr. Amit Sharma
        }
        return found;
      }
    );
  },

  /**
   * Fetch free/available appointment slots for a doctor on a specific date
   * Note: Maps to verified backend route /opd/free-slots
   */
  async getDoctorSlots(doctorId: string, date: string): Promise<string[]> {
    return withMockFallback(
      () =>
        apiClient.get<string[]>('/opd/free-slots', {
          params: { doctor: doctorId, date },
        } as any),
      () => {
        return mockDoctorSlots[doctorId] || mockDoctorSlots['doc-1'];
      }
    );
  },

  /**
   * Get recurring weekly schedule of a doctor
   */
  async getDoctorSchedule(doctorId: string): Promise<DoctorScheduleSlot[]> {
    return withMockFallback(
      () =>
        apiClient.get<DoctorScheduleSlot[]>(
          `/api/v1/doctors/${doctorId}/schedule`
        ),
      () => {
        return mockDoctorSchedules;
      }
    );
  },

  /**
   * Get patient reviews for a doctor
   */
  async getDoctorReviews(doctorId: string): Promise<DoctorReview[]> {
    return withMockFallback(
      () =>
        apiClient.get<DoctorReview[]>(`/api/v1/doctors/${doctorId}/reviews`),
      () => {
        return mockDoctorReviews[doctorId] || mockDoctorReviews['doc-1'] || [];
      }
    );
  },
};

export default doctorService;
