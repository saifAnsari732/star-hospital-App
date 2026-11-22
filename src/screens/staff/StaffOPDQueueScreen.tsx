import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Ticket,
  Clock,
  CheckCircle2,
  UserCheck,
  PhoneCall,
  Bot,
  Play,
  Pause,
  Volume2,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Bell,
  Sparkles,
  ArrowRight,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { hasStaffPermission } from '../../components/staff/staffPermissions';
import {
  opdTokenService,
  mockPaymentLedger,
  PatientPaymentLedgerItem,
} from '../../services/opdTokenService';
import { doctorService } from '../../services/doctorService';
import { voiceQueueAnnouncementService } from '../../services/voiceQueueAnnouncementService';
import type { OPDToken } from '../../types/opdToken';
import type { Doctor } from '../../types/doctor';

export const StaffOPDQueueScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const designation = user?.designation;

  const canManageQueue = hasStaffPermission(designation, 'queue:manage');
  const canGenerateToken = hasStaffPermission(designation, 'opd:token_generate');

  // Main UI Mode: Queue View vs Patient ID & Payment Ledger
  const [activeMainTab, setActiveMainTab] = useState<'queue' | 'payments'>('queue');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-1');
  const [tokens, setTokens] = useState<OPDToken[]>([]);
  const [currentServing, setCurrentServing] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'arrived' | 'in_consultation' | 'completed'
  >('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Autonomous OPD Queue Engine Controls
  const [isAutonomousActive, setIsAutonomousActive] = useState(true);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(10);
  const [remainingSeconds, setRemainingSeconds] = useState(10 * 60);
  const [voiceAnnouncementLog, setVoiceAnnouncementLog] = useState<string | null>(null);
  const [payments, setPayments] = useState<PatientPaymentLedgerItem[]>(mockPaymentLedger);

  const remindedTokenIds = useRef<Set<string>>(new Set());

  const loadQueue = useCallback(async (docId: string) => {
    try {
      const [docs, queueView, ledgerPayments] = await Promise.all([
        doctorService.getAllDoctors(),
        opdTokenService.getDoctorQueue(docId),
        opdTokenService.getAllPayments(),
      ]);
      setDoctors(docs);
      setTokens(queueView.tokens);
      setCurrentServing(queueView.currentServingToken || null);
      setPayments(ledgerPayments);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQueue(selectedDoctorId);
  }, [loadQueue, selectedDoctorId]);

  useFocusEffect(
    useCallback(() => {
      loadQueue(selectedDoctorId);
    }, [loadQueue, selectedDoctorId])
  );

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId) || doctors[0];
  const activeConsultationToken = tokens.find((t) => t.status === 'in_consultation');
  const nextWaitingToken = tokens.find((t) => t.status === 'arrived');

  // Autonomous Engine Tick: counts down consultation time & auto-advances
  useEffect(() => {
    let interval: any = null;
    if (isAutonomousActive && activeConsultationToken) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Auto advance queue
            void handleAutonomousAutoAdvance();
            return slotDurationMinutes * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutonomousActive, activeConsultationToken, slotDurationMinutes]);

  // Pre-call reminder check: fires voice alert when token is #2 in queue
  useEffect(() => {
    if (!isAutonomousActive) return;
    tokens.forEach((tok) => {
      if (tok.status === 'arrived' && tok.queuePosition === 2) {
        if (!remindedTokenIds.current.has(tok.id)) {
          remindedTokenIds.current.add(tok.id);
          const docName = selectedDoctor?.name || 'Dr. Amit Sharma';
          const chamber = selectedDoctor?.roomNo || 'OPD Room 101';
          void voiceQueueAnnouncementService.announceUpcomingTurn(
            tok.tokenNumber,
            tok.patientName,
            docName,
            chamber
          );
          setVoiceAnnouncementLog(
            `🔔 Pre-Call Voice Alert: Token ${tok.tokenNumber} (${tok.patientName}) — "Aapka number aane wala hai!"`
          );
        }
      }
    });
  }, [tokens, isAutonomousActive, selectedDoctor]);

  const handleAutonomousAutoAdvance = async () => {
    const called = await opdTokenService.callNextToken(selectedDoctorId);
    setRemainingSeconds(slotDurationMinutes * 60);
    await loadQueue(selectedDoctorId);
    if (called) {
      const docName = selectedDoctor?.name || 'Dr. Amit Sharma';
      const chamber = selectedDoctor?.roomNo || 'OPD Room 101';
      void voiceQueueAnnouncementService.announceYourTurnNow(
        called.tokenNumber,
        called.patientName,
        docName,
        chamber
      );
      setVoiceAnnouncementLog(
        `⚡ Auto-Called: Token ${called.tokenNumber} (${called.patientName}) called into ${chamber}.`
      );
    }
  };

  const handleCallNext = async () => {
    const called = await opdTokenService.callNextToken(selectedDoctorId);
    setRemainingSeconds(slotDurationMinutes * 60);
    if (called) {
      const docName = selectedDoctor?.name || 'Dr. Amit Sharma';
      const chamber = selectedDoctor?.roomNo || 'OPD Room 101';
      void voiceQueueAnnouncementService.announceYourTurnNow(
        called.tokenNumber,
        called.patientName,
        docName,
        chamber
      );
      Alert.alert(
        'Queue Advanced',
        `Token ${called.tokenNumber} (${called.patientName}) called into Consultation Room.`
      );
    } else {
      Alert.alert('Queue Clear', 'No waiting tokens remaining for this doctor.');
    }
    loadQueue(selectedDoctorId);
  };

  const handleCheckOutToken = async (tok: OPDToken) => {
    await opdTokenService.completeToken(tok.id);
    void voiceQueueAnnouncementService.announceConsultationCompleted(
      tok.tokenNumber,
      tok.patientName
    );
    Alert.alert(
      'Patient Checked Out',
      `${tok.patientName} (${tok.tokenNumber}) marked completed and checked out.`
    );
    loadQueue(selectedDoctorId);
  };

  const handleExtendFiveMins = () => {
    setRemainingSeconds((prev) => prev + 300);
    Alert.alert('Slot Extended', 'Added +5 minutes to current consultation slot.');
  };

  const handleTestVoiceAnnouncement = async () => {
    const sampleToken = activeConsultationToken || nextWaitingToken || tokens[0];
    const tokenNo = sampleToken ? sampleToken.tokenNumber : 'A-102';
    const patName = sampleToken ? sampleToken.patientName : 'Rahul Sharma';
    const docName = selectedDoctor?.name || 'Dr. Amit Sharma';
    const chamber = selectedDoctor?.roomNo || 'OPD Room 101';

    await voiceQueueAnnouncementService.announceUpcomingTurn(
      tokenNo,
      patName,
      docName,
      chamber
    );
    setVoiceAnnouncementLog(
      `🔊 Voice Announcement Test Fired: "टोकन नंबर ${tokenNo}, ${patName}, कृपया तैयार रहें। आपका नंबर आने वाला है।"`
    );
  };

  const handleDoctorDutyArrivalAnnouncement = async () => {
    const docName = selectedDoctor?.name || 'Dr. Amit Sharma';
    const chamber = selectedDoctor?.roomNo || 'OPD Room 101';
    const dept = selectedDoctor?.department || 'General OPD';

    await voiceQueueAnnouncementService.announceDoctorDutyStarted(
      docName,
      chamber,
      dept
    );
    setVoiceAnnouncementLog(
      `📢 Doctor Duty Broadcast: "${docName} केबिन ${chamber} में उपस्थित हैं। ओपीडी कतार प्रारंभ हो चुकी है।"`
    );
    Alert.alert(
      'Doctor Cabin Duty Started',
      `All waiting patients have been notified that ${docName} is in ${chamber}.`
    );
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const visibleTokens = tokens.filter((t) =>
    filterStatus === 'all' ? true : t.status === filterStatus
  );

  const waitingCount = tokens.filter((t) => t.status === 'arrived').length;
  const completedCount = tokens.filter((t) => t.status === 'completed').length;
  const totalLedgerAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="OPD Queue Control Center"
        subtitle={
          canManageQueue
            ? 'Autonomous Queue Engine, Live Voice & Patient Payments'
            : 'Live OPD Queue & Realtime DB Monitor'
        }
        onBackPress={() => navigation.goBack()}
        rightAction={
          canGenerateToken ? (
            <TouchableOpacity
              style={styles.issueBtn}
              onPress={() => navigation.navigate('TokenGeneration')}
            >
              <Ticket size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Main Tab Switcher: Queue Control vs Patient Payment Ledger */}
      <View style={styles.mainTabRow}>
        <TouchableOpacity
          style={[styles.mainTabBtn, activeMainTab === 'queue' && styles.mainTabBtnActive]}
          onPress={() => setActiveMainTab('queue')}
        >
          <Users size={15} color={activeMainTab === 'queue' ? '#FFFFFF' : '#475569'} />
          <Text style={[styles.mainTabBtnText, activeMainTab === 'queue' && styles.mainTabBtnTextActive]}>
            OPD Live Queue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeMainTab === 'payments' && styles.mainTabBtnActive]}
          onPress={() => setActiveMainTab('payments')}
        >
          <CreditCard size={15} color={activeMainTab === 'payments' ? '#FFFFFF' : '#475569'} />
          <Text style={[styles.mainTabBtnText, activeMainTab === 'payments' && styles.mainTabBtnTextActive]}>
            Patient ID & Payment Ledger
          </Text>
        </TouchableOpacity>
      </View>

      {/* Doctor Selector Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.docStrip}
      >
        {doctors.map((d) => {
          const active = selectedDoctorId === d.id;
          return (
            <TouchableOpacity
              key={d.id}
              style={[styles.docChip, active && styles.docChipActive]}
              onPress={() => setSelectedDoctorId(d.id)}
            >
              <Text style={[styles.docChipText, active && styles.docChipTextActive]}>
                {d.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeMainTab === 'queue' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadQueue(selectedDoctorId);
              }}
              tintColor="#0866C6"
            />
          }
        >
          {/* Autonomous OPD Control Engine Card */}
          <View style={styles.engineCard}>
            <View style={styles.engineHeader}>
              <View style={styles.engineTitleRow}>
                <View style={styles.engineIconCircle}>
                  <Bot size={18} color="#0866C6" />
                </View>
                <View>
                  <Text style={styles.engineTitle}>Autonomous OPD Queue Engine</Text>
                  <Text style={styles.engineSubtitle}>
                    Auto-calls next token on timer expiration & fires voice alerts
                  </Text>
                </View>
              </View>
              <Switch
                value={isAutonomousActive}
                onValueChange={(val) => setIsAutonomousActive(val)}
                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                thumbColor={isAutonomousActive ? '#0866C6' : '#94A3B8'}
              />
            </View>

            {/* Status & Duration Selector */}
            <View style={styles.engineConfigRow}>
              <View style={styles.engineBadge}>
                <View
                  style={[
                    styles.pulseDot,
                    { backgroundColor: isAutonomousActive ? '#16A34A' : '#94A3B8' },
                  ]}
                />
                <Text
                  style={[
                    styles.engineBadgeText,
                    { color: isAutonomousActive ? '#16A34A' : '#64748B' },
                  ]}
                >
                  {isAutonomousActive ? 'ENGINE RUNNING (AUTO-CALL ON)' : 'MANUAL DESK MODE'}
                </Text>
              </View>

              <View style={styles.durationSelector}>
                <Text style={styles.durationLabel}>Slot Limit:</Text>
                {[5, 10, 15].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.durationPill,
                      slotDurationMinutes === m && styles.durationPillActive,
                    ]}
                    onPress={() => {
                      setSlotDurationMinutes(m);
                      setRemainingSeconds(m * 60);
                    }}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        slotDurationMinutes === m && styles.durationPillTextActive,
                      ]}
                    >
                      {m}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Live Serving Consultation Countdown Bar */}
            <View style={styles.liveConsultationBox}>
              <View style={styles.liveConsultationHeader}>
                <View>
                  <Text style={styles.liveConsultationLabel}>NOW SERVING IN CHAMBER</Text>
                  <Text style={styles.liveConsultationName}>
                    {activeConsultationToken
                      ? `${activeConsultationToken.tokenNumber} • ${activeConsultationToken.patientName}`
                      : 'Consultation Room Idle (No Patient Inside)'}
                  </Text>
                </View>
                <View style={styles.timerBadge}>
                  <Clock size={14} color="#0866C6" />
                  <Text style={styles.timerText}>{formatTimer(remainingSeconds)}</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          ((slotDurationMinutes * 60 - remainingSeconds) /
                            (slotDurationMinutes * 60)) *
                            100
                        )
                      )}%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.autoAdvanceNote}>
                {isAutonomousActive
                  ? `⚡ Auto-advances queue and alerts next patient when timer reaches 00:00.`
                  : `⏸️ Automatic advance is paused. Click Advance Patient below to call.`}
              </Text>

              {/* Engine Quick Action Buttons */}
              <View style={styles.engineActionsRow}>
                <TouchableOpacity
                  style={styles.engineActionBtn}
                  onPress={handleCallNext}
                >
                  <PhoneCall size={13} color="#FFFFFF" />
                  <Text style={styles.engineActionBtnText}>Call Next Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.engineActionBtnOutline}
                  onPress={handleExtendFiveMins}
                >
                  <Clock size={13} color="#0866C6" />
                  <Text style={styles.engineActionBtnOutlineText}>+5 Mins</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.engineActionBtnOutline}
                  onPress={handleTestVoiceAnnouncement}
                >
                  <Volume2 size={13} color="#0866C6" />
                  <Text style={styles.engineActionBtnOutlineText}>Test Hindi Voice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.engineActionBtnDoctor}
                  onPress={handleDoctorDutyArrivalAnnouncement}
                >
                  <Sparkles size={13} color="#D97706" />
                  <Text style={styles.engineActionBtnDoctorText}>Doctor Arrived</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Voice Announcement Broadcast Log */}
            {voiceAnnouncementLog ? (
              <View style={styles.logCard}>
                <Volume2 size={14} color="#0866C6" />
                <Text style={styles.logText} numberOfLines={2}>
                  {voiceAnnouncementLog}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricVal}>{currentServing || '--'}</Text>
              <Text style={styles.metricLabel}>Now Serving</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricVal, { color: '#D97706' }]}>
                {waitingCount}
              </Text>
              <Text style={styles.metricLabel}>Waiting</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricVal, { color: '#16A34A' }]}>
                {completedCount}
              </Text>
              <Text style={styles.metricLabel}>Completed</Text>
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.filterRow}>
            {(
              [
                { key: 'all', label: 'All' },
                { key: 'arrived', label: 'Waiting' },
                { key: 'in_consultation', label: 'Serving' },
                { key: 'completed', label: 'Checked Out' },
              ] as const
            ).map((tab) => {
              const active = filterStatus === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterPill, active && styles.filterPillActive]}
                  onPress={() => setFilterStatus(tab.key)}
                >
                  <Text
                    style={[styles.filterText, active && styles.filterTextActive]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <StarLoader message="Refreshing live queue..." />
          ) : visibleTokens.length === 0 ? (
            <EmptyState
              title="No Tokens in Filter"
              description="No patients match the selected queue filter right now."
            />
          ) : (
            visibleTokens.map((tok) => {
              const isServing = tok.status === 'in_consultation';
              const isNext = tok.status === 'arrived' && tok.queuePosition === 2;

              return (
                <View
                  key={tok.id}
                  style={[
                    styles.tokenCard,
                    isServing && styles.tokenCardServing,
                    isNext && styles.tokenCardNext,
                  ]}
                >
                  <View style={styles.tokenLeft}>
                    <View
                      style={[
                        styles.tokenBadge,
                        isServing && { backgroundColor: '#DCFCE7' },
                        isNext && { backgroundColor: '#FEF3C7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tokenBadgeText,
                          isServing && { color: '#166534' },
                          isNext && { color: '#92400E' },
                        ]}
                      >
                        {tok.tokenNumber}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.patientName}>{tok.patientName}</Text>
                        {isNext ? (
                          <View style={styles.nextInLineBadge}>
                            <Bell size={10} color="#92400E" />
                            <Text style={styles.nextInLineText}>Turn Next (Reminder Sent)</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.patientMeta}>
                        Patient ID: {tok.patientId} • MRN: {tok.patientMrn || 'N/A'} • Fee: ₹500 (Paid)
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusTag,
                        isServing
                          ? { backgroundColor: '#DCFCE7' }
                          : tok.status === 'completed'
                          ? { backgroundColor: '#E0F2FE' }
                          : { backgroundColor: '#FEF3C7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusTagText,
                          isServing
                            ? { color: '#166534' }
                            : tok.status === 'completed'
                            ? { color: '#0369A1' }
                            : { color: '#92400E' },
                        ]}
                      >
                        {tok.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Token Actions */}
                  {canManageQueue && tok.status !== 'completed' ? (
                    <View style={styles.tokenActions}>
                      <TouchableOpacity
                        style={styles.checkoutBtn}
                        onPress={() => handleCheckOutToken(tok)}
                      >
                        <CheckCircle2 size={14} color="#16A34A" />
                        <Text style={styles.checkoutText}>Check-Out / Complete</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        /* Patient ID & Payment Ledger View */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadQueue(selectedDoctorId);
              }}
              tintColor="#0866C6"
            />
          }
        >
          {/* Ledger Summary Cards */}
          <View style={styles.ledgerSummaryCard}>
            <View style={styles.ledgerHeaderRow}>
              <View>
                <Text style={styles.ledgerSubtitle}>OPD CONSULTATION ACCOUNTS LEDGER</Text>
                <Text style={styles.ledgerTotalAmount}>₹{totalLedgerAmount.toLocaleString('en-IN')}.00</Text>
              </View>
              <View style={styles.realtimeShieldBadge}>
                <ShieldCheck size={16} color="#16A34A" />
                <Text style={styles.realtimeShieldText}>Dual Firebase RTDB Synced</Text>
              </View>
            </View>
            <Text style={styles.ledgerExplainer}>
              Every appointment booking and walk-in token is automatically recorded and tied permanently to the Patient ID & MRN.
            </Text>
          </View>

          {/* Payment Items List */}
          <Text style={styles.sectionHeaderTitle}>Patient Payment Records</Text>
          {payments.map((p) => (
            <View key={p.id} style={styles.paymentCard}>
              <View style={styles.paymentCardHeader}>
                <View style={styles.paymentTokenBadge}>
                  <Text style={styles.paymentTokenText}>{p.tokenNumber || 'TOKEN'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentPatientName}>{p.patientName}</Text>
                  <Text style={styles.paymentPatientMeta}>
                    Patient ID: <Text style={styles.boldText}>{p.patientId}</Text> • MRN: <Text style={styles.boldText}>{p.patientMrn}</Text>
                  </Text>
                </View>
                <View style={styles.paymentAmountBox}>
                  <Text style={styles.paymentAmountText}>₹{p.amount}</Text>
                  <View style={styles.paidPill}>
                    <CheckCircle2 size={10} color="#16A34A" />
                    <Text style={styles.paidPillText}>PAID</Text>
                  </View>
                </View>
              </View>

              <View style={styles.paymentDivider} />

              <View style={styles.paymentCardFooter}>
                <View>
                  <Text style={styles.paymentFooterLabel}>Method & Reference:</Text>
                  <Text style={styles.paymentFooterValue}>
                    {p.paymentMethod} • {p.transactionRef}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.paymentFooterLabel}>Doctor & Dept:</Text>
                  <Text style={styles.paymentFooterValue}>
                    {p.doctorName} ({p.department})
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  issueBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginVertical: 10,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  mainTabBtnActive: {
    backgroundColor: '#0866C6',
  },
  mainTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  mainTabBtnTextActive: {
    color: '#FFFFFF',
  },
  docStrip: {
    paddingHorizontal: 16,
    maxHeight: 44,
    marginBottom: 10,
  },
  docChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    alignSelf: 'center',
  },
  docChipActive: {
    backgroundColor: '#142D4E',
    borderColor: '#142D4E',
  },
  docChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  docChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  engineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 14,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  engineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  engineIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
  },
  engineSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  engineConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  engineBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 4,
  },
  durationPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  durationPillActive: {
    backgroundColor: '#0866C6',
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  durationPillTextActive: {
    color: '#FFFFFF',
  },
  liveConsultationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveConsultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveConsultationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0866C6',
    letterSpacing: 0.5,
  },
  liveConsultationName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0866C6',
    fontVariant: ['tabular-nums'],
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0866C6',
    borderRadius: 3,
  },
  autoAdvanceNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    fontStyle: 'italic',
  },
  engineActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  engineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0866C6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  engineActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  engineActionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  engineActionBtnOutlineText: {
    color: '#0866C6',
    fontSize: 11,
    fontWeight: '700',
  },
  engineActionBtnDoctor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  engineActionBtnDoctorText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    padding: 9,
    borderRadius: 8,
    marginTop: 10,
  },
  logText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0866C6',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#142D4E',
    borderColor: '#142D4E',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  tokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  tokenCardServing: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  tokenCardNext: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tokenBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tokenBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0866C6',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
  },
  nextInLineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  nextInLineText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  patientMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tokenActions: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  // Ledger Styles
  ledgerSummaryCard: {
    backgroundColor: '#142D4E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ledgerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.5,
  },
  ledgerTotalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  realtimeShieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  realtimeShieldText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ADE80',
  },
  ledgerExplainer: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 10,
    lineHeight: 16,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentTokenBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
  },
  paymentTokenText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0866C6',
  },
  paymentPatientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  paymentPatientMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentAmountBox: {
    alignItems: 'flex-end',
  },
  paymentAmountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  paidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  paidPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  paymentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentFooterLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  paymentFooterValue: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    marginTop: 2,
  },
});

export default StaffOPDQueueScreen;
