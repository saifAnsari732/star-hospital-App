/**
 * Star Hospital Reusable Text Input Component
 * Features left icon, placeholder, focus highlight, password eye toggle, and error states.
 */

import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

export interface StarInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  errorMessage?: string | null;
  isPassword?: boolean;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  required?: boolean;
  testID?: string;
}

export const StarInput = forwardRef<React.ComponentRef<typeof TextInput>, StarInputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      leftIcon,
      rightIcon,
      errorMessage,
      isPassword = false,
      disabled = false,
      containerStyle,
      inputStyle,
      required = false,
      testID,
      ...restProps
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const hasError = !!errorMessage;

    const getInputBorderColor = (): string => {
      if (hasError) return colors.danger;
      if (isFocused) return colors.primary;
      return colors.border;
    };

    const getInputBackgroundColor = (): string => {
      if (disabled) return colors.surfaceSubtle;
      if (isFocused) return colors.surface;
      return colors.surface;
    };

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label ? (
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              {label}
              {required ? <Text style={styles.requiredAsterisk}> *</Text> : null}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            {
              borderColor: getInputBorderColor(),
              backgroundColor: getInputBackgroundColor(),
            },
          ]}
        >
          {leftIcon ? <View style={styles.leftIconWrapper}>{leftIcon}</View> : null}

          <TextInput
            ref={ref}
            accessibilityLabel={label || placeholder}
            editable={!disabled}
            onBlur={() => setIsFocused(false)}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            placeholderTextColor={colors.textPlaceholder}
            secureTextEntry={isPassword && !showPassword}
            style={[
              styles.textInput,
              { color: disabled ? colors.textMuted : colors.textPrimary },
              inputStyle,
            ]}
            testID={testID}
            value={value}
            {...restProps}
          />

          {isPassword ? (
            <TouchableOpacity
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityRole="button"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => setShowPassword(!showPassword)}
              style={styles.rightActionWrapper}
            >
              {showPassword ? (
                <EyeOff color={colors.textSecondary} size={20} />
              ) : (
                <Eye color={colors.textSecondary} size={20} />
              )}
            </TouchableOpacity>
          ) : rightIcon ? (
            <View style={styles.rightActionWrapper}>{rightIcon}</View>
          ) : null}
        </View>

        {hasError ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    );
  }
);

StarInput.displayName = 'StarInput';

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
  },
  requiredAsterisk: {
    color: colors.danger,
    fontWeight: fontWeights.bold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1.2,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  leftIconWrapper: {
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: fontSizes.body,
    paddingVertical: 0,
  },
  rightActionWrapper: {
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: spacing.xs,
    fontSize: fontSizes.tiny,
    color: colors.danger,
    fontWeight: fontWeights.medium,
  },
});
