import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react-native';
import { AuthStackParamList } from '../../navigation/navigationTypes';
import { authService } from '../../services/authService';
import { StarLogo } from '../../assets/branding/StarLogo';
import { StarInput, StarButton, StarCard } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC<Props> = ({ navigation, route }) => {
  const identifier = route.params?.identifier || '';
  const role = route.params?.role || 'patient';

  const [tokenOrOtp, setTokenOrOtp] = useState(
    route.params?.verificationCode || ''
  );
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    token?: string;
    password?: string;
    confirm?: string;
  }>({});

  const hasMinLen = newPassword.length >= 6;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const validate = (): boolean => {
    const errors: { token?: string; password?: string; confirm?: string } = {};
    if (tokenOrOtp.trim().length < 4) {
      errors.token = 'Enter the 6-digit verification code sent to your account';
    }
    if (!hasMinLen) {
      errors.password = 'New password must be at least 6 characters';
    }
    if (confirmPassword !== newPassword) {
      errors.confirm = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = async () => {
    setErrorMsg(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await authService.resetPassword({
        tokenOrOtp: tokenOrOtp.trim(),
        newPassword,
      });
      if (!res.success) {
        setErrorMsg(res.message || 'Unable to reset password.');
        return;
      }
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Password reset failed. Verify your OTP code and retry.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.topRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.brandSection}>
            <StarLogo size="sm" showTagline={false} />
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {identifier
                ? `Create a new password for ${identifier}`
                : 'Enter your verification code and set a strong new password.'}
            </Text>
          </View>

          {isSuccess ? (
            <StarCard style={styles.successCard} variant="elevated">
              <View style={styles.successIconWrap}>
                <CheckCircle2 size={44} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Password Updated</Text>
              <Text style={styles.successDesc}>
                Your Star Hospital password has been reset securely. You can now
                sign in with your new credentials.
              </Text>
              <StarButton
                title="Proceed to Sign In"
                onPress={() =>
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login', params: { role } }],
                  })
                }
                fullWidth
              />
            </StarCard>
          ) : (
            <StarCard style={styles.formCard} variant="elevated">
              {errorMsg && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={18} color={colors.danger} />
                  <Text style={styles.errorBannerText}>{errorMsg}</Text>
                </View>
              )}

              <StarInput
                label="Verification Code / Reset Token"
                placeholder="Enter 6-digit code (e.g. 123456)"
                value={tokenOrOtp}
                onChangeText={(text) => {
                  setTokenOrOtp(text);
                  if (fieldErrors.token) {
                    setFieldErrors((prev) => ({ ...prev, token: undefined }));
                  }
                }}
                keyboardType="number-pad"
                leftIcon={<KeyRound size={18} color={colors.primary} />}
              />
              {fieldErrors.token ? (
                <Text style={styles.fieldError}>{fieldErrors.token}</Text>
              ) : null}

              <StarInput
                label="New Password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      password: undefined,
                    }));
                  }
                }}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                leftIcon={<Lock size={18} color={colors.primary} />}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowNewPassword((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showNewPassword ? (
                      <EyeOff size={18} color={colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                }
              />
              {fieldErrors.password ? (
                <Text style={styles.fieldError}>{fieldErrors.password}</Text>
              ) : null}

              {/* Password Strength Checklist */}
              <View style={styles.rulesRow}>
                <View
                  style={[
                    styles.rulePill,
                    hasMinLen ? styles.rulePillActive : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.rulePillText,
                      hasMinLen ? styles.rulePillTextActive : undefined,
                    ]}
                  >
                    6+ chars
                  </Text>
                </View>
                <View
                  style={[
                    styles.rulePill,
                    hasLetter ? styles.rulePillActive : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.rulePillText,
                      hasLetter ? styles.rulePillTextActive : undefined,
                    ]}
                  >
                    Letter
                  </Text>
                </View>
                <View
                  style={[
                    styles.rulePill,
                    hasNumberOrSymbol ? styles.rulePillActive : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.rulePillText,
                      hasNumberOrSymbol ? styles.rulePillTextActive : undefined,
                    ]}
                  >
                    Number / Symbol
                  </Text>
                </View>
              </View>

              <StarInput
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (fieldErrors.confirm) {
                    setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
                  }
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                leftIcon={<ShieldCheck size={18} color={colors.primary} />}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color={colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                }
              />
              {fieldErrors.confirm ? (
                <Text style={styles.fieldError}>{fieldErrors.confirm}</Text>
              ) : null}

              <StarButton
                title={isLoading ? 'Updating Password...' : 'Update Password'}
                onPress={handleReset}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
                style={styles.submitBtn}
              />

              <TouchableOpacity
                onPress={() => navigation.navigate('Login', { role })}
                style={styles.backToLoginBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </TouchableOpacity>
            </StarCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 320,
  },
  formCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  errorBannerText: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
  },
  fieldError: {
    ...typography.caption,
    color: colors.danger,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  rulesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xxs,
    marginBottom: spacing.md,
  },
  rulePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.borderLight,
  },
  rulePillActive: {
    backgroundColor: colors.successLight,
  },
  rulePillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rulePillTextActive: {
    color: colors.success,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  backToLoginBtn: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
  backToLoginText: {
    ...typography.labelLarge,
    color: colors.primary,
  },
  successCard: {
    padding: spacing.xl,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  successIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  successDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
});
