import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { profileService } from '../../services/profileService';
import { StarHeader, StarCard, StarInput, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'ChangePassword'>;

export const ChangePasswordScreen: React.FC<Props> = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async () => {
    setErrorMsg(null);
    if (!currentPassword.trim()) {
      setErrorMsg('Enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (confirmPassword !== newPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg('New password must differ from your current password.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await profileService.changePassword({
        currentPassword,
        newPassword,
      });
      if (!res.success) {
        setErrorMsg(res.message || 'Unable to update password.');
        return;
      }
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Password update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader title="Change Password" onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isSuccess ? (
            <StarCard style={styles.successCard} variant="elevated">
              <View style={styles.successIcon}>
                <CheckCircle2 size={46} color={colors.success} />
              </View>
              <Text style={styles.successTitle}>Password Changed</Text>
              <Text style={styles.successDesc}>
                Your Star Hospital account password has been updated securely.
              </Text>
              <StarButton
                title="Done"
                onPress={() => navigation.goBack()}
                fullWidth
              />
            </StarCard>
          ) : (
            <StarCard style={styles.card} variant="elevated">
              <Text style={styles.introText}>
                Choose a strong password with at least 6 characters to keep your
                medical records protected.
              </Text>

              {errorMsg ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={18} color={colors.danger} />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <StarInput
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
                leftIcon={<Lock size={18} color={colors.primary} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowCurrent((v) => !v)}>
                    {showCurrent ? (
                      <EyeOff size={18} color={colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                }
              />

              <StarInput
                label="New Password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                autoCapitalize="none"
                leftIcon={<ShieldCheck size={18} color={colors.primary} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowNew((v) => !v)}>
                    {showNew ? (
                      <EyeOff size={18} color={colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                }
              />

              <StarInput
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                leftIcon={<ShieldCheck size={18} color={colors.primary} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirm((v) => !v)}>
                    {showConfirm ? (
                      <EyeOff size={18} color={colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                }
              />

              <StarButton
                title={isSaving ? 'Updating...' : 'Update Password'}
                onPress={handleUpdate}
                loading={isSaving}
                disabled={isSaving}
                fullWidth
              />
            </StarCard>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { padding: spacing.lg, borderRadius: radii.xl, gap: spacing.xs },
  introText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  errorText: { ...typography.bodySmall, color: colors.danger, flex: 1 },
  successCard: { padding: spacing.xl, borderRadius: radii.xl, alignItems: 'center' },
  successIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.xs },
  successDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
