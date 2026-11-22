/**
 * Star Hospital Vector Illustration - Modern Hospital Building Hero
 * Used in Splash Screen (Screen 1) and Patient Home Banner (Screen 6).
 * Rendered natively via react-native-svg.
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

export interface HospitalHeroSvgProps {
  width?: number;
  height?: number;
}

export const HospitalHeroSvg: React.FC<HospitalHeroSvgProps> = ({
  width = 320,
  height = 180,
}) => {
  return (
    <Svg height={height} viewBox="0 0 320 180" width={width}>
      <Defs>
        <LinearGradient id="skyGradient" x1="0%" x2="0%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#EBF4FF" />
          <Stop offset="100%" stopColor="#F5F9FF" />
        </LinearGradient>
        <LinearGradient id="buildingMain" x1="0%" x2="100%" y1="0%" y2="0%">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#F1F5F9" />
        </LinearGradient>
        <LinearGradient id="buildingTower" x1="0%" x2="0%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#0866C6" />
          <Stop offset="100%" stopColor="#064A91" />
        </LinearGradient>
        <LinearGradient id="glassWindow" x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#BAE6FD" />
          <Stop offset="100%" stopColor="#7DD3FC" />
        </LinearGradient>
        <LinearGradient id="groundGrad" x1="0%" x2="100%" y1="0%" y2="0%">
          <Stop offset="0%" stopColor="#DCFCE7" />
          <Stop offset="100%" stopColor="#BBF7D0" />
        </LinearGradient>
      </Defs>

      {/* Sky Canvas / Sun / Clouds */}
      <Rect fill="url(#skyGradient)" height="180" rx="16" width="320" />
      <Circle cx="270" cy="40" fill="#FEF08A" opacity={0.6} r="18" />
      <Path
        d="M30 45 Q40 35 55 38 Q70 30 85 40 Q95 40 100 48 L25 48 Z"
        fill="#FFFFFF"
        opacity={0.8}
      />

      {/* Landscaped Green Lawn Ground */}
      <Path
        d="M0 145 Q80 138 160 142 T320 140 L320 180 L0 180 Z"
        fill="url(#groundGrad)"
      />

      {/* Modern Hospital Architecture */}
      <G id="hospitalArchitecture">
        {/* Left Wing (3 floors) */}
        <Rect
          fill="url(#buildingMain)"
          height="75"
          rx="4"
          stroke="#CBD5E1"
          strokeWidth="1"
          width="75"
          x="55"
          y="70"
        />
        {/* Windows - Left Wing */}
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="65" y="80" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="88" y="80" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="110" y="80" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="65" y="100" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="88" y="100" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="110" y="100" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="65" y="120" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="88" y="120" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="110" y="120" />

        {/* Central High-Rise Tower (Royal Blue Accent) */}
        <Rect
          fill="url(#buildingTower)"
          height="105"
          rx="6"
          stroke="#064A91"
          strokeWidth="1.5"
          width="80"
          x="125"
          y="40"
        />

        {/* Hospital Medical Red Cross on Tower Roof */}
        <Circle cx="165" cy="28" fill="#FFFFFF" r="14" stroke="#DC2626" strokeWidth="1.5" />
        <Rect fill="#DC2626" height="16" rx="2" width="4.5" x="162.75" y="20" />
        <Rect fill="#DC2626" height="4.5" rx="2" width="16" x="157" y="25.75" />

        {/* High-Rise Curtain Glass Windows */}
        <Rect fill="url(#glassWindow)" height="14" rx="2" width="28" x="135" y="52" />
        <Rect fill="url(#glassWindow)" height="14" rx="2" width="28" x="168" y="52" />
        <Rect fill="url(#glassWindow)" height="14" rx="2" width="28" x="135" y="74" />
        <Rect fill="url(#glassWindow)" height="14" rx="2" width="28" x="168" y="74" />
        <Rect fill="url(#glassWindow)" height="14" rx="2" width="28" x="135" y="96" />
        <Rect fill="url(#glassWindow)" height="14" rx="2" width="28" x="168" y="96" />

        {/* Right Wing (4 floors) */}
        <Rect
          fill="url(#buildingMain)"
          height="85"
          rx="4"
          stroke="#CBD5E1"
          strokeWidth="1"
          width="70"
          x="200"
          y="60"
        />
        {/* Windows - Right Wing */}
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="210" y="72" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="245" y="72" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="210" y="94" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="245" y="94" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="210" y="116" />
        <Rect fill="url(#glassWindow)" height="12" rx="2" width="14" x="245" y="116" />

        {/* Main Glass Entrance Canopy */}
        <Path
          d="M135 125 L195 125 L190 145 L140 145 Z"
          fill="#0866C6"
          opacity={0.3}
        />
        {/* Sliding Glass Doors */}
        <Rect
          fill="#38BDF8"
          height="22"
          opacity={0.8}
          rx="2"
          width="36"
          x="147"
          y="123"
        />
        <Rect fill="#064A91" height="22" width="2" x="164" y="123" />
      </G>

      {/* Decorative Landscaping Trees & Ambulance Entrance */}
      <G id="treesAndPath">
        {/* Driveway */}
        <Path
          d="M142 145 L130 180 L198 180 L188 145 Z"
          fill="#E2E8F0"
        />

        {/* Tree 1 Left */}
        <Circle cx="38" cy="130" fill="#22C55E" r="14" />
        <Circle cx="44" cy="122" fill="#16A34A" r="10" />
        <Rect fill="#78350F" height="15" width="4" x="36" y="138" />

        {/* Tree 2 Right */}
        <Circle cx="285" cy="128" fill="#22C55E" r="15" />
        <Circle cx="292" cy="120" fill="#16A34A" r="11" />
        <Rect fill="#78350F" height="16" width="4" x="283" y="136" />
      </G>
    </Svg>
  );
};
