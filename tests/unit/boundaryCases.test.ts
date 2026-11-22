/**
 * Tier 2 Boundary & Corner Cases Tests
 * Tests boundary conditions, edge cases, input sanitization, and resource limits
 */

import { mockAdapter } from '../../src/services/mock/mockAdapter';

describe('Tier 2: Boundary & Corner Cases', () => {
  beforeEach(() => {
    mockAdapter.reset();
  });

  // Corner Case 1: Phone number format normalization
  it('should accept phone numbers with various formats (spaces, hyphens, country codes)', async () => {
    const validPhones = [
      '+92 300 1234567',
      '0300-1234567',
      '+923001234567',
      '92 300 1234567',
      '(0300) 1234567',
    ];

    for (const phone of validPhones) {
      const res = await mockAdapter.sendOtp(phone, 'patient');
      expect(res.success).toBe(true);
      expect(res.data.verificationId).toBeDefined();
    }
  });

  // Boundary Case 2: Sub-10 digit phone rejection
  it('should reject phone numbers with fewer than 10 digits', async () => {
    const invalidPhones = ['123', '123456789', '   ', '+92 12'];

    for (const phone of invalidPhones) {
      await expect(mockAdapter.sendOtp(phone, 'patient')).rejects.toThrow(
        'Please enter a valid 10-digit mobile number'
      );
    }
  });

  // Boundary Case 3: Invalid OTP length boundary
  it('should reject OTPs that are not exactly 6 characters', async () => {
    const badOtps = ['123', '12345', '1234567', ''];

    for (const otp of badOtps) {
      await expect(mockAdapter.verifyOtp('+92 300 1234567', otp, 'patient')).rejects.toThrow(
        'Invalid OTP code'
      );
    }
  });

  // Boundary Case 4: Zero medicine items in prescription
  it('should reject prescription creation when items array is empty', async () => {
    await expect(
      mockAdapter.createPrescription({
        patientId: 'pat-1',
        doctorId: 'doc-1',
        date: '2026-11-20',
        items: [],
      })
    ).rejects.toThrow('Prescription must include at least one medicine item');
  });

  // Boundary Case 5: Maximum length vitals & extreme clinical readings
  it('should accept valid high-stress clinical vitals within physiological limits', async () => {
    const response = await mockAdapter.updateVitals({
      appointmentId: 'appt-1',
      vitals: {
        bloodPressure: '220/130 mmHg', // Hypertensive crisis
        pulse: '180 bpm',             // Tachycardia
        temperature: '105.4 °F',       // Hyperpyrexia
        weight: '198.5 kg',            // Severe obesity
        oxygenSaturation: '78%',       // Severe hypoxia
      },
    });

    expect(response.success).toBe(true);
    expect(response.data.vitals?.bloodPressure).toBe('220/130 mmHg');
    expect(response.data.vitals?.temperature).toBe('105.4 °F');
    expect(response.data.vitals?.oxygenSaturation).toBe('78%');
  });

  // Boundary Case 6: Past date booking rejection
  it('should reject appointment booking with yesterday date', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    await expect(
      mockAdapter.bookAppointment({
        patientId: 'pat-1',
        doctorId: 'doc-1',
        date: yesterdayStr,
        startTime: '10:00 AM',
        mode: 'in_person',
      })
    ).rejects.toThrow('Cannot book an appointment for a past date');
  });

  // Boundary Case 7: High discount in billing
  it('should compute net total to zero if discount equals or exceeds gross total', async () => {
    const response = await mockAdapter.createInvoice({
      patientId: 'pat-1',
      careSetting: 'opd',
      items: [{ description: 'General Consultation', quantity: 1, unitPrice: 1000 }],
      discount: 1500, // Exceeds gross 1000
    });

    expect(response.success).toBe(true);
    expect(response.data.grossTotal).toBe(1000);
    expect(response.data.discount).toBe(1500);
    expect(response.data.netTotal).toBe(0); // Clamped at 0
    expect(response.data.balanceDue).toBe(0);
  });

  // Boundary Case 8: Stock reduction down to 0
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
