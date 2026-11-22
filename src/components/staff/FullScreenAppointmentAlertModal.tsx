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
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  IndianRupee,
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
  const bannerPulse = useRef(new Animated.Value(1)).current;
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

    // Beacon scale pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // Banner pulse animation for blocked audio
    const bPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(bannerPulse, {
          toValue: 1.03,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bannerPulse, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    );
    bPulse.start();

    return () => {
      pulse.stop();
      bPulse.stop();
    };
  }, [visible, pulseAnim, bannerPulse]);

  if (!alert || !visible) return null;

  const handleContainerTouch = () => {
    if (isAudioBlocked) {
      void emergencyAudioService.unlockAudio();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <StatusBar barStyle="light-content" />
      <View
        style={styles.container}
        onTouchStart={handleContainerTouch}
        {...(Platform.OS === 'web' ? ({ onClick: handleContainerTouch } as any) : {})}
      >
        {/* Urgent Flashing Header */}
        <View style={styles.headerBanner}>
          <Animated.View
            style={[styles.beaconCircle, { transform: [{ scale: pulseAnim }] }]}
          >
            <ShieldAlert size={36} color="#FFFFFF" />
          </Animated.View>
          <View style={styles.headerTextGroup}>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeLabel}>PRIORITY CLINICAL DISPATCH</Text>
              {queueCount > 1 ? (
                <View style={styles.queueBadge}>
                  <Layers size={12} color="#FEF08A" />
                  <Text style={styles.queueBadgeText}>+{queueCount - 1} QUEUED</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.mainAlertTitle}>NEW APPOINTMENT BOOKED</Text>
            <Text style={styles.headerSubtitle}>
              Live Firebase Realtime Sync • Front Desk & Triage Alert
            </Text>
          </View>
        </View>

        {/* Audio Status Banner / Tap-To-Unmute Prompt */}
        {isAudioBlocked ? (
          <Animated.View
            style={[
              styles.audioBlockedBanner,
              { transform: [{ scale: bannerPulse }] },
            ]}
          >
            <TouchableOpacity
              style={styles.unmuteButton}
              onPress={() => {
                void emergencyAudioService.unlockAudio();
              }}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Sound loud medical siren"
            >
              <VolumeX size={18} color="#FFFFFF" />
              <Text style={styles.audioBlockedText}>
                ⚠️ AUDIO MUTED BY BROWSER — TAP HERE TO SOUND LOUD ALARM
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.audioNoticeBar}>
            <Volume2 size={18} color="#FEF08A" />
            <Text style={styles.audioNoticeText}>
              HIGH-VOLUME SIREN ACTIVE • SILENCE VIA ACTION BELOW
            </Text>
          </View>
        )}

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Patient Details Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBox}>
                <User size={20} color="#0866C6" />
              </View>
              <Text style={styles.cardSectionTitle}>PATIENT DETAILS</Text>
              {alert.patientMrn ? (
                <View style={styles.mrnBadge}>
                  <Text style={styles.mrnBadgeText}>{alert.patientMrn}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.patientNameText}>{alert.patientName}</Text>
            {alert.patientPhone ? (
              <Text style={styles.patientMetaText}>
                Contact: {alert.patientPhone}
              </Text>
            ) : null}

            <View style={styles.modeTagRow}>
              <View style={styles.modeTag}>
                <Text style={styles.modeTagText}>
                  {alert.mode === 'video'
                    ? 'Telemedicine Video OPD'
                    : 'In-Person Hospital OPD'}
                </Text>
              </View>
            </View>
          </View>

          {/* Doctor & Schedule Card */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconBox, { backgroundColor: '#F0FDF4' }]}>
                <Stethoscope size={20} color="#16A34A" />
              </View>
              <Text style={styles.cardSectionTitle}>ASSIGNED PHYSICIAN</Text>
            </View>

            <Text style={styles.doctorNameText}>{alert.doctorName}</Text>
            <Text style={styles.doctorDeptText}>{alert.doctorDepartment}</Text>

            <View style={styles.divider} />

            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <Calendar size={18} color="#38BDF8" />
                <View>
                  <Text style={styles.scheduleLabel}>Date</Text>
                  <Text style={styles.scheduleValue}>{alert.date}</Text>
                </View>
              </View>

              <View style={styles.scheduleItem}>
                <Clock size={18} color="#FBBF24" />
                <View>
                  <Text style={styles.scheduleLabel}>Time Slot</Text>
                  <Text style={styles.scheduleValue}>{alert.timeSlot}</Text>
                </View>
              </View>
            </View>

            {alert.consultationFee !== undefined ? (
              <View style={styles.feeRow}>
                <View style={styles.feeBadge}>
                  <IndianRupee size={14} color="#10B981" />
                  <Text style={styles.feeText}>
                    Consultation Fee: ₹{alert.consultationFee} (Paid)
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Operational Instructions */}
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>
              • Patient record is queued at the reception desk.{'\n'}
              • Triage nurse can record vitals or issue an OPD token immediately.
            </Text>
          </View>
        </ScrollView>

        {/* Fixed Bottom Action Panel */}
        <View style={styles.bottomActionsPanel}>
          <TouchableOpacity
            style={styles.silenceButton}
            onPress={onAcknowledge}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Acknowledge alert and silence siren"
          >
            <CheckCircle2 size={20} color="#FFFFFF" />
            <Text style={styles.silenceButtonText}>Acknowledge & Silence</Text>
          </TouchableOpacity>

          {onNavigateToQueue ? (
            <TouchableOpacity
              style={styles.openQueueButton}
              onPress={() => {
                onAcknowledge();
                onNavigateToQueue();
              }}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Open in OPD Queue"
            >
              <Text style={styles.openQueueButtonText}>
                Open in OPD Queue
              </Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1D',
  },
  headerBanner: {
    backgroundColor: '#7F1D1D',
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#EF4444',
  },
  beaconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 8,
  },
  headerTextGroup: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 0.8,
  },
  queueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(254, 240, 138, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  queueBadgeText: {
    color: '#FEF08A',
    fontSize: 10,
    fontWeight: '800',
  },
  mainAlertTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FEE2E2',
    fontWeight: '500',
    marginTop: 2,
  },
  audioNoticeBar: {
    backgroundColor: '#991B1B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DC2626',
  },
  audioNoticeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FEF08A',
    letterSpacing: 0.5,
  },
  audioBlockedBanner: {
    backgroundColor: '#B45309',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
  },
  unmuteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  audioBlockedText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    flex: 1,
  },
  mrnBadge: {
    backgroundColor: '#0866C6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  mrnBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  patientNameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  patientMetaText: {
    fontSize: 13.5,
    color: '#CBD5E1',
    marginTop: 4,
  },
  modeTagRow: {
    marginTop: 10,
    flexDirection: 'row',
  },
  modeTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeTagText: {
    color: '#7DD3FC',
    fontSize: 12,
    fontWeight: '700',
  },
  doctorNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doctorDeptText: {
    fontSize: 13,
    color: '#4ADE80',
    fontWeight: '600',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  scheduleItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 10,
    borderRadius: 10,
  },
  scheduleLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  scheduleValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  feeRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  feeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  feeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.35)',
    borderRadius: 12,
    padding: 14,
  },
  instructionText: {
    fontSize: 12.5,
    color: '#FEF08A',
    lineHeight: 18,
    fontWeight: '500',
  },
  bottomActionsPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  silenceButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  silenceButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  openQueueButton: {
    flex: 1.2,
    backgroundColor: '#0866C6',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  openQueueButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
});

export default FullScreenAppointmentAlertModal;
