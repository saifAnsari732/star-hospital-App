import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneOff,
  Clock,
  Wifi,
  Info,
  Stethoscope,
  Pill,
  Calendar,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { StarHeader, StarCard, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'VideoConsultation'>;

export const VideoConsultationScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const doctorName = route.params?.doctorName || 'Dr. Amit Sharma';
  const department = route.params?.department || 'General Physician';
  const appointmentId = route.params?.appointmentId || 'apt-video-101';
  const scheduledTime =
    route.params?.scheduledTime || 'Today • Waiting Room Open';

  const roomEndpoint = `wss://telemed.starhospital.local/room/${appointmentId}`;

  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);
  const [roomState, setRoomState] = useState<'waiting' | 'staging' | 'ended'>(
    'waiting'
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (roomState !== 'staging') return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [roomState]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleJoinRoom = () => {
    setRoomState('staging');
    Alert.alert(
      'Telemedicine Integration Notice',
      'Camera/microphone pre-check staging has started locally. Live peer-to-peer WebRTC media requires an active ICTHospital WebRTC signaling token.'
    );
  };

  const handleLeaveCall = () => {
    setRoomState('ended');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="Video Consultation"
        subtitle={doctorName}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Honest Integration Status Banner */}
        <View style={styles.integrationBanner}>
          <Info size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.integrationTitle}>
              WebRTC Signaling Integration Status: Staging Mode
            </Text>
            <Text style={styles.integrationDesc}>
              ICTHospital backend does not expose a live WebRTC signaling/TURN
              server in this build. Local audio/camera controls and session
              staging UI are active; live video stream will connect once
              signaling credentials are provisioned.
            </Text>
            <Text style={styles.endpointText} numberOfLines={1}>
              Signaling URL: {roomEndpoint}
            </Text>
          </View>
        </View>

        {/* Video Viewport Stage */}
        <View style={styles.videoViewport}>
          <View style={styles.viewportHeader}>
            <View style={styles.statusChip}>
              <Wifi
                size={13}
                color={
                  roomState === 'staging'
                    ? colors.success
                    : roomState === 'ended'
                      ? colors.danger
                      : colors.warning
                }
              />
              <Text style={styles.statusChipText}>
                {roomState === 'staging'
                  ? 'Staging Waiting Room'
                  : roomState === 'ended'
                    ? 'Consultation Closed'
                    : 'Ready to Join'}
              </Text>
            </View>
            <View style={styles.timerChip}>
              <Clock size={12} color={colors.white} />
              <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
            </View>
          </View>

          <View style={styles.doctorCenter}>
            <View style={styles.doctorAvatar}>
              <Stethoscope size={32} color={colors.white} />
            </View>
            <Text style={styles.stageDoctorName}>{doctorName}</Text>
            <Text style={styles.stageDoctorDept}>{department}</Text>
            <View style={styles.schedulePill}>
              <Calendar size={12} color="#BFDBFE" />
              <Text style={styles.scheduleText}>{scheduledTime}</Text>
            </View>
            <Text style={styles.stageHint}>
              {camOff
                ? 'Your local camera preview is paused'
                : roomState === 'staging'
                  ? 'Awaiting remote physician WebRTC media track...'
                  : 'Tap "Join Waiting Room" below to test your consultation staging'}
            </Text>
          </View>

          {/* Media Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={() => setMicMuted((v) => !v)}
              style={[
                styles.controlBtn,
                micMuted ? styles.controlBtnMuted : undefined,
              ]}
            >
              {micMuted ? (
                <MicOff size={20} color={colors.white} />
              ) : (
                <Mic size={20} color={colors.white} />
              )}
              <Text style={styles.controlLabel}>
                {micMuted ? 'Muted' : 'Mic On'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCamOff((v) => !v)}
              style={[
                styles.controlBtn,
                camOff ? styles.controlBtnMuted : undefined,
              ]}
            >
              {camOff ? (
                <VideoOff size={20} color={colors.white} />
              ) : (
                <Video size={20} color={colors.white} />
              )}
              <Text style={styles.controlLabel}>
                {camOff ? 'Cam Off' : 'Cam On'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSpeakerMuted((v) => !v)}
              style={[
                styles.controlBtn,
                speakerMuted ? styles.controlBtnMuted : undefined,
              ]}
            >
              {speakerMuted ? (
                <VolumeX size={20} color={colors.white} />
              ) : (
                <Volume2 size={20} color={colors.white} />
              )}
              <Text style={styles.controlLabel}>
                {speakerMuted ? 'Spk Off' : 'Speaker'}
              </Text>
            </TouchableOpacity>

            {roomState === 'staging' && (
              <TouchableOpacity
                onPress={handleLeaveCall}
                style={[styles.controlBtn, styles.endCallBtn]}
              >
                <PhoneOff size={20} color={colors.white} />
                <Text style={styles.controlLabel}>Leave</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Primary Action */}
        {roomState !== 'staging' ? (
          <StarButton
            title={
              roomState === 'ended'
                ? 'Re-enter Waiting Room Staging'
                : 'Join Waiting Room (Staging)'
            }
            onPress={handleJoinRoom}
            fullWidth
          />
        ) : (
          <StarButton
            title="End Tele-Consultation Staging"
            variant="danger"
            onPress={handleLeaveCall}
            fullWidth
          />
        )}

        {/* Helpful Post-Consult Links */}
        <StarCard style={styles.linksCard} variant="elevated">
          <Text style={styles.linksTitle}>Consultation Quick Tools</Text>
          <View style={styles.linksRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate('PrescriptionsList')}
              style={styles.quickTool}
            >
              <Pill size={18} color={colors.primary} />
              <Text style={styles.quickToolText}>My Prescriptions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ReportsList')}
              style={styles.quickTool}
            >
              <Calendar size={18} color={colors.tealAccent} />
              <Text style={styles.quickToolText}>Share Lab Reports</Text>
            </TouchableOpacity>
          </View>
        </StarCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  integrationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  integrationTitle: { ...typography.labelLarge, color: colors.primaryDark },
  integrationDesc: {
    ...typography.bodySmall,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 18,
  },
  endpointText: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 6,
    fontWeight: '600',
  },
  videoViewport: {
    backgroundColor: '#0F172A',
    borderRadius: radii.xl,
    padding: spacing.lg,
    minHeight: 360,
    justifyContent: 'space-between',
  },
  viewportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  statusChipText: { ...typography.caption, color: colors.white, fontWeight: '600' },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(8, 102, 198, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  timerText: { ...typography.caption, color: colors.white, fontWeight: '700' },
  doctorCenter: { alignItems: 'center', paddingVertical: spacing.lg },
  doctorAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  stageDoctorName: { ...typography.h3, color: colors.white },
  stageDoctorDept: { ...typography.bodySmall, color: '#94A3B8', marginTop: 2 },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginTop: spacing.xs,
  },
  scheduleText: { ...typography.caption, color: '#BFDBFE' },
  stageHint: {
    ...typography.caption,
    color: '#CBD5E1',
    textAlign: 'center',
    marginTop: spacing.md,
    maxWidth: 270,
    lineHeight: 17,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    minWidth: 68,
    gap: 4,
  },
  controlBtnMuted: { backgroundColor: '#475569' },
  endCallBtn: { backgroundColor: colors.danger },
  controlLabel: { ...typography.caption, color: colors.white, fontSize: 11 },
  linksCard: { padding: spacing.md, borderRadius: radii.xl },
  linksTitle: { ...typography.labelLarge, color: colors.textPrimary, marginBottom: spacing.sm },
  linksRow: { flexDirection: 'row', gap: spacing.sm },
  quickTool: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickToolText: { ...typography.labelMedium, color: colors.textPrimary },
});
