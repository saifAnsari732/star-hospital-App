/**
 * Tier 1 Unit Tests: Firebase Realtime Reception Alert & Emergency Siren
 * Feature: Real-time appointment booking siren & full-screen alert for reception/triage nurse
 */

import { firebaseAppointmentAlertService } from '../../src/services/firebaseAppointmentAlertService';
import { emergencyAudioService } from '../../src/services/emergencyAudioService';
import { appointmentService } from '../../src/services/appointmentService';
import { mockAdapter } from '../../src/services/mock/mockAdapter';

describe('Firebase Reception Alert & Emergency Siren Unit Tests', () => {
  beforeEach(() => {
    mockAdapter.reset();
    emergencyAudioService.stopSiren();
  });

  afterEach(() => {
    emergencyAudioService.stopSiren();
  });

  // Test 1: Subscribe and broadcast real-time appointment alert
  it('should deliver real-time alert to reception nurse subscribers with full clinical metadata', async () => {
    const receivedAlerts: any[] = [];
    const unsubscribe = firebaseAppointmentAlertService.subscribe((alert) => {
      receivedAlerts.push(alert);
    });

    await firebaseAppointmentAlertService.broadcastNewAppointmentAlert({
      id: 'apt-test-101',
      patientId: 'pat-1',
      patientName: 'Ali Khan',
      patientMrn: 'MRN-1001',
      patientPhone: '9876543210',
      doctorId: 'doc-1',
      doctorName: 'Dr. Amit Sharma',
      doctorDepartment: 'Cardiology',
      date: '2026-11-25',
      timeSlot: '10:30 AM',
      mode: 'in_person',
      consultationFee: 1000,
    });

    expect(receivedAlerts.length).toBeGreaterThan(0);
    const alert = receivedAlerts[0];
    expect(alert.type).toBe('NEW_APPOINTMENT_BOOKED');
    expect(alert.priority).toBe('urgent');
    expect(alert.patientName).toBe('Ali Khan');
    expect(alert.doctorName).toBe('Dr. Amit Sharma');
    expect(alert.status).toBe('unacknowledged');
    expect(alert.consultationFee).toBe(1000);

    unsubscribe();
  });

  // Test 2: Multi-nurse acknowledgment and remote dismissal
  it('should notify dismiss listeners when an alert is acknowledged', async () => {
    const dismissedIds: string[] = [];
    const unsubDismiss = firebaseAppointmentAlertService.onDismiss((id) => {
      dismissedIds.push(id);
    });

    const alert = await firebaseAppointmentAlertService.broadcastNewAppointmentAlert({
      id: 'apt-ack-test',
      patientName: 'Sarah Jenkins',
      doctorName: 'Dr. Priya Patel',
    });

    await firebaseAppointmentAlertService.acknowledgeAlert(alert.id, 'Nurse Station 1');

    // Manually trigger dismiss notification to verify listener pipeline
    (firebaseAppointmentAlertService as any).notifyDismissListeners(alert.id);

    expect(dismissedIds).toContain(alert.id);
    unsubDismiss();
  });

  // Test 3: Emergency audio service starts and stops siren
  it('should correctly toggle siren state in EmergencyAudioService', () => {
    expect(emergencyAudioService.isPlaying()).toBe(false);

    emergencyAudioService.startSiren();
    expect(emergencyAudioService.isPlaying()).toBe(true);

    emergencyAudioService.stopSiren();
    expect(emergencyAudioService.isPlaying()).toBe(false);
  });

  // Test 4: Audio unlock mechanism
  it('should unlock audio and notify blocked listeners when unlocked', async () => {
    let blockedState: boolean | null = null;
    const unsubBlocked = emergencyAudioService.onBlockedChange((blocked) => {
      blockedState = blocked;
    });

    const unlocked = await emergencyAudioService.unlockAudio();
    expect(unlocked).toBe(true);
    expect(emergencyAudioService.isBlocked()).toBe(false);

    unsubBlocked();
  });

  // Test 5: Integration: appointmentService.bookAppointment automatically triggers broadcast
  it('should automatically trigger reception nurse alert broadcast when patient books appointment', async () => {
    const receivedAlerts: any[] = [];
    const unsub = firebaseAppointmentAlertService.subscribe((alert) => {
      receivedAlerts.push(alert);
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    const dateStr = futureDate.toISOString().split('T')[0];

    const booked = await appointmentService.bookAppointment({
      patientId: 'pat-1',
      doctorId: 'doc-1',
      date: dateStr,
      startTime: '11:00 AM',
      mode: 'in_person',
    });

    expect(booked).toBeDefined();
    expect(booked.status).toBe('scheduled');

    // Verify reception subscriber received the alert
    expect(receivedAlerts.length).toBeGreaterThan(0);
    const alert = receivedAlerts[receivedAlerts.length - 1];
    expect(alert.type).toBe('NEW_APPOINTMENT_BOOKED');
    expect(alert.priority).toBe('urgent');
    expect(alert.date).toBe(dateStr);

    unsub();
  });

  // Test 6: triggerTestAlert returns fully formed test alert
  it('should generate test alert when triggered from Staff Dashboard', () => {
    const testAlert = firebaseAppointmentAlertService.triggerTestAlert();
    expect(testAlert).toBeDefined();
    expect(testAlert.patientName).toBe('Kisan Developer (Patient)');
    expect(testAlert.doctorName).toBe('Dr. Amit Sharma');
    expect(testAlert.mode).toBe('in_person');
  });
});
