import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Volume2,
  BellRing,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  ChevronLeft,
  Users,
  Radio,
  Sparkles,
} from 'lucide-react-native';
import { QueueCallerItem, QueuePatientData } from '@/components/doctor/QueueCallerItem';
import { VitalsSummaryBadge } from '@/components/doctor/VitalsSummaryBadge';
import { StarLoader } from '@/components/common';
import { useAuth } from '@/context/AuthContext';
import { opdTokenService } from '@/services/opdTokenService';
import { doctorService } from '@/services/doctorService';
import { patientService } from '@/services/patientService';
import { appointmentService } from '@/services/appointmentService';
import { voiceQueueAnnouncementService } from '@/services/voiceQueueAnnouncementService';
import { mockOpdTokens } from '@/fixtures/mockOpdTokens';
import type { Doctor } from '@/types/doctor';
import type { OPDToken } from '@/types/opdToken';

interface OPDQueueCallerProps {
  navigation?: any;
  route?: any;
}

export const OPDQueueCallerScreen: React.FC<OPDQueueCallerProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const doctorId = 'doc-1';

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [servingToken, setServingToken] = useState<QueuePatientData | null>(null);
  const [queue, setQueue] = useState<QueuePatientData[]>([]);
  const [completedList, setCompletedList] = useState<QueuePatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Elapsed consultation timer
  const [consultElapsedSeconds, setConsultElapsedSeconds] = useState(0);
  const [isChimeActive, setIsChimeActive] = useState(false);
  const [chimeMessage, setChimeMessage] = useState<string | null>(null);

  // Active filter tab
  const [activeTab, setActiveTab] = useState<'waiting' | 'in_consultation' | 'completed' | 'all'>('waiting');

  const loadQueue = useCallback(async () => {
    try {
      const [docProfile, queueView, allPatients, appts] = await Promise.all([
        doctorService.getDoctorById(doctorId),
        opdTokenService.getDoctorQueue(doctorId),
        patientService.getAllPatients(),
        appointmentService.getAppointments({ doctorId }),
      ]);

      setDoctor(docProfile);
      const patientMap = new Map(allPatients.map((p) => [p.id, p]));
      const vitalsMap = new Map(
        appts
          .filter((a) => a.vitals)
          .map((a) => [a.patientId, a.vitals!])
      );

      const mapToken = (tok: OPDToken): QueuePatientData => {
        const pat = patientMap.get(tok.patientId);
        const v = vitalsMap.get(tok.patientId);
        return {
          id: tok.id,
          tokenNumber: tok.tokenNumber,
          patientId: tok.patientId,
          patientName: tok.patientName || pat?.name || 'Patient',
          patientMrn: tok.patientMrn || pat?.mrn || 'N/A',
          age: pat?.age,
          gender: pat?.gender
            ? pat.gender.charAt(0).toUpperCase() + pat.gender.slice(1)
            : undefined,
          department: tok.department || docProfile.department,
          arrivedAt: tok.generatedAt
            ? new Date(tok.generatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '09:30 AM',
          waitTimeMinutes: tok.estimatedWaitMinutes,
          status: tok.status,
          chiefComplaint:
            tok.estimatedWaitMinutes <= 5
              ? 'Urgent Priority Consultation'
              : `${tok.department} OPD Consultation`,
          vitals: v
            ? {
                bp: v.bloodPressure,
                pulse: v.pulse,
                temp: v.temperature,
                weight: v.weight,
              }
            : undefined,
        };
      };

      const mapped = queueView.tokens.map(mapToken);
      setServingToken(mapped.find((t) => t.status === 'in_consultation') || null);
      setQueue(mapped.filter((t) => t.status === 'arrived' || t.status === 'scheduled'));
      setCompletedList(mapped.filter((t) => t.status === 'completed'));
    } catch {
      Alert.alert('Queue Error', 'Unable to load OPD queue.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useFocusEffect(
    useCallback(() => {
      loadQueue();
    }, [loadQueue])
  );

  // Timer tick for consultation
  useEffect(() => {
    let timer: any = null;
    if (servingToken) {
      timer = setInterval(() => {
        setConsultElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [servingToken]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const chamberLabel = doctor?.roomNo || 'OPD Chamber';
  const doctorDisplayName = doctor?.name || user?.name || 'Attending Doctor';

  const triggerChime = (tokenNumber: string, patientName: string) => {
    setIsChimeActive(true);
    setChimeMessage(
      `Announcement: Token ${tokenNumber} — ${patientName}, please proceed to ${chamberLabel} (${doctor?.department || 'OPD'})`
    );
    setTimeout(() => {
      setIsChimeActive(false);
    }, 4500);
  };

  const openConsultation = (item: QueuePatientData) => {
    navigation?.navigate?.('Consultation', {
      tokenId: item.id,
      tokenNumber: item.tokenNumber,
      patientId: item.patientId || 'pat-1',
      patientName: item.patientName,
      patientMrn: item.patientMrn,
      vitals: item.vitals,
      patient: item,
    });
  };

  // Call next patient in queue
  const handleCallNextPatient = async () => {
    const waitingPatients = queue.filter((item) => item.status === 'arrived');
    if (waitingPatients.length === 0) {
      Alert.alert('Queue Complete', 'No waiting patients in queue.');
      return;
    }

    setActionBusy(true);
    try {
      const nextCalled = await opdTokenService.callNextToken(doctorId);
      setConsultElapsedSeconds(0);
      await loadQueue();
      if (nextCalled) {
        triggerChime(nextCalled.tokenNumber, nextCalled.patientName);
        void voiceQueueAnnouncementService.announceYourTurnNow(
          nextCalled.tokenNumber,
          nextCalled.patientName,
          doctorDisplayName,
          chamberLabel
        );
      }
    } catch {
      Alert.alert('Queue Error', 'Failed to call next patient.');
    } finally {
      setActionBusy(false);
    }
  };

  // Mark currently serving patient done
  const handleCompleteCurrent = async () => {
    if (!servingToken) return;
    setActionBusy(true);
    const finished = servingToken;
    try {
      await opdTokenService.completeToken(servingToken.id);
      setConsultElapsedSeconds(0);
      await loadQueue();
      if (finished) {
        void voiceQueueAnnouncementService.announceConsultationCompleted(
          finished.tokenNumber,
          finished.patientName
        );
      }
    } catch {
      Alert.alert('Queue Error', 'Failed to complete active consultation.');
    } finally {
      setActionBusy(false);
    }
  };

  // Call specific patient from queue
  const handleCallSpecificPatient = async (patient: QueuePatientData) => {
    setActionBusy(true);
    try {
      if (servingToken && servingToken.id !== patient.id) {
        await opdTokenService.completeToken(servingToken.id);
      }
      const targetTok = mockOpdTokens.find((t) => t.id === patient.id);
      if (targetTok) {
        targetTok.status = 'in_consultation';
        targetTok.queuePosition = 0;
        targetTok.estimatedWaitMinutes = 0;
      }
      setConsultElapsedSeconds(0);
      await loadQueue();
      triggerChime(patient.tokenNumber, patient.patientName);
    } catch {
      Alert.alert('Queue Error', 'Unable to call selected patient.');
    } finally {
      setActionBusy(false);
    }
  };

  // Filter list based on selected tab
  const getFilteredList = () => {
    switch (activeTab) {
      case 'waiting':
        return queue.filter((p) => p.status === 'arrived');
      case 'in_consultation':
        return servingToken ? [servingToken] : [];
      case 'completed':
        return completedList;
      case 'all':
        return [
          ...(servingToken ? [servingToken] : []),
          ...queue,
          ...completedList,
        ];
    }
  };

  const filteredItems = getFilteredList();

  if (loading && !doctor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarLoader message="Loading live OPD queue..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <ChevronLeft size={22} color="#142D4E" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>OPD Live Queue Caller</Text>
          <Text style={styles.headerSubtitle}>
            {doctorDisplayName} • {chamberLabel}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.soundTestButton}
          onPress={() =>
            triggerChime(
              servingToken?.tokenNumber || queue[0]?.tokenNumber || '--',
              servingToken?.patientName || queue[0]?.patientName || 'Next Patient'
            )
          }
        >
          <BellRing size={18} color="#0866C6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadQueue();
            }}
            tintColor="#0866C6"
          />
        }
      >
        {/* Visual Chime Notification Banner */}
        {isChimeActive && chimeMessage ? (
          <View style={styles.chimeBanner}>
            <Sparkles size={20} color="#FFFFFF" />
            <Text style={styles.chimeBannerText}>{chimeMessage}</Text>
          </View>
        ) : null}

        {/* Current Serving Token Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.livePulseDot} />
              <Radio size={14} color="#7C3AED" />
              <Text style={styles.liveIndicatorText}>NOW SERVING IN CHAMBER</Text>
            </View>
            <View style={styles.timerBadge}>
              <Clock size={13} color="#0866C6" />
              <Text style={styles.timerText}>
                {servingToken ? formatTimer(consultElapsedSeconds) : '00:00'}
              </Text>
            </View>
          </View>

          {servingToken ? (
            <View style={styles.servingBody}>
              <View style={styles.tokenDisplayRow}>
                <Text style={styles.giantTokenText}>
                  {servingToken.tokenNumber}
                </Text>
                <View style={styles.patientMetaContainer}>
                  <Text style={styles.heroPatientName}>
                    {servingToken.patientName}
                  </Text>
                  <Text style={styles.heroPatientSub}>
                    MRN: {servingToken.patientMrn || 'N/A'}
                    {servingToken.age ? ` • ${servingToken.age}` : ''}
                    {servingToken.gender ? ` • ${servingToken.gender}` : ''}
                  </Text>
                  <Text style={styles.heroArrivalSub}>
                    Checked in {servingToken.arrivedAt}
                  </Text>
                </View>
              </View>

              {servingToken.vitals ? (
                <View style={styles.vitalsWrap}>
                  <VitalsSummaryBadge vitals={servingToken.vitals} />
                </View>
              ) : null}

              {servingToken.chiefComplaint ? (
                <View style={styles.complaintBox}>
                  <Text style={styles.complaintLabel}>Visit Reason:</Text>
                  <Text style={styles.complaintVal}>
                    {servingToken.chiefComplaint}
                  </Text>
                </View>
              ) : null}

              <View style={styles.servingButtonRow}>
                <TouchableOpacity
                  style={styles.notesActionButton}
                  onPress={() => openConsultation(servingToken)}
                >
                  <FileText size={16} color="#0866C6" />
                  <Text style={styles.notesActionText}>Consultation</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.doneActionButton, actionBusy && { opacity: 0.7 }]}
                  disabled={actionBusy}
                  onPress={handleCompleteCurrent}
                >
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text style={styles.doneActionText}>Complete Visit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.emptyHeroBody}>
              <UserCheck size={36} color="#94A3B8" />
              <Text style={styles.emptyHeroTitle}>Chamber Free</Text>
              <Text style={styles.emptyHeroSubtitle}>
                No patient inside chamber. Click &quot;Call Next Patient&quot; to advance the queue.
              </Text>
            </View>
          )}
        </View>

        {/* Primary Call Next Button */}
        <TouchableOpacity
          style={[styles.primaryCallNextBtn, actionBusy && { opacity: 0.7 }]}
          disabled={actionBusy}
          onPress={handleCallNextPatient}
          activeOpacity={0.88}
        >
          <Volume2 size={24} color="#FFFFFF" />
          <View style={styles.callNextTextGroup}>
            <Text style={styles.callNextMainTitle}>
              {actionBusy ? 'Advancing Queue...' : 'Call Next Patient'}
            </Text>
            <Text style={styles.callNextSubTitle}>
              {queue.filter((q) => q.status === 'arrived').length} patient(s) waiting in OPD lounge
            </Text>
          </View>
        </TouchableOpacity>

        {/* Queue Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>
              {queue.filter((q) => q.status === 'arrived').length}
            </Text>
            <Text style={styles.statLabel}>Waiting</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#7C3AED' }]}>
              {servingToken ? 1 : 0}
            </Text>
            <Text style={styles.statLabel}>Serving</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#16A34A' }]}>
              {completedList.length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'waiting' && styles.activeTabItem]}
            onPress={() => setActiveTab('waiting')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'waiting' && styles.activeTabText,
              ]}
            >
              Waiting ({queue.filter((p) => p.status === 'arrived').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'in_consultation' && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab('in_consultation')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'in_consultation' && styles.activeTabText,
              ]}
            >
              In Chamber ({servingToken ? 1 : 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === 'completed' && styles.activeTabItem,
            ]}
            onPress={() => setActiveTab('completed')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'completed' && styles.activeTabText,
              ]}
            >
              Done ({completedList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'all' && styles.activeTabItem]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' && styles.activeTabText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Queue Items List */}
        <View style={styles.listContainer}>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <QueueCallerItem
                key={item.id}
                item={item}
                isCurrentlyServing={servingToken?.id === item.id}
                onCallPatient={handleCallSpecificPatient}
                onCompletePatient={handleCompleteCurrent}
                onOpenNotes={openConsultation}
                onSelect={(p) =>
                  navigation?.navigate?.('PatientDetail', {
                    patientId: p.patientId || 'pat-1',
                  })
                }
              />
            ))
          ) : (
            <View style={styles.emptyListCard}>
              <Users size={32} color="#94A3B8" />
              <Text style={styles.emptyListTitle}>No Patients in this View</Text>
              <Text style={styles.emptyListText}>
                {activeTab === 'waiting'
                  ? 'All waiting patients have been attended to.'
                  : 'No patients found under this category.'}
              </Text>
            </View>
          )}
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  soundTestButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  chimeBanner: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  chimeBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7C3AED',
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
    fontVariant: ['tabular-nums'],
  },
  servingBody: {},
  tokenDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  giantTokenText: {
    fontSize: 44,
    fontWeight: '900',
    color: '#064A91',
    letterSpacing: -1,
    marginRight: 16,
  },
  patientMetaContainer: {
    flex: 1,
  },
  heroPatientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
  },
  heroPatientSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  heroArrivalSub: {
    fontSize: 11,
    color: '#0866C6',
    marginTop: 2,
    fontWeight: '600',
  },
  vitalsWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
  complaintBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0866C6',
  },
  complaintLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  complaintVal: {
    fontSize: 13,
    color: '#142D4E',
    fontWeight: '500',
  },
  servingButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  notesActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingVertical: 12,
    borderRadius: 12,
  },
  notesActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0866C6',
  },
  doneActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 12,
  },
  doneActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyHeroBody: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyHeroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 6,
  },
  emptyHeroSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  primaryCallNextBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  callNextTextGroup: {
    marginLeft: 14,
    flex: 1,
  },
  callNextMainTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  callNextSubTitle: {
    color: '#E0F2FE',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0866C6',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  activeTabItem: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#0866C6',
    fontWeight: '800',
  },
  listContainer: {},
  emptyListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 8,
  },
  emptyListText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
