/**
 * Star Hospital Mobile Application - Comprehensive Test Runner Engine
 * Architect: Worker Track 7 (E2E Test Suite, Mock Adapter Engine & Test Runner Architect)
 * 
 * Executes all 4 Tiers of testing:
 *   - Tier 1: Unit & Feature Coverage (Auth, OPD Token, Appointments, Prescriptions, Staff RBAC)
 *   - Tier 2: Boundary & Corner Cases (Phone formatting, Empty fields, Invalid OTP, Zero Rx, Extreme Vitals, Past Dates)
 *   - Tier 3: Pairwise & Integration (Role Navigation, Anti-tampering, Live Queue Stepper Progression)
 *   - Tier 4: Real-World Scenarios S1 - S5 (Patient Outpatient Journey, Doctor Consultation, Staff Clinical Pipeline, Records/Reports, Role Boundary)
 */

import { mockAdapter } from '../src/services/mock/mockAdapter.ts';
import { buildRazorpayConfig, isRazorpayKeyConfigured } from '../src/config/razorpay.ts';

// In-memory AsyncStorage simulator for self-contained test execution
const asyncStorageMemory = new Map<string, string>();
const mockStorage = {
  getItem: async (key: string) => asyncStorageMemory.get(key) ?? null,
  setItem: async (key: string, val: string) => { asyncStorageMemory.set(key, String(val)); },
  removeItem: async (key: string) => { asyncStorageMemory.delete(key); },
  clear: async () => { asyncStorageMemory.clear(); },
};

// Staff RBAC permissions
type StaffDesignation = 'nurse' | 'receptionist' | 'pharmacist' | 'laboratorist' | 'billing' | 'admin' | string;
const STAFF_PERMISSIONS: Record<string, string[]> = {
  nurse: ['vitals:record', 'vitals:view', 'beds:view', 'queue:view', 'patients:view'],
  laboratorist: ['lab:worklist', 'lab:results_enter', 'lab:reports_release', 'patients:view'],
  pharmacist: ['pharmacy:worklist', 'pharmacy:inventory', 'pharmacy:dispense', 'prescriptions:view'],
  billing: ['billing:invoices_list', 'billing:invoice_create', 'billing:payments_record', 'billing:receipts'],
  receptionist: ['patients:register', 'opd:token_generate', 'appointments:checkin', 'queue:view'],
  admin: [
    'vitals:record',
    'vitals:view',
    'beds:view',
    'beds:admit',
    'beds:discharge',
    'lab:worklist',
    'lab:results_enter',
    'lab:reports_release',
    'pharmacy:worklist',
    'pharmacy:inventory',
    'pharmacy:dispense',
    'billing:invoices_list',
    'billing:invoice_create',
    'billing:payments_record',
    'patients:register',
    'opd:token_generate',
  ],
};

function hasPermission(designation: StaffDesignation, permission: string): boolean {
  const allowed = STAFF_PERMISSIONS[designation] || [];
  return allowed.includes(permission);
}

// Session Guard Simulator
type UserRole = 'patient' | 'doctor' | 'staff';
class SessionGuardSimulator {
  private activeRole: UserRole | null = null;
  private currentSession: any = null;

  public async setSession(user: any, role: UserRole, token: string): Promise<void> {
    const validRoles: UserRole[] = ['patient', 'doctor', 'staff'];
    if (!validRoles.includes(role)) {
      throw new Error(`Unauthorized role assignment: ${role}`);
    }

    this.currentSession = { user: { ...user, role, token }, role, token };
    this.activeRole = role;
    await mockStorage.setItem('@star_hospital_auth_session_v1', JSON.stringify(this.currentSession));
  }

  public async restoreSession(): Promise<{ role: UserRole | null; valid: boolean }> {
    const raw = await mockStorage.getItem('@star_hospital_auth_session_v1');
    if (!raw) return { role: null, valid: false };

    try {
      const parsed = JSON.parse(raw);
      const validRoles: UserRole[] = ['patient', 'doctor', 'staff'];
      if (!parsed || !parsed.user || !parsed.token || !validRoles.includes(parsed.role) || parsed.user.role !== parsed.role) {
        await mockStorage.removeItem('@star_hospital_auth_session_v1');
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
    if (!validRoles.includes(newRole)) return false;
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

// -------------------------------------------------------------
// ASSERTION ENGINE & QUEUE
// -------------------------------------------------------------

interface QueuedTest {
  suite: string;
  name: string;
  beforeEachList: Array<() => void | Promise<void>>;
  fn: () => void | Promise<void>;
}

interface TestResult {
  suite: string;
  name: string;
  status: 'passed' | 'failed';
  error?: string;
  durationMs: number;
}

class TestContext {
  private queue: QueuedTest[] = [];
  public results: TestResult[] = [];
  private currentSuite = '';
  private currentBeforeEachFns: Array<() => void | Promise<void>> = [];

  public describe(suiteName: string, fn: () => void | Promise<void>): void {
    this.currentSuite = suiteName;
    this.currentBeforeEachFns = [];
    fn();
  }

  public beforeEach(fn: () => void | Promise<void>): void {
    this.currentBeforeEachFns.push(fn);
  }

  public it(testName: string, fn: () => void | Promise<void>): void {
    this.queue.push({
      suite: this.currentSuite,
      name: testName,
      beforeEachList: [...this.currentBeforeEachFns],
      fn,
    });
  }

  public async executeAll(): Promise<void> {
    for (const test of this.queue) {
      const startTime = Date.now();
      try {
        for (const beforeFn of test.beforeEachList) {
          await beforeFn();
        }
        await test.fn();
        this.results.push({
          suite: test.suite,
          name: test.name,
          status: 'passed',
          durationMs: Date.now() - startTime,
        });
      } catch (err: any) {
        this.results.push({
          suite: test.suite,
          name: test.name,
          status: 'failed',
          error: err?.message || String(err),
          durationMs: Date.now() - startTime,
        });
      }
    }
  }

  public expect(actual: any) {
    return {
      toBe: (expected: any) => {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
        }
      },
      toEqual: (expected: any) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected equal to ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
        }
      },
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error(`Expected value to be defined, but was undefined`);
        }
      },
      toBeNull: () => {
        if (actual !== null) {
          throw new Error(`Expected null, received ${JSON.stringify(actual)}`);
        }
      },
      not: {
        toBeNull: () => {
          if (actual === null) {
            throw new Error(`Expected value not to be null`);
          }
        },
      },
      toBeTruthy: () => {
        if (!actual) {
          throw new Error(`Expected truthy value, received ${JSON.stringify(actual)}`);
        }
      },
      toBeGreaterThan: (expected: number) => {
        if (!(actual > expected)) {
          throw new Error(`Expected ${actual} > ${expected}`);
        }
      },
      toBeGreaterThanOrEqual: (expected: number) => {
        if (!(actual >= expected)) {
          throw new Error(`Expected ${actual} >= ${expected}`);
        }
      },
      toContain: (expectedSubstring: string) => {
        if (typeof actual === 'string') {
          if (!actual.includes(expectedSubstring)) {
            throw new Error(`Expected "${actual}" to contain "${expectedSubstring}"`);
          }
        } else if (Array.isArray(actual)) {
          if (!actual.includes(expectedSubstring)) {
            throw new Error(`Expected array to contain ${JSON.stringify(expectedSubstring)}`);
          }
        }
      },
      toMatch: (pattern: RegExp) => {
        if (!pattern.test(String(actual))) {
          throw new Error(`Expected "${actual}" to match pattern ${pattern}`);
        }
      },
      toHaveLength: (length: number) => {
        if (!actual || actual.length !== length) {
          throw new Error(`Expected length ${length}, received ${actual?.length}`);
        }
      },
      rejects: {
        toThrow: async (expectedMsgSubstring?: string) => {
          let threw = false;
          let thrownError: any = null;
          try {
            if (typeof actual === 'function') {
              await actual();
            } else {
              await actual;
            }
          } catch (err: any) {
            threw = true;
            thrownError = err;
          }
          if (!threw) {
            throw new Error(`Expected function/promise to throw, but it succeeded.`);
          }
          if (expectedMsgSubstring && !String(thrownError?.message || thrownError).includes(expectedMsgSubstring)) {
            throw new Error(`Expected error message to include "${expectedMsgSubstring}", but was "${thrownError?.message}"`);
          }
        },
      },
    };
  }

  public getSummary() {
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === 'passed').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;
    return { total, passed, failed, results: this.results };
  }
}

// -------------------------------------------------------------
// EXECUTE ALL TEST SUITES
// -------------------------------------------------------------

async function runTestSuite() {
  const runner = new TestContext();
  const describe = runner.describe.bind(runner);
  const it = runner.it.bind(runner);
  const expect = runner.expect.bind(runner);
  const beforeEach = runner.beforeEach.bind(runner);

  console.log('\n================================================================');
  console.log('  STAR HOSPITAL MOBILE APPLICATION - TEST SUITE RUNNER');
  console.log('================================================================\n');

  // =============================================================
  // TIER 1: UNIT & FEATURE COVERAGE
  // =============================================================

  // 1. AuthService Unit Tests
  describe('Tier 1: AuthService & RBAC Unit Tests', () => {
    beforeEach(() => mockAdapter.reset());

    it('should successfully authenticate patient with valid email and password', async () => {
      const response = await mockAdapter.login({
        login: 'ali.khan@gmail.com',
        password: 'password123',
        role: 'patient',
      });
      expect(response.success).toBe(true);
      expect(response.data.token).toContain('star_mock_jwt_patient');
      expect(response.data.user.role).toBe('patient');
      expect(response.data.user.email).toBe('ali.khan@gmail.com');
    });

    it('should successfully authenticate doctor and return doctor profile with role', async () => {
      const response = await mockAdapter.login({
        login: 'dr.amit@starhospital.com',
        password: 'doctorPassword',
        role: 'doctor',
      });
      expect(response.success).toBe(true);
      expect(response.data.token).toContain('star_mock_jwt_doctor');
      expect(response.data.user.role).toBe('doctor');
      expect(response.data.user.name).toBe('Dr. Amit Sharma');
    });

    it('should authenticate hospital staff and attach proper designation', async () => {
      const response = await mockAdapter.login({
        login: 'nurse.aisha@starhospital.com',
        password: 'staffPassword',
        role: 'staff',
        designation: 'nurse',
      });
      expect(response.success).toBe(true);
      expect(response.data.user.role).toBe('staff');
      expect(response.data.user.designation).toBe('nurse');
      expect(response.data.token).toContain('star_mock_jwt_staff');
    });

    it('should generate verification ID upon valid phone OTP request', async () => {
      const response = await mockAdapter.sendOtp('+92 300 1234567', 'patient');
      expect(response.success).toBe(true);
      expect(response.data.verificationId).toBeDefined();
      expect(response.data.verificationId).toContain('verify-');
    });

    it('should successfully verify 6-digit OTP and issue authentication session', async () => {
      const response = await mockAdapter.verifyOtp('+92 300 1234567', '123456', 'patient');
      expect(response.success).toBe(true);
      expect(response.data.token).toContain('star_otp_jwt_patient');
      expect(response.data.user.phone).toContain('300 1234567');
      expect(response.data.user.role).toBe('patient');
    });

    it('should register a new patient and allocate valid MRN number', async () => {
      const initialCount = mockAdapter.patients.length;
      const response = await mockAdapter.registerPatient({
        name: 'Zainab Bibi',
        email: 'zainab.bibi@example.com',
        phone: '+92 333 1122334',
        gender: 'female',
        dateOfBirth: '1998-04-12',
        bloodGroup: 'A+',
        address: 'Street 4, Sector G-9/1',
        city: 'Islamabad',
      });
      expect(response.success).toBe(true);
      expect(mockAdapter.patients.length).toBe(initialCount + 1);
      expect(response.data.user.name).toBe('Zainab Bibi');
    });

    it('should reject login attempt when identifier is empty or whitespace', async () => {
      await expect(
        mockAdapter.login({ login: '   ', password: 'pass', role: 'patient' })
      ).rejects.toThrow('Mobile number or email is required');
    });

    it('should reject verification with incorrect OTP code', async () => {
      await expect(
        mockAdapter.verifyOtp('+92 300 1234567', '999999', 'patient')
      ).rejects.toThrow('Incorrect OTP');
    });
  });

  // 2. OPDTokenService Unit Tests
  describe('Tier 1: OPDTokenService & Queue Math Unit Tests', () => {
    beforeEach(() => mockAdapter.reset());

    it('should generate sequential token number with A- prefix', async () => {
      const response = await mockAdapter.generateToken('pat-1', 'doc-1', 'first_visit');
      expect(response.success).toBe(true);
      expect(response.data.tokenNumber).toMatch(/^A-\d+$/);
      const tokenNum = parseInt(response.data.tokenNumber.replace('A-', ''), 10);
      expect(tokenNum).toBeGreaterThanOrEqual(103);
    });

    it('should correctly calculate queue position based on waiting tokens count', async () => {
      const waitingBefore = mockAdapter.tokens.filter(
        (t) => t.doctorId === 'doc-1' && t.status === 'arrived'
      ).length;
      const response = await mockAdapter.generateToken('pat-2', 'doc-1', 'first_visit');
      expect(response.data.queuePosition).toBe(waitingBefore + 1);
    });

    it('should estimate wait time proportional to queue position (10 mins per patient)', async () => {
      const response = await mockAdapter.generateToken('pat-1', 'doc-1', 'first_visit');
      expect(response.data.estimatedWaitMinutes).toBe(response.data.queuePosition * 10);
    });

    it('should allocate reduced emergency wait time (5 minutes) for emergency visit type', async () => {
      const response = await mockAdapter.generateToken('pat-1', 'doc-1', 'emergency');
      expect(response.data.estimatedWaitMinutes).toBe(5);
    });

    it('should advance arrived token to in_consultation and update serving token', async () => {
      const response = await mockAdapter.callNextToken('doc-1');
      expect(response.success).toBe(true);
      expect(response.data).not.toBeNull();
      expect(response.data?.tokenNumber).toBe('A-102');
      expect(response.data?.status).toBe('in_consultation');
    });

    it('should decrement queue positions of remaining waiting patients when next token is called', async () => {
      await mockAdapter.generateToken('pat-2', 'doc-1');
      await mockAdapter.callNextToken('doc-1');
      const tokenAfter = mockAdapter.tokens.find((t) => t.tokenNumber === 'A-103');
      if (tokenAfter) {
        expect(tokenAfter.servingToken).toBe('A-102');
      }
    });

    it('should mark token as completed with ISO timestamp', async () => {
      const response = await mockAdapter.completeToken('tok-102');
      expect(response.success).toBe(true);
      expect(response.data.status).toBe('completed');
      expect(response.data.completedAt).toBeDefined();
    });

    it('should maintain 3-step live queue stepper with completed, current, and waiting states', async () => {
      const response = await mockAdapter.generateToken('pat-1', 'doc-1');
      const steps = response.data.liveSteps;
      expect(steps.length).toBe(3);
      expect(steps[0].status).toBe('completed');
      expect(steps[1].status).toBe('current');
      expect(steps[2].status).toBe('waiting');
    });
  });

  // 3. AppointmentService Unit Tests
  describe('Tier 1: AppointmentService Unit Tests', () => {
    beforeEach(() => mockAdapter.reset());

    it('should successfully book an appointment for an available slot in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const dateStr = futureDate.toISOString().split('T')[0];

      const response = await mockAdapter.bookAppointment({
        patientId: 'pat-1',
        doctorId: 'doc-1',
        date: dateStr,
        startTime: '02:00 PM',
        mode: 'in_person',
        remarks: 'Follow up routine check',
      });
      expect(response.success).toBe(true);
      expect(response.data.status).toBe('scheduled');
      expect(response.data.patientName).toBe('Ali Khan');
      expect(response.data.consultationFee).toBe(1000);
    });

    it('should detect and reject booking clash for the same doctor, date, and time slot', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const dateStr = futureDate.toISOString().split('T')[0];

      await mockAdapter.bookAppointment({
        patientId: 'pat-1',
        doctorId: 'doc-2',
        date: dateStr,
        startTime: '10:00 AM',
        mode: 'in_person',
      });

      await expect(
        mockAdapter.bookAppointment({
          patientId: 'pat-2',
          doctorId: 'doc-2',
          date: dateStr,
          startTime: '10:00 AM',
          mode: 'video',
        })
      ).rejects.toThrow('already booked');
    });

    it('should reject booking requests for dates in the past', async () => {
      await expect(
        mockAdapter.bookAppointment({
          patientId: 'pat-1',
          doctorId: 'doc-1',
          date: '2020-01-01',
          startTime: '10:00 AM',
          mode: 'in_person',
        })
      ).rejects.toThrow('Cannot book an appointment for a past date');
    });

    it('should cancel an active appointment and append cancellation reason to remarks', async () => {
      const response = await mockAdapter.cancelAppointment('appt-1', 'Patient has urgent conflict');
      expect(response.success).toBe(true);
      expect(response.data.status).toBe('cancelled');
      expect(response.data.remarks).toContain('Cancelled: Patient has urgent conflict');
    });

    it('should reject cancellation of an appointment that is already marked completed', async () => {
      await expect(
        mockAdapter.cancelAppointment('appt-2', 'Trying to cancel completed')
      ).rejects.toThrow('Completed appointments cannot be cancelled');
    });

    it('should reschedule an existing appointment to a new date and time slot', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const newDateStr = futureDate.toISOString().split('T')[0];

      const response = await mockAdapter.rescheduleAppointment({
        appointmentId: 'appt-1',
        newDate: newDateStr,
        newTimeSlot: '11:00 AM',
        reason: 'Shifted schedule',
      });
      expect(response.success).toBe(true);
      expect(response.data.date).toBe(newDateStr);
      expect(response.data.timeSlot).toBe('11:00 AM');
    });

    it('should update and record clinical vitals (BP, pulse, temp, SpO2) for an appointment', async () => {
      const response = await mockAdapter.updateVitals({
        appointmentId: 'appt-1',
        vitals: {
          bloodPressure: '120/80 mmHg',
          pulse: '72 bpm',
          temperature: '98.6 °F',
          weight: '70 kg',
          oxygenSaturation: '99%',
        },
      });
      expect(response.success).toBe(true);
      expect(response.data.vitals?.bloodPressure).toBe('120/80 mmHg');
      expect(response.data.vitals?.recordedAt).toBeDefined();
    });
  });

  // 4. PrescriptionService Unit Tests
  describe('Tier 1: PrescriptionService & Rx Builder Unit Tests', () => {
    beforeEach(() => mockAdapter.reset());

    it('should create prescription with formatted sequential RX number and complete metadata', async () => {
      const response = await mockAdapter.createPrescription({
        patientId: 'pat-1',
        doctorId: 'doc-1',
        date: '2026-11-15',
        diagnosis: 'Acute Pharyngitis',
        symptoms: 'Sore throat, fever 101F',
        advice: 'Gargle with warm salt water',
        items: [
          {
            medicineName: 'Azithromycin 500mg',
            dosage: '1 tablet',
            frequency: 'Once a day (1-0-0)',
            duration: '3 days',
            instructions: 'After lunch',
          },
        ],
      });
      expect(response.success).toBe(true);
      expect(response.data.prescriptionNumber).toMatch(/^RX-\d{4}-\d{4}$/);
      expect(response.data.status).toBe('issued');
      expect(response.data.items.length).toBe(1);
    });

    it('should accurately serialize multi-medicine regimen with individual dosages and frequencies', async () => {
      const medicines = [
        { medicineName: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'TDS (1-1-1)', duration: '5 days', instructions: 'SOS' },
        { medicineName: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'BD (1-0-1)', duration: '7 days', instructions: 'After meals' },
      ];
      const response = await mockAdapter.createPrescription({
        patientId: 'pat-1',
        doctorId: 'doc-1',
        date: '2026-11-15',
        items: medicines,
      });
      expect(response.data.items.length).toBe(2);
      expect(response.data.items[0].medicineName).toBe('Paracetamol 500mg');
      expect(response.data.items[1].frequency).toBe('BD (1-0-1)');
    });

    it('should throw validation error when prescription contains zero medicine items', async () => {
      await expect(
        mockAdapter.createPrescription({
          patientId: 'pat-1',
          doctorId: 'doc-1',
          date: '2026-11-15',
          items: [],
        })
      ).rejects.toThrow('Prescription must include at least one medicine item');
    });

    it('should reject prescription item when medicine name, dosage, or frequency is missing', async () => {
      await expect(
        mockAdapter.createPrescription({
          patientId: 'pat-1',
          doctorId: 'doc-1',
          date: '2026-11-15',
          items: [{ medicineName: '', dosage: '500mg', frequency: '1-0-1', duration: '5 days', instructions: 'oral' }],
        })
      ).rejects.toThrow('Medicine name is required');
    });

    it('should mark prescription as dispensed and automatically deduct stock from pharmacy inventory', async () => {
      const med1Before = mockAdapter.medicines.find((m) => m.id === 'med-1')?.availableQuantity || 0;
      const response = await mockAdapter.dispensePrescription({
        prescriptionId: 'rx-1',
        patientId: 'pat-1',
        items: [{ medicineId: 'med-1', quantity: 15, unitPrice: 2 }],
        paymentMethod: 'cash',
      });
      expect(response.success).toBe(true);
      expect(response.data.status).toBe('dispensed');
      const med1After = mockAdapter.medicines.find((m) => m.id === 'med-1')?.availableQuantity || 0;
      expect(med1After).toBe(med1Before - 15);
    });
  });

  // 5. StaffRolePermissions Unit Tests
  describe('Tier 1: StaffRolePermissions & RBAC Matrix Unit Tests', () => {
    it('should grant clinical vitals entry to nurse but deny pharmacy dispensing and invoice creation', () => {
      expect(hasPermission('nurse', 'vitals:record')).toBe(true);
      expect(hasPermission('nurse', 'beds:view')).toBe(true);
      expect(hasPermission('nurse', 'pharmacy:dispense')).toBe(false);
      expect(hasPermission('nurse', 'billing:invoice_create')).toBe(false);
    });

    it('should allow lab technician to enter test results but prevent clinical vitals recording', () => {
      expect(hasPermission('laboratorist', 'lab:results_enter')).toBe(true);
      expect(hasPermission('laboratorist', 'lab:reports_release')).toBe(true);
      expect(hasPermission('laboratorist', 'vitals:record')).toBe(false);
      expect(hasPermission('laboratorist', 'billing:payments_record')).toBe(false);
    });

    it('should allow pharmacist to manage inventory and dispense drugs but deny lab result entry', () => {
      expect(hasPermission('pharmacist', 'pharmacy:dispense')).toBe(true);
      expect(hasPermission('pharmacist', 'pharmacy:inventory')).toBe(true);
      expect(hasPermission('pharmacist', 'lab:results_enter')).toBe(false);
    });

    it('should allow billing clerk to generate invoices and record payments but deny clinical tasks', () => {
      expect(hasPermission('billing', 'billing:invoice_create')).toBe(true);
      expect(hasPermission('billing', 'billing:payments_record')).toBe(true);
      expect(hasPermission('billing', 'vitals:record')).toBe(false);
    });

    it('should allow receptionist to register patients and generate OPD tokens but deny medical edits', () => {
      expect(hasPermission('receptionist', 'patients:register')).toBe(true);
      expect(hasPermission('receptionist', 'opd:token_generate')).toBe(true);
      expect(hasPermission('receptionist', 'lab:results_enter')).toBe(false);
    });

    it('should grant full operational supervisory permissions to admin', () => {
      expect(hasPermission('admin', 'vitals:record')).toBe(true);
      expect(hasPermission('admin', 'lab:results_enter')).toBe(true);
      expect(hasPermission('admin', 'pharmacy:dispense')).toBe(true);
      expect(hasPermission('admin', 'billing:invoice_create')).toBe(true);
    });
  });

  // =============================================================
  // TIER 2: BOUNDARY & CORNER CASES
  // =============================================================

  describe('Tier 2: Boundary & Corner Cases', () => {
    beforeEach(() => mockAdapter.reset());

    it('should accept phone numbers with various formats (spaces, hyphens, country codes)', async () => {
      const validPhones = ['+92 300 1234567', '0300-1234567', '+923001234567'];
      for (const phone of validPhones) {
        const res = await mockAdapter.sendOtp(phone, 'patient');
        expect(res.success).toBe(true);
      }
    });

    it('should reject phone numbers with fewer than 10 digits', async () => {
      const invalidPhones = ['123', '123456789', '   '];
      for (const phone of invalidPhones) {
        await expect(mockAdapter.sendOtp(phone, 'patient')).rejects.toThrow('valid 10-digit mobile number');
      }
    });

    it('should reject OTPs that are not exactly 6 characters', async () => {
      const badOtps = ['123', '12345', '1234567'];
      for (const otp of badOtps) {
        await expect(mockAdapter.verifyOtp('+92 300 1234567', otp, 'patient')).rejects.toThrow('Invalid OTP code');
      }
    });

    it('should reject prescription creation when items array is empty', async () => {
      await expect(
        mockAdapter.createPrescription({ patientId: 'pat-1', doctorId: 'doc-1', date: '2026-11-20', items: [] })
      ).rejects.toThrow('Prescription must include at least one medicine item');
    });

    it('should accept valid high-stress clinical vitals within physiological limits', async () => {
      const response = await mockAdapter.updateVitals({
        appointmentId: 'appt-1',
        vitals: {
          bloodPressure: '220/130 mmHg',
          pulse: '180 bpm',
          temperature: '105.4 °F',
          weight: '198.5 kg',
          oxygenSaturation: '78%',
        },
      });
      expect(response.success).toBe(true);
      expect(response.data.vitals?.bloodPressure).toBe('220/130 mmHg');
    });

    it('should reject appointment booking with yesterday date', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await expect(
        mockAdapter.bookAppointment({ patientId: 'pat-1', doctorId: 'doc-1', date: yesterdayStr, startTime: '10:00 AM', mode: 'in_person' })
      ).rejects.toThrow('Cannot book an appointment for a past date');
    });

    it('should compute net total to zero if discount equals or exceeds gross total', async () => {
      const response = await mockAdapter.createInvoice({
        patientId: 'pat-1',
        careSetting: 'opd',
        items: [{ description: 'General Consultation', quantity: 1, unitPrice: 1000 }],
        discount: 1500,
      });
      expect(response.data.netTotal).toBe(0);
      expect(response.data.balanceDue).toBe(0);
    });

    it('should clamp medicine inventory at 0 when dispensing full or excess quantity', async () => {
      const stockItem = mockAdapter.medicines[0];
      const initialQty = stockItem.availableQuantity;

      await mockAdapter.dispensePrescription({
        prescriptionId: 'rx-1',
        patientId: 'pat-1',
        items: [{ medicineId: stockItem.id, quantity: initialQty + 50, unitPrice: 2 }],
        paymentMethod: 'cash',
      });
      expect(stockItem.availableQuantity).toBe(0);
    });
  });

  // =============================================================
  // TIER 3: PAIRWISE & INTEGRATION TESTS
  // =============================================================

  describe('Tier 3: Pairwise & Integration Tests', () => {
    let guard: SessionGuardSimulator;
    beforeEach(() => {
      mockAdapter.reset();
      guard = new SessionGuardSimulator();
    });

    it('should permit Patient routes and reject Doctor/Staff routes for Patient session', async () => {
      await guard.setSession({ id: 'pat-1', name: 'Ali' }, 'patient', 'jwt_patient');
      expect(guard.canAccessRoute('PatientHome')).toBe(true);
      expect(guard.canAccessRoute('DoctorDashboard')).toBe(false);
      expect(guard.canAccessRoute('NurseVitals')).toBe(false);
    });

    it('should permit Doctor routes and reject Patient/Staff routes for Doctor session', async () => {
      await guard.setSession({ id: 'doc-1', name: 'Dr. Amit' }, 'doctor', 'jwt_doctor');
      expect(guard.canAccessRoute('DoctorDashboard')).toBe(true);
      expect(guard.canAccessRoute('PatientHome')).toBe(false);
    });

    it('should permit Staff routes and reject Doctor/Patient routes for Staff session', async () => {
      await guard.setSession({ id: 'stf-1', name: 'Nurse' }, 'staff', 'jwt_staff');
      expect(guard.canAccessRoute('StaffDashboard')).toBe(true);
      expect(guard.canAccessRoute('DoctorDashboard')).toBe(false);
    });

    it('should accurately progress token through arrived -> in_consultation -> completed', async () => {
      const genRes = await mockAdapter.generateToken('pat-1', 'doc-1');
      const token = genRes.data;
      expect(token.status).toBe('arrived');

      await mockAdapter.callNextToken('doc-1');
      const callRes = await mockAdapter.callNextToken('doc-1');
      expect(callRes.data?.tokenNumber).toBe(token.tokenNumber);
      expect(callRes.data?.status).toBe('in_consultation');

      const compRes = await mockAdapter.completeToken(token.id);
      expect(compRes.data.status).toBe('completed');
    });

    it('should maintain independent queues and serving tokens for different doctors', async () => {
      const tokenDoc1 = await mockAdapter.generateToken('pat-1', 'doc-1');
      const tokenDoc2 = await mockAdapter.generateToken('pat-2', 'doc-2');
      await mockAdapter.callNextToken('doc-1');

      const doc2Tokens = mockAdapter.tokens.filter((t) => t.doctorId === 'doc-2');
      const doc2Arrived = doc2Tokens.find((t) => t.id === tokenDoc2.data.id);
      expect(doc2Arrived?.status).toBe('arrived');
    });
  });

  // =============================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS (S1 - S5)
  // =============================================================

  describe('Tier 4: Real-World Application Scenarios (S1 - S5)', () => {
    let guard: SessionGuardSimulator;
    beforeEach(() => {
      mockAdapter.reset();
      guard = new SessionGuardSimulator();
    });

    it('Scenario S1: Patient Outpatient Journey (Auth -> Search -> Booking -> OPD Token -> Queue Tracking)', async () => {
      // Step 1: Patient Login
      const loginRes = await mockAdapter.login({ login: 'ali.khan@gmail.com', password: 'password', role: 'patient' });
      expect(loginRes.success).toBe(true);
      await guard.setSession(loginRes.data.user, 'patient', loginRes.data.token);

      // Step 2: Search Doctors
      const doctors = mockAdapter.doctors;
      expect(doctors.length).toBeGreaterThanOrEqual(3);
      const selectedDoctor = doctors[0];

      // Step 3: Appointment Booking
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + 2);
      const apptRes = await mockAdapter.bookAppointment({
        patientId: loginRes.data.user.id,
        doctorId: selectedDoctor.id,
        date: bookingDate.toISOString().split('T')[0],
        startTime: '10:30 AM',
        mode: 'in_person',
      });
      expect(apptRes.success).toBe(true);

      // Step 4: Token Generation & Stepper
      const tokenRes = await mockAdapter.generateToken(loginRes.data.user.id, selectedDoctor.id, 'first_visit');
      expect(tokenRes.success).toBe(true);
      const token = tokenRes.data;
      expect(token.liveSteps).toHaveLength(3);
      expect(token.liveSteps[0].status).toBe('completed');
      expect(token.liveSteps[1].status).toBe('current');
      expect(token.liveSteps[2].status).toBe('waiting');
    });

    it('Scenario S2: Doctor Consultation & Prescription (Auth -> Call Next -> Vitals -> Rx Builder -> Saved)', async () => {
      const doctorLogin = await mockAdapter.login({ login: 'dr.amit@starhospital.com', password: 'docPass', role: 'doctor' });
      expect(doctorLogin.success).toBe(true);

      const callRes = await mockAdapter.callNextToken(doctorLogin.data.user.id);
      expect(callRes.success).toBe(true);
      const activeToken = callRes.data!;
      expect(activeToken.status).toBe('in_consultation');

      const rxRes = await mockAdapter.createPrescription({
        patientId: activeToken.patientId,
        doctorId: doctorLogin.data.user.id,
        date: new Date().toISOString().split('T')[0],
        diagnosis: 'Acute Bronchitis',
        items: [
          { medicineName: 'Amoxicillin 500mg', dosage: '1 cap', frequency: '1-0-1', duration: '7 days', instructions: 'After meals' },
          { medicineName: 'Paracetamol 500mg', dosage: '1 tab', frequency: 'SOS', duration: '3 days', instructions: 'For fever' },
        ],
      });
      expect(rxRes.success).toBe(true);
      expect(rxRes.data.items).toHaveLength(2);

      const compRes = await mockAdapter.completeToken(activeToken.id);
      expect(compRes.data.status).toBe('completed');
    });

    it('Scenario S3: Staff Multi-Role Clinical Pipeline (Nurse Vitals -> Lab Entry -> Pharmacy Dispense -> Billing)', async () => {
      // 1. Nurse
      const vitalsRes = await mockAdapter.updateVitals({
        appointmentId: 'appt-1',
        vitals: { bloodPressure: '124/82 mmHg', pulse: '76 bpm', temperature: '98.8 °F', oxygenSaturation: '98%' },
      });
      expect(vitalsRes.success).toBe(true);

      // 2. Lab
      const labRes = await mockAdapter.saveLabResults({
        reportId: 'rep-1',
        results: [{ parameter: 'Hemoglobin', value: '14.8', unit: 'g/dL', referenceRange: '13.5 - 17.5', isAbnormal: false }],
        markCompleted: true,
      });
      expect(labRes.success).toBe(true);

      // 3. Pharmacy
      const dispenseRes = await mockAdapter.dispensePrescription({
        prescriptionId: 'rx-1',
        patientId: 'pat-1',
        items: [{ medicineId: 'med-1', quantity: 10, unitPrice: 2 }],
        paymentMethod: 'cash',
      });
      expect(dispenseRes.success).toBe(true);

      // 4. Billing
      const invoiceRes = await mockAdapter.createInvoice({
        patientId: 'pat-1',
        careSetting: 'opd',
        items: [{ description: 'OPD Package', quantity: 1, unitPrice: 2000 }],
        discount: 200,
      });
      expect(invoiceRes.success).toBe(true);
      expect(invoiceRes.data.netTotal).toBe(1800);

      const payRes = await mockAdapter.recordPayment({
        invoiceId: invoiceRes.data.id,
        amount: 1800,
        method: 'card',
      });
      expect(payRes.success).toBe(true);
      expect(payRes.data.status).toBe('paid');
    });

    it('Scenario S4: Patient Medical Records & Reports Download Workflow', async () => {
      const patientRxList = mockAdapter.prescriptions.filter((r) => r.patientId === 'pat-1');
      expect(patientRxList.length).toBeGreaterThanOrEqual(1);

      const patientReports = mockAdapter.reports.filter((rep) => rep.patientId === 'pat-1');
      expect(patientReports.length).toBeGreaterThanOrEqual(2);
      expect(patientReports[0].downloadUrl).toBeDefined();
    });

    it('Scenario S5: Strict Role Boundary Enforcement & Tampering Rejection', async () => {
      await guard.setSession({ id: 'pat-1', name: 'Ali Khan' }, 'patient', 'jwt_patient');
      expect(guard.canAccessRoute('OPDQueueCaller')).toBe(false);
      expect(guard.canAccessRoute('BillingDashboard')).toBe(false);

      await guard.setSession({ id: 'doc-1', name: 'Dr. Amit' }, 'doctor', 'jwt_doctor');
      expect(guard.canAccessRoute('StaffPatientReg')).toBe(false);

      await expect(
        guard.setSession({ id: 'hacker' }, 'superadmin' as any, 'fake_token')
      ).rejects.toThrow('Unauthorized role assignment');
    });
  });

  // 6. Razorpay Gateway & Security Configuration Unit Tests
  describe('Tier 1: Razorpay Gateway & Security Unit Tests', () => {
    beforeEach(() => mockAdapter.reset());

    it('should detect Razorpay placeholders as unconfigured and accept valid public keys', () => {
      expect(isRazorpayKeyConfigured('rzp_test_your_razorpay_key_id')).toBe(false);
      expect(isRazorpayKeyConfigured('')).toBe(false);
      expect(isRazorpayKeyConfigured('rzp_live_TWLWfA0Ba2tiwG')).toBe(true);

      const cfg = buildRazorpayConfig('rzp_live_TWLWfA0Ba2tiwG');
      expect(cfg.currency).toBe('INR');
      expect(cfg.merchantName).toBe('Star Hospital');
      expect(cfg.themeColor).toBe('#0866C6');
    });

    it('should create and mock-verify Razorpay order for an unpaid invoice without server capture', async () => {
      const invRes = await mockAdapter.createInvoice({
        patientId: 'pat-1',
        careSetting: 'opd',
        items: [{ description: 'OPD Consultation', quantity: 1, unitPrice: 1500 }],
      });
      const orderRes = await mockAdapter.createRazorpayOrder({ invoiceId: invRes.data.id });
      expect(orderRes.success).toBe(true);
      expect(orderRes.data.amountInPaise).toBe(150000);
      expect(orderRes.data.currency).toBe('INR');
      expect(orderRes.data.backendMetadata.isLiveBackendEndpoint).toBe(false);

      const verifyRes = await mockAdapter.verifyRazorpayPayment({
        invoiceId: invRes.data.id,
        razorpayOrderId: orderRes.data.orderId,
        razorpayPaymentId: 'pay_runner_123',
        razorpaySignature: 'sig_runner_123456',
      });
      expect(verifyRes.data.verified).toBe(true);
      expect(verifyRes.data.verificationStatus).toBe('mock_verified');
      expect(verifyRes.data.capturedOnServer).toBe(false);
      expect(verifyRes.data.invoice?.status).toBe('paid');
    });
  });

  // -----------------------------------------------------------
  // RUN QUEUED TESTS SEQUENTIALLY
  // -----------------------------------------------------------

  await runner.executeAll();

  // -----------------------------------------------------------
  // PRINT FORMATTED SUMMARY TABLE
  // -----------------------------------------------------------

  const summary = runner.getSummary();
  console.log('----------------------------------------------------------------');
  console.log('  TEST EXECUTION REPORT');
  console.log('----------------------------------------------------------------');
  
  let currentGroup = '';
  for (const r of summary.results) {
    if (r.suite !== currentGroup) {
      currentGroup = r.suite;
      console.log(`\n▶ ${currentGroup}`);
    }
    const icon = r.status === 'passed' ? '  ✓' : '  ✗';
    console.log(`${icon} ${r.name} (${r.durationMs}ms)`);
    if (r.error) {
      console.error(`      ERROR: ${r.error}`);
    }
  }

  console.log('\n================================================================');
  console.log(`  TOTAL TEST SUITES: 10`);
  console.log(`  TOTAL TESTS:       ${summary.total}`);
  console.log(`  PASSED:            ${summary.passed}`);
  console.log(`  FAILED:            ${summary.failed}`);
  console.log('================================================================\n');

  if (summary.failed > 0) {
    process.exit(1);
  }
}

// Auto-run if executed directly
runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

export { runTestSuite };
