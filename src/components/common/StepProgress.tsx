/**
 * Star Hospital Reusable 3-Step Progress Indicator
 * Used in Multi-step Appointment Booking (Screens 9-10) and Live Queue Status (Screen 13).
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

export interface StepItem {
  number: number | string;
  title: string;
  subtitle?: string;
}

export interface StepProgressProps {
  steps: StepItem[];
  currentStep: number; // 1-based index (e.g. 1, 2, 3)
  variant?: 'booking' | 'queue';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  variant = 'booking',
  style,
  testID,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          // Queue variant highlights completed in green (#16A34A), current in blue (#0866C6)
          const getCircleColors = () => {
            if (variant === 'queue') {
              if (isCompleted) {
                return { bg: colors.success, border: colors.success, text: colors.white };
              }
              if (isCurrent) {
                return { bg: colors.primary, border: colors.primaryDark, text: colors.white };
              }
              return { bg: colors.surfaceSubtle, border: colors.border, text: colors.textSecondary };
            }

            // Booking variant
            if (isCompleted) {
              return { bg: colors.primary, border: colors.primary, text: colors.white };
            }
            if (isCurrent) {
              return { bg: colors.primary, border: colors.primary, text: colors.white };
            }
            return { bg: colors.surface, border: colors.border, text: colors.textSecondary };
          };

          const circleColor = getCircleColors();

          return (
            <React.Fragment key={step.number.toString()}>
              {/* Connector line before step */}
              {index > 0 ? (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor:
                        stepNumber <= currentStep
                          ? variant === 'queue'
                            ? colors.success
                            : colors.primary
                          : colors.border,
                    },
                  ]}
                />
              ) : null}

              {/* Step circle & label container */}
              <View style={styles.stepNode}>
                <View
                  style={[
                    styles.circle,
                    {
                      backgroundColor: circleColor.bg,
                      borderColor: circleColor.border,
                    },
                    isCurrent && styles.currentCircleGlow,
                  ]}
                >
                  {isCompleted && variant === 'booking' ? (
                    <Check color={colors.white} size={16} strokeWidth={2.5} />
                  ) : (
                    <Text
                      style={[
                        styles.circleText,
                        { color: circleColor.text },
                        isCurrent && styles.currentCircleText,
                      ]}
                    >
                      {step.number}
                    </Text>
                  )}
                </View>

                {step.title ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.stepTitle,
                      isCurrent
                        ? styles.stepTitleCurrent
                        : isCompleted
                        ? styles.stepTitleCompleted
                        : styles.stepTitleUpcoming,
                    ]}
                  >
                    {step.title}
                  </Text>
                ) : null}

                {step.subtitle ? (
                  <Text numberOfLines={1} style={styles.stepSubtitle}>
                    {step.subtitle}
                  </Text>
                ) : null}
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: spacing.md,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  stepNode: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentCircleGlow: {
    borderWidth: 2.5,
    borderColor: colors.primaryDark,
  },
  circleText: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.bold,
  },
  currentCircleText: {
    fontWeight: fontWeights.heavy,
  },
  connectorLine: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    marginBottom: 20, // aligns with circle center above title
    marginHorizontal: 4,
  },
  stepTitle: {
    fontSize: fontSizes.tiny,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  stepTitleCurrent: {
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  stepTitleCompleted: {
    color: colors.textPrimary,
    fontWeight: fontWeights.semibold,
  },
  stepTitleUpcoming: {
    color: colors.textPlaceholder,
    fontWeight: fontWeights.medium,
  },
  stepSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 1,
  },
});
