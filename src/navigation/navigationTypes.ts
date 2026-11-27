import { RouteProp, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { UserRole } from '../types/user';
import { PatientRegisterData } from '../types/auth';

// ==========================================
// 1. Auth Stack Parameter List
// ==========================================
export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  RoleSelection: undefined;
  Login: { role?: UserRole } | undefined;
  MobileLogin: { role?: UserRole; phone?: string } | undefined;
  OTPVerification: {
    phone: string;
    role: UserRole;
    isRegistration?: boolean;
    verificationId?: string;
    flow?: 'login' | 'register' | 'reset';
    registrationData?: PatientRegisterData;
  };
  PatientRegistration: undefined;
  ForgotPassword: { role?: UserRole } | undefined;
  ResetPassword: { identifier?: string; role?: UserRole; verificationCode?: string } | undefined;
  LanguageSelection: undefined;
  ProfileSetup: {
    role?: UserRole;
    registrationData?: PatientRegisterData;
  } | undefined;
  NotificationPermission: {
    role?: UserRole;
    registrationData?: PatientRegisterData;
  } | undefined;
};

export type AuthNavigationProp<T extends keyof AuthStackParamList> = NativeStackNavigationProp<
  AuthStackParamList,
  T
>;
export type AuthRouteProp<T extends keyof AuthStackParamList> = RouteProp<AuthStackParamList, T>;

// ==========================================
// 2. Patient Module Parameter Lists
// ==========================================
export type PatientTabParamList = {
  HomeTab: undefined;
  AppointmentsTab: undefined;
  ReportsTab: undefined;
  ProfileTab: undefined;
};

export type PatientStackParamList = {
  PatientTabs: NavigatorScreenParams<PatientTabParamList> | undefined;
  StaffOPDQueue: { doctorId?: string } | undefined;
  OPDToken: { tokenId?: string; tokenNumber?: string; doctorId?: string } | undefined;
  QueueStatus: { tokenNumber?: string; doctorId?: string } | undefined;
  FindDoctors: { specialty?: string; query?: string } | undefined;
  DoctorProfile: { doctorId: string; doctorName?: string };
  BookAppointment: { doctorId?: string } | undefined;
  SelectSlot: { doctorId: string; doctorName: string; department?: string };
  BookingConfirmation: {
    appointmentId?: string;
    doctorId?: string;
    doctorName: string;
    department?: string;
    date: string;
    time: string;
    mode?: 'in_person' | 'video';
    remarks?: string;
    consultationFee?: number;
  };
  AppointmentDetails: { appointmentId: string };
  CancelAppointment: { appointmentId: string };
  RescheduleAppointment: { appointmentId: string };
  PrescriptionsList: undefined;
  PrescriptionDetail: { prescriptionId: string };
  MedicineDetails: {
    medicineId?: string;
    medicineName?: string;
    genericName?: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    instructions?: string;
  };
  ReportsList: undefined;
  ReportDetail: { reportId: string; title?: string };
  LabTestBooking: { preselectedTestId?: string } | undefined;
  RadiologyReports: undefined;
  MedicalHistory: undefined;
  Allergies: undefined;
  HealthRecords: undefined;
  Bills: undefined;
  PaymentHistory: undefined;
  PaymentDetails: {
    invoiceId?: string;
    paymentId?: string;
    transactionRef?: string;
    transactionId?: string;
    module?: 'appointment' | 'opd' | 'laboratory' | 'radiology' | 'pharmacy' | 'admission' | 'invoice';
    moduleId?: string;
  };
  PaymentStatus: {
    transactionId: string;
    status: 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_paid';
    message?: string;
    receiptNumber?: string;
    amount?: number;
  };
  PaymentReceipt: {
    transactionId: string;
  };
  Admissions: undefined;
  VideoConsultation: {
    appointmentId?: string;
    doctorId?: string;
    doctorName?: string;
    department?: string;
    scheduledTime?: string;
  } | undefined;
  Notifications: undefined;
  EditProfile: undefined;
  HelpSupport: undefined;
  ContactHospital: undefined;
  Settings: undefined;
  ChangePassword: undefined;
};

export type PatientNavigationProp<T extends keyof PatientStackParamList> = NativeStackNavigationProp<
  PatientStackParamList,
  T
>;
export type PatientTabNavProp<T extends keyof PatientTabParamList> = BottomTabNavigationProp<
  PatientTabParamList,
  T
>;

// ==========================================
// 3. Doctor Module Parameter Lists
// ==========================================
export type DoctorTabParamList = {
  DoctorDashboardTab: undefined;
  PatientsTab: undefined;
  ScheduleTab: undefined;
  DoctorProfileTab: undefined;
};

export type DoctorStackParamList = {
  DoctorTabs: NavigatorScreenParams<DoctorTabParamList> | undefined;
  OPDQueueCaller: undefined;
  Consultation: { patientId: string; tokenId?: string; appointmentId?: string };
  PrescriptionBuilder: {
    patientId: string;
    patientName?: string;
    appointmentId?: string;
    diagnosis?: string;
  };
  PatientDetail: { patientId: string };
  DoctorVideoConsultation: {
    appointmentId?: string;
    patientId?: string;
    patientName?: string;
  };
  DoctorNotifications: undefined;
  DoctorSettings: undefined;
};

export type DoctorNavigationProp<T extends keyof DoctorStackParamList> = NativeStackNavigationProp<
  DoctorStackParamList,
  T
>;
export type DoctorTabNavProp<T extends keyof DoctorTabParamList> = BottomTabNavigationProp<
  DoctorTabParamList,
  T
>;

// ==========================================
// 4. Staff Module Parameter Lists
// ==========================================
export type StaffTabParamList = {
  StaffDashboardTab: undefined;
  StaffPatientsTab: undefined;
  StaffAppointmentsTab: undefined;
  StaffMoreTab: undefined;
};

export type StaffStackParamList = {
  StaffTabs: NavigatorScreenParams<StaffTabParamList> | undefined;
  StaffPatientRegistration: undefined;
  StaffPatientDetails: { patientId: string };
  StaffBookAppointment: { patientId?: string } | undefined;
  TokenGeneration: { patientId?: string; appointmentId?: string } | undefined;
  StaffOPDQueue: undefined;
  NurseVitals: { appointmentId?: string; patientId?: string } | undefined;
  LabEntry: { testId?: string } | undefined;
  StaffLabTestDetail: { orderId: string };
  PharmacyDispense: { prescriptionId?: string } | undefined;
  BillingInvoice: { patientId?: string; invoiceId?: string } | undefined;
  StaffPaymentHistory: { patientId?: string } | undefined;
  StaffPaymentTransactions: { patientId?: string; status?: string } | undefined;
  AdmissionBed: { patientId?: string } | undefined;
  StaffDischarge: { admissionId?: string; patientId?: string } | undefined;
  StaffTasks: undefined;
  StaffNotifications: undefined;
  StaffSettings: undefined;
};

export type StaffNavigationProp<T extends keyof StaffStackParamList> = NativeStackNavigationProp<
  StaffStackParamList,
  T
>;
export type StaffTabNavProp<T extends keyof StaffTabParamList> = BottomTabNavigationProp<
  StaffTabParamList,
  T
>;

// ==========================================
// 5. Root Parameter List
// ==========================================
export type RootStackParamList = {
  Auth: undefined;
  PatientRoot: undefined;
  DoctorRoot: undefined;
  StaffRoot: undefined;
};
