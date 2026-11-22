/**
 * Star Hospital Design Token System - Typography
 * Strict hierarchy (H1 24px bold, H2 20px bold, H3 18px semibold, Body 15px, Caption 13px)
 */

import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const fontSizes = {
  tiny: 11,
  caption: 13,
  body: 15,
  subtitle: 16,
  h3: 18,
  h2: 20,
  h1: 24,
  displayLarge: 38, // OPD giant token number e.g. "A-102"
} as const;

export const lineHeights = {
  tiny: 14,
  caption: 18,
  body: 22,
  subtitle: 22,
  h3: 24,
  h2: 28,
  h1: 32,
  displayLarge: 46,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const typography: Record<string, TextStyle> = {
  display: {
    fontFamily,
    fontSize: fontSizes.displayLarge,
    lineHeight: lineHeights.displayLarge,
    fontWeight: fontWeights.heavy,
  },
  h1: {
    fontFamily,
    fontSize: fontSizes.h1,
    lineHeight: lineHeights.h1,
    fontWeight: fontWeights.bold,
  },
  h2: {
    fontFamily,
    fontSize: fontSizes.h2,
    lineHeight: lineHeights.h2,
    fontWeight: fontWeights.bold,
  },
  h3: {
    fontFamily,
    fontSize: fontSizes.h3,
    lineHeight: lineHeights.h3,
    fontWeight: fontWeights.semibold,
  },
  subtitle: {
    fontFamily,
    fontSize: fontSizes.subtitle,
    lineHeight: lineHeights.subtitle,
    fontWeight: fontWeights.medium,
  },
  body: {
    fontFamily,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.regular,
  },
  bodyMedium: {
    fontFamily,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.medium,
  },
  bodyBold: {
    fontFamily,
    fontSize: fontSizes.body,
    lineHeight: lineHeights.body,
    fontWeight: fontWeights.bold,
  },
  caption: {
    fontFamily,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.regular,
  },
  captionMedium: {
    fontFamily,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.medium,
  },
  captionBold: {
    fontFamily,
    fontSize: fontSizes.caption,
    lineHeight: lineHeights.caption,
    fontWeight: fontWeights.bold,
  },
  tiny: {
    fontFamily,
    fontSize: fontSizes.tiny,
    lineHeight: lineHeights.tiny,
    fontWeight: fontWeights.regular,
  },
};
