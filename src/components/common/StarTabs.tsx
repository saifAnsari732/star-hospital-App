/**
 * Star Hospital Reusable Segmented Tabs Component
 * Supports both underline tabs ("Upcoming"/"Past", "All"/"Recent") and pill tabs.
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
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

export type StarTabsVariant = 'underline' | 'pill';

export interface StarTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: StarTabsVariant;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const StarTabs: React.FC<StarTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  style,
  testID,
}) => {
  return (
    <View
      style={[
        variant === 'underline' ? styles.underlineContainer : styles.pillContainer,
        style,
      ]}
      testID={testID}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;

        if (variant === 'pill') {
          return (
            <TouchableOpacity
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              activeOpacity={0.8}
              onPress={() => onTabChange(tab.key)}
              style={[styles.pillItem, isActive && styles.pillItemActive]}
            >
              <Text
                style={[
                  styles.pillText,
                  isActive ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined ? (
                <View
                  style={[
                    styles.pillBadge,
                    isActive ? styles.pillBadgeActive : styles.pillBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillBadgeText,
                      isActive ? styles.pillBadgeTextActive : styles.pillBadgeTextInactive,
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }

        // Default 'underline' variant
        return (
          <TouchableOpacity
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            activeOpacity={0.7}
            onPress={() => onTabChange(tab.key)}
            style={[styles.underlineItem, isActive && styles.underlineItemActive]}
          >
            <Text
              style={[
                styles.underlineText,
                isActive ? styles.underlineTextActive : styles.underlineTextInactive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.count !== undefined ? (
              <View
                style={[
                  styles.countBadge,
                  isActive ? styles.countBadgeActive : styles.countBadgeInactive,
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    isActive ? styles.countBadgeTextActive : styles.countBadgeTextInactive,
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            ) : null}
            {isActive ? <View style={styles.activeIndicatorBar} /> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Underline variant styles
  underlineContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.sm,
  },
  underlineItem: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  underlineItemActive: {},
  underlineText: {
    fontSize: fontSizes.body,
    fontWeight: fontWeights.semibold,
  },
  underlineTextActive: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  underlineTextInactive: {
    color: colors.textSecondary,
    fontWeight: fontWeights.medium,
  },
  activeIndicatorBar: {
    position: 'absolute',
    bottom: -1.5,
    left: '15%',
    right: '15%',
    height: 3,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
  countBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  countBadgeActive: {
    backgroundColor: colors.primaryLight,
  },
  countBadgeInactive: {
    backgroundColor: colors.surfaceSubtle,
  },
  countBadgeText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },
  countBadgeTextActive: {
    color: colors.primary,
  },
  countBadgeTextInactive: {
    color: colors.textSecondary,
  },

  // Pill variant styles
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radii.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  pillItemActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  pillTextActive: {
    color: colors.textInverse,
    fontWeight: fontWeights.bold,
  },
  pillTextInactive: {
    color: colors.textSecondary,
  },
  pillBadge: {
    marginLeft: spacing.xs,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.full,
  },
  pillBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  pillBadgeInactive: {
    backgroundColor: colors.border,
  },
  pillBadgeText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
  },
  pillBadgeTextActive: {
    color: colors.textInverse,
  },
  pillBadgeTextInactive: {
    color: colors.textSecondary,
  },
});
