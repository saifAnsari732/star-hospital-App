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
        title="OPD Queue &amp; Ledger"
        subtitle="Real-time Patient Queue &amp; Collections"
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
      {/* Segmented Control Bar */}
      <View style={styles.mainTabRow}>
        <TouchableOpacity
          style={[styles.mainTabBtn, activeMainTab === 'queue' && styles.mainTabBtnActive]}
          onPress={() => setActiveMainTab('queue')}
          activeOpacity={0.8}
        >
          <Users size={14} color={activeMainTab === 'queue' ? '#0866C6' : '#64748B'} />
          <Text style={[styles.mainTabBtnText, activeMainTab === 'queue' && styles.mainTabBtnTextActive]}>
            OPD Live Queue
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeMainTab === 'payments' && styles.mainTabBtnActive]}
          onPress={() => setActiveMainTab('payments')}
          activeOpacity={0.8}
        >
          <CreditCard size={14} color={activeMainTab === 'payments' ? '#0866C6' : '#64748B'} />
          <Text style={[styles.mainTabBtnText, activeMainTab === 'payments' && styles.mainTabBtnTextActive]}>
            Payment Ledger
          </Text>
        </TouchableOpacity>
      </View>

      {/* Doctor Filter Horizontal Chips */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.docStripContent}
        >
          {doctors.map((d) => {
            const active = selectedDoctorId === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.docChip, active && styles.docChipActive]}
                onPress={() => setSelectedDoctorId(d.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.docChipText, active && styles.docChipTextActive]}>
                  {d.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
          {/* Beautiful Modern Autonomous OPD Control Engine Card */}
          <View style={styles.engineCard}>
            {/* Top Engine Title & Toggle */}
            <View style={styles.engineHeader}>
              <View style={styles.engineTitleRow}>
                <View style={styles.engineIconCircle}>
                  <Bot size={20} color="#0866C6" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.engineTitle}>Autonomous OPD Engine</Text>
                    <View style={[styles.pulseDot, { backgroundColor: isAutonomousActive ? '#16A34A' : '#94A3B8' }]} />
                  </View>
                  <Text style={styles.engineSubtitle}>
                    {isAutonomousActive ? 'AI Auto-Call & Voice Active' : 'Manual Operation Mode'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isAutonomousActive}
                onValueChange={(val) => setIsAutonomousActive(val)}
                trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
                thumbColor={isAutonomousActive ? '#0866C6' : '#94A3B8'}
              />
            </View>

            {/* Slot Limit Duration Pills */}
            <View style={styles.engineConfigRow}>
              <Text style={styles.durationLabel}>Consultation Limit:</Text>
              <View style={styles.durationSelector}>
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
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.durationPillText,
                        slotDurationMinutes === m && styles.durationPillTextActive,
                      ]}
                    >
                      {m} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Now Serving Chamber Box (Hero Card) */}
            <View style={styles.liveConsultationBox}>
              <View style={styles.liveConsultationHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.liveConsultationLabel}>CURRENT CONSULTATION</Text>
                  <Text style={styles.liveConsultationName} numberOfLines={1}>
                    {activeConsultationToken
                      ? `${activeConsultationToken.tokenNumber} • ${activeConsultationToken.patientName}`
                      : 'Chamber Idle • Waiting for Call'}
                  </Text>
                </View>
                <View style={styles.timerBadge}>
                  <Clock size={13} color="#0866C6" />
                  <Text style={styles.timerText}>{formatTimer(remainingSeconds)}</Text>
                </View>
              </View>

              {/* Smooth Animated Progress Bar */}
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

              {/* Action Buttons Grid (Clean 2x2 Layout) */}
              <View style={styles.engineActionsRow}>
                <TouchableOpacity
                  style={[styles.engineActionBtn, { flex: 1 }]}
                  onPress={handleCallNext}
                  activeOpacity={0.8}
                >
                  <PhoneCall size={14} color="#FFFFFF" />
                  <Text style={styles.engineActionBtnText}>Call Next</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.engineActionBtnOutline, { flex: 1 }]}
                  onPress={handleExtendFiveMins}
                  activeOpacity={0.8}
                >
                  <Clock size={14} color="#0866C6" />
                  <Text style={styles.engineActionBtnOutlineText}>+5 Mins</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.engineActionBtnOutline, { flex: 1 }]}
                  onPress={handleTestVoiceAnnouncement}
                  activeOpacity={0.8}
                >
                  <Volume2 size={14} color="#0866C6" />
                  <Text style={styles.engineActionBtnOutlineText}>Hindi Voice</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.engineActionBtnDoctor, { flex: 1 }]}
                  onPress={handleDoctorDutyArrivalAnnouncement}
                  activeOpacity={0.8}
                >
                  <Sparkles size={14} color="#B45309" />
                  <Text style={styles.engineActionBtnDoctorText}>Arrived</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Realtime Hindi Voice Announcement Notification Banner */}
            {voiceAnnouncementLog ? (
              <View style={styles.logCard}>
                <Volume2 size={16} color="#15803D" />
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
          {/* Premium Modern Ledger Summary Card */}
          <View style={styles.ledgerSummaryCard}>
            <View style={styles.ledgerHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CreditCard size={14} color="#93C5FD" />
                  <Text style={styles.ledgerSubtitle}>CONSULTATION COLLECTIONS</Text>
                </View>
                <Text style={styles.ledgerTotalAmount}>₹{totalLedgerAmount.toLocaleString('en-IN')}.00</Text>
              </View>
              <View style={styles.realtimeShieldBadge}>
                <ShieldCheck size={13} color="#4ADE80" />
                <Text style={styles.realtimeShieldText}>Live Ledger</Text>
              </View>
            </View>
            <View style={styles.ledgerDivider} />
            <View style={styles.ledgerMetricsRow}>
              <View style={styles.ledgerMetricCol}>
                <Text style={styles.ledgerMetricSubLabel}>TRANSACTIONS</Text>
                <Text style={styles.ledgerMetricVal}>{payments.length}</Text>
              </View>
              <View style={styles.ledgerMetricDivider} />
              <View style={styles.ledgerMetricCol}>
                <Text style={styles.ledgerMetricSubLabel}>AVG / PATIENT</Text>
                <Text style={styles.ledgerMetricVal}>₹{payments.length ? Math.round(totalLedgerAmount / payments.length) : 0}</Text>
              </View>
              <View style={styles.ledgerMetricDivider} />
              <View style={styles.ledgerMetricCol}>
                <Text style={styles.ledgerMetricSubLabel}>SETTLEMENT</Text>
                <Text style={[styles.ledgerMetricVal, { color: '#4ADE80' }]}>100%</Text>
              </View>
            </View>
          </View>

          {/* Payment Items List Header */}
          <View style={styles.ledgerListHeader}>
            <Text style={styles.sectionHeaderTitle}>Patient Payment Records</Text>
            <View style={styles.recordsCountBadge}>
              <Text style={styles.recordsCountText}>{payments.length} Records</Text>
            </View>
          </View>

          {payments.map((p) => (
            <View key={p.id} style={styles.paymentCard}>
              <View style={styles.paymentCardHeader}>
                <View style={styles.paymentTokenBadge}>
                  <Text style={styles.paymentTokenText}>{p.tokenNumber || 'TOKEN'}</Text>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 4 }}>
                  <Text style={styles.paymentPatientName}>{p.patientName}</Text>
                  <Text style={styles.paymentPatientMeta}>
                    ID: <Text style={styles.boldText}>{p.patientId}</Text>  •  MRN: <Text style={styles.boldText}>{p.patientMrn}</Text>
                  </Text>
                </View>
                <View style={styles.paymentAmountBox}>
                  <Text style={styles.paymentAmountText}>₹{p.amount}</Text>
                  <View style={styles.paidPill}>
                    <CheckCircle2 size={10} color="#15803D" />
                    <Text style={styles.paidPillText}>PAID</Text>
                  </View>
                </View>
              </View>

              <View style={styles.paymentDivider} />

              {/* Clean Structured Footer Details */}
              <View style={styles.paymentDetailsContainer}>
                <View style={styles.paymentDetailRow}>
                  <Text style={styles.paymentFooterLabel}>PAYMENT METHOD</Text>
                  <View style={styles.methodBadge}>
                    <CreditCard size={11} color="#0866C6" />
                    <Text style={styles.methodBadgeText}>{p.paymentMethod}</Text>
                  </View>
                </View>

                <View style={styles.paymentDetailRow}>
                  <Text style={styles.paymentFooterLabel}>TRANSACTION REF</Text>
                  <Text style={styles.txRefMono}>
                    {p.transactionRef}
                  </Text>
                </View>

                <View style={styles.paymentDetailRow}>
                  <Text style={styles.paymentFooterLabel}>ATTENDING DOCTOR</Text>
                  <Text style={styles.attendingDoctorText}>
                    {p.doctorName}
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
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
    backgroundColor: 'transparent',
  },
  mainTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mainTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  mainTabBtnTextActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  docStripContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  docChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  docChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  docChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  engineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  engineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  engineSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
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
  durationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  durationPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  durationPillActive: {
    backgroundColor: '#0866C6',
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  durationPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  liveConsultationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveConsultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  liveConsultationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0866C6',
    letterSpacing: 0.6,
  },
  liveConsultationName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0866C6',
    fontVariant: ['tabular-nums'],
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0866C6',
    borderRadius: 3,
  },
  engineActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  engineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0866C6',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  engineActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  engineActionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  engineActionBtnOutlineText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  engineActionBtnDoctor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  engineActionBtnDoctorText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
  logCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  logText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
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
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
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
    color: '#0F172A',
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
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  ledgerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.8,
  },
  ledgerTotalAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  realtimeShieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
  },
  realtimeShieldText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ADE80',
  },
  ledgerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 14,
  },
  ledgerMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ledgerMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  ledgerMetricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  ledgerMetricSubLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  ledgerMetricVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  ledgerListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordsCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recordsCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentTokenBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  paymentTokenText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
  },
  paymentPatientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  paymentPatientMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: '#334155',
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
    borderRadius: 6,
    marginTop: 2,
  },
  paidPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  paymentDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  paymentDetailsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  paymentDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentFooterLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  methodBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0866C6',
  },
  txRefMono: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  attendingDoctorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
});

export default StaffOPDQueueScreen;
