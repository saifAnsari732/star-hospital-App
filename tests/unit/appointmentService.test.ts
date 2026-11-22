/**
 * Tier 1 Unit Tests: Appointment Service
 * Feature: Slot availability, booking clash detection, cancellation, rescheduling, vitals
 * Minimum requirement: >= 5 tests
 */

import { mockAdapter } from '../../src/services/mock/mockAdapter';

describe('AppointmentService Unit Tests', () => {
  beforeEach(() => {
    mockAdapter.reset();
  });

  // Test 1: Successful booking
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
    expect(response.data.id).toBeDefined();
    expect(response.data.status).toBe('scheduled');
    expect(response.data.patientName).toBe('Ali Khan');
    expect(response.data.doctorName).toBe('Dr. Amit Sharma');
    expect(response.data.consultationFee).toBe(1000);
  });

  // Test 2: Booking clash detection
  it('should detect and reject booking clash for the same doctor, date, and time slot', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const dateStr = futureDate.toISOString().split('T')[0];

    // Book first appointment
    await mockAdapter.bookAppointment({
      patientId: 'pat-1',
      doctorId: 'doc-2',
      date: dateStr,
      startTime: '10:00 AM',
      mode: 'in_person',
    });

    // Attempt duplicate booking for same doctor at same slot
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

  // Test 3: Past date validation
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

  // Test 4: Appointment cancellation
  it('should cancel an active appointment and append cancellation reason to remarks', async () => {
    const response = await mockAdapter.cancelAppointment('appt-1', 'Patient has urgent conflict');

    expect(response.success).toBe(true);
    expect(response.data.status).toBe('cancelled');
    expect(response.data.remarks).toContain('Cancelled: Patient has urgent conflict');
  });

  // Test 5: Prevention of completed appointment cancellation
  it('should reject cancellation of an appointment that is already marked completed', async () => {
    await expect(
      mockAdapter.cancelAppointment('appt-2', 'Trying to cancel completed')
    ).rejects.toThrow('Completed appointments cannot be cancelled');
  });

  // Test 6: Rescheduling appointment
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
    expect(response.data.remarks).toContain('Rescheduled: Shifted schedule');
  });

  // Test 7: Recording clinical vitals
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
    expect(response.data.vitals?.oxygenSaturation).toBe('99%');
    expect(response.data.vitals?.recordedAt).toBeDefined();
  });
});
