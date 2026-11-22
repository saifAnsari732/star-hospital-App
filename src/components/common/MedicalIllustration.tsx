import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';
import {
  BookingConfirmedSvg,
  DoctorIllustration,
  EmptyAppointmentsSvg,
  EmptyPrescriptionsSvg,
  EmptyReportsSvg,
  HospitalHeroSvg,
} from '../../assets/illustrations';
import { colors } from '../../theme';

export type MedicalIllustrationVariant =
  | 'hospital-hero'
  | 'doctor'
  | 'empty-appointments'
  | 'empty-reports'
  | 'empty-prescriptions'
  | 'booking-confirmed'
  | 'pharmacy'
  | 'billing'
  | 'opd-queue'
  | 'emergency';

export interface MedicalIllustrationProps {
  variant: MedicalIllustrationVariant;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

const DEFAULT_DIMENSIONS: Record<MedicalIllustrationVariant, { width: number; height: number }> = {
  'hospital-hero': { width: 280, height: 180 },
  doctor: { width: 180, height: 180 },
  'empty-appointments': { width: 180, height: 150 },
  'empty-reports': { width: 180, height: 150 },
  'empty-prescriptions': { width: 180, height: 150 },
  'booking-confirmed': { width: 190, height: 160 },
  pharmacy: { width: 180, height: 150 },
  billing: { width: 180, height: 150 },
  'opd-queue': { width: 200, height: 150 },
  emergency: { width: 180, height: 150 },
};

const PharmacySvg: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <Svg width={width} height={height} viewBox="0 0 200 160" fill="none">
    <Defs>
      <LinearGradient id="pharmBg" x1="0" y1="0" x2="200" y2="160" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#E6F1FD" />
        <Stop offset="1" stopColor="#F5F9FF" />
      </LinearGradient>
      <LinearGradient id="bottleGrad" x1="65" y1="35" x2="125" y2="128" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#FFFFFF" />
        <Stop offset="1" stopColor="#DCEBFF" />
      </LinearGradient>
    </Defs>
    <Circle cx="100" cy="80" r="68" fill="url(#pharmBg)" />
    <Rect x="72" y="28" width="46" height="14" rx="5" fill={colors.primaryDark} />
    <Rect
      x="65"
      y="42"
      width="60"
      height="86"
      rx="14"
      fill="url(#bottleGrad)"
      stroke={colors.primary}
      strokeWidth="2.5"
    />
    <Rect x="75" y="60" width="40" height="46" rx="8" fill={colors.surface} stroke={colors.borderLight} strokeWidth="1.5" />
    <Path d="M95 72V94M84 83H106" stroke={colors.tealAccent} strokeWidth="4.5" strokeLinecap="round" />
    <G transform="translate(122, 92) rotate(-25)">
      <Rect x="0" y="0" width="38" height="16" rx="8" fill={colors.primary} />
      <Rect x="19" y="0" width="19" height="16" rx="8" fill={colors.tealAccent} />
    </G>
    <Circle cx="46" cy="54" r="6" fill={colors.secondary} opacity="0.25" />
    <Circle cx="156" cy="48" r="8" fill={colors.tealAccent} opacity="0.25" />
  </Svg>
);

const BillingSvg: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <Svg width={width} height={height} viewBox="0 0 200 160" fill="none">
    <Circle cx="100" cy="80" r="66" fill="#E6F1FD" />
    <Rect
      x="56"
      y="26"
      width="88"
      height="108"
      rx="14"
      fill={colors.surface}
      stroke={colors.primary}
      strokeWidth="2.5"
    />
    <Rect x="68" y="40" width="64" height="18" rx="6" fill="#EBF4FF" />
    <Rect x="74" y="46" width="36" height="6" rx="3" fill={colors.primary} />
    <Rect x="68" y="68" width="44" height="6" rx="3" fill="#BBD6F7" />
    <Rect x="118" y="68" width="14" height="6" rx="3" fill={colors.tealAccent} />
    <Rect x="68" y="84" width="38" height="6" rx="3" fill="#BBD6F7" />
    <Rect x="118" y="84" width="14" height="6" rx="3" fill={colors.tealAccent} />
    <Rect x="68" y="100" width="48" height="6" rx="3" fill="#BBD6F7" />
    <Circle cx="142" cy="112" r="20" fill={colors.tealAccent} />
    <Path
      d="M134 112L139.5 117.5L151 106"
      stroke={colors.white}
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const OpdQueueSvg: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <Svg width={width} height={height} viewBox="0 0 220 160" fill="none">
    <Circle cx="110" cy="80" r="68" fill="#E6F1FD" />
    <Rect
      x="38"
      y="36"
      width="144"
      height="88"
      rx="18"
      fill={colors.surface}
      stroke={colors.primary}
      strokeWidth="2.5"
    />
    <Rect x="52" y="50" width="54" height="12" rx="6" fill={colors.primary} />
    <Rect x="52" y="72" width="116" height="10" rx="5" fill="#DCEBFF" />
    <Rect x="52" y="72" width="76" height="10" rx="5" fill={colors.tealAccent} />
    <Circle cx="60" cy="102" r="9" fill={colors.tealAccent} />
    <Circle cx="108" cy="102" r="9" fill={colors.primary} />
    <Circle cx="156" cy="102" r="9" fill="#CBDDF5" />
    <Path d="M69 102H99M117 102H147" stroke="#A6C8F0" strokeWidth="3" strokeLinecap="round" />
    <Path d="M56.5 102L59 104.5L64 99.5" stroke={colors.white} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const EmergencySvg: React.FC<{ width: number; height: number }> = ({ width, height }) => (
  <Svg width={width} height={height} viewBox="0 0 200 160" fill="none">
    <Circle cx="100" cy="80" r="66" fill="#FEECEE" />
    <Circle cx="100" cy="80" r="46" fill={colors.surface} stroke={colors.danger} strokeWidth="2.5" />
    <Path
      d="M58 82H76L86 60L98 100L110 70L118 82H142"
      stroke={colors.danger}
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="146" cy="44" r="14" fill={colors.primary} />
    <Path d="M146 37V51M139 44H153" stroke={colors.white} strokeWidth="3" strokeLinecap="round" />
  </Svg>
);

/**
 * Reusable Star Hospital Healthcare Illustration wrapper.
 * Unifies local Open Peeps / Storyset / unDraw-inspired medical SVGs in the
 * hospital's blue, white, and teal visual system.
 */
export const MedicalIllustration: React.FC<MedicalIllustrationProps> = ({
  variant,
  width,
  height,
  style,
  accessibilityLabel,
  testID,
}) => {
  const defaults = DEFAULT_DIMENSIONS[variant];
  const resolvedWidth = width ?? defaults.width;
  const resolvedHeight = height ?? defaults.height;

  const renderGraphic = () => {
    switch (variant) {
      case 'hospital-hero':
        return <HospitalHeroSvg width={resolvedWidth} height={resolvedHeight} />;
      case 'doctor':
        return <DoctorIllustration width={resolvedWidth} height={resolvedHeight} />;
      case 'empty-appointments':
        return <EmptyAppointmentsSvg width={resolvedWidth} height={resolvedHeight} />;
      case 'empty-reports':
        return <EmptyReportsSvg width={resolvedWidth} height={resolvedHeight} />;
      case 'empty-prescriptions':
        return <EmptyPrescriptionsSvg width={resolvedWidth} height={resolvedHeight} />;
      case 'booking-confirmed':
        return <BookingConfirmedSvg width={resolvedWidth} height={resolvedHeight} />;
      case 'pharmacy':
        return <PharmacySvg width={resolvedWidth} height={resolvedHeight} />;
      case 'billing':
        return <BillingSvg width={resolvedWidth} height={resolvedHeight} />;
      case 'opd-queue':
        return <OpdQueueSvg width={resolvedWidth} height={resolvedHeight} />;
      case 'emergency':
        return <EmergencySvg width={resolvedWidth} height={resolvedHeight} />;
    }
  };

  return (
    <View
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, style]}
      testID={testID}
    >
      {renderGraphic()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MedicalIllustration;
