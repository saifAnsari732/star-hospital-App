/**
 * Star Hospital Reusable Card Component
 * Elevated card with 16px radius, soft shadow, light blue border (#E2E8F0).
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

export type StarCardVariant = 'elevated' | 'outlined' | 'subtle' | 'tinted';

export interface StarCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: StarCardVariant;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof spacing | number;
  testID?: string;
  activeOpacity?: number;
}

export const StarCard: React.FC<StarCardProps> = ({
  children,
  onPress,
  variant = 'elevated',
  style,
  padding = 'lg',
  testID,
  activeOpacity = 0.7,
}) => {
  const paddingValue = typeof padding === 'number' ? padding : spacing[padding];

  const getCardStyle = (): ViewStyle[] => {
    const cardStyles: ViewStyle[] = [
      styles.base,
      { padding: paddingValue },
    ];

    switch (variant) {
      case 'elevated':
        cardStyles.push(styles.elevated);
        cardStyles.push(shadows.card);
        break;
      case 'outlined':
        cardStyles.push(styles.outlined);
        break;
      case 'subtle':
        cardStyles.push(styles.subtle);
        break;
      case 'tinted':
        cardStyles.push(styles.tinted);
        break;
    }

    return cardStyles;
  };

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={activeOpacity}
        onPress={onPress}
        style={[getCardStyle(), style]}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[getCardStyle(), style]} testID={testID}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlined: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  subtle: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tinted: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
});
