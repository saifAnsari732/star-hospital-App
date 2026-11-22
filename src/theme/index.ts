/**
 * Star Hospital Design Token System - Main Theme Index
 */

import { colors } from './colors';
import { typography, fontSizes, fontWeights, lineHeights } from './typography';
import { spacing, radii } from './spacing';
import { shadows } from './shadows';

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';

export const StarHospitalTheme = {
  colors,
  typography,
  fontSizes,
  fontWeights,
  lineHeights,
  spacing,
  radii,
  shadows,
} as const;

export const theme = StarHospitalTheme;
export default StarHospitalTheme;
