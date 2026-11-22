import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Stethoscope,
  Pill,
  FileText,
  Wifi,
  Clock,
  Info,
} from 'lucide-react-native';
import { StarHeader } from '../../components/common';
import { patientService } from '../../services/patientService';
import type { Patient } from '../../types/patient';

export const DoctorVideoConsultationScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const paramPatientId: string = route?.params?.patientId || 'pat-1';
  const paramPatientName: string = route?.params?.patientName || 'Ali Khan';
  const paramPatientMrn: string = route?.params?.patientMrn || 'P-00102';
  const appointmentId: string | undefined = route?.params?.appointmentId;
  const roomUrl: string =
    route?.params?.roomUrl || `wss://telemed.starhospital.local/room/${appointmentId || paramPatientId}`;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [speakerOff, setSpeakerOff] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [sessionState, setSessionState] = useState<'standby' | 'active' | 'ended'>('standby');
  const [quickNotes, setQuickNotes] = useState('');

  useEffect(() => {
    patientService
      .getProfile(paramPatientId)
      .then((p) => setPatient(p))
      .catch(() => {});
  }, [paramPatientId]);

  useEffect(() => {
    if (sessionState !== 'active') return;
    const timer = setInterval(() => {
      setCallSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionState]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setSessionState('ended');
    Alert.alert(
      'Tele-Consultation Ended',
      'Would you like to document clinical notes or issue an e-Prescription for this patient?',
      [
        {
          text: 'Close',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Consultation Notes',
          onPress: () =>
            navigation.navigate('Consultation', {
              appointmentId,
              patientId: patient?.id || paramPatientId,
              patientName: patient?.name || paramPatientName,
              patientMrn: patient?.mrn || paramPatientMrn,
              initialNotes: quickNotes,
            }),
        },
        {
          text: 'Write Rx',
          onPress: () =>
            navigation.navigate('PrescriptionBuilder', {
              appointmentId,
              patientId: patient?.id || paramPatientId,
              patientName: patient?.name || paramPatientName,
              patientMrn: patient?.mrn || paramPatientMrn,
            }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Video Consultation"
        subtitle={patient?.name || paramPatientName}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Honest Integration Notice */}
        <View style={styles.integrationBanner}>
          <Info size={18} color="#0866C6" />
          <View style={{ flex: 1 }}>
            <Text style={styles.integrationTitle}>
              Telemedicine Signaling Integration Ready
            </Text>
            <Text style={styles.integrationDesc}>
              Live WebRTC media transport requires the production signaling server
              token. Local camera, mic, timer, and clinical handoff controls are
              active for consultation staging.
            </Text>
            <Text style={styles.roomUrlText} numberOfLines={1}>
              Room Endpoint: {roomUrl}
            </Text>
          </View>
        </View>

        {/* Simulated Video Viewport */}
        <View style={styles.videoViewport}>
          <View style={styles.viewportTop}>
            <View style={styles.statusChip}>
              <Wifi size={12} color={sessionState === 'active' ? '#16A34A' : '#F59E0B'} />
              <Text style={styles.statusChipText}>
                {sessionState === 'active'
                  ? 'Session Staging Active'
                  : sessionState === 'ended'
                    ? 'Session Ended'
                    : 'Waiting to Join Room'}
              </Text>
            </View>
            <View style={styles.timerChip}>
              <Clock size={12} color="#FFFFFF" />
              <Text style={styles.timerText}>{formatTimer(callSeconds)}</Text>
            </View>
          </View>

          <View style={styles.remoteStage}>
            <View style={styles.patientAvatarLg}>
              <Text style={styles.patientAvatarText}>
                {(patient?.name || paramPatientName).charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.stagePatientName}>
              {patient?.name || paramPatientName}
            </Text>
            <Text style={styles.stagePatientMeta}>
              MRN: {patient?.mrn || paramPatientMrn} |{' '}
              {patient ? `${patient.age} / ${patient.bloodGroup}` : 'Telemedicine OPD'}
            </Text>
            <Text style={styles.stageFeedHint}>
              {camOff
                ? 'Doctor camera is turned off'
                : 'Awaiting remote patient video track from signaling gateway'}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsBar}>
            <TouchableOpacity
              style={[styles.ctrlBtn, micMuted && styles.ctrlBtnMuted]}
              onPress={() => setMicMuted((v) => !v)}
            >
              {micMuted ? (
                <MicOff size={20} color="#FFFFFF" />
              ) : (
                <Mic size={20} color="#FFFFFF" />
              )}
              <Text style={styles.ctrlLabel}>{micMuted ? 'Muted' : 'Mic'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctrlBtn, camOff && styles.ctrlBtnMuted]}
              onPress={() => setCamOff((v) => !v)}
            >
              {camOff ? (
                <VideoOff size={20} color="#FFFFFF" />
              ) : (
                <Video size={20} color="#FFFFFF" />
              )}
              <Text style={styles.ctrlLabel}>{camOff ? 'Cam Off' : 'Camera'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctrlBtn, speakerOff && styles.ctrlBtnMuted]}
              onPress={() => setSpeakerOff((v) => !v)}
            >
              {speakerOff ? (
                <VolumeX size={20} color="#FFFFFF" />
              ) : (
                <Volume2 size={20} color="#FFFFFF" />
              )}
              <Text style={styles.ctrlLabel}>{speakerOff ? 'Quiet' : 'Audio'}</Text>
            </TouchableOpacity>

            {sessionState === 'active' ? (
              <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
                <PhoneOff size={20} color="#FFFFFF" />
                <Text style={styles.ctrlLabel}>End</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.startCallBtn}
                onPress={() => setSessionState('active')}
              >
                <Video size={20} color="#FFFFFF" />
                <Text style={styles.ctrlLabel}>Start</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Live Scratchpad */}
        <View style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <FileText size={16} color="#0866C6" />
            <Text style={styles.notesTitle}>In-Call Clinical Scratchpad</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            multiline
            numberOfLines={4}
            placeholder="Capture symptoms, video observation, or verbal instructions during call..."
            placeholderTextColor="#94A3B8"
            value={quickNotes}
            onChangeText={setQuickNotes}
          />

          <View style={styles.handoffRow}>
            <TouchableOpacity
              style={styles.handoffBtn}
              onPress={() =>
                navigation.navigate('Consultation', {
                  appointmentId,
                  patientId: patient?.id || paramPatientId,
                  patientName: patient?.name || paramPatientName,
                  patientMrn: patient?.mrn || paramPatientMrn,
                  initialNotes: quickNotes,
                })
              }
            >
              <Stethoscope size={15} color="#0866C6" />
              <Text style={styles.handoffBtnText}>Open Clinical Exam</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.handoffBtn, styles.handoffBtnPrimary]}
              onPress={() =>
                navigation.navigate('PrescriptionBuilder', {
                  appointmentId,
                  patientId: patient?.id || paramPatientId,
                  patientName: patient?.name || paramPatientName,
                  patientMrn: patient?.mrn || paramPatientMrn,
                })
              }
            >
              <Pill size={15} color="#FFFFFF" />
              <Text style={styles.handoffPrimaryText}>Build e-Rx</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  integrationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  integrationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064A91',
    marginBottom: 2,
  },
  integrationDesc: {
    fontSize: 12,
    color: '#1E3A8A',
    lineHeight: 17,
  },
  roomUrlText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    fontWeight: '600',
  },
  videoViewport: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  viewportTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0866C6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  remoteStage: {
    alignItems: 'center',
    paddingVertical: 34,
  },
  patientAvatarLg: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#38BDF8',
  },
  patientAvatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stagePatientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stagePatientMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  stageFeedHint: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 10,
    textAlign: 'center',
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  ctrlBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minWidth: 64,
  },
  ctrlBtnMuted: {
    backgroundColor: '#475569',
  },
  endCallBtn: {
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 64,
  },
  startCallBtn: {
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    minWidth: 64,
  },
  ctrlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    minHeight: 92,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#142D4E',
  },
  handoffRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  handoffBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  handoffBtnPrimary: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  handoffBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  handoffPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DoctorVideoConsultationScreen;
