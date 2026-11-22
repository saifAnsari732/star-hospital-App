/**
 * Star Hospital Mobile App
 * Axios Mock Adapter & In-Memory Offline Backend Engine
 * Supports all ICTHospital Laravel endpoints with typed fixtures
 */

import type { ApiResponse } from '../../types/api';
import type { User, UserRole, StaffDesignation } from '../../types/user';
import type { LoginCredentials, PatientRegisterData, AuthResponse } from '../../types/auth';
import type { Patient, PatientAdmission } from '../../types/patient';
import type { Doctor, DoctorFreeSlotsResponse } from '../../types/doctor';
import type { Appointment, BookAppointmentRequest, RescheduleAppointmentRequest, UpdateVitalsRequest } from '../../types/appointment';
import type { OPDToken, LiveQueueStep } from '../../types/opdToken';
import type { Prescription, CreatePrescriptionRequest } from '../../types/prescription';
import type { DiagnosticReportItem, SaveLabResultRequest } from '../../types/laboratory';
import type { MedicineStockItem, PharmacyWorklistItem, DispensePrescriptionRequest } from '../../types/pharmacy';
import type {
  InvoiceDetail,
  CreateInvoiceRequest,
  RecordPaymentRequest,
  CreateRazorpayOrderRequest,
  RazorpayOrderResponse,
  VerifyRazorpayPaymentRequest,
  VerifyRazorpayPaymentResponse,
  RazorpayBackendEndpointMetadata,
} from '../../types/billing';
import type { HospitalBed, BedAdmissionRequest, BedDischargeRequest } from '../../types/bed';
import type { HospitalKpiMetrics } from '../../types/staff';
// In-line mock delay helper
export const mockNetworkDelay = (ms: number = 20): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Generic Axios type compatibility interfaces
export type AxiosInstance = any;
export type InternalAxiosRequestConfig = any;
export interface AxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, any>;
  config: any;
}

// -------------------------------------------------------------
// DEFAULT DATA FIXTURES
// -------------------------------------------------------------

export const getInitialPatients = (): Patient[] => [
  {
    id: 'pat-1',
    mrn: 'P-00102',
    name: 'Ali Khan',
    email: 'ali.khan@gmail.com',
    phone: '+92 300 1234567',
    gender: 'male',
    birthDate: '1992-05-14',
    age: '32 yrs',
    bloodGroup: 'O+',
    address: 'House 45, Street 12, Sector F-8/2',
    city: 'Islamabad',
    cnic: '61101-1234567-1',
    fatherName: 'Rashid Khan',
    registeredAt: '2025-01-10T09:00:00Z',
  },
  {
    id: 'pat-2',
    mrn: 'P-00103',
    name: 'Sarah Ahmed',
    email: 'sarah.ahmed@example.com',
    phone: '+92 312 9876543',
    gender: 'female',
    birthDate: '1996-08-22',
    age: '28 yrs',
    bloodGroup: 'B+',
    address: 'Apartment 4B, Blue Area',
    city: 'Islamabad',
    registeredAt: '2025-02-14T11:30:00Z',
  },
];

export const getInitialDoctors = (): Doctor[] => [
  {
    id: 'doc-1',
    name: 'Dr. Amit Sharma',
    department: 'General Physician',
    qualification: 'MBBS, MD - General Medicine',
    experienceYears: 12,
    consultationFee: 1000,
    rating: 4.9,
    reviewCount: 1250,
    isAvailableToday: true,
    roomNo: 'Room 104',
    phone: '+91 98111 22334',
    email: 'dr.amit@starhospital.com',
    workingHours: '09:00 AM - 05:00 PM',
  },
  {
    id: 'doc-2',
    name: 'Dr. Priya Mehta',
    department: 'Cardiologist',
    qualification: 'MBBS, MD, DM - Cardiology',
    experienceYears: 15,
    consultationFee: 1500,
    rating: 4.8,
    reviewCount: 980,
    isAvailableToday: true,
    roomNo: 'Room 208',
    phone: '+91 98111 22335',
    email: 'dr.priya@starhospital.com',
    workingHours: '10:00 AM - 06:00 PM',
  },
  {
    id: 'doc-3',
    name: 'Dr. Rakesh Verma',
    department: 'Orthopedic',
    qualification: 'MBBS, MS - Orthopedics',
    experienceYears: 10,
    consultationFee: 1200,
    rating: 4.7,
    reviewCount: 740,
    isAvailableToday: true,
    roomNo: 'Room 112',
    phone: '+91 98111 22336',
    email: 'dr.rakesh@starhospital.com',
    workingHours: '09:30 AM - 04:30 PM',
  },
];

export const getInitialTokens = (): OPDToken[] => [
  {
    id: 'tok-100',
    tokenNumber: 'A-100',
    patientId: 'pat-2',
    patientName: 'Sarah Ahmed',
    patientMrn: 'P-00103',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    servingToken: 'A-100',
    queuePosition: 0,
    estimatedWaitMinutes: 0,
    status: 'completed',
    roomNo: 'Room 104',
    generatedAt: '2026-11-15T08:30:00Z',
    liveSteps: [
      { tokenNumber: 'A-100', status: 'completed', label: 'Completed' },
      { tokenNumber: 'A-101', status: 'current', label: 'In Consultation' },
      { tokenNumber: 'A-102', status: 'waiting', label: 'In Queue' },
    ],
  },
  {
    id: 'tok-101',
    tokenNumber: 'A-101',
    patientId: 'pat-3',
    patientName: 'Mohammed Bilal',
    patientMrn: 'P-00104',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    servingToken: 'A-101',
    queuePosition: 1,
    estimatedWaitMinutes: 5,
    status: 'in_consultation',
    roomNo: 'Room 104',
    generatedAt: '2026-11-15T08:50:00Z',
    liveSteps: [
      { tokenNumber: 'A-100', status: 'completed', label: 'Completed' },
      { tokenNumber: 'A-101', status: 'current', label: 'In Consultation' },
      { tokenNumber: 'A-102', status: 'waiting', label: 'In Queue' },
    ],
  },
  {
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
      { tokenNumber: 'A-100', status: 'completed', label: 'Completed' },
      { tokenNumber: 'A-101', status: 'current', label: 'In Consultation' },
      { tokenNumber: 'A-102', status: 'waiting', label: 'In Queue' },
    ],
  },
];

export const getInitialAppointments = (): Appointment[] => [
  {
    id: 'appt-1',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientMrn: 'P-00102',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    doctorDepartment: 'General Physician',
    date: '2026-11-20',
    timeSlot: '10:00 AM',
    startTime: '10:00',
    endTime: '10:15',
    status: 'scheduled',
    mode: 'in_person',
    consultationFee: 1000,
    paymentStatus: 'paid',
  },
  {
    id: 'appt-2',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientMrn: 'P-00102',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priya Mehta',
    doctorDepartment: 'Cardiologist',
    date: '2026-11-10',
    timeSlot: '11:30 AM',
    startTime: '11:30',
    endTime: '11:45',
    status: 'completed',
    mode: 'in_person',
    consultationFee: 1500,
    paymentStatus: 'paid',
  },
];

export const getInitialPrescriptions = (): Prescription[] => [
  {
    id: 'rx-1',
    prescriptionNumber: 'RX-2026-0042',
    date: '2026-11-10',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientAge: '32 yrs',
    patientGender: 'male',
    patientMrn: 'P-00102',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    doctorDepartment: 'General Physician',
    doctorQualification: 'MBBS, MD',
    diagnosis: 'Acute Upper Respiratory Tract Infection',
    symptoms: 'Fever, sore throat, mild cough for 3 days',
    advice: 'Drink warm fluids, rest for 3 days',
    status: 'issued',
    items: [
      {
        id: 'med-item-1',
        medicineName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        frequency: 'Thrice a day (1-1-1)',
        duration: '5 days',
        instructions: 'After meals when having fever',
      },
      {
        id: 'med-item-2',
        medicineName: 'Amoxicillin 500mg',
        dosage: '1 capsule',
        frequency: 'Twice a day (1-0-1)',
        duration: '5 days',
        instructions: 'Complete full course with water',
      },
    ],
  },
];

export const getInitialReports = (): DiagnosticReportItem[] => [
  {
    id: 'rep-1',
    reportNumber: 'REP-8821',
    type: 'lab',
    testName: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    date: '2026-11-12',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientMrn: 'P-00102',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    technicianName: 'Bilal Tech',
    status: 'completed',
    resultSummary: 'Normal blood count with mild reactive lymphocytosis',
    results: [
      { parameter: 'Hemoglobin', value: '14.5', unit: 'g/dL', referenceRange: '13.5 - 17.5', isAbnormal: false, flag: 'Normal' },
      { parameter: 'WBC Count', value: '7,200', unit: '/mcL', referenceRange: '4,500 - 11,000', isAbnormal: false, flag: 'Normal' },
      { parameter: 'Platelets', value: '250,000', unit: '/mcL', referenceRange: '150,000 - 450,000', isAbnormal: false, flag: 'Normal' },
    ],
    downloadUrl: 'https://example.com/reports/rep-8821.pdf',
    fileSize: '1.2 MB',
  },
  {
    id: 'rep-2',
    reportNumber: 'REP-8822',
    type: 'radiology',
    testName: 'Chest X-Ray PA View',
    category: 'Radiology',
    date: '2026-11-12',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientMrn: 'P-00102',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    status: 'completed',
    resultSummary: 'Both lung fields clear. Cardiothoracic ratio normal.',
    downloadUrl: 'https://example.com/reports/rep-8822.pdf',
    fileSize: '3.4 MB',
  },
];

export const getInitialInvoices = (): InvoiceDetail[] => [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-10023',
    date: '2026-11-10',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientMrn: 'P-00102',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    department: 'General Physician',
    careSetting: 'opd',
    grossTotal: 1000,
    discount: 0,
    netTotal: 1000,
    amountReceived: 1000,
    balanceDue: 0,
    status: 'paid',
    items: [
      { id: 'item-1', description: 'OPD Consultation Fee', quantity: 1, unitPrice: 1000, total: 1000 },
    ],
    payments: [
      { id: 'pay-1', date: '2026-11-10', amount: 1000, method: 'cash', transactionRef: 'TXN-9988' },
    ],
  },
];

export const getInitialBeds = (): HospitalBed[] => [
  {
    id: 'bed-1',
    bedNumber: 'B-101',
    roomNumber: 'Room 101',
    wardName: 'Medical Ward A',
    category: 'General',
    floor: '1st Floor',
    dailyRate: 1500,
    status: 'occupied',
    currentPatient: {
      patientId: 'pat-1',
      patientName: 'Ali Khan',
      mrn: 'P-00102',
      admittedAt: '2026-11-10T10:00:00Z',
      doctorName: 'Dr. Amit Sharma',
    },
  },
  {
    id: 'bed-2',
    bedNumber: 'B-102',
    roomNumber: 'Room 101',
    wardName: 'Medical Ward A',
    category: 'General',
    floor: '1st Floor',
    dailyRate: 1500,
    status: 'available',
  },
  {
    id: 'bed-3',
    bedNumber: 'ICU-1',
    roomNumber: 'ICU Unit',
    wardName: 'Intensive Care Unit',
    category: 'ICU',
    floor: '2nd Floor',
    dailyRate: 6000,
    status: 'available',
    features: ['Ventilator', 'Multipara Monitor', 'Defibrillator'],
  },
];

export const getInitialKpis = (): HospitalKpiMetrics => ({
  totalPatients: 1250,
  todayOpd: 320,
  appointments: 280,
  reports: 180,
  totalDoctors: 24,
  totalNurses: 48,
  totalStaff: 110,
  totalBeds: 50,
  occupiedBeds: 35,
  freeBeds: 15,
  bedOccupancyPercent: 70,
  todayAppointments: 42,
  pendingAppointments: 18,
  todayPrescriptions: 55,
  todayLabTests: 38,
  totalRevenueToday: 345000,
  outstandingBalance: 12000,
});

export const getInitialMedicines = (): MedicineStockItem[] => [
  { id: 'med-1', name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Analgesic', availableQuantity: 1200, unit: 'tablets', unitPrice: 2, reorderLevel: 200, expiryDate: '2028-12-31' },
  { id: 'med-2', name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', category: 'Antibiotic', availableQuantity: 450, unit: 'capsules', unitPrice: 15, reorderLevel: 100, expiryDate: '2027-08-30' },
  { id: 'med-3', name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Antacid', availableQuantity: 800, unit: 'capsules', unitPrice: 10, reorderLevel: 150, expiryDate: '2027-10-15' },
  { id: 'med-4', name: 'Cetirizine 10mg', genericName: 'Cetirizine Hydrochloride', category: 'Antihistamine', availableQuantity: 600, unit: 'tablets', unitPrice: 5, reorderLevel: 100, expiryDate: '2028-05-20' },
];

// -------------------------------------------------------------
// MOCK ADAPTER ENGINE CLASS
// -------------------------------------------------------------

export class MockAdapterEngine {
  public patients: Patient[] = getInitialPatients();
  public doctors: Doctor[] = getInitialDoctors();
  public tokens: OPDToken[] = getInitialTokens();
  public appointments: Appointment[] = getInitialAppointments();
  public prescriptions: Prescription[] = getInitialPrescriptions();
  public reports: DiagnosticReportItem[] = getInitialReports();
  public invoices: InvoiceDetail[] = getInitialInvoices();
  public beds: HospitalBed[] = getInitialBeds();
  public medicines: MedicineStockItem[] = getInitialMedicines();
  public kpis: HospitalKpiMetrics = getInitialKpis();
  public razorpayOrders: Map<string, RazorpayOrderResponse> = new Map();

  public reset(): void {
    this.patients = getInitialPatients();
    this.doctors = getInitialDoctors();
    this.tokens = getInitialTokens();
    this.appointments = getInitialAppointments();
    this.prescriptions = getInitialPrescriptions();
    this.reports = getInitialReports();
    this.invoices = getInitialInvoices();
    this.beds = getInitialBeds();
    this.medicines = getInitialMedicines();
    this.kpis = getInitialKpis();
    this.razorpayOrders.clear();
  }

  // -----------------------------------------------------------
  // AUTHENTICATION
  // -----------------------------------------------------------

  public async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    await mockNetworkDelay(20);
    const { login: identifier, password, role: rawRole, designation } = credentials;
    const role = rawRole || 'patient';

    if (!identifier || identifier.trim().length === 0) {
      throw new Error('Mobile number or email is required.');
    }
    if (!['patient', 'doctor', 'staff'].includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    const token = `star_mock_jwt_${role}_${Date.now()}`;
    let user: User;

    if (role === 'patient') {
      const existing = this.patients.find((p) => p.email === identifier || p.phone === identifier);
      user = {
        id: existing ? existing.id : 'pat-1',
        name: existing ? existing.name : 'Ali Khan',
        email: existing ? existing.email : identifier,
        phone: existing ? existing.phone : identifier,
        role: 'patient',
        token,
      };
    } else if (role === 'doctor') {
      const existing = this.doctors.find((d) => d.email === identifier || d.phone === identifier);
      user = {
        id: existing ? existing.id : 'doc-1',
        name: existing ? existing.name : 'Dr. Amit Sharma',
        email: existing ? (existing.email || identifier) : identifier,
        phone: existing ? (existing.phone || identifier) : identifier,
        role: 'doctor',
        token,
      };
    } else {
      user = {
        id: 'stf-1',
        name: 'Sunita Verma',
        email: identifier.includes('@') ? identifier : 'staff@starhospital.com',
        phone: identifier,
        role: 'staff',
        designation: designation || 'nurse',
        token,
      };
    }

    return {
      success: true,
      message: 'Login successful',
      data: {
        token,
        expiresIn: 86400,
        user,
      },
    };
  }

  public async sendOtp(phone: string, role: UserRole = 'patient'): Promise<ApiResponse<{ verificationId: string }>> {
    await mockNetworkDelay(20);
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    return {
      success: true,
      message: 'OTP sent to mobile number',
      data: {
        verificationId: `verify-${Date.now()}`,
      },
    };
  }

  public async verifyOtp(phone: string, otp: string, role: UserRole): Promise<ApiResponse<AuthResponse>> {
    await mockNetworkDelay(20);
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }
    if (!otp || otp.length !== 6) {
      throw new Error('Invalid OTP code. Expected 6 digits.');
    }
    if (otp !== '123456' && otp !== '000000') {
      throw new Error('Incorrect OTP. Please enter the verification code sent to your phone.');
    }

    const token = `star_otp_jwt_${role}_${Date.now()}`;
    const user: User = {
      id: `${role.substring(0, 3)}-${Date.now()}`,
      name: role === 'doctor' ? 'Dr. Amit Sharma' : role === 'staff' ? 'Nurse Aisha' : 'Ali Khan',
      email: `${cleanPhone}@starhospital.com`,
      phone: phone.startsWith('+') ? phone : `+92 ${phone}`,
      role,
      designation: role === 'staff' ? 'nurse' : undefined,
      token,
    };

    return {
      success: true,
      message: 'OTP verified successfully',
      data: {
        token,
        expiresIn: 86400,
        user,
      },
    };
  }

  public async registerPatient(data: PatientRegisterData): Promise<ApiResponse<AuthResponse>> {
    await mockNetworkDelay(20);
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Full Name is required.');
    }
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) {
      throw new Error('Valid mobile number is required.');
    }

    const id = `pat-${this.patients.length + 1}`;
    const mrn = `P-0010${this.patients.length + 2}`;
    const token = `star_reg_jwt_${Date.now()}`;

    const newPatient: Patient = {
      id,
      mrn,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      gender: data.gender,
      birthDate: data.dateOfBirth,
      age: '25 yrs',
      bloodGroup: data.bloodGroup,
      address: data.address,
      city: data.city,
      cnic: data.cnic,
      registeredAt: new Date().toISOString(),
    };

    this.patients.push(newPatient);

    const user: User = {
      id,
      name: newPatient.name,
      email: newPatient.email,
      phone: newPatient.phone,
      role: 'patient',
      gender: newPatient.gender,
      bloodGroup: newPatient.bloodGroup,
      dateOfBirth: newPatient.birthDate,
      city: newPatient.city,
      token,
    };

    return {
      success: true,
      message: 'Patient registered successfully',
      data: {
        token,
        expiresIn: 86400,
        user,
      },
    };
  }

  // -----------------------------------------------------------
  // OPD TOKENS & QUEUE
  // -----------------------------------------------------------

  public async generateToken(patientId: string, doctorId: string, visitType: string = 'first_visit'): Promise<ApiResponse<OPDToken>> {
    await mockNetworkDelay(20);
    const doctor = this.doctors.find((d) => d.id === doctorId) || this.doctors[0];
    const patient = this.patients.find((p) => p.id === patientId) || this.patients[0];

    const maxNum = this.tokens.reduce((acc, t) => {
      const match = t.tokenNumber.match(/A-(\d+)/);
      return match ? Math.max(acc, parseInt(match[1], 10)) : acc;
    }, 100);

    const nextTokenNum = `A-${maxNum + 1}`;
    const serving = this.tokens.find((t) => t.status === 'in_consultation')?.tokenNumber || 'A-101';
    const queueAhead = this.tokens.filter((t) => t.doctorId === doctor.id && t.status === 'arrived').length;
    const waitTime = (queueAhead + 1) * 10;

    const steps: LiveQueueStep[] = [
      { tokenNumber: `A-${maxNum - 1}`, status: 'completed', label: 'Completed' },
      { tokenNumber: serving, status: 'current', label: 'In Consultation' },
      { tokenNumber: nextTokenNum, status: 'waiting', label: 'In Queue' },
    ];

    const newToken: OPDToken = {
      id: `tok-${Date.now()}`,
      tokenNumber: nextTokenNum,
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: doctor.department,
      servingToken: serving,
      queuePosition: queueAhead + 1,
      estimatedWaitMinutes: visitType === 'emergency' ? 5 : waitTime,
      status: 'arrived',
      roomNo: doctor.roomNo || 'Room 104',
      generatedAt: new Date().toISOString(),
      liveSteps: steps,
    };

    this.tokens.push(newToken);
    return {
      success: true,
      message: 'OPD Token generated successfully',
      data: newToken,
    };
  }

  public async callNextToken(doctorId: string): Promise<ApiResponse<OPDToken | null>> {
    await mockNetworkDelay(20);
    const currentServing = this.tokens.find((t) => t.doctorId === doctorId && t.status === 'in_consultation');
    if (currentServing) {
      currentServing.status = 'completed';
      currentServing.completedAt = new Date().toISOString();
    }

    const nextWaiting = this.tokens.find((t) => t.doctorId === doctorId && t.status === 'arrived');
    if (nextWaiting) {
      nextWaiting.status = 'in_consultation';
      nextWaiting.consultStartedAt = new Date().toISOString();
      nextWaiting.servingToken = nextWaiting.tokenNumber;
      nextWaiting.queuePosition = 0;
      nextWaiting.estimatedWaitMinutes = 0;

      this.tokens
        .filter((t) => t.doctorId === doctorId && t.status === 'arrived')
        .forEach((t) => {
          t.queuePosition = Math.max(1, t.queuePosition - 1);
          t.estimatedWaitMinutes = t.queuePosition * 10;
          t.servingToken = nextWaiting.tokenNumber;
        });

      return {
        success: true,
        message: `Token ${nextWaiting.tokenNumber} is now serving`,
        data: nextWaiting,
      };
    }

    return {
      success: true,
      message: 'No patients waiting in queue',
      data: null,
    };
  }

  public async completeToken(tokenId: string): Promise<ApiResponse<OPDToken>> {
    await mockNetworkDelay(20);
    const token = this.tokens.find((t) => t.id === tokenId || t.tokenNumber === tokenId);
    if (!token) {
      throw new Error(`Token ${tokenId} not found`);
    }
    token.status = 'completed';
    token.completedAt = new Date().toISOString();

    return {
      success: true,
      message: `Token ${token.tokenNumber} marked completed`,
      data: token,
    };
  }

  // -----------------------------------------------------------
  // APPOINTMENTS
  // -----------------------------------------------------------

  public async bookAppointment(req: BookAppointmentRequest): Promise<ApiResponse<Appointment>> {
    await mockNetworkDelay(20);
    const { patientId, doctorId, date, startTime, mode, remarks } = req;

    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      throw new Error('Cannot book an appointment for a past date.');
    }

    const clash = this.appointments.find(
      (a) => a.doctorId === doctorId && a.date === date && a.startTime === startTime && a.status !== 'cancelled'
    );
    if (clash) {
      throw new Error(`Time slot ${startTime} on ${date} is already booked for this doctor.`);
    }

    const doctor = this.doctors.find((d) => d.id === doctorId) || this.doctors[0];
    const patient = this.patients.find((p) => p.id === patientId) || this.patients[0];

    const newAppt: Appointment = {
      id: `appt-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorDepartment: doctor.department,
      date,
      timeSlot: startTime,
      startTime,
      endTime: startTime,
      status: 'scheduled',
      mode: mode || 'in_person',
      remarks,
      consultationFee: doctor.consultationFee,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.appointments.push(newAppt);
    return {
      success: true,
      message: 'Appointment booked successfully',
      data: newAppt,
    };
  }

  public async cancelAppointment(appointmentId: string, reason?: string): Promise<ApiResponse<Appointment>> {
    await mockNetworkDelay(20);
    const appt = this.appointments.find((a) => a.id === appointmentId);
    if (!appt) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }
    if (appt.status === 'completed') {
      throw new Error('Completed appointments cannot be cancelled.');
    }
    appt.status = 'cancelled';
    appt.remarks = reason ? `${appt.remarks ? appt.remarks + ' | ' : ''}Cancelled: ${reason}` : appt.remarks;

    return {
      success: true,
      message: 'Appointment cancelled successfully',
      data: appt,
    };
  }

  public async rescheduleAppointment(req: RescheduleAppointmentRequest): Promise<ApiResponse<Appointment>> {
    await mockNetworkDelay(20);
    const { appointmentId, newDate, newTimeSlot, reason } = req;
    const appt = this.appointments.find((a) => a.id === appointmentId);
    if (!appt) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (newDate < todayStr) {
      throw new Error('Cannot reschedule to a past date.');
    }

    appt.date = newDate;
    appt.timeSlot = newTimeSlot;
    appt.startTime = newTimeSlot;
    if (reason) {
      appt.remarks = `Rescheduled: ${reason}`;
    }

    return {
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appt,
    };
  }

  public async updateVitals(req: UpdateVitalsRequest): Promise<ApiResponse<Appointment>> {
    await mockNetworkDelay(20);
    const { appointmentId, vitals } = req;
    const appt = this.appointments.find((a) => a.id === appointmentId);
    if (!appt) {
      throw new Error(`Appointment ${appointmentId} not found`);
    }

    appt.vitals = {
      ...appt.vitals,
      ...vitals,
      recordedAt: new Date().toISOString(),
    };

    return {
      success: true,
      message: 'Vitals recorded successfully',
      data: appt,
    };
  }

  // -----------------------------------------------------------
  // PRESCRIPTIONS
  // -----------------------------------------------------------

  public async createPrescription(req: CreatePrescriptionRequest): Promise<ApiResponse<Prescription>> {
    await mockNetworkDelay(20);
    const { patientId, doctorId, date, symptoms, diagnosis, advice, notes, items } = req;

    if (!items || items.length === 0) {
      throw new Error('Prescription must include at least one medicine item.');
    }

    for (const item of items) {
      if (!item.medicineName || item.medicineName.trim().length === 0) {
        throw new Error('Medicine name is required for all items.');
      }
      if (!item.dosage || !item.frequency) {
        throw new Error(`Dosage and frequency required for ${item.medicineName}`);
      }
    }

    const doctor = this.doctors.find((d) => d.id === doctorId) || this.doctors[0];
    const patient = this.patients.find((p) => p.id === patientId) || this.patients[0];
    const rxNumber = `RX-${new Date().getFullYear()}-${String(this.prescriptions.length + 1).padStart(4, '0')}`;

    const newPrescription: Prescription = {
      id: `rx-${Date.now()}`,
      prescriptionNumber: rxNumber,
      date: date || new Date().toISOString().split('T')[0],
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      patientMrn: patient.mrn,
      doctorId: doctor.id,
      doctorName: doctor.name,
      doctorDepartment: doctor.department,
      doctorQualification: doctor.qualification,
      symptoms,
      diagnosis,
      advice,
      notes,
      status: 'issued',
      items: items.map((item, idx) => ({
        ...item,
        id: `rx-item-${idx + 1}`,
      })),
    };

    this.prescriptions.push(newPrescription);

    return {
      success: true,
      message: 'Prescription created successfully',
      data: newPrescription,
    };
  }

  public async dispensePrescription(dispenseReq: DispensePrescriptionRequest): Promise<ApiResponse<Prescription>> {
    await mockNetworkDelay(20);
    const rx = this.prescriptions.find((p) => p.id === dispenseReq.prescriptionId);
    if (!rx) {
      throw new Error(`Prescription ${dispenseReq.prescriptionId} not found`);
    }

    rx.status = 'dispensed';

    for (const item of dispenseReq.items) {
      const stock = this.medicines.find((m) => m.id === item.medicineId);
      if (stock) {
        stock.availableQuantity = Math.max(0, stock.availableQuantity - item.quantity);
      }
    }

    return {
      success: true,
      message: 'Prescription marked as dispensed',
      data: rx,
    };
  }

  // -----------------------------------------------------------
  // LABORATORY
  // -----------------------------------------------------------

  public async saveLabResults(req: SaveLabResultRequest): Promise<ApiResponse<DiagnosticReportItem>> {
    await mockNetworkDelay(20);
    const report = this.reports.find((r) => r.id === req.reportId);
    if (!report) {
      throw new Error(`Lab report ${req.reportId} not found`);
    }

    report.results = req.results;
    if (req.resultSummary) {
      report.resultSummary = req.resultSummary;
    }
    if (req.markCompleted) {
      report.status = 'completed';
    }

    return {
      success: true,
      message: 'Lab results saved successfully',
      data: report,
    };
  }

  // -----------------------------------------------------------
  // BILLING & INVOICING
  // -----------------------------------------------------------

  public async createInvoice(req: CreateInvoiceRequest): Promise<ApiResponse<InvoiceDetail>> {
    await mockNetworkDelay(20);
    const patient = this.patients.find((p) => p.id === req.patientId) || this.patients[0];
    const grossTotal = req.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const discount = req.discount || 0;
    const netTotal = Math.max(0, grossTotal - discount);

    const invoiceNum = `INV-${10020 + this.invoices.length + 1}`;
    const newInvoice: InvoiceDetail = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      date: new Date().toISOString().split('T')[0],
      patientId: patient.id,
      patientName: patient.name,
      patientMrn: patient.mrn,
      careSetting: req.careSetting,
      grossTotal,
      discount,
      netTotal,
      amountReceived: 0,
      balanceDue: netTotal,
      status: 'unpaid',
      items: req.items.map((it, idx) => ({
        id: `inv-item-${idx + 1}`,
        description: it.description,
        category: it.category,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.quantity * it.unitPrice,
      })),
      payments: [],
    };

    this.invoices.push(newInvoice);
    return {
      success: true,
      message: 'Invoice generated successfully',
      data: newInvoice,
    };
  }

  public async recordPayment(req: RecordPaymentRequest): Promise<ApiResponse<InvoiceDetail>> {
    await mockNetworkDelay(20);
    const invoice = this.invoices.find((inv) => inv.id === req.invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${req.invoiceId} not found`);
    }

    invoice.payments.push({
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      amount: req.amount,
      method: req.method,
      transactionRef: req.transactionRef || `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    invoice.amountReceived += req.amount;
    invoice.balanceDue = Math.max(0, invoice.netTotal - invoice.amountReceived);
    invoice.status = invoice.balanceDue === 0 ? 'paid' : 'partial';

    return {
      success: true,
      message: 'Payment recorded successfully',
      data: invoice,
    };
  }

  private getRazorpayPlaceholderMetadata(): RazorpayBackendEndpointMetadata {
    return {
      orderEndpoint: '/api/v1/payments/razorpay/order',
      verifyEndpoint: '/api/v1/payments/razorpay/verify',
      webhookEndpoint: '/api/v1/webhooks/razorpay',
      isLiveBackendEndpoint: false,
      integrationMode: 'mock_placeholder',
      statusNote:
        'MockAdapter offline Razorpay simulation. Deploy ICTHospital Laravel order/verify/webhook endpoints for real signature verification and capture.',
    };
  }

  private resolvePublicRazorpayKey(): string {
    const runtimeProcess = (
      globalThis as { process?: { env?: Record<string, string | undefined> } }
    ).process;
    const rawKey = runtimeProcess?.env?.EXPO_PUBLIC_RAZORPAY_KEY_ID?.trim() || '';
    const match = /^rzp_(test|live)_([A-Za-z0-9]{8,})$/.exec(rawKey);
    if (!match) {
      return '';
    }
    const lower = rawKey.toLowerCase();
    const suffix = match[2];
    if (
      lower.includes('your_razorpay') ||
      lower.includes('placeholder') ||
      lower.includes('replace_') ||
      lower.includes('xxxxxxxx') ||
      lower.includes('example') ||
      lower.includes('dummy') ||
      /^(.)\1+$/.test(suffix) ||
      /^0?123456789?0?$/.test(suffix)
    ) {
      return '';
    }
    return rawKey;
  }

  public async createRazorpayOrder(
    req: CreateRazorpayOrderRequest
  ): Promise<ApiResponse<RazorpayOrderResponse>> {
    await mockNetworkDelay(20);
    const invoiceId = req?.invoiceId?.trim();
    if (!invoiceId) {
      throw new Error('invoiceId is required to create a Razorpay order.');
    }

    const invoice = this.invoices.find(
      (inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId
    );
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    if (invoice.balanceDue <= 0) {
      throw new Error(`Invoice ${invoice.invoiceNumber} has no outstanding balance due.`);
    }

    const amount = req.amount !== undefined ? req.amount : invoice.balanceDue;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Order amount must be a positive number.');
    }
    if (amount > invoice.balanceDue) {
      throw new Error('Order amount cannot exceed outstanding invoice balance.');
    }

    const now = Date.now();
    const orderId = `order_mock_${now}`;
    const order: RazorpayOrderResponse = {
      orderId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount,
      amountInPaise: Math.round(amount * 100),
      currency: 'INR',
      receipt: `rcpt_${invoice.invoiceNumber}_${now}`,
      keyId: this.resolvePublicRazorpayKey(),
      merchantName: 'Star Hospital',
      themeColor: '#0866C6',
      status: 'created',
      notes: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        patientMrn: invoice.patientMrn,
        ...(req.notes || {}),
      },
      backendMetadata: this.getRazorpayPlaceholderMetadata(),
    };

    this.razorpayOrders.set(orderId, order);

    return {
      success: true,
      message: 'Razorpay order created in mock placeholder mode',
      data: order,
    };
  }

  public async verifyRazorpayPayment(
    req: VerifyRazorpayPaymentRequest
  ): Promise<ApiResponse<VerifyRazorpayPaymentResponse>> {
    await mockNetworkDelay(20);
    const invoiceId = req?.invoiceId?.trim();
    const orderId = req?.razorpayOrderId?.trim();
    const paymentId = req?.razorpayPaymentId?.trim();
    const signature = req?.razorpaySignature?.trim();

    if (!invoiceId || !orderId || !paymentId || !signature) {
      throw new Error(
        'invoiceId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.'
      );
    }

    const lowerSig = signature.toLowerCase();
    if (signature.length < 8 || lowerSig.includes('invalid') || lowerSig.includes('tamper')) {
      throw new Error('Razorpay payment signature verification failed.');
    }

    const invoice = this.invoices.find(
      (inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId
    );
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const storedOrder = this.razorpayOrders.get(orderId);
    if (storedOrder && storedOrder.invoiceId !== invoice.id) {
      throw new Error('Razorpay order does not match target invoice.');
    }

    const alreadyRecorded = invoice.payments.some(
      (p) => p.transactionRef === paymentId
    );
    if (!alreadyRecorded && invoice.balanceDue > 0) {
      const paymentAmount = Math.min(
        invoice.balanceDue,
        storedOrder?.amount ?? invoice.balanceDue
      );
      invoice.payments.push({
        id: `pay-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: paymentAmount,
        method: 'online',
        transactionRef: paymentId,
        receivedBy: 'Razorpay (Mock Verification)',
      });
      invoice.amountReceived += paymentAmount;
      invoice.balanceDue = Math.max(0, invoice.netTotal - invoice.amountReceived);
      invoice.status =
        invoice.balanceDue === 0
          ? 'paid'
          : invoice.amountReceived > 0
            ? 'partial'
            : 'unpaid';
    }

    if (storedOrder) {
      storedOrder.status = 'paid';
      this.razorpayOrders.set(orderId, storedOrder);
    }

    return {
      success: true,
      message: 'Razorpay mock payment verification completed (live capture requires backend HMAC verification)',
      data: {
        verified: true,
        verificationStatus: 'mock_verified',
        paymentId,
        orderId,
        invoiceId: invoice.id,
        invoice: { ...invoice },
        capturedOnServer: false,
        verifiedByServer: false,
        verifiedAt: new Date().toISOString(),
        message:
          'Mock verification completed offline. Real funds capture requires ICTHospital Laravel HMAC verification.',
        backendMetadata: this.getRazorpayPlaceholderMetadata(),
      },
    };
  }

  // -----------------------------------------------------------
  // BEDS & ADMISSION
  // -----------------------------------------------------------

  public async admitPatient(req: BedAdmissionRequest): Promise<ApiResponse<HospitalBed>> {
    await mockNetworkDelay(20);
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (!bed) {
      throw new Error(`Bed ${req.bedId} not found`);
    }
    if (bed.status === 'occupied') {
      throw new Error(`Bed ${bed.bedNumber} is already occupied.`);
    }

    const patient = this.patients.find((p) => p.id === req.patientId) || this.patients[0];
    const doctor = this.doctors.find((d) => d.id === req.doctorId) || this.doctors[0];

    bed.status = 'occupied';
    bed.currentPatient = {
      patientId: patient.id,
      patientName: patient.name,
      mrn: patient.mrn,
      admittedAt: new Date().toISOString(),
      doctorName: doctor.name,
    };

    return {
      success: true,
      message: `Patient ${patient.name} admitted to ${bed.bedNumber}`,
      data: bed,
    };
  }

  public async dischargePatient(req: BedDischargeRequest): Promise<ApiResponse<HospitalBed>> {
    await mockNetworkDelay(20);
    const bed = this.beds.find((b) => b.id === req.bedId);
    if (!bed) {
      throw new Error(`Bed ${req.bedId} not found`);
    }

    bed.status = 'available';
    bed.currentPatient = undefined;

    return {
      success: true,
      message: `Bed ${bed.bedNumber} is now available`,
      data: bed,
    };
  }

  // -----------------------------------------------------------
  // AXIOS INTERCEPTOR ATTACHMENT
  // -----------------------------------------------------------

  public attachAxios(axiosInstance: any): void {
    if (!axiosInstance || !axiosInstance.interceptors || !axiosInstance.interceptors.request) {
      return;
    }
    axiosInstance.interceptors.request.use(async (config: any) => {
      config.adapter = async (cfg: any): Promise<AxiosResponse> => {
        const rawUrl = cfg.url || '';
        const path = rawUrl.split('?')[0];
        const method = (cfg.method || 'GET').toUpperCase();
        const data =
          typeof cfg.data === 'string' ? JSON.parse(cfg.data || '{}') : cfg.data || {};

        let responseData: any;

        const apptCheckInMatch = path.match(/\/appointments\/([^/]+)\/check-in$/);
        const apptRescheduleMatch = path.match(/\/appointments\/([^/]+)\/reschedule$/);
        const apptVitalsMatch = path.match(/\/appointments\/([^/]+)\/vitals$/);
        const apptDetailMatch = path.match(/\/appointments\/([^/]+)$/);
        const queueCallNextMatch = path.match(/\/opd\/queue\/([^/]+)\/call-next$/);
        const queueDocMatch = path.match(/\/opd\/queue\/([^/]+)$/);
        const tokenCompleteMatch = path.match(/\/opd\/tokens\/([^/]+)\/complete$/);
        const tokenDetailMatch = path.match(/\/opd\/tokens\/([^/]+)$/);
        const labResultsMatch = path.match(/\/lab\/reports\/([^/]+)\/results$/);
        const labDownloadMatch = path.match(/\/lab\/reports\/([^/]+)\/download$/);
        const labDetailMatch = path.match(/\/lab\/reports\/([^/]+)$/);
        const invoicePaymentMatch = path.match(/\/billing\/invoices\/([^/]+)\/payments$/);
        const invoiceDetailMatch = path.match(/\/billing\/invoices\/([^/]+)$/);
        const patientDetailMatch = path.match(/\/patients\/([^/]+)$/);
        const doctorDetailMatch = path.match(/\/doctors\/([^/]+)$/);
        const prescriptionDetailMatch = path.match(/\/prescriptions\/([^/]+)$/);

        try {
          if (path.includes('/auth/login') && method === 'POST') {
            responseData = await this.login(data);
          } else if (
            (path.includes('/auth/otp/send') ||
              path.includes('/auth/otp/request') ||
              path.includes('/auth/phone/otp-request')) &&
            method === 'POST'
          ) {
            responseData = await this.sendOtp(data.phone, data.role);
          } else if (
            (path.includes('/auth/otp/verify') || path.includes('/auth/phone/otp-verify')) &&
            method === 'POST'
          ) {
            responseData = await this.verifyOtp(data.phone, data.otp, data.role);
          } else if (
            (path.includes('/auth/register') || path.includes('/auth/patient/register')) &&
            method === 'POST'
          ) {
            responseData = await this.registerPatient(data);
          } else if (path.includes('/auth/logout') && method === 'POST') {
            responseData = { success: true, message: 'Logged out successfully', data: null };
          } else if (path.endsWith('/api/user') && method === 'GET') {
            const pat = this.patients[0];
            responseData = {
              success: true,
              data: pat ? { ...pat, role: 'patient' as const } : null,
            };
          } else if (path.includes('/opd/free-slots') && method === 'GET') {
            responseData = {
              success: true,
              data: ['09:00 AM', '09:30 AM', '10:00 AM', '11:30 AM', '04:00 PM', '05:30 PM'],
            };
          } else if (queueCallNextMatch && method === 'POST') {
            responseData = await this.callNextToken(queueCallNextMatch[1]);
          } else if (queueDocMatch && method === 'GET') {
            responseData = {
              success: true,
              data: this.tokens.filter((t) => t.doctorId === queueDocMatch[1]),
            };
          } else if (path.includes('/opd/tokens/generate') && method === 'POST') {
            responseData = await this.generateToken(data.patientId, data.doctorId, data.visitType);
          } else if (path.includes('/opd/tokens/call-next') && method === 'POST') {
            responseData = await this.callNextToken(data.doctorId);
          } else if (tokenCompleteMatch && method === 'POST') {
            responseData = await this.completeToken(tokenCompleteMatch[1]);
          } else if (tokenDetailMatch && method === 'GET') {
            responseData = {
              success: true,
              data: this.tokens.find((t) => t.id === tokenDetailMatch[1]) || null,
            };
          } else if (path.includes('/opd/tokens') && method === 'GET') {
            responseData = { success: true, data: this.tokens };
          } else if (apptCheckInMatch && method === 'POST') {
            const target = this.appointments.find((a) => a.id === apptCheckInMatch[1]);
            if (!target) throw new Error('Appointment not found');
            target.status = 'arrived';
            responseData = { success: true, data: target };
          } else if (apptRescheduleMatch && method === 'PUT') {
            responseData = await this.rescheduleAppointment({
              ...data,
              appointmentId: apptRescheduleMatch[1],
            });
          } else if (apptVitalsMatch && method === 'PUT') {
            responseData = await this.updateVitals({
              ...data,
              appointmentId: apptVitalsMatch[1],
            });
          } else if (apptDetailMatch && method === 'DELETE') {
            responseData = await this.cancelAppointment(apptDetailMatch[1], data?.reason);
          } else if (apptDetailMatch && method === 'GET') {
            responseData = {
              success: true,
              data: this.appointments.find((a) => a.id === apptDetailMatch[1]) || null,
            };
          } else if (path.includes('/appointments') && method === 'POST') {
            responseData = await this.bookAppointment(data);
          } else if (path.includes('/appointments') && method === 'GET') {
            responseData = { success: true, data: this.appointments };
          } else if (prescriptionDetailMatch && method === 'GET') {
            responseData = {
              success: true,
              data: this.prescriptions.find((p) => p.id === prescriptionDetailMatch[1]) || null,
            };
          } else if (path.includes('/prescriptions') && method === 'POST') {
            responseData = await this.createPrescription(data);
          } else if (path.includes('/prescriptions') && method === 'GET') {
            responseData = { success: true, data: this.prescriptions };
          } else if (path.includes('/pharmacy/dispense') && method === 'POST') {
            responseData = await this.dispensePrescription(data);
          } else if (path.includes('/pharmacy/worklist') && method === 'GET') {
            responseData = { success: true, data: this.prescriptions };
          } else if (path.includes('/pharmacy/inventory') && method === 'GET') {
            responseData = { success: true, data: this.medicines };
          } else if (labResultsMatch && method === 'POST') {
            responseData = await this.saveLabResults({
              ...data,
              reportId: labResultsMatch[1],
            });
          } else if (labDownloadMatch && method === 'GET') {
            const report = this.reports.find((r) => r.id === labDownloadMatch[1]);
            responseData = {
              success: true,
              data: {
                downloadUrl: report?.downloadUrl || 'https://example.com/reports/sample.pdf',
                fileName: report
                  ? `${report.reportNumber}_${report.testName.replace(/\s+/g, '_')}.pdf`
                  : 'StarHospital_Report.pdf',
              },
            };
          } else if (labDetailMatch && method === 'GET') {
            responseData = {
              success: true,
              data: this.reports.find((r) => r.id === labDetailMatch[1]) || null,
            };
          } else if (path.includes('/lab/reports') && method === 'GET') {
            responseData = { success: true, data: this.reports };
          } else if (path.includes('/lab/results') && method === 'POST') {
            responseData = await this.saveLabResults(data);
          } else if (path.includes('/payments/razorpay/order') && method === 'POST') {
            responseData = await this.createRazorpayOrder(data);
          } else if (path.includes('/payments/razorpay/verify') && method === 'POST') {
            responseData = await this.verifyRazorpayPayment(data);
          } else if (invoicePaymentMatch && method === 'POST') {
            responseData = await this.recordPayment({
              ...data,
              invoiceId: invoicePaymentMatch[1],
            });
          } else if (invoiceDetailMatch && method === 'GET') {
            responseData = {
              success: true,
              data: this.invoices.find((inv) => inv.id === invoiceDetailMatch[1]) || null,
            };
          } else if (path.includes('/billing/invoices') && method === 'POST') {
            responseData = await this.createInvoice(data);
          } else if (path.includes('/billing/invoices') && method === 'GET') {
            responseData = { success: true, data: this.invoices };
          } else if (
            (path.includes('/staff/kpis') || path.includes('/staff/kpi-metrics')) &&
            method === 'GET'
          ) {
            responseData = { success: true, data: this.kpis };
          } else if (path.includes('/beds/admit') && method === 'POST') {
            responseData = await this.admitPatient(data);
          } else if (path.includes('/beds/discharge') && method === 'POST') {
            responseData = await this.dischargePatient(data);
          } else if (path.includes('/beds') && method === 'GET') {
            responseData = { success: true, data: this.beds };
          } else if (patientDetailMatch && method === 'GET') {
            responseData = {
              success: true,
              data: this.patients.find((p) => p.id === patientDetailMatch[1]) || null,
            };
          } else if (path.includes('/patients') && method === 'GET') {
            responseData = { success: true, data: this.patients };
          } else if (doctorDetailMatch && method === 'GET') {
            responseData = {
              success: true,
              data: this.doctors.find((d) => d.id === doctorDetailMatch[1]) || null,
            };
          } else if (path.includes('/doctors') && method === 'GET') {
            responseData = { success: true, data: this.doctors };
          } else {
            responseData = { success: true, data: {} };
          }

          return {
            data: responseData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: cfg,
          };
        } catch (error: any) {
          return {
            data: { success: false, message: error.message || 'Error occurred' },
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config: cfg,
          };
        }
      };

      return config;
    });
  }
}

export const mockAdapter = new MockAdapterEngine();
export default mockAdapter;
