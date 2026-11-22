import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Volume2,
  VolumeX,
  Calendar,
  Clock,
  User,
  Stethoscope,
  BellRing,
  CheckCircle2,
  ArrowRight,
  Layers,
} from 'lucide-react-native';
import type { ReceptionAppointmentAlert } from '../../services/firebaseAppointmentAlertService';
import { emergencyAudioService } from '../../services/emergencyAudioService';

export interface FullScreenAppointmentAlertModalProps {
  alert: ReceptionAppointmentAlert | null;
  visible: boolean;
  onAcknowledge: () => void;
  onNavigateToQueue?: () => void;
  queueCount?: number;
}

export const FullScreenAppointmentAlertModal: React.FC<
  FullScreenAppointmentAlertModalProps
> = ({ alert, visible, onAcknowledge, onNavigateToQueue, queueCount = 1 }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isAudioBlocked, setIsAudioBlocked] = useState<boolean>(
    emergencyAudioService.isBlocked()
  );

  useEffect(() => {
    const unsub = emergencyAudioService.onBlockedChange((blocked) => {
      setIsAudioBlocked(blocked);
    });
    setIsAudioBlocked(emergencyAudioService.isBlocked());
    return unsub;
  }, []);

  useEffect(() => {
    if (!visible) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [visible, pulseAnim]);

  if (!alert || !visible) return null;

  const handleContainerTouch = () => {
    if (isAudioBlocked) {
      void emergencyAudioService.unlockAudio();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <StatusBar barStyle="light-content" />
      <View
        style={styles.overlay}
        onTouchStart={handleContainerTouch}
        {...(Platform.OS === 'web' ? ({ onClick: handleContainerTouch } as any) : {})}
      >
        <View style={styles.modalCard}>
          {/* Header Strip with Alert Icon & Live Siren Badge */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Animated.View
                style={[
                  styles.alertIconBadge,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <BellRing size={22} color="#DC2626" />
              </Animated.View>
              <View style={styles.headerTitleBox}>
                <Text style={styles.alertCategory}>NEW APPOINTMENT</Text>
                <Text style={styles.alertTitle} numberOfLines={1}>Patient Booking</Text>
              </View>
            </View>

            {queueCount > 1 ? (
              <View style={styles.queuePill}>
                <Layers size={12} color="#92400E" />
                <Text style={styles.queuePillText}>+{queueCount - 1} queued</Text>
              </View>
            ) : null}
          </View>

          {/* Audio Status Banner */}
          {isAudioBlocked ? (
            <TouchableOpacity
              style={styles.audioWarningBanner}
              onPress={() => {
                void emergencyAudioService.unlockAudio();
              }}
              activeOpacity={0.8}
            >
              <VolumeX size={16} color="#B45309" />
              <Text style={styles.audioWarningText}>
                Sound blocked by browser • Tap here to play loud siren
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.audioActiveBanner}>
              <Volume2 size={15} color="#DC2626" />
              <Text style={styles.audioActiveText}>
                Loud Medical Siren Ringing
              </Text>
            </View>
          )}

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Patient Info Box */}
            <View style={styles.patientBox}>
              <View style={styles.iconCircleBlue}>
                <User size={20} color="#0866C6" />
              </View>
              <View style={styles.patientInfoCol}>
                <View style={styles.patientNameRow}>
                  <Text style={styles.patientName}>{alert.patientName}</Text>
                  {alert.patientMrn ? (
                    <View style={styles.mrnTag}>
                      <Text style={styles.mrnTagText}>{alert.patientMrn}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.patientSubtext}>
                  {alert.patientPhone ? `📞 ${alert.patientPhone}  •  ` : ''}
                  {alert.mode === 'video' ? 'Online Video' : 'In-Person OPD'}
                </Text>
              </View>
            </View>

            {/* Doctor & Appointment Details */}
            <View style={styles.appointmentBox}>
              <View style={styles.doctorHeader}>
                <View style={styles.iconCircleGreen}>
                  <Stethoscope size={18} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorName}>{alert.doctorName}</Text>
                  <Text style={styles.doctorDept}>{alert.doctorDepartment}</Text>
                </View>
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Calendar size={15} color="#64748B" />
                  <Text style={styles.metaValue}>{alert.date}</Text>
                </View>

                <View style={styles.metaItem}>
                  <Clock size={15} color="#64748B" />
                  <Text style={styles.metaValue}>{alert.timeSlot}</Text>
                </View>

                {alert.consultationFee !== undefined ? (
                  <View style={styles.feeTag}>
                    <Text style={styles.feeTagText}>
                      ₹{alert.consultationFee} (Paid)
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.silenceBtn}
              onPress={onAcknowledge}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Acknowledge alert and silence siren"
            >
              <CheckCircle2 size={18} color="#FFFFFF" />
              <Text style={styles.silenceBtnText}>Silence & Acknowledge</Text>
            </TouchableOpacity>

            {onNavigateToQueue ? (
              <TouchableOpacity
                style={styles.queueBtn}
                onPress={() => {
                  onAcknowledge();
                  onNavigateToQueue();
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Open in OPD Queue"
              >
                <Text style={styles.queueBtnText}>Open OPD Queue</Text>
                <ArrowRight size={16} color="#0866C6" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
    maxHeight: '92%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleBox: {
    flex: 1,
  },
  alertIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  queuePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  queuePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  audioActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  audioActiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  audioWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  audioWarningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    flex: 1,
  },
  scrollArea: {
    maxHeight: 280,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  patientBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 12,
  },
  iconCircleBlue: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInfoCol: {
    flex: 1,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  mrnTag: {
    backgroundColor: '#0866C6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mrnTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  patientSubtext: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
  },
  appointmentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 6,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircleGreen: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  doctorDept: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  metaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
  },
  feeTag: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  feeTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
  actionsRow: {
    marginTop: 16,
    gap: 10,
  },
  silenceBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  silenceBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  queueBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  queueBtnText: {
    color: '#0866C6',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default FullScreenAppointmentAlertModal;
