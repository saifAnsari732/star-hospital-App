/**
 * Star Hospital Design Token System - Spacing & Radii
 * Standard 8pt spacing grid and rounded corner tokens.
 */

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  hero: 32,
  section: 40,
  gutter: 16,
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,     // Standard inputs & regular buttons
  lg: 14,     // Welcome screen CTAs
  card: 16,   // Standard StarCards & elevated containers
  xl: 16,     // 16px radius alias
  xxl: 20,    // Large modal sheets
  full: 9999, // Pills, status badges, circular avatar frames
} as const;

export type SpacingToken = keyof typeof spacing;
export type RadiiToken = keyof typeof radii;
