import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  Stethoscope,
  MapPin,
  Video,
  FileText,
  Activity,
  RefreshCw,
  XCircle,
  CreditCard,
  AlertCircle,
  UserCheck,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { Appointment } from '../../types/appointment';
import { appointmentService } from '../../services/appointmentService';
import { useOPDToken } from '../../context/OPDTokenContext';
import { StarHeader, StarCard, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';
import { getDoctorAvatarSource } from '../../assets/images';

type Props = NativeStackScreenProps<PatientStackParamList, 'AppointmentDetails'>;

export const AppointmentDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { appointmentId } = route.params;
  const { generateToken } = useOPDToken();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAppointment = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await appointmentService.getAppointmentById(appointmentId);
      if (!data) {
        setErrorMsg('Appointment record could not be found.');
      } else {
        setAppointment(data);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load appointment details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  const handleGenerateToken = async () => {
    if (!appointment) return;
    setIsActionLoading(true);
    try {
      await appointmentService.checkInAppointment(appointment.id);
      const token = await generateToken(appointment.doctorId, 'follow_up');
      navigation.navigate('OPDToken', {
        tokenId: token.id,
        tokenNumber: token.tokenNumber,
        doctorId: appointment.doctorId,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to generate OPD token.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const getStatusChipStyle = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Scheduled', bg: colors.primaryLight, fg: colors.primaryDark };
      case 'arrived':
        return { label: 'Checked In', bg: colors.infoLight, fg: colors.primary };
      case 'completed':
        return { label: 'Completed', bg: colors.successLight, fg: colors.success };
      case 'cancelled':
        return { label: 'Cancelled', bg: colors.dangerLight, fg: colors.danger };
      default:
        return {
          label: String(status).toUpperCase(),
          bg: colors.borderLight,
          fg: colors.textSecondary,
        };
    }
  };

  const canModify =
    appointment &&
    appointment.status !== 'completed' &&
    appointment.status !== 'cancelled';

  const statusPill = appointment ? getStatusChipStyle(appointment.status) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader title="Appointment Details" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading appointment details...</Text>
        </View>
      ) : errorMsg || !appointment ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color={colors.danger} />
          <Text style={styles.errorText}>
            {errorMsg || 'Appointment not found.'}
          </Text>
          <StarButton title="Retry" onPress={loadAppointment} variant="outline" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Doctor & Status Summary */}
          <StarCard style={styles.heroCard} variant="elevated">
            <View style={styles.heroTopRow}>
              <View style={styles.docAvatar}>
                <Image
                  source={getDoctorAvatarSource(appointment.doctorName || appointment.doctorId)}
                  style={styles.docAvatarImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.heroInfo}>
                <Text style={styles.doctorName}>{appointment.doctorName}</Text>
                <Text style={styles.doctorDept}>
                  {appointment.doctorDepartment}
                </Text>
              </View>
              {statusPill && (
                <View style={[styles.statusBadge, { backgroundColor: statusPill.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: statusPill.fg }]}>
                    {statusPill.label}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.metaDivider} />

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Calendar size={16} color={colors.primary} />
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{appointment.date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={16} color={colors.primary} />
                <Text style={styles.metaLabel}>Time Slot</Text>
                <Text style={styles.metaValue}>{appointment.timeSlot}</Text>
              </View>
              <View style={styles.metaItem}>
                {appointment.mode === 'video' ? (
                  <Video size={16} color={colors.tealAccent} />
                ) : (
                  <MapPin size={16} color={colors.tealAccent} />
                )}
                <Text style={styles.metaLabel}>Mode</Text>
                <Text style={styles.metaValue}>
                  {appointment.mode === 'video' ? 'Video Call' : 'In-Person OPD'}
                </Text>
              </View>
            </View>
          </StarCard>

          {/* Patient & Payment Info */}
          <StarCard style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Appointment ID</Text>
              <Text style={styles.detailVal}>{appointment.id.toUpperCase()}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Patient</Text>
              <Text style={styles.detailVal}>
                {appointment.patientName} ({appointment.patientMrn})
              </Text>
            </View>
            {appointment.tokenNo !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>OPD Token</Text>
                <Text style={[styles.detailVal, { color: colors.primary }]}>
                  A-{appointment.tokenNo}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Consultation Fee</Text>
              <Text style={styles.detailVal}>
                PKR {appointment.consultationFee?.toLocaleString() || '1,500'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailKey}>Payment Status</Text>
              <View style={styles.inlineRow}>
                <CreditCard size={14} color={colors.success} />
                <Text
                  style={[
                    styles.detailVal,
                    {
                      color:
                        appointment.paymentStatus === 'paid'
                          ? colors.success
                          : colors.warning,
                    },
                  ]}
                >
                  {(appointment.paymentStatus || 'pending').toUpperCase()}
                </Text>
              </View>
            </View>
          </StarCard>

          {/* Clinical Remarks */}
          {appointment.remarks ? (
            <StarCard style={styles.sectionCard} variant="elevated">
              <View style={styles.cardHeaderRow}>
                <FileText size={18} color={colors.primary} />
                <Text style={styles.sectionTitleInline}>Visit Notes / Remarks</Text>
              </View>
              <Text style={styles.remarksText}>{appointment.remarks}</Text>
            </StarCard>
          ) : null}

          {/* Vitals Card (if recorded) */}
          {appointment.vitals && (
            <StarCard style={styles.sectionCard} variant="elevated">
              <View style={styles.cardHeaderRow}>
                <Activity size={18} color={colors.tealAccent} />
                <Text style={styles.sectionTitleInline}>Recorded Triage Vitals</Text>
              </View>
              <View style={styles.vitalsGrid}>
                <View style={styles.vitalPill}>
                  <Text style={styles.vitalLabel}>BP</Text>
                  <Text style={styles.vitalValue}>
                    {appointment.vitals.bloodPressure}
                  </Text>
                </View>
                <View style={styles.vitalPill}>
                  <Text style={styles.vitalLabel}>Pulse</Text>
                  <Text style={styles.vitalValue}>{appointment.vitals.pulse}</Text>
                </View>
                <View style={styles.vitalPill}>
                  <Text style={styles.vitalLabel}>Temp</Text>
                  <Text style={styles.vitalValue}>
                    {appointment.vitals.temperature}
                  </Text>
                </View>
                <View style={styles.vitalPill}>
                  <Text style={styles.vitalLabel}>SpO2</Text>
                  <Text style={styles.vitalValue}>
                    {appointment.vitals.oxygenSaturation}
                  </Text>
                </View>
              </View>
              {appointment.vitals.recordedBy && (
                <View style={styles.recordedByRow}>
                  <UserCheck size={14} color={colors.textSecondary} />
                  <Text style={styles.recordedByText}>
                    Recorded by {appointment.vitals.recordedBy}
                  </Text>
                </View>
              )}
            </StarCard>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsSection}>
            {appointment.mode === 'video' && canModify && (
              <StarButton
                title="Open Video Consultation Room"
                onPress={() =>
                  navigation.navigate('VideoConsultation', {
                    appointmentId: appointment.id,
                    doctorId: appointment.doctorId,
                    doctorName: appointment.doctorName,
                    department: appointment.doctorDepartment,
                    scheduledTime: `${appointment.date} • ${appointment.timeSlot}`,
                  })
                }
                fullWidth
              />
            )}

            {canModify && appointment.paymentStatus !== 'paid' && (
              <StarButton
                title="Pay Consultation Online (Razorpay)"
                onPress={() =>
                  navigation.navigate('PaymentDetails', {
                    module: 'appointment',
                    moduleId: appointment.id,
                  })
                }
                variant="primary"
                fullWidth
              />
            )}

            {canModify && appointment.mode !== 'video' && (
              <StarButton
                title={
                  isActionLoading
                    ? 'Checking In...'
                    : 'Check In & Generate OPD Token'
                }
                onPress={handleGenerateToken}
                loading={isActionLoading}
                disabled={isActionLoading}
                variant="outline"
                fullWidth
              />
            )}

            {canModify && (
              <View style={styles.twoColActions}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('RescheduleAppointment', {
                      appointmentId: appointment.id,
                    })
                  }
                  style={styles.secondaryActionBtn}
                  activeOpacity={0.75}
                >
                  <RefreshCw size={16} color={colors.primary} />
                  <Text style={styles.secondaryActionText}>Reschedule</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('CancelAppointment', {
                      appointmentId: appointment.id,
                    })
                  }
                  style={[styles.secondaryActionBtn, styles.cancelActionBtn]}
                  activeOpacity={0.75}
                >
                  <XCircle size={16} color={colors.danger} />
                  <Text style={[styles.secondaryActionText, { color: colors.danger }]}>
                    Cancel Visit
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <StarButton
              title="View Doctor Profile"
              variant="outline"
              onPress={() =>
                navigation.navigate('DoctorProfile', {
                  doctorId: appointment.doctorId,
                  doctorName: appointment.doctorName,
                })
              }
              fullWidth
            />
          </View>
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
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: { ...typography.bodyMedium, color: colors.textSecondary },
  errorText: {
    ...typography.bodyMedium,
    color: colors.danger,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  heroCard: { padding: spacing.lg, borderRadius: radii.xl },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  docAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  docAvatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  heroInfo: { flex: 1 },
  doctorName: { ...typography.h4, color: colors.textPrimary },
  doctorDept: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  statusBadgeText: { ...typography.caption, fontWeight: '700' },
  metaDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  metaItem: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.sm,
    gap: 4,
  },
  metaLabel: { ...typography.caption, color: colors.textSecondary },
  metaValue: { ...typography.labelMedium, color: colors.textPrimary },
  sectionCard: { padding: spacing.lg, borderRadius: radii.xl },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  sectionTitleInline: { ...typography.h4, color: colors.textPrimary },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailKey: { ...typography.bodySmall, color: colors.textSecondary },
  detailVal: { ...typography.labelMedium, color: colors.textPrimary },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  remarksText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  vitalPill: {
    width: '48%',
    backgroundColor: colors.infoLight,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  vitalLabel: { ...typography.caption, color: colors.textSecondary },
  vitalValue: { ...typography.labelLarge, color: colors.textPrimary, marginTop: 2 },
  recordedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  recordedByText: { ...typography.caption, color: colors.textSecondary },
  actionsSection: { gap: spacing.sm, marginTop: spacing.xs },
  twoColActions: { flexDirection: 'row', gap: spacing.sm },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cancelActionBtn: { borderColor: colors.danger },
  secondaryActionText: { ...typography.labelLarge, color: colors.primary },
});
