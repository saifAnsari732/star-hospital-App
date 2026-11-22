/**
 * Star Hospital Reusable Loader Component
 * Accessible loading indicator with royal blue brand tint and optional message.
 */

import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

export interface StarLoaderProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const StarLoader: React.FC<StarLoaderProps> = ({
  message,
  size = 'large',
  color = colors.primary,
  fullScreen = false,
  style,
  testID,
}) => {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="progressbar"
      style={[
        fullScreen ? styles.fullScreenContainer : styles.inlineContainer,
        style,
      ]}
      testID={testID}
    >
      <View style={styles.spinnerWrapper}>
        <ActivityIndicator color={color} size={size} />
        {message ? <Text style={styles.messageText}>{message}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(245, 249, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  inlineContainer: {
    paddingVertical: spacing.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  messageText: {
    marginTop: spacing.md,
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
