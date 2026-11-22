/**
 * Unit & Screen Interaction Tests for Common Auth & Patient Modules
 * Covers utility functions, registration-to-onboarding flow, navigation contracts,
 * and UI regressions fixed during review.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import {
  resolveEffectivePatientId,
  formatCurrencyPKR,
  mergeAllergiesWithHistory,
} from '../../src/screens/patient/patientUtils';
import { SplashScreen } from '../../src/screens/auth/SplashScreen';
import { PatientRegistrationScreen } from '../../src/screens/auth/PatientRegistrationScreen';
import { NotificationPermissionScreen } from '../../src/screens/auth/NotificationPermissionScreen';
import { ForgotPasswordScreen } from '../../src/screens/auth/ForgotPasswordScreen';
import { QueueStatusScreen } from '../../src/screens/patient/QueueStatusScreen';
import { CancelAppointmentScreen } from '../../src/screens/patient/CancelAppointmentScreen';
import { BillsScreen } from '../../src/screens/patient/BillsScreen';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();
let mockRouteParams: Record<string, any> = {};

jest.mock('@react-navigation/native', () => {
  const ReactActual = require('react');
  return {
    NavigationContext: ReactActual.createContext(undefined),
    useNavigation: () => ({
      navigate: mockNavigate,
      replace: mockReplace,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: mockRouteParams,
    }),
    useFocusEffect: (callback: () => void | (() => void)) => {
      ReactActual.useEffect(() => callback(), [callback]);
    },
  };
});

const mockRegisterPatient = jest.fn().mockResolvedValue(undefined);
const mockLoginWithOtp = jest.fn().mockResolvedValue(undefined);
const mockAuthUser: any = {
  id: 'pat-1001',
  name: 'Ali Khan',
  email: 'ali.khan@gmail.com',
  phone: '+923001234567',
  role: 'patient',
};

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    role: 'patient',
    isAuthenticated: true,
    isLoading: false,
    login: jest.fn(),
    loginWithOtp: mockLoginWithOtp,
    registerPatient: mockRegisterPatient,
    logout: jest.fn(),
  }),
}));

const mockCurrentToken: any = {
  id: 'tok-102',
  tokenNumber: 'A-102',
  patientId: 'pat-1',
  patientName: 'Ali Khan',
  patientMrn: 'P-00102',
  doctorId: 'doc-1',
  doctorName: 'Dr. Amit Sharma',
  department: 'General Physician',
  servingToken: 'A-102',
  queuePosition: 0,
  estimatedWaitMinutes: 0,
  status: 'in_consultation',
  roomNo: 'Room 104',
  generatedAt: '2026-11-15T09:15:00.000Z',
  liveSteps: [
    { tokenNumber: 'A-100', status: 'completed', label: 'Completed' },
    { tokenNumber: 'A-101', status: 'completed', label: 'Completed' },
    { tokenNumber: 'A-102', status: 'current', label: 'In Consultation' },
  ],
};

const mockRefreshQueue = jest.fn().mockResolvedValue(undefined);
const mockFetchTokenStatus = jest.fn().mockResolvedValue(mockCurrentToken);
const mockShareToken = jest.fn().mockResolvedValue(undefined);

jest.mock('../../src/context/OPDTokenContext', () => ({
  useOPDToken: () => ({
    currentToken: mockCurrentToken,
    liveQueue: [mockCurrentToken],
    tokenHistory: [],
    isLoading: false,
    generateToken: jest.fn(),
    fetchTokenStatus: mockFetchTokenStatus,
    refreshQueue: mockRefreshQueue,
    shareToken: mockShareToken,
    callNextToken: jest.fn(),
    completeToken: jest.fn(),
    setCurrentToken: jest.fn(),
  }),
}));

const mockRequestPhoneOtp = jest.fn().mockResolvedValue({
  verificationId: 'mock-verif-123',
  message: 'OTP sent',
});
const mockForgotPassword = jest.fn().mockResolvedValue({
  message: 'Reset instructions sent',
});

jest.mock('../../src/services/authService', () => ({
  authService: {
    requestPhoneOtp: (...args: any[]) => mockRequestPhoneOtp(...args),
    forgotPassword: (...args: any[]) => mockForgotPassword(...args),
    resetPassword: jest.fn().mockResolvedValue({ message: 'Password updated' }),
  },
}));

const mockGetAppointmentById = jest.fn();
const mockCancelAppointment = jest.fn().mockResolvedValue(undefined);

jest.mock('../../src/services/appointmentService', () => ({
  appointmentService: {
    getAppointmentById: (...args: any[]) => mockGetAppointmentById(...args),
    cancelAppointment: (...args: any[]) => mockCancelAppointment(...args),
  },
}));

const mockGetInvoices = jest.fn();

jest.mock('../../src/services/billingService', () => ({
  billingService: {
    getInvoices: (...args: any[]) => mockGetInvoices(...args),
  },
}));

describe('Patient Utilities', () => {
  it('maps demo patient IDs to pat-1 while preserving custom and live IDs', () => {
    expect(resolveEffectivePatientId(undefined)).toBe('pat-1');
    expect(resolveEffectivePatientId('pat-1001')).toBe('pat-1');
    expect(resolveEffectivePatientId('pat-1002')).toBe('pat-1');
    expect(resolveEffectivePatientId('pat-custom-77')).toBe('pat-custom-77');
    expect(resolveEffectivePatientId('user-live-900')).toBe('user-live-900');
  });

  it('formats PKR currency safely including non-finite edge inputs', () => {
    expect(formatCurrencyPKR(1500)).toBe('PKR 1,500');
    expect(formatCurrencyPKR(0)).toBe('PKR 0');
    expect(formatCurrencyPKR(Number.NaN)).toBe('PKR 0');
    expect(formatCurrencyPKR(Number.POSITIVE_INFINITY)).toBe('PKR 0');
  });

  it('merges allergy medical history records without duplicating existing allergies', () => {
    const existing = [
      {
        id: 'alg-1',
        patientId: 'pat-1',
        allergen: 'Penicillin',
        severity: 'severe' as const,
        reaction: 'Hives',
      },
    ];
    const history = [
      {
        id: 'hist-1',
        patientId: 'pat-1',
        category: 'allergy' as const,
        title: 'Penicillin Allergy',
        description: 'SEVERE severity. Reaction: Hives',
        recordedDate: '2026-11-10',
      },
      {
        id: 'hist-2',
        patientId: 'pat-1',
        category: 'allergy' as const,
        title: 'Dust Mites Allergy',
        description: 'MODERATE severity. Reaction: Sneezing and watery eyes',
        recordedDate: '2026-11-11',
      },
      {
        id: 'hist-3',
        patientId: 'pat-1',
        category: 'condition' as const,
        title: 'Asthma',
        description: 'Mild seasonal asthma',
        recordedDate: '2026-11-11',
      },
    ];

    const merged = mergeAllergiesWithHistory(existing, history, 'pat-1');
    expect(merged).toHaveLength(2);
    expect(merged[0].allergen).toBe('Dust Mites');
    expect(merged[0].severity).toBe('moderate');
    expect(merged[0].reaction).toBe('Sneezing and watery eyes');
    expect(merged[1].allergen).toBe('Penicillin');
  });
});

describe('Auth Screens & Registration Flow Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
  });

  it('SplashScreen renders safely outside a Navigator without crashing', async () => {
    jest.useFakeTimers();
    let unmountFn: (() => Promise<void>) | undefined;
    try {
      const rendered = await render(<SplashScreen />);
      unmountFn = rendered.unmount;
      expect(rendered.getByText('Star Hospital')).toBeTruthy();
      expect(rendered.getByText('Care Today... Healthier Tomorrow...')).toBeTruthy();
    } finally {
      if (unmountFn) {
        await unmountFn();
      }
      jest.useRealTimers();
    }
  });

  it('PatientRegistrationScreen registers patient directly with default patient role (no OTP step)', async () => {
    const { getByPlaceholderText, getByLabelText, unmount } = await render(
      <PatientRegistrationScreen />
    );

    await fireEvent.changeText(getByPlaceholderText('Full Name'), 'Zainab Tariq');
    await fireEvent.changeText(getByPlaceholderText('Mobile Number'), '+923009876543');
    await fireEvent.changeText(getByPlaceholderText('Email Address'), 'zainab@example.com');
    await fireEvent.changeText(getByPlaceholderText('Password'), 'Star@123');
    await fireEvent.changeText(getByPlaceholderText('Date of Birth (YYYY-MM-DD)'), '1994-03-10');
    await fireEvent.changeText(getByPlaceholderText('Address'), 'House 12, Model Town, Lahore');

    await fireEvent.press(getByLabelText('Register account'));

    await waitFor(() => {
      expect(mockRegisterPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Zainab Tariq',
          email: 'zainab@example.com',
          phone: '+923009876543',
          password: 'Star@123',
        })
      );
      expect(mockRequestPhoneOtp).not.toHaveBeenCalled();
    });
    await unmount();
  });

  it('NotificationPermissionScreen completes registration when Allow is pressed with pending registrationData', async () => {
    mockRouteParams = {
      role: 'patient',
      registrationData: {
        name: 'Zainab Tariq',
        email: 'zainab@example.com',
        phone: '+923009876543',
        password: 'StrongPass123',
        gender: 'female',
        dateOfBirth: '1994-03-10',
        bloodGroup: 'A+',
        address: 'House 12, Model Town, Lahore',
        city: 'Lahore',
      },
    };

    const { getByLabelText, unmount } = await render(<NotificationPermissionScreen />);
    await fireEvent.press(getByLabelText('Allow notifications'));

    await waitFor(() => {
      expect(mockRegisterPatient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Zainab Tariq',
          bloodGroup: 'A+',
        })
      );
    });
    await unmount();
  });

  it('ForgotPasswordScreen sends reset request and navigates to ResetPassword', async () => {
    const { getByPlaceholderText, getByLabelText, unmount } = await render(
      <ForgotPasswordScreen />
    );

    await fireEvent.changeText(
      getByPlaceholderText('Mobile Number or Email'),
      'ali.khan@gmail.com'
    );
    await fireEvent.press(getByLabelText('Send Reset Code'));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith({
        emailOrPhone: 'ali.khan@gmail.com',
      });
      expect(mockNavigate).toHaveBeenCalledWith(
        'ResetPassword',
        expect.objectContaining({
          identifier: 'ali.khan@gmail.com',
        })
      );
    });
    await unmount();
  });
});

describe('Patient Screen Regressions & Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = {};
  });

  it('QueueStatusScreen handles queuePosition=0 and estimatedWaitMinutes=0 without negative ahead count or || fallback', async () => {
    const { getByText, queryByText, unmount } = await render(
      <QueueStatusScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack }} />
    );

    await waitFor(() => {
      expect(getByText('Token A-102')).toBeTruthy();
      expect(getByText('~ 0 mins')).toBeTruthy();
      expect(getByText(/You are next in line/i)).toBeTruthy();
      expect(queryByText(/-1 patients?/i)).toBeNull();
      expect(queryByText(/ahead of you/i)).toBeNull();
    });
    await unmount();
  });

  it('CancelAppointmentScreen blocks cancellation of already cancelled appointment', async () => {
    mockGetAppointmentById.mockResolvedValueOnce({
      id: 'apt-cancelled-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Amit Sharma',
      doctorDepartment: 'General Physician',
      date: '2026-11-15',
      timeSlot: '09:30 AM',
      mode: 'in_person',
      status: 'cancelled',
    });

    const { getByText, unmount } = await render(
      <CancelAppointmentScreen
        navigation={{ navigate: mockNavigate, goBack: mockGoBack, replace: mockReplace } as any}
        route={{
          key: 'CancelAppointment-1',
          name: 'CancelAppointment',
          params: { appointmentId: 'apt-cancelled-1' },
        }}
      />
    );

    await waitFor(() => {
      expect(
        getByText(/This appointment is marked as cancelled and cannot be cancelled/i)
      ).toBeTruthy();
    });

    await fireEvent.press(getByText('Confirm Cancellation'));
    expect(mockCancelAppointment).not.toHaveBeenCalled();
    await unmount();
  });

  it('CancelAppointmentScreen cancels scheduled appointment and navigates to nested PatientTabs AppointmentsTab', async () => {
    mockGetAppointmentById.mockResolvedValueOnce({
      id: 'apt-active-1',
      patientId: 'pat-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Amit Sharma',
      doctorDepartment: 'General Physician',
      date: '2026-11-15',
      timeSlot: '09:30 AM',
      mode: 'in_person',
      status: 'scheduled',
    });

    const { getByText, unmount } = await render(
      <CancelAppointmentScreen
        navigation={{ navigate: mockNavigate, goBack: mockGoBack, replace: mockReplace } as any}
        route={{
          key: 'CancelAppointment-2',
          name: 'CancelAppointment',
          params: { appointmentId: 'apt-active-1' },
        }}
      />
    );

    await waitFor(() => {
      expect(getByText('Confirm Cancellation')).toBeTruthy();
    });

    await fireEvent.press(getByText('Confirm Cancellation'));

    await waitFor(() => {
      expect(mockCancelAppointment).toHaveBeenCalledWith('apt-active-1', 'Schedule conflict');
      expect(getByText('Appointment Cancelled')).toBeTruthy();
    });

    await fireEvent.press(getByText('Back to My Appointments'));
    expect(mockNavigate).toHaveBeenCalledWith('PatientTabs', {
      screen: 'AppointmentsTab',
    });
    await unmount();
  });

  it('BillsScreen renders Unpaid badge (never hardcoded Paid) and PKR currency', async () => {
    mockGetInvoices.mockResolvedValueOnce([
      {
        id: 'inv-100',
        invoiceNumber: 'INV-2026-100',
        patientId: 'pat-1',
        patientName: 'Ali Khan',
        patientMrn: 'P-00102',
        date: '2026-11-14',
        totalAmount: 2500,
        paidAmount: 0,
        balanceDue: 2500,
        status: 'unpaid',
        items: [
          {
            id: 'item-1',
            description: 'Cardiology Consultation',
            quantity: 1,
            unitPrice: 2500,
            total: 2500,
          },
        ],
      },
    ]);

    const { getByText, getAllByText, queryByText, unmount } = await render(
      <BillsScreen navigation={{ navigate: mockNavigate, goBack: mockGoBack }} />
    );

    await waitFor(() => {
      expect(getByText('Unpaid')).toBeTruthy();
      expect(getAllByText('PKR 2,500').length).toBeGreaterThanOrEqual(2);
      expect(queryByText('Paid')).toBeNull();
      expect(queryByText(/₹/)).toBeNull();
    });
    await unmount();
  });
});
