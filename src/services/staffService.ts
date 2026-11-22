import apiClient, { withMockFallback } from './apiClient';
import { StaffMember, HospitalKpiMetrics, StaffTask } from '../types/staff';
import {
  mockStaff,
  mockHospitalKpis,
  mockStaffTasks,
} from '../fixtures/mockStaff';

export const staffService = {
  /**
   * Get staff member profile by ID or current logged in staff
   */
  async getStaffProfile(staffId: string = 'staff-1'): Promise<StaffMember> {
    return withMockFallback(
      () => apiClient.get<StaffMember>(`/api/v1/staff/${staffId}`),
      () => {
        const found = mockStaff.find((s) => s.id === staffId);
        return found || mockStaff[0];
      }
    );
  },

  /**
   * Get list of staff members, optionally filtered by designation
   */
  async getAllStaff(designation?: string): Promise<StaffMember[]> {
    return withMockFallback(
      () =>
        apiClient.get<StaffMember[]>('/api/v1/staff', {
          params: { designation },
        } as any),
      () => {
        if (!designation) return mockStaff;
        return mockStaff.filter((s) => s.designation === designation);
      }
    );
  },

  /**
   * Get aggregate hospital operational and clinical KPI metrics
   * Patients: 1,250, Today OPD: 320, Appointments: 280, Reports: 180
   */
  async getHospitalKpis(): Promise<HospitalKpiMetrics> {
    return withMockFallback(
      () => apiClient.get<HospitalKpiMetrics>('/api/v1/staff/kpi-metrics'),
      () => mockHospitalKpis
    );
  },

  /**
   * Get operational staff tasks and worklist items
   */
  async getStaffTasks(assignedTo?: string): Promise<StaffTask[]> {
    return withMockFallback(
      () =>
        apiClient.get<StaffTask[]>('/api/v1/staff/tasks', {
          params: { assignedTo },
        } as any),
      () => {
        if (!assignedTo) return mockStaffTasks;
        return mockStaffTasks.filter((t) => t.assignedTo === assignedTo);
      }
    );
  },

  /**
   * Update task status (e.g. mark completed)
   */
  async updateTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed'
  ): Promise<StaffTask> {
    return withMockFallback(
      () =>
        apiClient.put<StaffTask>(`/api/v1/staff/tasks/${taskId}`, { status }),
      () => {
        const task = mockStaffTasks.find((t) => t.id === taskId);
        if (task) {
          task.status = status;
          return task;
        }
        return mockStaffTasks[0];
      }
    );
  },
};

export default staffService;
