import { StaffDesignation } from './user';

export type StaffShift = 'morning' | 'evening' | 'night';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: StaffDesignation;
  department: string;
  photoUrl?: string;
  shift: StaffShift;
  permissions: string[];
  employeeId: string;
  joiningDate?: string;
}

export type StaffProfile = StaffMember;

export interface HospitalKpiMetrics {
  totalPatients: number; // e.g. 1250
  todayOpd: number; // e.g. 320
  appointments: number; // e.g. 280
  reports: number; // e.g. 180
  totalDoctors: number;
  totalNurses: number;
  totalStaff: number;
  totalBeds: number;
  occupiedBeds: number;
  freeBeds: number;
  bedOccupancyPercent: number;
  todayAppointments: number;
  pendingAppointments: number;
  todayPrescriptions: number;
  todayLabTests: number;
  totalRevenueToday: number;
  outstandingBalance: number;
}

export interface StaffTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  designation: StaffDesignation;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
}
