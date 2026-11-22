import React, { useEffect, useMemo, useState } from 'react';
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
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { Appointment } from '../../types/appointment';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { StarHeader, StarCard, StarButton, StarInput } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'RescheduleAppointment'>;

interface DateOption {
  iso: string;
  dayShort: string;
  dayNum: string;
  monthShort: string;
}

const getUpcomingDates = (count = 7): DateOption[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const result: DateOption[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      iso: d.toISOString().split('T')[0],
      dayShort: days[d.getDay()],
      dayNum: String(d.getDate()).padStart(2, '0'),
      monthShort: months[d.getMonth()],
    });
  }
  return result;
};

export const RescheduleAppointmentScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { appointmentId } = route.params;
  const dateOptions = useMemo(() => getUpcomingDates(7), []);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].iso);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [reason, setReason] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const appt = await appointmentService.getAppointmentById(appointmentId);
        if (!appt) {
          setErrorMsg('Appointment not found.');
        } else {
          setAppointment(appt);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to load appointment.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [appointmentId]);

  useEffect(() => {
    if (!appointment) return;
    let mounted = true;
    (async () => {
      setIsSlotsLoading(true);
      try {
        const slots = await doctorService.getDoctorSlots(
          appointment.doctorId,
          selectedDate
        );
        if (mounted) {
          setAvailableSlots(slots);
          setSelectedSlot(slots[0] || '');
        }
      } catch {
        if (mounted) {
          setAvailableSlots([]);
        }
      } finally {
        if (mounted) setIsSlotsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [appointment, selectedDate]);

  const canReschedule =
    !appointment ||
    (appointment.status !== 'completed' &&
      appointment.status !== 'cancelled' &&
      appointment.status !== 'no show');

  const handleReschedule = async () => {
    if (!canReschedule) {
      setErrorMsg(
        `Appointments marked as ${appointment?.status} cannot be rescheduled.`
      );
      return;
    }
    if (!selectedDate || !selectedSlot) {
      setErrorMsg('Please select both a new date and time slot.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await appointmentService.rescheduleAppointment({
        appointmentId,
        newDate: selectedDate,
        newTimeSlot: selectedSlot,
        reason: reason.trim() || 'Patient requested reschedule',
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Unable to reschedule appointment. Slot may be unavailable.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="Reschedule Appointment"
        onBackPress={() => navigation.goBack()}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isSuccess ? (
        <View style={styles.centerContainer}>
          <StarCard style={styles.successCard} variant="elevated">
            <View style={styles.successIcon}>
              <CheckCircle2 size={46} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Appointment Rescheduled</Text>
            <Text style={styles.successDesc}>
              Your consultation with {appointment?.doctorName} has been moved to{' '}
              {selectedDate} at {selectedSlot}.
            </Text>
            <StarButton
              title="View Appointment Details"
              onPress={() =>
                navigation.replace('AppointmentDetails', { appointmentId })
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
          {appointment && (
            <StarCard style={styles.currentCard} variant="elevated">
              <Text style={styles.currentLabel}>CURRENT APPOINTMENT</Text>
              <Text style={styles.doctorName}>{appointment.doctorName}</Text>
              <Text style={styles.doctorDept}>{appointment.doctorDepartment}</Text>
              <View style={styles.slotRow}>
                <View style={styles.slotItem}>
                  <Calendar size={14} color={colors.textSecondary} />
                  <Text style={styles.slotText}>{appointment.date}</Text>
                </View>
                <View style={styles.slotItem}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={styles.slotText}>{appointment.timeSlot}</Text>
                </View>
              </View>
            </StarCard>
          )}

          <StarCard style={styles.pickerCard} variant="elevated">
            <Text style={styles.sectionTitle}>Select New Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateStrip}
            >
              {dateOptions.map((item) => {
                const active = selectedDate === item.iso;
                return (
                  <TouchableOpacity
                    key={item.iso}
                    onPress={() => setSelectedDate(item.iso)}
                    style={[styles.datePill, active ? styles.datePillActive : undefined]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dateDay,
                        active ? styles.dateTextActive : undefined,
                      ]}
                    >
                      {item.dayShort}
                    </Text>
                    <Text
                      style={[
                        styles.dateNum,
                        active ? styles.dateTextActive : undefined,
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                    <Text
                      style={[
                        styles.dateMonth,
                        active ? styles.dateTextActive : undefined,
                      ]}
                    >
                      {item.monthShort}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>
              Select Available Time Slot
            </Text>
            {isSlotsLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ marginVertical: spacing.lg }}
              />
            ) : availableSlots.length === 0 ? (
              <Text style={styles.emptySlotsText}>
                No available slots on {selectedDate}. Try another date.
              </Text>
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots.map((slot) => {
                  const active = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setSelectedSlot(slot)}
                      style={[
                        styles.timePill,
                        active ? styles.timePillActive : undefined,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.timePillText,
                          active ? styles.timePillTextActive : undefined,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={{ marginTop: spacing.md }}>
              <StarInput
                label="Reason for Rescheduling (Optional)"
                placeholder="e.g. Prefer afternoon timing"
                value={reason}
                onChangeText={setReason}
              />
            </View>

            {errorMsg && (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}

            {!canReschedule && (
              <View style={styles.errorBanner}>
                <AlertCircle size={18} color={colors.danger} />
                <Text style={styles.errorBannerText}>
                  This appointment is {appointment?.status} and cannot be rescheduled.
                </Text>
              </View>
            )}

            <StarButton
              title={isSubmitting ? 'Updating Slot...' : 'Confirm New Slot'}
              onPress={handleReschedule}
              loading={isSubmitting}
              disabled={isSubmitting || !selectedSlot || !canReschedule}
              fullWidth
            />
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
  currentCard: { padding: spacing.lg, borderRadius: radii.xl },
  currentLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  doctorName: { ...typography.h4, color: colors.textPrimary },
  doctorDept: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  slotRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  slotItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotText: { ...typography.bodySmall, color: colors.textSecondary },
  pickerCard: { padding: spacing.lg, borderRadius: radii.xl },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  dateStrip: { gap: spacing.xs, paddingBottom: 4 },
  datePill: {
    width: 64,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  datePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: { ...typography.caption, color: colors.textSecondary },
  dateNum: { ...typography.h4, color: colors.textPrimary, marginVertical: 2 },
  dateMonth: { ...typography.caption, color: colors.textSecondary },
  dateTextActive: { color: colors.white },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  timePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  timePillActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  timePillText: { ...typography.labelMedium, color: colors.textPrimary },
  timePillTextActive: { color: colors.primaryDark, fontWeight: '700' },
  emptySlotsText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginVertical: spacing.sm,
  },
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
