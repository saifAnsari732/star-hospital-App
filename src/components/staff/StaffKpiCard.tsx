import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

export type StaffKpiColorTheme = 'blue' | 'green' | 'orange' | 'purple';

export interface StaffKpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  theme?: StaffKpiColorTheme;
  trendText?: string;
  trendPositive?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const THEME_STYLES: Record<
  StaffKpiColorTheme,
  {
    iconBg: string;
    iconColor: string;
    border: string;
    trendBg: string;
    trendColor: string;
  }
> = {
  blue: {
    iconBg: '#E0F2FE',
    iconColor: '#0866C6',
    border: '#BFDBFE',
    trendBg: '#EFF6FF',
    trendColor: '#0866C6',
  },
  green: {
    iconBg: '#DCFCE7',
    iconColor: '#16A34A',
    border: '#BBF7D0',
    trendBg: '#F0FDF4',
    trendColor: '#15803D',
  },
  orange: {
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    border: '#FDE68A',
    trendBg: '#FFFBEB',
    trendColor: '#B45309',
  },
  purple: {
    iconBg: '#EDE9FE',
    iconColor: '#7C3AED',
    border: '#DDD6FE',
    trendBg: '#FAF5FF',
    trendColor: '#6D28D9',
  },
};

export const StaffKpiCard: React.FC<StaffKpiCardProps> = ({
  label,
  value,
  icon: IconComponent,
  theme = 'blue',
  trendText,
  trendPositive = true,
  onPress,
  style,
  testID,
}) => {
  const currentTheme = THEME_STYLES[theme] || THEME_STYLES.blue;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      style={[styles.card, { borderColor: currentTheme.border }, style]}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: currentTheme.iconBg }]}>
          <IconComponent size={22} color={currentTheme.iconColor} strokeWidth={2.2} />
        </View>

        {trendText && (
          <View
            style={[
              styles.trendBadge,
              {
                backgroundColor: trendPositive ? '#DCFCE7' : '#FEE2E2',
              },
            ]}
          >
            <Text
              style={[
                styles.trendText,
                { color: trendPositive ? '#15803D' : '#DC2626' },
              ]}
            >
              {trendText}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.value} numberOfLines={1}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
    minHeight: 112,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contentContainer: {
    marginTop: 2,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#142D4E',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
});
