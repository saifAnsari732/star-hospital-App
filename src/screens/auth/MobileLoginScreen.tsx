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
  Phone,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  Lock,
} from 'lucide-react-native';
import { AuthStackParamList } from '../../navigation/navigationTypes';
import { UserRole } from '../../types/user';
import { authService } from '../../services/authService';
import { StarLogo } from '../../assets/branding/StarLogo';
import {
  RolePillToggle,
  StarInput,
  StarButton,
  StarCard,
} from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'MobileLogin'>;

export const MobileLoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialRole = route.params?.role || 'patient';
  const initialPhone = route.params?.phone || '';

  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);
  const [phone, setPhone] = useState(initialPhone);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const validatePhone = (raw: string): boolean => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      setPhoneError('Enter a valid mobile number (at least 10 digits)');
      return false;
    }
    setPhoneError(undefined);
    return true;
  };

  const handleSendOtp = async () => {
    setErrorMsg(null);
    if (!validatePhone(phone)) return;

    setIsLoading(true);
    try {
      const formatted = phone.trim();
      const res = await authService.requestPhoneOtp({
        phone: formatted,
        role: selectedRole,
      });

      navigation.navigate('OTPVerification', {
        phone: formatted,
        role: selectedRole,
        verificationId: res.verificationId,
        flow: 'login',
      });
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Unable to send OTP right now. Please try again.'
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
          {/* Top Navigation Bar */}
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
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Login', { role: selectedRole })
              }
              activeOpacity={0.75}
            >
              <Text style={styles.passwordSwitchText}>Use Password</Text>
            </TouchableOpacity>
          </View>

          {/* Brand Header */}
          <View style={styles.brandSection}>
            <StarLogo size="sm" showTagline={false} />
            <Text style={styles.title}>Mobile Number Login</Text>
            <Text style={styles.subtitle}>
              Enter your registered mobile number to receive a 6-digit SMS
              verification code.
            </Text>
          </View>

          {/* Role Switcher */}
          <View style={styles.roleSection}>
            <Text style={styles.roleLabel}>Sign in as</Text>
            <RolePillToggle
              selectedRole={selectedRole}
              onSelectRole={(role) => {
                setSelectedRole(role);
                setErrorMsg(null);
              }}
            />
          </View>

          {/* Main Input Card */}
          <StarCard style={styles.formCard} variant="elevated">
            {errorMsg && (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}

            <StarInput
              label="Mobile Number"
              placeholder="+92 300 1234567"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (phoneError) setPhoneError(undefined);
                if (errorMsg) setErrorMsg(null);
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              leftIcon={<Phone size={18} color={colors.primary} />}
            />
            {phoneError ? (
              <Text style={styles.fieldErrorText}>{phoneError}</Text>
            ) : null}

            {/* Quick Fill Demo Helper */}
            <TouchableOpacity
              onPress={() => {
                setPhone('+92 300 1234567');
                setPhoneError(undefined);
                setErrorMsg(null);
              }}
              style={styles.demoChip}
              activeOpacity={0.75}
            >
              <MessageSquare size={14} color={colors.primary} />
              <Text style={styles.demoChipText}>
                Fill demo mobile: +92 300 1234567
              </Text>
            </TouchableOpacity>

            <StarButton
              title={isLoading ? 'Sending OTP...' : 'Send 6-Digit OTP'}
              onPress={handleSendOtp}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              style={styles.submitButton}
            />

            {/* Honest OTP / Firebase Status Notice */}
            <View style={styles.infoBox}>
              <ShieldCheck size={16} color={colors.tealAccent} />
              <Text style={styles.infoText}>
                Firebase Phone Auth gateway ready with offline mock OTP fallback
                (use any 6-digit code such as 123456 when testing offline).
              </Text>
            </View>
          </StarCard>

          {/* Secondary Actions */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Login', { role: selectedRole })
              }
              style={styles.altMethodBtn}
              activeOpacity={0.75}
            >
              <Lock size={16} color={colors.primary} />
              <Text style={styles.altMethodText}>
                Sign in with Email & Password
              </Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>New to Star Hospital? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PatientRegistration')}
                activeOpacity={0.75}
              >
                <Text style={styles.registerLink}>Register as Patient</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
  passwordSwitchText: {
    ...typography.labelLarge,
    color: colors.primary,
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
    maxWidth: 310,
  },
  roleSection: {
    marginBottom: spacing.lg,
  },
  roleLabel: {
    ...typography.labelMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginLeft: spacing.xxs,
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
  fieldErrorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
    borderRadius: radii.full,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    gap: 6,
  },
  demoChipText: {
    ...typography.labelSmall,
    color: colors.primaryDark,
  },
  submitButton: {
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.infoLight,
    padding: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  footerActions: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  altMethodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  altMethodText: {
    ...typography.labelLarge,
    color: colors.primary,
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerPrompt: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  registerLink: {
    ...typography.labelLarge,
    color: colors.primary,
  },
});
