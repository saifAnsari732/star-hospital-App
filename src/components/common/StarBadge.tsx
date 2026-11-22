/**
 * Star Hospital Reusable Status Badge / Pill Component
 * Standard capsule badge for Confirmed, Completed, In Queue, Serving, Waiting, and Cancelled states.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

export type StarBadgeStatus =
  | 'confirmed'
  | 'completed'
  | 'in_queue'
  | 'serving'
  | 'waiting'
  | 'cancelled'
  | 'scheduled'
  | 'pending'
  | 'neutral';

export type StarBadgeSize = 'sm' | 'md';

export interface StarBadgeProps {
  label: string;
  status?: StarBadgeStatus;
  size?: StarBadgeSize;
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const StarBadge: React.FC<StarBadgeProps> = ({
  label,
  status = 'neutral',
  size = 'md',
  showDot = false,
  style,
  textStyle,
  testID,
}) => {
  const getBadgeColors = (): { bg: string; text: string; dot: string; border?: string } => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return {
          bg: colors.successLight,
          text: colors.successText,
          dot: colors.success,
        };
      case 'completed':
        return {
          bg: colors.infoLight,
          text: colors.primary,
          dot: colors.primary,
        };
      case 'in_queue':
      case 'waiting':
      case 'pending':
        return {
          bg: colors.warningLight,
          text: colors.warningText,
          dot: colors.warning,
        };
      case 'serving':
        return {
          bg: colors.primaryLight,
          text: colors.primaryDark,
          dot: colors.primary,
          border: '#BFDBFE',
        };
      case 'cancelled':
        return {
          bg: colors.dangerLight,
          text: colors.dangerText,
          dot: colors.danger,
        };
      case 'neutral':
      default:
        return {
          bg: colors.surfaceSubtle,
          text: colors.textSecondary,
          dot: colors.textMuted,
          border: colors.border,
        };
    }
  };

  const palette = getBadgeColors();

  return (
    <View
      style={[
        styles.base,
        styles[size],
        {
          backgroundColor: palette.bg,
          borderColor: palette.border || 'transparent',
          borderWidth: palette.border ? 1 : 0,
        },
        style,
      ]}
      testID={testID}
    >
      {showDot ? (
        <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      ) : null}
      <Text
        style={[
          styles.textBase,
          styles[`${size}Text` as keyof typeof styles],
          { color: palette.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  md: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },
  textBase: {
    fontWeight: fontWeights.semibold,
  },
  smText: {
    fontSize: fontSizes.tiny,
    lineHeight: 14,
  },
  mdText: {
    fontSize: fontSizes.caption,
    lineHeight: 18,
  },
});
