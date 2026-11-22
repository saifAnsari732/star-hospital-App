import apiClient, { withMockFallback } from './apiClient';
import { firebaseAppointmentAlertService } from './firebaseAppointmentAlertService';
import {
  Appointment,
  BookAppointmentRequest,
  RescheduleAppointmentRequest,
  UpdateVitalsRequest,
} from '../types/appointment';
import { mockAppointments } from '../fixtures/mockAppointments';
import { mockDoctors } from '../fixtures/mockDoctors';
import { mockPatients } from '../fixtures/mockPatients';

export const appointmentService = {
  /**
   * Get appointments with optional filters (patientId, doctorId, status, date)
   */
  async getAppointments(filters?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
    date?: string;
  }): Promise<Appointment[]> {
    return withMockFallback(
      () =>
        apiClient.get<Appointment[]>('/api/v1/appointments', {
          params: filters,
        } as any),
      () => {
        let results = [...mockAppointments];

        if (filters?.patientId) {
          results = results.filter((a) => a.patientId === filters.patientId);
        }

        if (filters?.doctorId) {
          results = results.filter((a) => a.doctorId === filters.doctorId);
        }

        if (filters?.status) {
          if (filters.status === 'upcoming') {
            results = results.filter(
              (a) => a.status === 'scheduled' || a.status === 'arrived'
            );
          } else if (filters.status === 'past') {
            results = results.filter(
              (a) => a.status === 'completed' || a.status === 'cancelled'
            );
          } else {
            results = results.filter((a) => a.status === filters.status);
          }
        }

        if (filters?.date) {
          results = results.filter((a) => a.date === filters.date);
        }

        return results;
      }
    );
  },

  /**
   * Get single appointment details by ID
   */
  async getAppointmentById(id: string): Promise<Appointment> {
    return withMockFallback(
      () => apiClient.get<Appointment>(`/api/v1/appointments/${id}`),
      () => {
        const found = mockAppointments.find((a) => a.id === id);
        return found || mockAppointments[0];
      }
    );
  },

  /**
   * Book a new doctor appointment
   */
  async bookAppointment(req: BookAppointmentRequest): Promise<Appointment> {
    const createdAppointment = await withMockFallback(
      () => apiClient.post<Appointment>('/api/v1/appointments', req),
      () => {
        const doc =
          mockDoctors.find((d) => d.id === req.doctorId) || mockDoctors[0];
        const pat =
          mockPatients.find((p) => p.id === req.patientId) || mockPatients[0];

        const newAppointment: Appointment = {
          id: `apt-${Date.now()}`,
          patientId: pat.id,
          patientName: pat.name,
          patientMrn: pat.mrn,
          patientPhone: pat.phone,
          doctorId: doc.id,
          doctorName: doc.name,
          doctorDepartment: doc.department,
          date: req.date,
          timeSlot: req.timeSlot || req.startTime,
          startTime: `${req.date}T${req.startTime.split(' ')[0]}:00Z`,
          endTime: `${req.date}T${req.startTime.split(' ')[0]}:15Z`,
          status: 'scheduled',
          mode: req.mode || 'in_person',
          remarks: req.remarks,
          consultationFee: doc.consultationFee,
          paymentStatus: 'paid',
          createdAt: new Date().toISOString(),
        };

        mockAppointments.unshift(newAppointment);
        return newAppointment;
      }
    );

    // Live Firebase Cloud Firestore priority broadcast for Reception & Triage Nurses
    try {
      void firebaseAppointmentAlertService.broadcastNewAppointmentAlert(createdAppointment);
    } catch {
      // Non-blocking
    }

    return createdAppointment;
  },

  /**
   * Reschedule an appointment to a new date/time slot
   */
  async rescheduleAppointment(
    req: RescheduleAppointmentRequest
  ): Promise<Appointment> {
    return withMockFallback(
      () =>
        apiClient.put<Appointment>(
          `/api/v1/appointments/${req.appointmentId}/reschedule`,
          req
        ),
      () => {
        const appt =
          mockAppointments.find((a) => a.id === req.appointmentId) ||
          mockAppointments[0];
        appt.date = req.newDate;
        appt.timeSlot = req.newTimeSlot;
        appt.status = 'scheduled';
        return { ...appt };
      }
    );
  },

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return withMockFallback(
      () =>
        apiClient.delete<{ success: boolean; message: string }>(
          `/api/v1/appointments/${appointmentId}`,
          { data: { reason } } as any
        ),
      () => {
        const appt = mockAppointments.find((a) => a.id === appointmentId);
        if (appt) {
          appt.status = 'cancelled';
        }
        return {
          success: true,
          message: 'Appointment has been cancelled successfully.',
        };
      }
    );
  },

  /**
   * Record patient vital signs (by Nurse or Doctor)
   */
  async updateVitals(req: UpdateVitalsRequest): Promise<Appointment> {
    return withMockFallback(
      () =>
        apiClient.put<Appointment>(
          `/api/v1/appointments/${req.appointmentId}/vitals`,
          req.vitals
        ),
      () => {
        const appt =
          mockAppointments.find((a) => a.id === req.appointmentId) ||
          mockAppointments[0];
        appt.vitals = {
          ...appt.vitals,
          ...req.vitals,
          recordedAt: new Date().toISOString(),
        };
        return { ...appt };
      }
    );
  },

  /**
   * Check in patient upon arrival at hospital
   */
  async checkInAppointment(appointmentId: string): Promise<Appointment> {
    return withMockFallback(
      () =>
        apiClient.post<Appointment>(
          `/api/v1/appointments/${appointmentId}/check-in`
        ),
      () => {
        const appt =
          mockAppointments.find((a) => a.id === appointmentId) ||
          mockAppointments[0];
        appt.status = 'arrived';
        return { ...appt };
      }
    );
  },
};

export default appointmentService;
