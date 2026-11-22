/**
 * Star Hospital Healthcare Illustration - Doctor with Stethoscope & Thumbs Up
 * Vector illustration matching Screen 2 (Welcome Screen).
 * Rendered natively via react-native-svg.
 */

import React from 'react';
import Svg, {
  Circle,
  Path,
  Rect,
  G,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export interface DoctorIllustrationProps {
  width?: number;
  height?: number;
}

export const DoctorIllustration: React.FC<DoctorIllustrationProps> = ({
  width = 240,
  height = 240,
}) => {
  return (
    <Svg height={height} viewBox="0 0 240 240" width={width}>
      <Defs>
        <LinearGradient id="bgGrad" x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#E0F2FE" />
          <Stop offset="100%" stopColor="#BAE6FD" />
        </LinearGradient>
        <LinearGradient id="coatGrad" x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F1F5F9" />
        </LinearGradient>
        <LinearGradient id="badgeGrad" x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#0866C6" />
          <Stop offset="100%" stopColor="#2196F3" />
        </LinearGradient>
      </Defs>

      {/* Decorative Background Circle */}
      <Circle cx="120" cy="120" fill="url(#bgGrad)" r="105" />

      {/* Subtle background decorative shapes */}
      <Circle cx="45" cy="85" fill="#38BDF8" opacity={0.3} r="6" />
      <Circle cx="195" cy="70" fill="#38BDF8" opacity={0.3} r="8" />
      <Circle cx="190" cy="160" fill="#38BDF8" opacity={0.25} r="5" />

      {/* Doctor Body - Torso & Lab Coat */}
      <G id="doctorBody">
        {/* Navy/Blue scrub shirt underneath */}
        <Path
          d="M85 150 L120 185 L155 150 L170 220 L70 220 Z"
          fill="#0866C6"
        />

        {/* White Lab Coat Left */}
        <Path
          d="M60 225 L75 145 L108 152 L95 225 Z"
          fill="url(#coatGrad)"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />

        {/* White Lab Coat Right */}
        <Path
          d="M180 225 L165 145 L132 152 L145 225 Z"
          fill="url(#coatGrad)"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />

        {/* Stethoscope Tubing (Teal/Dark Blue) */}
        <Path
          d="M95 140 C95 175, 110 190, 120 190 C130 190, 145 175, 145 140"
          fill="none"
          stroke="#142D4E"
          strokeLinecap="round"
          strokeWidth="4"
        />

        {/* Stethoscope Chest Piece */}
        <Circle cx="120" cy="192" fill="#94A3B8" r="7" />
        <Circle cx="120" cy="192" fill="#0866C6" r="4" />
      </G>

      {/* Doctor Head & Neck */}
      <G id="doctorHead">
        {/* Neck */}
        <Rect fill="#FBCFE8" height="24" rx="4" width="28" x="106" y="125" />

        {/* Head/Face Base */}
        <Circle cx="120" cy="98" fill="#FDE047" opacity={0.15} r="35" />
        <Path
          d="M95 95 C95 125, 145 125, 145 95 C145 75, 95 75, 95 95 Z"
          fill="#FCD34D"
        />

        {/* Hair */}
        <Path
          d="M92 90 C92 65, 148 65, 148 90 C148 80, 140 70, 120 70 C100 70, 92 80, 92 90 Z"
          fill="#1E293B"
        />

        {/* Eyes */}
        <Circle cx="110" cy="95" fill="#1E293B" r="3" />
        <Circle cx="130" cy="95" fill="#1E293B" r="3" />

        {/* Cheerful Smile */}
        <Path
          d="M112 108 Q120 115 128 108"
          fill="none"
          stroke="#991B1B"
          strokeLinecap="round"
          strokeWidth="2.5"
        />

        {/* Stethoscope Earpieces */}
        <Path
          d="M95 105 C92 120, 95 135, 98 142"
          fill="none"
          stroke="#142D4E"
          strokeLinecap="round"
          strokeWidth="3.5"
        />
        <Path
          d="M145 105 C148 120, 145 135, 142 142"
          fill="none"
          stroke="#142D4E"
          strokeLinecap="round"
          strokeWidth="3.5"
        />
      </G>

      {/* Right Arm: Thumbs Up Gesture */}
      <G id="thumbsUpArm">
        {/* Sleeve */}
        <Path
          d="M170 160 L195 140 L205 152 L175 180 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />

        {/* Hand with Thumbs Up */}
        <Circle cx="205" cy="138" fill="#FCD34D" r="10" />
        {/* Thumb */}
        <Rect
          fill="#FCD34D"
          height="14"
          rx="4"
          transform="rotate(-15 205 128)"
          width="8"
          x="201"
          y="124"
        />
      </G>

      {/* Floating Healthcare Badge 1: Heart Pulse */}
      <G id="heartBadge" transform="translate(30, 130)">
        <Circle cx="18" cy="18" fill="url(#badgeGrad)" r="18" />
        <Path
          d="M10 18 L14 18 L16 13 L20 23 L22 18 L26 18"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
        />
      </G>

      {/* Floating Healthcare Badge 2: Medical Cross */}
      <G id="crossBadge" transform="translate(180, 85)">
        <Circle cx="16" cy="16" fill="#13B8A6" r="16" />
        <Rect fill="#FFFFFF" height="14" rx="2" width="4" x="14" y="9" />
        <Rect fill="#FFFFFF" height="4" rx="2" width="14" x="9" y="14" />
      </G>
    </Svg>
  );
};
