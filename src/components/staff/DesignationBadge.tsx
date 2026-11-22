import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import {
  UserCheck,
  HeartPulse,
  FlaskConical,
  Pill,
  Receipt,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react-native';
import { StaffDesignation } from '../../types/user';

export interface DesignationBadgeProps {
  designation: StaffDesignation | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface DesignationConfig {
  label: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const DESIGNATION_MAP: Record<string, DesignationConfig> = {
  receptionist: {
    label: 'Receptionist',
    icon: UserCheck,
    bgColor: '#E0F2FE',
    textColor: '#0866C6',
    borderColor: '#BAE6FD',
  },
  nurse: {
    label: 'Staff Nurse',
    icon: HeartPulse,
    bgColor: '#CCFBF1',
    textColor: '#0F766E',
    borderColor: '#99F6E4',
  },
  laboratorist: {
    label: 'Laboratorist',
    icon: FlaskConical,
    bgColor: '#EDE9FE',
    textColor: '#6D28D9',
    borderColor: '#DDD6FE',
  },
  lab_tech: {
    label: 'Lab Technician',
    icon: FlaskConical,
    bgColor: '#EDE9FE',
    textColor: '#6D28D9',
    borderColor: '#DDD6FE',
  },
  pharmacist: {
    label: 'Pharmacist',
    icon: Pill,
    bgColor: '#DCFCE7',
    textColor: '#15803D',
    borderColor: '#BBF7D0',
  },
  billing: {
    label: 'Billing Officer',
    icon: Receipt,
    bgColor: '#FEF3C7',
    textColor: '#B45309',
    borderColor: '#FDE68A',
  },
  billing_clerk: {
    label: 'Billing Officer',
    icon: Receipt,
    bgColor: '#FEF3C7',
    textColor: '#B45309',
    borderColor: '#FDE68A',
  },
  admin: {
    label: 'Administrator',
    icon: ShieldCheck,
    bgColor: '#EFF6FF',
    textColor: '#1E40AF',
    borderColor: '#BFDBFE',
  },
};

const DEFAULT_CONFIG: DesignationConfig = {
  label: 'Hospital Staff',
  icon: UserCheck,
  bgColor: '#F1F5F9',
  textColor: '#475569',
  borderColor: '#CBD5E1',
};

export const DesignationBadge: React.FC<DesignationBadgeProps> = ({
  designation,
  size = 'md',
  showIcon = true,
  onPress,
  style,
  testID,
}) => {
  const normalizedKey = (designation || '').toLowerCase().trim();
  const config = DESIGNATION_MAP[normalizedKey] || {
    ...DEFAULT_CONFIG,
    label: designation ? designation.charAt(0).toUpperCase() + designation.slice(1) : 'Staff',
  };

  const IconComponent = config.icon;

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const badgeStyles = [
    styles.badge,
    styles[`badge_${size}`],
    {
      backgroundColor: config.bgColor,
      borderColor: config.borderColor,
    },
    style,
  ];

  const content = (
    <>
      {showIcon && (
        <View style={styles.iconWrapper}>
          <IconComponent
            size={iconSizes[size]}
            color={config.textColor}
            strokeWidth={2.4}
          />
        </View>
      )}
      <Text
        style={[
          styles.text,
          styles[`text_${size}`],
          { color: config.textColor },
        ]}
        numberOfLines={1}
      >
        {config.label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        testID={testID}
        style={badgeStyles}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={badgeStyles}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badge_sm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badge_md: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badge_lg: {
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  iconWrapper: {
    marginRight: 5,
  },
  text: {
    fontWeight: '600',
  },
  text_sm: {
    fontSize: 11,
  },
  text_md: {
    fontSize: 13,
  },
  text_lg: {
    fontSize: 15,
  },
});
