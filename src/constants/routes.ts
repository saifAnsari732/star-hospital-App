import {
  AuthStackParamList,
  DoctorStackParamList,
  DoctorTabParamList,
  PatientStackParamList,
  PatientTabParamList,
  RootStackParamList,
  StaffStackParamList,
  StaffTabParamList,
} from '../navigation/navigationTypes';

export const ROOT_ROUTES = {
  AUTH: 'Auth',
  PATIENT_ROOT: 'PatientRoot',
  DOCTOR_ROOT: 'DoctorRoot',
  STAFF_ROOT: 'StaffRoot',
} as const satisfies Record<string, keyof RootStackParamList>;

export const AUTH_ROUTES = {
  SPLASH: 'Splash',
  WELCOME: 'Welcome',
  ONBOARDING: 'Onboarding',
  ROLE_SELECTION: 'RoleSelection',
  LOGIN: 'Login',
  MOBILE_LOGIN: 'MobileLogin',
  OTP_VERIFICATION: 'OTPVerification',
  PATIENT_REGISTRATION: 'PatientRegistration',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  LANGUAGE_SELECTION: 'LanguageSelection',
  PROFILE_SETUP: 'ProfileSetup',
  NOTIFICATION_PERMISSION: 'NotificationPermission',
} as const satisfies Record<string, keyof AuthStackParamList>;

export const PATIENT_TAB_ROUTES = {
  HOME: 'HomeTab',
  APPOINTMENTS: 'AppointmentsTab',
  REPORTS: 'ReportsTab',
  PROFILE: 'ProfileTab',
} as const satisfies Record<string, keyof PatientTabParamList>;

export const PATIENT_ROUTES = {
  TABS: 'PatientTabs',
  OPD_TOKEN: 'OPDToken',
  QUEUE_STATUS: 'QueueStatus',
  FIND_DOCTORS: 'FindDoctors',
  DOCTOR_PROFILE: 'DoctorProfile',
  BOOK_APPOINTMENT: 'BookAppointment',
  SELECT_SLOT: 'SelectSlot',
  BOOKING_CONFIRMATION: 'BookingConfirmation',
  APPOINTMENT_DETAILS: 'AppointmentDetails',
  CANCEL_APPOINTMENT: 'CancelAppointment',
  RESCHEDULE_APPOINTMENT: 'RescheduleAppointment',
  PRESCRIPTIONS_LIST: 'PrescriptionsList',
  PRESCRIPTION_DETAIL: 'PrescriptionDetail',
  MEDICINE_DETAILS: 'MedicineDetails',
  REPORTS_LIST: 'ReportsList',
  REPORT_DETAIL: 'ReportDetail',
  LAB_TEST_BOOKING: 'LabTestBooking',
  RADIOLOGY_REPORTS: 'RadiologyReports',
  MEDICAL_HISTORY: 'MedicalHistory',
  ALLERGIES: 'Allergies',
  HEALTH_RECORDS: 'HealthRecords',
  BILLS: 'Bills',
  PAYMENT_HISTORY: 'PaymentHistory',
  PAYMENT_DETAILS: 'PaymentDetails',
  ADMISSIONS: 'Admissions',
  VIDEO_CONSULTATION: 'VideoConsultation',
  NOTIFICATIONS: 'Notifications',
  EDIT_PROFILE: 'EditProfile',
  HELP_SUPPORT: 'HelpSupport',
  CONTACT_HOSPITAL: 'ContactHospital',
  SETTINGS: 'Settings',
  CHANGE_PASSWORD: 'ChangePassword',
} as const satisfies Record<string, keyof PatientStackParamList>;

export const DOCTOR_TAB_ROUTES = {
  DASHBOARD: 'DoctorDashboardTab',
  PATIENTS: 'PatientsTab',
  SCHEDULE: 'ScheduleTab',
  PROFILE: 'DoctorProfileTab',
} as const satisfies Record<string, keyof DoctorTabParamList>;

export const DOCTOR_ROUTES = {
  TABS: 'DoctorTabs',
  OPD_QUEUE_CALLER: 'OPDQueueCaller',
  CONSULTATION: 'Consultation',
  PRESCRIPTION_BUILDER: 'PrescriptionBuilder',
  PATIENT_DETAIL: 'PatientDetail',
  NOTIFICATIONS: 'DoctorNotifications',
} as const satisfies Record<string, keyof DoctorStackParamList>;

export const STAFF_TAB_ROUTES = {
  DASHBOARD: 'StaffDashboardTab',
  PATIENTS: 'StaffPatientsTab',
  APPOINTMENTS: 'StaffAppointmentsTab',
  MORE: 'StaffMoreTab',
} as const satisfies Record<string, keyof StaffTabParamList>;

export const STAFF_ROUTES = {
  TABS: 'StaffTabs',
  TOKEN_GENERATION: 'TokenGeneration',
  NURSE_VITALS: 'NurseVitals',
  LAB_ENTRY: 'LabEntry',
  PHARMACY_DISPENSE: 'PharmacyDispense',
  BILLING_INVOICE: 'BillingInvoice',
  ADMISSION_BED: 'AdmissionBed',
  NOTIFICATIONS: 'StaffNotifications',
} as const satisfies Record<string, keyof StaffStackParamList>;
