import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type KpiColorTheme = 'blue' | 'green' | 'orange' | 'purple' | 'teal';

export interface DoctorKpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  trend?: string;
  color?: KpiColorTheme;
  icon?: React.ReactNode;
  onPress?: () => void;
}

const COLOR_MAP: Record<
  KpiColorTheme,
  { bg: string; iconBg: string; text: string; accent: string; border: string }
> = {
  blue: {
    bg: '#FFFFFF',
    iconBg: '#EFF6FF',
    text: '#0284C7',
    accent: '#0866C6',
    border: 'rgba(2, 132, 199, 0.22)',
  },
  green: {
    bg: '#FFFFFF',
    iconBg: '#F0FDF4',
    text: '#16A34A',
    accent: '#16A34A',
    border: 'rgba(22, 163, 74, 0.22)',
  },
  orange: {
    bg: '#FFFFFF',
    iconBg: '#FFFBEB',
    text: '#D97706',
    accent: '#D97706',
    border: 'rgba(217, 119, 6, 0.25)',
  },
  purple: {
    bg: '#FFFFFF',
    iconBg: '#FAF5FF',
    text: '#7C3AED',
    accent: '#7C3AED',
    border: 'rgba(124, 58, 237, 0.22)',
  },
  teal: {
    bg: '#FFFFFF',
    iconBg: '#F0FDFA',
    text: '#0D9488',
    accent: '#0D9488',
    border: 'rgba(13, 148, 136, 0.22)',
  },
};

export const DoctorKpiCard: React.FC<DoctorKpiCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  trend,
  color = 'blue',
  icon,
  onPress,
}) => {
  const theme = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, { borderColor: theme.border }]}
    >
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
            {icon}
          </View>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: theme.iconBg }]}>
              <Text style={[styles.badgeText, { color: theme.text }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.value}>{value}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.text }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        {trend ? (
          <View style={styles.trendRow}>
            <Text style={[styles.trendText, { color: theme.accent }]}>{trend}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  content: {
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 16,
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 1,
  },
  trendRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
