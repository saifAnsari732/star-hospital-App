/**
 * Tier 1 Unit Tests: Prescription Service & Rx Builder
 * Feature: Medicine item calculation, dosage/frequency serialization, dispensing, inventory
 * Minimum requirement: >= 5 tests
 */

import { mockAdapter } from '../../src/services/mock/mockAdapter';

describe('PrescriptionService & Rx Builder Unit Tests', () => {
  beforeEach(() => {
    mockAdapter.reset();
  });

  // Test 1: Successful prescription creation with formatted Rx number
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
    expect(response.data.patientName).toBe('Ali Khan');
    expect(response.data.doctorName).toBe('Dr. Amit Sharma');
    expect(response.data.items.length).toBe(1);
    expect(response.data.items[0].id).toBe('rx-item-1');
  });

  // Test 2: Multi-drug serialization
  it('should accurately serialize multi-medicine regimen with individual dosages and frequencies', async () => {
    const medicines = [
      { medicineName: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'TDS (1-1-1)', duration: '5 days', instructions: 'SOS' },
      { medicineName: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'BD (1-0-1)', duration: '7 days', instructions: 'After meals' },
      { medicineName: 'Omeprazole 20mg', dosage: '1 capsule', frequency: 'OD (1-0-0)', duration: '7 days', instructions: 'Before breakfast' },
    ];

    const response = await mockAdapter.createPrescription({
      patientId: 'pat-1',
      doctorId: 'doc-1',
      date: '2026-11-15',
      items: medicines,
    });

    expect(response.data.items.length).toBe(3);
    expect(response.data.items[0].medicineName).toBe('Paracetamol 500mg');
    expect(response.data.items[1].frequency).toBe('BD (1-0-1)');
    expect(response.data.items[2].instructions).toBe('Before breakfast');
  });

  // Test 3: Reject prescription with zero medicines
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

  // Test 4: Reject medicine with missing required fields
  it('should reject prescription item when medicine name, dosage, or frequency is missing', async () => {
    await expect(
      mockAdapter.createPrescription({
        patientId: 'pat-1',
        doctorId: 'doc-1',
        date: '2026-11-15',
        items: [
          {
            medicineName: '',
            dosage: '500mg',
            frequency: '1-0-1',
            duration: '5 days',
            instructions: 'oral',
          },
        ],
      })
    ).rejects.toThrow('Medicine name is required');

    await expect(
      mockAdapter.createPrescription({
        patientId: 'pat-1',
        doctorId: 'doc-1',
        date: '2026-11-15',
        items: [
          {
            medicineName: 'Cough Syrup',
            dosage: '',
            frequency: '1-0-1',
            duration: '5 days',
            instructions: 'oral',
          },
        ],
      })
    ).rejects.toThrow('Dosage and frequency required');
  });

  // Test 5: Pharmacy dispensing & stock deduction
  it('should mark prescription as dispensed and automatically deduct stock from pharmacy inventory', async () => {
    const med1Before = mockAdapter.medicines.find((m) => m.id === 'med-1')?.availableQuantity || 0;

    const response = await mockAdapter.dispensePrescription({
      prescriptionId: 'rx-1',
      patientId: 'pat-1',
      items: [
        { medicineId: 'med-1', quantity: 15, unitPrice: 2 },
      ],
      paymentMethod: 'cash',
    });

    expect(response.success).toBe(true);
    expect(response.data.status).toBe('dispensed');

    const med1After = mockAdapter.medicines.find((m) => m.id === 'med-1')?.availableQuantity || 0;
    expect(med1After).toBe(med1Before - 15);
  });
});
