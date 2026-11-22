export const HOSPITAL_INFO = {
  NAME: 'STAR HOSPITAL',
  DISPLAY_NAME: 'Star Hospital',
  TAGLINE: 'Care Today... Healthier Tomorrow...',
  HELPLINE: '+91 22 4000 8800',
  EMERGENCY_NUMBER: '+91 22 4000 9911',
  EMAIL: 'care@starhospital.com',
  WEBSITE: 'https://starhospital.example.com',
  ADDRESS: 'Star Health Tower, Linking Road, Bandra West, Mumbai 400050',
  OPD_HOURS: 'Mon - Sat: 08:30 AM - 08:00 PM | Emergency: 24/7',
  BACKEND_SYSTEM: 'ICTHospital HMS (Laravel)',
} as const;

export const HOSPITAL_DEPARTMENTS = [
  'General Medicine',
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
  'Dermatology',
  'Gynecology',
  'Neurology',
  'ENT',
  'Ophthalmology',
  'Pathology & Diagnostics',
] as const;

export const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];
