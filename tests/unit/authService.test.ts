/**
 * Tier 1 Unit Tests: Authentication Service & RBAC
 * Feature: Login, OTP Verify, Role Resolution, Registration, Logout
 * Minimum requirement: >= 5 tests
 */

import { mockAdapter } from '../../src/services/mock/mockAdapter';

describe('AuthService & RBAC Unit Tests', () => {
  beforeEach(() => {
    mockAdapter.reset();
  });

  // Test 1: Patient login
  it('should successfully authenticate patient with valid email and password', async () => {
    const response = await mockAdapter.login({
      login: 'ali.khan@gmail.com',
      password: 'password123',
      role: 'patient',
    });

    expect(response.success).toBe(true);
    expect(response.data.token).toBeDefined();
    expect(response.data.token).toContain('star_mock_jwt_patient');
    expect(response.data.user.role).toBe('patient');
    expect(response.data.user.email).toBe('ali.khan@gmail.com');
  });

  // Test 2: Doctor login
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

  // Test 3: Staff login with designation
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

  // Test 4: OTP Request & Dispatch
  it('should generate verification ID upon valid phone OTP request', async () => {
    const response = await mockAdapter.sendOtp('+92 300 1234567', 'patient');

    expect(response.success).toBe(true);
    expect(response.data.verificationId).toBeDefined();
    expect(response.data.verificationId).toContain('verify-');
  });

  // Test 5: OTP Verification & Token generation
  it('should successfully verify 6-digit OTP and issue authentication session', async () => {
    const response = await mockAdapter.verifyOtp('+92 300 1234567', '123456', 'patient');

    expect(response.success).toBe(true);
    expect(response.data.token).toContain('star_otp_jwt_patient');
    expect(response.data.user.phone).toContain('300 1234567');
    expect(response.data.user.role).toBe('patient');
  });

  // Test 6: Patient registration creates persistent record
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
    const addedPatient = mockAdapter.patients.find((p) => p.email === 'zainab.bibi@example.com');
    expect(addedPatient).toBeDefined();
    expect(addedPatient?.mrn).toBeDefined();
    expect(response.data.user.name).toBe('Zainab Bibi');
  });

  // Test 7: Error handling for invalid credentials
  it('should reject login attempt when identifier is empty or whitespace', async () => {
    await expect(
      mockAdapter.login({
        login: '   ',
        password: 'pass',
        role: 'patient',
      })
    ).rejects.toThrow('Mobile number or email is required.');
  });

  // Test 8: Error handling for invalid OTP
  it('should reject verification with incorrect OTP code', async () => {
    await expect(
      mockAdapter.verifyOtp('+92 300 1234567', '999999', 'patient')
    ).rejects.toThrow('Incorrect OTP.');
  });
});
