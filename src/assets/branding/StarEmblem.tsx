/**
 * Star Hospital Standalone Emblem - 5-Point Blue Star with Centered Medical Cross
 * Rendered natively via react-native-svg.
 */

import React from 'react';
import Svg, {
  Path,
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

export interface StarEmblemProps {
  size?: number;
  primaryColor?: string;
  crossColor?: string;
}

export const StarEmblem: React.FC<StarEmblemProps> = ({
  size = 48,
  primaryColor = '#0866C6',
  crossColor = '#FFFFFF',
}) => {
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Defs>
        <LinearGradient id="starGrad" x1="0%" x2="100%" y1="0%" y2="100%">
          <Stop offset="0%" stopColor="#2196F3" />
          <Stop offset="100%" stopColor={primaryColor} />
        </LinearGradient>
      </Defs>

      {/* Orbiting Dynamic Swoosh */}
      <Path
        d="M10 50 A 42 22 45 0 1 90 50 A 42 22 45 0 1 10 50"
        fill="none"
        opacity={0.35}
        stroke="#13B8A6"
        strokeWidth="3.5"
      />

      {/* 5-Point Symmetrical Medical Star */}
      <Path
        d="M50 5 L62.5 35 L95 38 L70 60 L78 92 L50 75 L22 92 L30 60 L5 38 L37.5 35 Z"
        fill="url(#starGrad)"
      />

      {/* Subtle Star Center Core Circle */}
      <Circle cx="50" cy="50" fill={primaryColor} opacity={0.3} r="18" />

      {/* Centered Medical White Cross */}
      <Rect
        fill={crossColor}
        height="26"
        rx="3.5"
        width="8"
        x="46"
        y="37"
      />
      <Rect
        fill={crossColor}
        height="8"
        rx="3.5"
        width="26"
        x="37"
        y="46"
      />
    </Svg>
  );
};
