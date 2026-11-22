/**
 * Star Hospital Reusable Empty State Component
 * Accessible empty states with vector illustrations, clear messaging, and retry/action CTA.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';
import { StarButton } from './StarButton';
import { FileQuestion } from 'lucide-react-native';

export interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  illustration,
  actionLabel,
  onAction,
  actionLoading = false,
  style,
  testID,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.illustrationContainer}>
        {illustration || (
          <View style={styles.defaultIconCircle}>
            <FileQuestion color={colors.primary} size={48} />
          </View>
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      {description ? <Text style={styles.description}>{description}</Text> : null}

      {actionLabel && onAction ? (
        <View style={styles.actionWrapper}>
          <StarButton
            fullWidth={false}
            loading={actionLoading}
            onPress={onAction}
            size="md"
            title={actionLabel}
            variant="primary"
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.hero,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSizes.h3,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSizes.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  actionWrapper: {
    marginTop: spacing.sm,
  },
});
