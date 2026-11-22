/**
 * Star Hospital Healthcare Empty State Illustrations
 * Native SVG vector illustrations for Appointments, Reports, Prescriptions, and Booking Confirmation.
 */

import React from 'react';
import Svg, {
  Path,
  Rect,
  Circle,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export interface IllustrationProps {
  width?: number;
  height?: number;
}

/**
 * Empty Appointments Illustration (Storyset Pana style)
 */
export const EmptyAppointmentsSvg: React.FC<IllustrationProps> = ({
  width = 160,
  height = 140,
}) => {
  return (
    <Svg height={height} viewBox="0 0 160 140" width={width}>
      <Defs>
        <LinearGradient id="calGrad" x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F1F5F9" />
        </LinearGradient>
      </Defs>

      {/* Background Soft Glow */}
      <Circle cx="80" cy="70" fill="#EBF4FF" r="60" />

      {/* Calendar Base Sheet */}
      <Rect
        fill="url(#calGrad)"
        height="80"
        rx="12"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        width="90"
        x="35"
        y="35"
      />

      {/* Calendar Header Bar (Primary Blue) */}
      <Path
        d="M35 47 C35 40.37 40.37 35 47 35 L113 35 C119.63 35 125 40.37 125 47 L125 55 L35 55 Z"
        fill="#0866C6"
      />

      {/* Calendar Rings */}
      <Rect fill="#64748B" height="12" rx="2" width="4" x="52" y="29" />
      <Rect fill="#64748B" height="12" rx="2" width="4" x="104" y="29" />

      {/* Calendar Grid Placeholders */}
      <Circle cx="55" cy="70" fill="#CBD5E1" r="5" />
      <Circle cx="80" cy="70" fill="#CBD5E1" r="5" />
      <Circle cx="105" cy="70" fill="#CBD5E1" r="5" />
      <Circle cx="55" cy="92" fill="#CBD5E1" r="5" />
      <Circle cx="80" cy="92" fill="#38BDF8" r="7" />
      <Circle cx="105" cy="92" fill="#CBD5E1" r="5" />

      {/* Floating Clock Badge */}
      <Circle cx="115" cy="100" fill="#FFFFFF" r="18" stroke="#0866C6" strokeWidth="2" />
      <Circle cx="115" cy="100" fill="#0866C6" r="2" />
      <Path
        d="M115 88 L115 100 L123 100"
        fill="none"
        stroke="#0866C6"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </Svg>
  );
};

/**
 * Empty Reports Illustration (Clinical medical folder)
 */
export const EmptyReportsSvg: React.FC<IllustrationProps> = ({
  width = 160,
  height = 140,
}) => {
  return (
    <Svg height={height} viewBox="0 0 160 140" width={width}>
      {/* Background Soft Glow */}
      <Circle cx="80" cy="70" fill="#E0F2FE" r="60" />

      {/* Folder Backing */}
      <Path
        d="M35 40 L65 40 L75 48 L125 48 C128 48 130 50 130 53 L130 105 C130 108 128 110 125 110 L35 110 C32 110 30 108 30 105 L30 45 C30 42 32 40 35 40 Z"
        fill="#0284C7"
      />

      {/* Document Sheet Peeking Out */}
      <Rect
        fill="#FFFFFF"
        height="60"
        rx="4"
        stroke="#E2E8F0"
        strokeWidth="1.5"
        width="65"
        x="45"
        y="45"
      />
      {/* Document Lines */}
      <Rect fill="#94A3B8" height="3" rx="1.5" width="40" x="55" y="55" />
      <Rect fill="#CBD5E1" height="3" rx="1.5" width="45" x="55" y="64" />
      <Rect fill="#CBD5E1" height="3" rx="1.5" width="35" x="55" y="73" />

      {/* Red Droplet Badge (Lab test symbol) */}
      <Circle cx="108" cy="90" fill="#FEE2E2" r="16" />
      <Path
        d="M108 80 C108 80 101 88 101 92 C101 95.8 104.1 99 108 99 C111.9 99 115 95.8 115 92 C115 88 108 80 108 80 Z"
        fill="#DC2626"
      />
    </Svg>
  );
};

/**
 * Empty Prescriptions Illustration (Rx pad with capsule)
 */
export const EmptyPrescriptionsSvg: React.FC<IllustrationProps> = ({
  width = 160,
  height = 140,
}) => {
  return (
    <Svg height={height} viewBox="0 0 160 140" width={width}>
      <Circle cx="80" cy="70" fill="#EBF4FF" r="60" />

      {/* Rx Document Sheet */}
      <Rect
        fill="#FFFFFF"
        height="75"
        rx="6"
        stroke="#CBD5E1"
        strokeWidth="1.5"
        width="65"
        x="40"
        y="35"
      />

      {/* Rx Symbol */}
      <Path
        d="M52 48 L52 64 M52 48 L58 48 C61 48 63 50 63 53 C63 56 61 58 58 58 L52 58 M56 58 L63 66 M59 61 L65 57"
        fill="none"
        stroke="#0866C6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
      />

      {/* Medical Pill / Capsule in Foreground */}
      <G transform="translate(85, 75) rotate(-25)">
        <Rect fill="#13B8A6" height="30" rx="10" width="20" x="0" y="0" />
        <Path d="M0 15 L20 15 L20 20 C20 25.5 15.5 30 10 30 C4.5 30 0 25.5 0 20 Z" fill="#2196F3" />
        <Circle cx="10" cy="8" fill="#FFFFFF" opacity={0.6} r="2" />
      </G>
    </Svg>
  );
};

/**
 * Booking Confirmed Illustration (Green checkmark shield)
 */
export const BookingConfirmedSvg: React.FC<IllustrationProps> = ({
  width = 160,
  height = 140,
}) => {
  return (
    <Svg height={height} viewBox="0 0 160 140" width={width}>
      <Circle cx="80" cy="70" fill="#DCFCE7" r="55" />

      {/* Medical Shield */}
      <Path
        d="M80 32 L110 44 C110 70 95 95 80 105 C65 95 50 70 50 44 Z"
        fill="#16A34A"
      />

      {/* White Bold Checkmark */}
      <Path
        d="M68 68 L76 76 L94 56"
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
    </Svg>
  );
};
