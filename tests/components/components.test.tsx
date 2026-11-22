/**
 * Component Tests: UI Components Rendering & Visual Tokens
 * Verifies rendering of DoctorKpiCard, TokenHeroCard, DesignationBadge, StaffKpiCard
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Users } from 'lucide-react-native';
import { DoctorKpiCard } from '../../src/components/doctor/DoctorKpiCard';
import { TokenHeroCard } from '../../src/components/patient/TokenHeroCard';
import { DesignationBadge } from '../../src/components/staff/DesignationBadge';
import { StaffKpiCard } from '../../src/components/staff/StaffKpiCard';
import { DoctorCard } from '../../src/components/patient/DoctorCard';
import { ReportCard } from '../../src/components/patient/ReportCard';
import { CalendarSlotPicker } from '../../src/components/patient/CalendarSlotPicker';
import { LiveQueueStepper } from '../../src/components/patient/LiveQueueStepper';
import { TEMPLATE_IMAGES, getDoctorAvatarSource } from '../../src/assets/images';
import { OPDToken } from '../../src/types/opdToken';

describe('UI Component Rendering Tests', () => {
  const sampleToken: OPDToken = {
    id: 'tok-102',
    tokenNumber: 'A-102',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientMrn: 'P-00102',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    servingToken: 'A-101',
    queuePosition: 2,
    estimatedWaitMinutes: 15,
    status: 'arrived',
    roomNo: 'Room 104',
    generatedAt: '2026-11-15T09:15:00Z',
    liveSteps: [
      { tokenNumber: 'A-100', status: 'completed' },
      { tokenNumber: 'A-101', status: 'current' },
      { tokenNumber: 'A-102', status: 'waiting' },
    ],
  };

  // Test 1: DoctorKpiCard renders title, value and subtitle
  it('renders DoctorKpiCard with title, value, and color theme accurately', async () => {
    const { getByText } = await render(
      <DoctorKpiCard
        title="Today OPD"
        value={320}
        subtitle="Patients waiting: 14"
        color="blue"
      />
    );

    expect(getByText('Today OPD')).toBeTruthy();
    expect(getByText('320')).toBeTruthy();
    expect(getByText('Patients waiting: 14')).toBeTruthy();
  });

  // Test 2: TokenHeroCard renders giant token number and queue stats
  it('renders TokenHeroCard displaying giant token A-102 and estimated wait time', async () => {
    const { getByText } = await render(
      <TokenHeroCard token={sampleToken} showActions={true} />
    );

    expect(getByText('Your Token Number')).toBeTruthy();
    expect(getByText('A-102')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText(/15 mins/)).toBeTruthy();
    expect(getByText('Dr. Amit Sharma')).toBeTruthy();
  });

  // Test 3: DesignationBadge renders designation label for staff roles
  it('renders DesignationBadge with correct label for nurse and pharmacist', async () => {
    const { getByText: getNurseText } = await render(
      <DesignationBadge designation="nurse" />
    );
    expect(getNurseText('Staff Nurse')).toBeTruthy();

    const { getByText: getPharmText } = await render(
      <DesignationBadge designation="pharmacist" />
    );
    expect(getPharmText('Pharmacist')).toBeTruthy();
  });

  // Test 4: StaffKpiCard renders hospital KPI metrics
  it('renders StaffKpiCard with label, count, and subtitle', async () => {
    const { getByText } = await render(
      <StaffKpiCard
        label="Total Patients"
        value="1,250"
        icon={Users}
        trendText="+12% from last week"
      />
    );

    expect(getByText('Total Patients')).toBeTruthy();
    expect(getByText('1,250')).toBeTruthy();
    expect(getByText('+12% from last week')).toBeTruthy();
  });

  // Test 5: getDoctorAvatarSource resolves distinct HD portraits and handles empty/null boundary inputs + dynamic backend doctors
  it('resolves distinct doctor portraits for all 6 doctors, hashes dynamic backend doctors deterministically, and falls back safely on null/empty inputs', () => {
    expect(getDoctorAvatarSource('Dr. Amit Sharma')).toBe(TEMPLATE_IMAGES.drAmit);
    expect(getDoctorAvatarSource('Dr. Priya Mehta')).toBe(TEMPLATE_IMAGES.drPriya);
    expect(getDoctorAvatarSource('Dr. Rakesh Verma')).toBe(TEMPLATE_IMAGES.drRakesh);
    expect(getDoctorAvatarSource('Dr. Sara Khan')).toBe(TEMPLATE_IMAGES.drSara);
    expect(getDoctorAvatarSource('Dr. Hassan Raza')).toBe(TEMPLATE_IMAGES.drHassan);
    expect(getDoctorAvatarSource('Dr. Ayesha Siddiqui')).toBe(TEMPLATE_IMAGES.drAyesha);
    expect(getDoctorAvatarSource(null)).toBe(TEMPLATE_IMAGES.drAmit);
    expect(getDoctorAvatarSource(undefined)).toBe(TEMPLATE_IMAGES.drAmit);
    expect(getDoctorAvatarSource('')).toBe(TEMPLATE_IMAGES.drAmit);
    expect(getDoctorAvatarSource('   ')).toBe(TEMPLATE_IMAGES.drAmit);

    // Dynamic backend doctors should deterministically map to valid portraits and not all collapse to drAmit
    const dynamicPool = [
      'Dr. Vikram Singh',
      'Dr. Zoya Ali',
      'Dr. Farhan Qureshi',
      'Dr. Meera Nair',
      'Dr. Kabir Malhotra',
      'Dr. Sana Sheikh',
    ].map((name) => getDoctorAvatarSource(name));
    const uniquePortraits = new Set(dynamicPool);
    expect(uniquePortraits.size).toBeGreaterThan(1);
    expect(getDoctorAvatarSource('Dr. Vikram Singh')).toBe(
      getDoctorAvatarSource('Dr. Vikram Singh')
    );
  });

  // Test 7: CalendarSlotPicker dynamically recalculates days in month when navigating months
  it('recalculates daysInMonth accurately when navigating from November (30 days) to October/December (31 days)', async () => {
    const onDateChange = jest.fn();
    const { getByText, queryByText, getByLabelText } = await render(
      <CalendarSlotPicker initialDate="2026-11-15" onDateChange={onDateChange} />
    );

    expect(getByText('November 2026')).toBeTruthy();
    expect(getByText('30')).toBeTruthy();
    expect(queryByText('31')).toBeNull();

    await fireEvent.press(getByLabelText('Next Month'));
    expect(getByText('December 2026')).toBeTruthy();
    expect(getByText('31')).toBeTruthy();
    expect(onDateChange).toHaveBeenCalledWith('2026-12-15');
  });

  // Test 8: LiveQueueStepper renders 3-step queue tokens without duplicating token text inside waiting circle
  it('renders LiveQueueStepper with single token label per step', async () => {
    const { getAllByText } = await render(
      <LiveQueueStepper currentTokenNumber="A-102" servingTokenNumber="A-101" />
    );
    expect(getAllByText('A-100')).toHaveLength(1);
    expect(getAllByText('A-101')).toHaveLength(1);
    expect(getAllByText('A-102')).toHaveLength(1);
  });

  // Test 6: DoctorCard and ReportCard render template UI details accurately
  it('renders DoctorCard booking variant and ReportCard with LAB tag for Blood Test Report', async () => {
    const { getByText: getDocText } = await render(
      <DoctorCard
        doctor={{
          id: 'doc-2',
          name: 'Dr. Priya Mehta',
          department: 'Cardiologist',
          qualification: 'MD, DM',
          experienceYears: 12,
          consultationFee: 2500,
          rating: 4.9,
          reviewCount: 1840,
          isAvailableToday: true,
        }}
        variant="booking"
        showBookButton={true}
        onBookPress={() => {}}
      />
    );
    expect(getDocText('Dr. Priya Mehta')).toBeTruthy();
    expect(getDocText('Cardiologist')).toBeTruthy();
    expect(getDocText('Exp. 12+ years')).toBeTruthy();
    expect(getDocText('Book')).toBeTruthy();

    const { getByText: getRepText, getAllByText: getAllRepText } = await render(
      <ReportCard
        report={{
          id: 'rep-1',
          reportNumber: 'REP-8821',
          type: 'lab',
          testName: 'Blood Test Report',
          category: 'Hematology',
          date: '15 Nov 2026',
          patientId: 'pat-1',
          patientName: 'Rahul Sharma',
          patientMrn: 'P-00102',
          doctorId: 'doc-1',
          doctorName: 'Dr. Amit Sharma',
          status: 'completed',
          results: [],
        }}
      />
    );
    expect(getRepText('Blood Test Report')).toBeTruthy();
    expect(getRepText('LAB')).toBeTruthy();
    expect(getAllRepText('Download').length).toBeGreaterThanOrEqual(1);
  });
});
