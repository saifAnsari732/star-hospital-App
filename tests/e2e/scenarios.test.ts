/**
 * Tier 4 Real-World Application Scenarios (S1 - S5)
 * Comprehensive End-to-End Multi-Role Workflow Verification
 * Tested against Mock Adapter Engine and System State
 */

import { mockAdapter } from '../../src/services/mock/mockAdapter';
import { SessionGuardSimulator } from '../navigation/roleNavigation.test';
import { hasPermission } from '../unit/staffRolePermissions.test';

describe('Tier 4: Real-World Application Scenarios (S1 - S5)', () => {
  let sessionGuard: SessionGuardSimulator;

  beforeEach(() => {
    mockAdapter.reset();
    sessionGuard = new SessionGuardSimulator();
  });

  // -----------------------------------------------------------
  // SCENARIO S1: Patient Outpatient Journey
  // -----------------------------------------------------------
  it('Scenario S1: Patient Outpatient Journey (Auth -> Search -> Booking -> OPD Token -> Queue Tracking)', async () => {
    // Step 1: Patient Login
    const loginRes = await mockAdapter.login({
      login: 'ali.khan@gmail.com',
      password: 'patientPass',
      role: 'patient',
    });
    expect(loginRes.success).toBe(true);
    await sessionGuard.setSession(loginRes.data.user, 'patient', loginRes.data.token);

    // Step 2: Search Doctors directory
    const doctors = mockAdapter.doctors;
    expect(doctors.length).toBeGreaterThanOrEqual(3);
    const selectedDoctor = doctors.find((d) => d.department === 'General Physician');
    expect(selectedDoctor).toBeDefined();

    // Step 3: Multi-step Appointment Booking
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() + 2);
    const dateStr = bookingDate.toISOString().split('T')[0];

    const apptRes = await mockAdapter.bookAppointment({
      patientId: loginRes.data.user.id,
      doctorId: selectedDoctor!.id,
      date: dateStr,
      startTime: '10:30 AM',
      mode: 'in_person',
      remarks: 'Persistent seasonal cough',
    });
    expect(apptRes.success).toBe(true);
    expect(apptRes.data.status).toBe('scheduled');

    // Step 4: High-Priority OPD Token Generation
    const tokenRes = await mockAdapter.generateToken(loginRes.data.user.id, selectedDoctor!.id, 'first_visit');
    expect(tokenRes.success).toBe(true);
    const token = tokenRes.data;
    expect(token.tokenNumber).toMatch(/^A-\d+$/);

    // Step 5: Live 3-Step Queue Stepper Inspection
    expect(token.liveSteps).toHaveLength(3);
    expect(token.liveSteps[0].status).toBe('completed');
    expect(token.liveSteps[1].status).toBe('current');
    expect(token.liveSteps[2].status).toBe('waiting');
    expect(token.queuePosition).toBeGreaterThan(0);
    expect(token.estimatedWaitMinutes).toBe(token.queuePosition * 10);
  });

  // -----------------------------------------------------------
  // SCENARIO S2: Doctor Consultation & Prescription Builder
  // -----------------------------------------------------------
  it('Scenario S2: Doctor Consultation & Prescription (Auth -> Call Next -> Vitals -> Rx Builder -> Saved)', async () => {
    // Step 1: Doctor Login
    const doctorLogin = await mockAdapter.login({
      login: 'dr.amit@starhospital.com',
      password: 'doctorPass',
      role: 'doctor',
    });
    expect(doctorLogin.success).toBe(true);
    await sessionGuard.setSession(doctorLogin.data.user, 'doctor', doctorLogin.data.token);

    // Step 2: Doctor calls next patient in OPD Queue
    const callRes = await mockAdapter.callNextToken(doctorLogin.data.user.id);
    expect(callRes.success).toBe(true);
    expect(callRes.data).not.toBeNull();
    const activeToken = callRes.data!;
    expect(activeToken.status).toBe('in_consultation');
    expect(activeToken.tokenNumber).toBe('A-102');

    // Step 3: Doctor inspects recorded vitals for patient's appointment
    const appointment = mockAdapter.appointments.find((a) => a.patientId === activeToken.patientId);
    expect(appointment).toBeDefined();

    // Step 4: Doctor builds prescription with multiple medicines
    const rxRes = await mockAdapter.createPrescription({
      patientId: activeToken.patientId,
      doctorId: doctorLogin.data.user.id,
      date: new Date().toISOString().split('T')[0],
      diagnosis: 'Acute Bronchitis',
      symptoms: 'Productive cough, chest tightness',
      advice: 'Steam inhalation twice daily, plenty of warm water',
      items: [
        {
          medicineName: 'Amoxicillin 500mg',
          dosage: '1 capsule',
          frequency: 'Three times daily (1-1-1)',
          duration: '7 days',
          instructions: 'After food',
        },
        {
          medicineName: 'Paracetamol 500mg',
          dosage: '1 tablet',
          frequency: 'As needed (SOS)',
          duration: '3 days',
          instructions: 'Take if fever > 100 F',
        },
        {
          medicineName: 'Omeprazole 20mg',
          dosage: '1 capsule',
          frequency: 'Once daily (1-0-0)',
          duration: '7 days',
          instructions: 'Before breakfast',
        },
      ],
    });

    expect(rxRes.success).toBe(true);
    expect(rxRes.data.prescriptionNumber).toMatch(/^RX-\d{4}-\d{4}$/);
    expect(rxRes.data.items).toHaveLength(3);

    // Step 5: Doctor marks consultation as completed
    const compRes = await mockAdapter.completeToken(activeToken.id);
    expect(compRes.data.status).toBe('completed');
  });

  // -----------------------------------------------------------
  // SCENARIO S3: Staff Clinical Multi-Role Operations
  // -----------------------------------------------------------
  it('Scenario S3: Staff Multi-Role Clinical Pipeline (Nurse Vitals -> Lab Entry -> Pharmacy Dispense -> Billing)', async () => {
    // Step 1: Nurse records patient clinical vitals
    expect(hasPermission('nurse', 'vitals:record')).toBe(true);
    const vitalsRes = await mockAdapter.updateVitals({
      appointmentId: 'appt-1',
      vitals: {
        bloodPressure: '124/82 mmHg',
        pulse: '76 bpm',
        temperature: '98.8 °F',
        weight: '72 kg',
        oxygenSaturation: '98%',
      },
    });
    expect(vitalsRes.success).toBe(true);
    expect(vitalsRes.data.vitals?.bloodPressure).toBe('124/82 mmHg');

    // Step 2: Lab technician enters test results
    expect(hasPermission('laboratorist', 'lab:results_enter')).toBe(true);
    const labRes = await mockAdapter.saveLabResults({
      reportId: 'rep-1',
      results: [
        { parameter: 'Hemoglobin', value: '14.8', unit: 'g/dL', referenceRange: '13.5 - 17.5', isAbnormal: false, flag: 'Normal' },
        { parameter: 'WBC Count', value: '6,800', unit: '/mcL', referenceRange: '4,500 - 11,000', isAbnormal: false, flag: 'Normal' },
      ],
      resultSummary: 'Normal complete blood count',
      markCompleted: true,
    });
    expect(labRes.success).toBe(true);
    expect(labRes.data.status).toBe('completed');

    // Step 3: Pharmacist dispenses medicines and updates stock
    expect(hasPermission('pharmacist', 'pharmacy:dispense')).toBe(true);
    const dispenseRes = await mockAdapter.dispensePrescription({
      prescriptionId: 'rx-1',
      patientId: 'pat-1',
      items: [
        { medicineId: 'med-1', quantity: 10, unitPrice: 2 },
        { medicineId: 'med-2', quantity: 14, unitPrice: 15 },
      ],
      paymentMethod: 'cash',
    });
    expect(dispenseRes.success).toBe(true);
    expect(dispenseRes.data.status).toBe('dispensed');

    // Step 4: Billing clerk generates invoice and records payment
    expect(hasPermission('billing', 'billing:invoice_create')).toBe(true);
    const invoiceRes = await mockAdapter.createInvoice({
      patientId: 'pat-1',
      careSetting: 'opd',
      items: [
        { description: 'Consultation Fee', category: 'Consultation', quantity: 1, unitPrice: 1000 },
        { description: 'Lab CBC Test', category: 'Laboratory', quantity: 1, unitPrice: 800 },
        { description: 'Pharmacy Dispensed Medicines', category: 'Pharmacy', quantity: 1, unitPrice: 230 },
      ],
      discount: 100,
    });
    expect(invoiceRes.success).toBe(true);
    expect(invoiceRes.data.grossTotal).toBe(2030);
    expect(invoiceRes.data.netTotal).toBe(1930);
    expect(invoiceRes.data.status).toBe('unpaid');

    // Record checkout payment
    const payRes = await mockAdapter.recordPayment({
      invoiceId: invoiceRes.data.id,
      amount: 1930,
      method: 'card',
      transactionRef: 'POS-AUTH-99128',
    });
    expect(payRes.success).toBe(true);
    expect(payRes.data.status).toBe('paid');
    expect(payRes.data.balanceDue).toBe(0);
  });

  // -----------------------------------------------------------
  // SCENARIO S4: Patient Medical Records & Reports
  // -----------------------------------------------------------
  it('Scenario S4: Patient Medical Records & Reports Download Workflow', async () => {
    // Step 1: Patient fetches prescriptions list
    const patientRxList = mockAdapter.prescriptions.filter((r) => r.patientId === 'pat-1');
    expect(patientRxList.length).toBeGreaterThanOrEqual(1);
    const rx = patientRxList[0];
    expect(rx.prescriptionNumber).toBeDefined();
    expect(rx.items.length).toBeGreaterThan(0);

    // Step 2: Patient views laboratory reports list
    const patientReports = mockAdapter.reports.filter((rep) => rep.patientId === 'pat-1');
    expect(patientReports.length).toBeGreaterThanOrEqual(2);

    // Step 3: Verify report details and download link
    const cbcReport = patientReports.find((r) => r.testName.includes('Blood Count'));
    expect(cbcReport).toBeDefined();
    expect(cbcReport?.status).toBe('completed');
    expect(cbcReport?.downloadUrl).toBeDefined();
    expect(cbcReport?.results).toBeDefined();
    expect(cbcReport?.results?.length).toBeGreaterThan(0);
  });

  // -----------------------------------------------------------
  // SCENARIO S5: Strict Role Boundary Enforcement & Tampering Rejection
  // -----------------------------------------------------------
  it('Scenario S5: Role Boundary Enforcement & Unauthorized Access Rejection', async () => {
    // 1. Patient authenticated session
    await sessionGuard.setSession({ id: 'pat-1', name: 'Ali Khan' }, 'patient', 'jwt_patient');

    // Patient attempting to navigate to doctor queue caller or billing
    expect(sessionGuard.canAccessRoute('OPDQueueCaller')).toBe(false);
    expect(sessionGuard.canAccessRoute('BillingDashboard')).toBe(false);
    expect(sessionGuard.canAccessRoute('NurseVitals')).toBe(false);

    // 2. Doctor session attempting staff administration
    await sessionGuard.setSession({ id: 'doc-1', name: 'Dr. Amit' }, 'doctor', 'jwt_doctor');
    expect(sessionGuard.canAccessRoute('StaffPatientReg')).toBe(false);
    expect(sessionGuard.canAccessRoute('BillingDashboard')).toBe(false);

    // 3. Nurse attempting pharmacist or billing operations
    expect(hasPermission('nurse', 'pharmacy:dispense')).toBe(false);
    expect(hasPermission('nurse', 'billing:invoice_create')).toBe(false);
    expect(hasPermission('nurse', 'lab:results_enter')).toBe(false);

    // 4. Unauthorized role tampering throws error
    await expect(
      sessionGuard.setSession({ id: 'hacker' }, 'superadmin' as any, 'fake_token')
    ).rejects.toThrow('Unauthorized role assignment');
  });
});
