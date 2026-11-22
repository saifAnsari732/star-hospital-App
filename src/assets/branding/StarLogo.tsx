/**
 * Star Hospital Full Brand Logo
 * Combines the Star Emblem with "Star Hospital" and "Care Today... Healthier Tomorrow..."
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { StarEmblem } from './StarEmblem';
import { colors } from '../../theme/colors';
import { fontSizes, fontWeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export interface StarLogoProps {
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const StarLogo: React.FC<StarLogoProps> = ({
  layout = 'horizontal',
  size = 'md',
  showTagline = true,
  style,
  testID,
}) => {
  const getEmblemSize = () => {
    switch (size) {
      case 'sm':
        return 36;
      case 'lg':
        return 64;
      case 'md':
      default:
        return 48;
    }
  };

  const isVertical = layout === 'vertical';

  return (
    <View
      style={[
        styles.container,
        isVertical ? styles.containerVertical : styles.containerHorizontal,
        style,
      ]}
      testID={testID}
    >
      <StarEmblem size={getEmblemSize()} />

      <View
        style={[
          styles.textContainer,
          isVertical ? styles.textContainerVertical : styles.textContainerHorizontal,
        ]}
      >
        <Text
          style={[
            styles.brandTitle,
            size === 'sm' && styles.brandTitleSm,
            size === 'lg' && styles.brandTitleLg,
          ]}
        >
          Star Hospital
        </Text>

        {showTagline ? (
          <Text
            style={[
              styles.tagline,
              size === 'sm' && styles.taglineSm,
              size === 'lg' && styles.taglineLg,
            ]}
          >
            Care Today... Healthier Tomorrow...
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerHorizontal: {
    flexDirection: 'row',
  },
  containerVertical: {
    flexDirection: 'column',
  },
  textContainer: {
    justifyContent: 'center',
  },
  textContainerHorizontal: {
    marginLeft: spacing.md,
    alignItems: 'flex-start',
  },
  textContainerVertical: {
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: fontSizes.h2,
    fontWeight: fontWeights.bold,
    color: colors.primaryDark,
    letterSpacing: -0.3,
  },
  brandTitleSm: {
    fontSize: fontSizes.subtitle,
  },
  brandTitleLg: {
    fontSize: fontSizes.h1 + 2,
  },
  tagline: {
    fontSize: fontSizes.tiny,
    color: colors.secondary,
    fontWeight: fontWeights.medium,
    marginTop: 1,
  },
  taglineSm: {
    fontSize: 9,
  },
  taglineLg: {
    fontSize: fontSizes.caption,
    marginTop: 3,
  },
});
