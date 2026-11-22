import { ImageSourcePropType } from 'react-native';

export const TEMPLATE_IMAGES = {
  starLogo: require('./star_logo.png') as ImageSourcePropType,
  splashHospital: require('./splash_hospital.png') as ImageSourcePropType,
  welcomeDoctor: require('./welcome_doctor.png') as ImageSourcePropType,
  homeHeroBanner: require('./home_hero_banner.png') as ImageSourcePropType,
  drAmit: require('./dr_amit.png') as ImageSourcePropType,
  drPriya: require('./dr_priya.png') as ImageSourcePropType,
  drRakesh: require('./dr_rakesh.png') as ImageSourcePropType,
  drSara: require('./dr_sara.png') as ImageSourcePropType,
  drHassan: require('./dr_hassan.png') as ImageSourcePropType,
  drAyesha: require('./dr_ayesha.png') as ImageSourcePropType,
  patientRahul: require('./patient_rahul.png') as ImageSourcePropType,
};

const ALL_DOCTOR_AVATARS: ImageSourcePropType[] = [
  TEMPLATE_IMAGES.drAmit,
  TEMPLATE_IMAGES.drPriya,
  TEMPLATE_IMAGES.drRakesh,
  TEMPLATE_IMAGES.drSara,
  TEMPLATE_IMAGES.drHassan,
  TEMPLATE_IMAGES.drAyesha,
];

/**
 * Resolves the realistic HD doctor portrait avatar image matching the Star Hospital UI template.
 * Safely handles null/undefined/empty strings and deterministically maps dynamic backend doctors
 * across all 6 realistic studio portraits.
 */
export function getDoctorAvatarSource(nameOrId?: string | null): ImageSourcePropType {
  const normalized = (nameOrId || '').trim().toLowerCase();
  if (!normalized) {
    return TEMPLATE_IMAGES.drAmit;
  }
  if (
    normalized.includes('amit') ||
    normalized === 'doc-1' ||
    normalized.includes('doc-001')
  ) {
    return TEMPLATE_IMAGES.drAmit;
  }
  if (normalized.includes('priya') || normalized === 'doc-2' || normalized.includes('doc-002')) {
    return TEMPLATE_IMAGES.drPriya;
  }
  if (normalized.includes('rakesh') || normalized === 'doc-3' || normalized.includes('doc-003')) {
    return TEMPLATE_IMAGES.drRakesh;
  }
  if (
    normalized.includes('sara') ||
    normalized.includes('neha') ||
    normalized === 'doc-4' ||
    normalized.includes('doc-004')
  ) {
    return TEMPLATE_IMAGES.drSara;
  }
  if (
    normalized.includes('hassan') ||
    normalized.includes('sanjay') ||
    normalized === 'doc-5' ||
    normalized.includes('doc-005')
  ) {
    return TEMPLATE_IMAGES.drHassan;
  }
  if (
    normalized.includes('ayesha') ||
    normalized.includes('anita') ||
    normalized === 'doc-6' ||
    normalized.includes('doc-006')
  ) {
    return TEMPLATE_IMAGES.drAyesha;
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return ALL_DOCTOR_AVATARS[hash % ALL_DOCTOR_AVATARS.length];
}

