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
    iconBg: '#E0F2FE',
    text: '#0369A1',
    accent: '#0866C6',
    border: '#BAE6FD',
  },
  green: {
    bg: '#FFFFFF',
    iconBg: '#DCFCE7',
    text: '#15803D',
    accent: '#16A34A',
    border: '#BBF7D0',
  },
  orange: {
    bg: '#FFFFFF',
    iconBg: '#FEF3C7',
    text: '#B45309',
    accent: '#F59E0B',
    border: '#FDE68A',
  },
  purple: {
    bg: '#FFFFFF',
    iconBg: '#EDE9FE',
    text: '#6D28D9',
    accent: '#7C3AED',
    border: '#DDD6FE',
  },
  teal: {
    bg: '#FFFFFF',
    iconBg: '#CCFBF1',
    text: '#0F766E',
    accent: '#13B8A6',
    border: '#99F6E4',
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
        <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
          {icon}
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: theme.iconBg }]}>
            <Text style={[styles.badgeText, { color: theme.text }]}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={[styles.value, { color: '#142D4E' }]}>{value}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
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
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    margin: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  content: {
    gap: 2,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#0866C6',
    marginTop: 3,
  },
  trendRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
