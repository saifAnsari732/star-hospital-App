/**
 * Star Hospital Reusable 3-Way Role Pill Toggle
 * Toggle pill control for [ Patient | Doctor | Staff ] matching Screen 3 Login specification.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { User, Stethoscope, ShieldCheck } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

export type UserRoleType = 'patient' | 'doctor' | 'staff';

export interface RolePillToggleProps {
  selectedRole: UserRoleType;
  onSelectRole: (role: UserRoleType) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  testID?: string;
}

interface RoleOption {
  key: UserRoleType;
  label: string;
  icon: (color: string) => React.ReactNode;
}

const ROLES: RoleOption[] = [
  {
    key: 'patient',
    label: 'Patient',
    icon: (color) => <User color={color} size={16} />,
  },
  {
    key: 'doctor',
    label: 'Doctor',
    icon: (color) => <Stethoscope color={color} size={16} />,
  },
  {
    key: 'staff',
    label: 'Staff',
    icon: (color) => <ShieldCheck color={color} size={16} />,
  },
];

export const RolePillToggle: React.FC<RolePillToggleProps> = ({
  selectedRole,
  onSelectRole,
  style,
  disabled = false,
  testID,
}) => {
  return (
    <View
      accessibilityRole="radiogroup"
      style={[styles.container, style]}
      testID={testID}
    >
      {ROLES.map((role) => {
        const isSelected = selectedRole === role.key;
        const iconColor = isSelected ? colors.textInverse : colors.textSecondary;
        const textColor = isSelected ? colors.textInverse : colors.textSecondary;

        return (
          <TouchableOpacity
            key={role.key}
            accessibilityLabel={`${role.label} role`}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            activeOpacity={0.8}
            disabled={disabled}
            onPress={() => onSelectRole(role.key)}
            style={[
              styles.pill,
              isSelected ? [styles.pillActive, shadows.button] : styles.pillInactive,
            ]}
          >
            <View style={styles.iconWrapper}>{role.icon(iconColor)}</View>
            <Text
              style={[
                styles.label,
                { color: textColor },
                isSelected ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {role.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  pill: {
    flex: 1,
    height: 42,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillInactive: {
    backgroundColor: 'transparent',
  },
  iconWrapper: {
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSizes.caption,
  },
  labelActive: {
    fontWeight: fontWeights.bold,
  },
  labelInactive: {
    fontWeight: fontWeights.medium,
  },
});
