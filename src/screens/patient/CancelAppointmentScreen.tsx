import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { Appointment } from '../../types/appointment';
import { appointmentService } from '../../services/appointmentService';
import { StarHeader, StarCard, StarButton, StarInput } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'CancelAppointment'>;

const CANCELLATION_REASONS = [
  'Schedule conflict',
  'Feeling better now',
  'Rescheduling to another doctor',
  'Travel / transport issue',
  'Booked by mistake',
];

export const CancelAppointmentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { appointmentId } = route.params;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>(
    CANCELLATION_REASONS[0]
  );
  const [customNotes, setCustomNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await appointmentService.getAppointmentById(appointmentId);
        setAppointment(data);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to load appointment details.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [appointmentId]);

  const canCancel =
    !appointment ||
    (appointment.status !== 'completed' &&
      appointment.status !== 'cancelled' &&
      appointment.status !== 'no show');

  const handleConfirmCancel = async () => {
    if (!canCancel) {
      setErrorMsg(`This appointment is already ${appointment?.status} and cannot be cancelled.`);
      return;
    }
    setErrorMsg(null);
    const fullReason = customNotes.trim()
      ? `${selectedReason} - ${customNotes.trim()}`
      : selectedReason;

    setIsSubmitting(true);
    try {
      await appointmentService.cancelAppointment(appointmentId, fullReason);
      setIsCancelled(true);
    } catch (err: any) {
      setErrorMsg(
        err?.message || 'Could not cancel this appointment. Please check status.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader title="Cancel Appointment" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isCancelled ? (
        <View style={styles.centerContainer}>
          <StarCard style={styles.successCard} variant="elevated">
            <View style={styles.successIcon}>
              <CheckCircle2 size={46} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Appointment Cancelled</Text>
            <Text style={styles.successDesc}>
              Your visit with {appointment?.doctorName || 'the doctor'} on{' '}
              {appointment?.date} has been cancelled. If you paid online, refund
              processing follows Star Hospital billing policy.
            </Text>
            <StarButton
              title="Back to My Appointments"
              onPress={() =>
                navigation.navigate('PatientTabs', { screen: 'AppointmentsTab' })
              }
              fullWidth
            />
          </StarCard>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Warning Callout */}
          <View style={styles.warningBox}>
            <AlertTriangle size={20} color={colors.warning} />
            <Text style={styles.warningText}>
              Cancelling an appointment releases your reserved consultation slot.
              You can also reschedule instead if you only need a new time.
            </Text>
          </View>

          {appointment && (
            <StarCard style={styles.summaryCard} variant="elevated">
              <Text style={styles.doctorName}>{appointment.doctorName}</Text>
              <Text style={styles.doctorDept}>{appointment.doctorDepartment}</Text>
              <View style={styles.slotRow}>
                <View style={styles.slotBadge}>
                  <Calendar size={14} color={colors.primary} />
                  <Text style={styles.slotText}>{appointment.date}</Text>
                </View>
                <View style={styles.slotBadge}>
                  <Clock size={14} color={colors.primary} />
                  <Text style={styles.slotText}>{appointment.timeSlot}</Text>
                </View>
              </View>
            </StarCard>
          )}

          <StarCard style={styles.formCard} variant="elevated">
            <Text style={styles.sectionTitle}>Reason for Cancellation</Text>

            <View style={styles.reasonsList}>
              {CANCELLATION_REASONS.map((reason) => {
                const active = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    onPress={() => setSelectedReason(reason)}
                    style={[
                      styles.reasonChip,
                      active ? styles.reasonChipActive : undefined,
                    ]}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.radioDot,
                        active ? styles.radioDotActive : undefined,
                      ]}
                    />
                    <Text
                      style={[
                        styles.reasonText,
                        active ? styles.reasonTextActive : undefined,
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <StarInput
              label="Additional Notes (Optional)"
              placeholder="Any details for our OPD desk..."
              value={customNotes}
              onChangeText={setCustomNotes}
              multiline
              numberOfLines={3}
            />

            {errorMsg && (
              <View style={styles.errorBanner}>
                <XCircle size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}

            <View style={styles.buttonStack}>
              {!canCancel && (
                <Text style={styles.errorBannerText}>
                  This appointment is marked as {appointment?.status} and cannot be cancelled.
                </Text>
              )}
              <StarButton
                title={isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                variant="danger"
                onPress={handleConfirmCancel}
                loading={isSubmitting}
                disabled={isSubmitting || !canCancel}
                fullWidth
              />
              <StarButton
                title="Reschedule Instead"
                variant="outline"
                onPress={() =>
                  navigation.replace('RescheduleAppointment', { appointmentId })
                }
                disabled={isSubmitting || !canCancel}
                fullWidth
              />
            </View>
          </StarCard>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 19,
  },
  summaryCard: { padding: spacing.lg, borderRadius: radii.xl },
  doctorName: { ...typography.h4, color: colors.textPrimary },
  doctorDept: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  slotRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  slotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  slotText: { ...typography.labelMedium, color: colors.primaryDark },
  formCard: { padding: spacing.lg, borderRadius: radii.xl },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  reasonsList: { gap: spacing.xs, marginBottom: spacing.lg },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  reasonChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  radioDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  radioDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  reasonText: { ...typography.bodyMedium, color: colors.textPrimary },
  reasonTextActive: { fontWeight: '600', color: colors.primaryDark },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md,
  },
  errorBannerText: { ...typography.bodySmall, color: colors.danger, flex: 1 },
  buttonStack: { gap: spacing.sm },
  successCard: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
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
    lineHeight: 22,
  },
});
