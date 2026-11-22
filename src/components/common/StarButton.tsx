/**
 * Star Hospital Reusable Button Component
 * Supports primary, secondary, outline, danger, ghost variants, loading spinners, and disabled states.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

export type StarButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type StarButtonSize = 'sm' | 'md' | 'lg';

export interface StarButtonProps {
  title: string;
  onPress: () => void;
  variant?: StarButtonVariant;
  size?: StarButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  testID?: string;
}

export const StarButton: React.FC<StarButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  fullWidth = true,
  testID,
}) => {
  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle[] => {
    const base: ViewStyle[] = [
      styles.base,
      styles[size],
      fullWidth ? styles.fullWidth : styles.fitContent,
    ];

    switch (variant) {
      case 'primary':
        base.push(styles.primary);
        if (!isDisabled) base.push(shadows.button);
        break;
      case 'secondary':
        base.push(styles.secondary);
        break;
      case 'outline':
        base.push(styles.outline);
        break;
      case 'danger':
        base.push(styles.danger);
        break;
      case 'ghost':
        base.push(styles.ghost);
        break;
    }

    if (isDisabled) {
      base.push(styles.disabled);
    }

    return base;
  };

  const getTextColor = (): string => {
    if (variant === 'primary' || variant === 'danger') {
      return colors.textInverse;
    }
    if (variant === 'secondary' || variant === 'outline' || variant === 'ghost') {
      return colors.primary;
    }
    return colors.textPrimary;
  };

  const spinnerColor = variant === 'primary' || variant === 'danger' ? colors.white : colors.primary;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={onPress}
      style={[getContainerStyle(), style]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}
          <Text
            style={[
              styles.textBase,
              styles[`${size}Text` as keyof typeof styles],
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon ? <View style={styles.rightIconContainer}>{rightIcon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  fitContent: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xl,
  },
  // Sizes
  sm: {
    height: 38,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
  },
  md: {
    height: 48,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    height: 52,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
  },
  // Variants
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.55,
  },
  // Typography per size
  textBase: {
    fontWeight: fontWeights.bold,
    textAlign: 'center',
  },
  smText: {
    fontSize: fontSizes.caption,
  },
  mdText: {
    fontSize: fontSizes.body,
  },
  lgText: {
    fontSize: fontSizes.subtitle,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
  },
});
