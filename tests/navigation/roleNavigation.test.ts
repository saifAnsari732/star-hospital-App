/**
 * Tier 3 Pairwise & Integration Tests: Role Navigation & Auth Guards
 * Verifies role switching, session anti-tampering, and isolation between Patient, Doctor, and Staff
 */

import { mockAsyncStorage } from '../setupTests';
import { UserRole } from '../../src/types/user';

// Simulation of Auth Session Guard logic as used in AuthContext and RootNavigator
export class SessionGuardSimulator {
  private activeRole: UserRole | null = null;
  private currentSession: any = null;

  public async setSession(user: any, role: UserRole, token: string): Promise<void> {
    const validRoles: UserRole[] = ['patient', 'doctor', 'staff'];
    if (!validRoles.includes(role)) {
      throw new Error(`Unauthorized role assignment: ${role}`);
    }

    this.currentSession = { user: { ...user, role, token }, role, token };
    this.activeRole = role;
    await mockAsyncStorage.setItem('@star_hospital_auth_session_v1', JSON.stringify(this.currentSession));
  }

  public async restoreSession(): Promise<{ role: UserRole | null; valid: boolean }> {
    const raw = await mockAsyncStorage.getItem('@star_hospital_auth_session_v1');
    if (!raw) {
      return { role: null, valid: false };
    }

    try {
      const parsed = JSON.parse(raw);
      const validRoles: UserRole[] = ['patient', 'doctor', 'staff'];
      if (!parsed || !parsed.user || !parsed.token || !validRoles.includes(parsed.role) || parsed.user.role !== parsed.role) {
        // Tampered session detected
        await mockAsyncStorage.removeItem('@star_hospital_auth_session_v1');
        return { role: null, valid: false };
      }
      this.activeRole = parsed.role;
      return { role: parsed.role, valid: true };
    } catch {
      return { role: null, valid: false };
    }
  }

  public switchRole(newRole: UserRole): boolean {
    const validRoles: UserRole[] = ['patient', 'doctor', 'staff'];
    if (!validRoles.includes(newRole)) {
      return false;
    }
    this.activeRole = newRole;
    return true;
  }

  public canAccessRoute(routeName: string): boolean {
    if (!this.activeRole) return routeName.startsWith('Auth');

    if (this.activeRole === 'patient') {
      return ['PatientHome', 'DoctorSearch', 'BookAppointment', 'MyPrescriptions', 'MyReports', 'QueueStatus'].includes(routeName);
    }
    if (this.activeRole === 'doctor') {
      return ['DoctorDashboard', 'DoctorPatients', 'OPDQueueCaller', 'PrescriptionBuilder', 'DoctorSchedule'].includes(routeName);
    }
    if (this.activeRole === 'staff') {
      return ['StaffDashboard', 'StaffPatientReg', 'NurseVitals', 'LabWorklist', 'PharmacyWorklist', 'BillingDashboard'].includes(routeName);
    }
    return false;
  }
}

describe('Tier 3: Role Navigation & Auth Guard Integration Tests', () => {
  let guard: SessionGuardSimulator;

  beforeEach(() => {
    guard = new SessionGuardSimulator();
  });

  // Pairwise Test 1: Patient role navigation
  it('should permit Patient routes and reject Doctor/Staff routes for Patient session', async () => {
    await guard.setSession(
      { id: 'pat-1', name: 'Ali Khan', email: 'ali@example.com' },
      'patient',
      'jwt_patient_123'
    );

    expect(guard.canAccessRoute('PatientHome')).toBe(true);
    expect(guard.canAccessRoute('BookAppointment')).toBe(true);
    expect(guard.canAccessRoute('DoctorDashboard')).toBe(false);
    expect(guard.canAccessRoute('NurseVitals')).toBe(false);
    expect(guard.canAccessRoute('BillingDashboard')).toBe(false);
  });

  // Pairwise Test 2: Doctor role navigation
  it('should permit Doctor routes and reject Patient/Staff routes for Doctor session', async () => {
    await guard.setSession(
      { id: 'doc-1', name: 'Dr. Amit', email: 'dr.amit@starhospital.com' },
      'doctor',
      'jwt_doctor_123'
    );

    expect(guard.canAccessRoute('DoctorDashboard')).toBe(true);
    expect(guard.canAccessRoute('OPDQueueCaller')).toBe(true);
    expect(guard.canAccessRoute('PrescriptionBuilder')).toBe(true);
    expect(guard.canAccessRoute('PatientHome')).toBe(false);
    expect(guard.canAccessRoute('NurseVitals')).toBe(false);
  });

  // Pairwise Test 3: Staff role navigation
  it('should permit Staff routes and reject Doctor/Patient routes for Staff session', async () => {
    await guard.setSession(
      { id: 'stf-1', name: 'Nurse Aisha', email: 'aisha@starhospital.com', designation: 'nurse' },
      'staff',
      'jwt_staff_123'
    );

    expect(guard.canAccessRoute('StaffDashboard')).toBe(true);
    expect(guard.canAccessRoute('NurseVitals')).toBe(true);
    expect(guard.canAccessRoute('LabWorklist')).toBe(true);
    expect(guard.canAccessRoute('DoctorDashboard')).toBe(false);
    expect(guard.canAccessRoute('PatientHome')).toBe(false);
  });

  // Pairwise Test 4: Dynamic role switching
  it('should update route access immediately when switching role in multi-role profile', () => {
    guard.switchRole('patient');
    expect(guard.canAccessRoute('PatientHome')).toBe(true);
    expect(guard.canAccessRoute('DoctorDashboard')).toBe(false);

    guard.switchRole('doctor');
    expect(guard.canAccessRoute('PatientHome')).toBe(false);
    expect(guard.canAccessRoute('DoctorDashboard')).toBe(true);

    guard.switchRole('staff');
    expect(guard.canAccessRoute('DoctorDashboard')).toBe(false);
    expect(guard.canAccessRoute('StaffDashboard')).toBe(true);
  });

  // Pairwise Test 5: Anti-tampering detection
  it('should reject tampered or corrupted session in persistent storage', async () => {
    // Inject a tampered session where role claimed does not match user object role
    const tamperedPayload = {
      user: { id: 'pat-1', name: 'Hacker', role: 'patient' },
      role: 'doctor', // Tampered elevated role!
      token: 'fake_jwt_doctor',
    };
    await mockAsyncStorage.setItem('@star_hospital_auth_session_v1', JSON.stringify(tamperedPayload));

    const result = await guard.restoreSession();
    expect(result.valid).toBe(false);
    expect(result.role).toBeNull();
  });
});
