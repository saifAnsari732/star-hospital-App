import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Bell,
  PhoneCall,
  Stethoscope,
  Pill,
  ChevronRight,
  Video,
  Settings,
  UserCheck,
  AlertCircle,
} from 'lucide-react-native';
import {
  DoctorKpiCard,
  QueueCallerItem,
  QueuePatientData,
} from '../../components/doctor';
import { StarLoader } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctorService';
import { opdTokenService } from '../../services/opdTokenService';
import { appointmentService } from '../../services/appointmentService';
import { patientService } from '../../services/patientService';
import { notificationService } from '../../services/notificationService';
import type { Doctor } from '../../types/doctor';
import type { OPDToken } from '../../types/opdToken';
import { getDoctorAvatarSource } from '../../assets/images';

const mapTokenToQueuePatient = (
  t: OPDToken,
  idx: number
): QueuePatientData => {
  return {
    id: t.id,
    tokenNumber: t.tokenNumber,
    patientId: t.patientId,
    patientName: t.patientName,
    patientMrn: t.patientMrn,
    department: t.department,
    arrivedAt: t.generatedAt
      ? new Date(t.generatedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '09:30 AM',
    waitTimeMinutes: t.estimatedWaitMinutes,
    status: t.status,
    vitals: {
      bp: '122/80',
      pulse: '76',
      temp: '98.6',
      weight: '70 kg',
    },
    chiefComplaint:
      idx === 0
        ? `${t.department} Follow-up`
        : `${t.department} OPD Consultation`,
  };
};

export const DoctorDashboardScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [queue, setQueue] = useState<QueuePatientData[]>([]);
  const [todayApptCount, setTodayApptCount] = useState(0);
  const [totalPatientsCount, setTotalPatientsCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [actionBusy, setActionBusy] = useState(false);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const doctorId = 'doc-1';
      const [docProfile, queueView, appts, allPatients, notifs] =
        await Promise.all([
          doctorService.getDoctorById(doctorId),
          opdTokenService.getDoctorQueue(doctorId),
          appointmentService.getAppointments({ doctorId }),
          patientService.getAllPatients(),
          notificationService.getNotifications(),
        ]);

      setDoctor(docProfile);
      setQueue(queueView.tokens.map(mapTokenToQueuePatient));
      setTodayApptCount(appts.length);
      setTotalPatientsCount(allPatients.length);
      setUnreadNotifications(notifs.filter((n) => !n.read).length);
    } catch {
      setError('Could not refresh Doctor Dashboard. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const activePatient = queue.find((q) => q.status === 'in_consultation');
  const nextWaiting = queue.find((q) => q.status === 'arrived');
  const waitingCount = queue.filter((q) => q.status === 'arrived').length;
  const completedCount = queue.filter((q) => q.status === 'completed').length;

  const handleCallNext = async () => {
    setActionBusy(true);
    try {
      await opdTokenService.callNextToken(doctor?.id || 'doc-1');
      await loadDashboard();
    } catch {
      setError('Failed to advance OPD queue.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleCompleteCurrent = async () => {
    if (!activePatient) return;
    setActionBusy(true);
    try {
      await opdTokenService.completeToken(activePatient.id);
      await loadDashboard();
    } catch {
      setError('Failed to complete current consultation.');
    } finally {
      setActionBusy(false);
    }
  };

  if (loading && !doctor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarLoader message="Loading Doctor Workspace..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0866C6"
          />
        }
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.doctorProfileLeft}>
            <View style={styles.avatarContainer}>
              <Image
                source={getDoctorAvatarSource(user?.name || doctor?.name || doctor?.id)}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <View style={styles.onlineDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeLabel}>Welcome back,</Text>
              <Text style={styles.doctorName} numberOfLines={1}>
                {user?.name || doctor?.name || 'Dr. Amit Sharma'}
              </Text>
              <Text style={styles.doctorSub} numberOfLines={1}>
                {doctor?.department || 'General Physician'} |{' '}
                {doctor?.roomNo || 'OPD Room 101'}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('DoctorSettings')}
              accessibilityLabel="Doctor settings"
            >
              <Settings size={20} color="#142D4E" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate('DoctorNotifications')}
              accessibilityLabel="Clinical notifications"
            >
              <Bell size={20} color="#142D4E" />
              {unreadNotifications > 0 ? (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifications}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#DC2626" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* KPI Cards Row (2x2 Grid) */}
        <View style={styles.kpiRow}>
          <DoctorKpiCard
            title="Today's Appointments"
            value={todayApptCount}
            subtitle="Scheduled & OPD"
            color="blue"
            icon={<Calendar size={18} color="#0866C6" />}
            onPress={() =>
              navigation.navigate('DoctorTabs', { screen: 'ScheduleTab' })
            }
          />
          <DoctorKpiCard
            title="Waiting Patients"
            value={waitingCount}
            subtitle={nextWaiting ? `Next: ${nextWaiting.tokenNumber}` : 'Queue clear'}
            color="orange"
            icon={<Clock size={18} color="#EA580C" />}
            onPress={() => navigation.navigate('OPDQueueCaller')}
          />
        </View>
        <View style={styles.kpiRow}>
          <DoctorKpiCard
            title="Total Patients"
            value={totalPatientsCount}
            subtitle="Registered roster"
            color="teal"
            icon={<Users size={18} color="#0F766E" />}
            onPress={() =>
              navigation.navigate('DoctorTabs', { screen: 'PatientsTab' })
            }
          />
          <DoctorKpiCard
            title="Completed Consults"
            value={completedCount}
            subtitle="Today's visits"
            color="green"
            icon={<CheckCircle2 size={18} color="#16A34A" />}
            onPress={() => navigation.navigate('OPDQueueCaller')}
          />
        </View>

        {/* Current Consultation or Next Patient Hero Card */}
        {activePatient ? (
          <View style={styles.activeConsultCard}>
            <View style={styles.activeTopBar}>
              <View style={styles.servingBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.servingBadgeText}>NOW IN CONSULTATION</Text>
              </View>
              <Text style={styles.activeTokenText}>
                {activePatient.tokenNumber}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('PatientDetail', {
                  patientId: activePatient.patientId || 'pat-1',
                })
              }
            >
              <Text style={styles.activePatientName}>
                {activePatient.patientName}
              </Text>
              <Text style={styles.activeComplaint}>
                {activePatient.patientMrn
                  ? `MRN ${activePatient.patientMrn}`
                  : 'OPD Visit'}{' '}
                | {activePatient.chiefComplaint}
              </Text>
            </TouchableOpacity>

            <View style={styles.activeActionsRow}>
              <TouchableOpacity
                style={styles.openNotesBtn}
                onPress={() =>
                  navigation.navigate('Consultation', {
                    tokenId: activePatient.id,
                    tokenNumber: activePatient.tokenNumber,
                    patientId: activePatient.patientId || 'pat-1',
                    patientName: activePatient.patientName,
                    vitals: activePatient.vitals,
                  })
                }
              >
                <Stethoscope size={16} color="#FFFFFF" />
                <Text style={styles.openNotesText}>Clinical Exam & Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rxSmallBtn}
                onPress={() =>
                  navigation.navigate('PrescriptionBuilder', {
                    patientId: activePatient.patientId || 'pat-1',
                    patientName: activePatient.patientName,
                  })
                }
              >
                <Pill size={16} color="#0866C6" />
                <Text style={styles.rxSmallText}>Rx</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.doneSmallBtn}
                disabled={actionBusy}
                onPress={handleCompleteCurrent}
              >
                <CheckCircle2 size={18} color="#16A34A" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.idleCard}>
            <Stethoscope size={28} color="#0866C6" />
            <Text style={styles.idleTitle}>Consultation Room Ready</Text>
            <Text style={styles.idleSub}>
              {nextWaiting
                ? `Next Patient Waiting: ${nextWaiting.patientName} (${nextWaiting.tokenNumber})`
                : 'No waiting tokens right now'}
            </Text>
            {nextWaiting ? (
              <TouchableOpacity
                style={styles.callNextInlineButton}
                disabled={actionBusy}
                onPress={handleCallNext}
              >
                <PhoneCall size={16} color="#FFFFFF" />
                <Text style={styles.callNextInlineText}>
                  {actionBusy ? 'Calling...' : 'Call Next Patient'}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>Clinical Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('OPDQueueCaller')}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}
            >
              <PhoneCall size={20} color="#0866C6" />
            </View>
            <Text style={styles.quickActionLabel}>OPD Queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() =>
              navigation.navigate('Consultation', {
                patientId:
                  activePatient?.patientId || nextWaiting?.patientId || 'pat-1',
                patientName:
                  activePatient?.patientName || nextWaiting?.patientName,
              })
            }
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}
            >
              <Stethoscope size={20} color="#16A34A" />
            </View>
            <Text style={styles.quickActionLabel}>Start Consult</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() =>
              navigation.navigate('PrescriptionBuilder', {
                patientId:
                  activePatient?.patientId || nextWaiting?.patientId || 'pat-1',
                patientName:
                  activePatient?.patientName || nextWaiting?.patientName,
              })
            }
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}
            >
              <Pill size={20} color="#D97706" />
            </View>
            <Text style={styles.quickActionLabel}>Write Rx</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() =>
              navigation.navigate('VideoConsultation', {
                patientId:
                  activePatient?.patientId || nextWaiting?.patientId || 'pat-1',
                patientName:
                  activePatient?.patientName || nextWaiting?.patientName,
              })
            }
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}
            >
              <Video size={20} color="#7C3AED" />
            </View>
            <Text style={styles.quickActionLabel}>Video Consult</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() =>
              navigation.navigate('DoctorTabs', { screen: 'PatientsTab' })
            }
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}
            >
              <UserCheck size={20} color="#0284C7" />
            </View>
            <Text style={styles.quickActionLabel}>Patients</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() =>
              navigation.navigate('DoctorTabs', { screen: 'ScheduleTab' })
            }
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: '#FFE4E6' }]}
            >
              <Calendar size={20} color="#E11D48" />
            </View>
            <Text style={styles.quickActionLabel}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Live OPD Queue Preview */}
        <View style={styles.queueHeaderRow}>
          <Text style={styles.sectionTitle}>Today&apos;s OPD Queue</Text>
          <TouchableOpacity
            style={styles.viewAllQueueLink}
            onPress={() => navigation.navigate('OPDQueueCaller')}
          >
            <Text style={styles.viewAllQueueText}>Open Caller</Text>
            <ChevronRight size={15} color="#0866C6" />
          </TouchableOpacity>
        </View>

        <View style={styles.queueListContainer}>
          {queue.length === 0 ? (
            <View style={styles.emptyQueueCard}>
              <Users size={28} color="#94A3B8" />
              <Text style={styles.emptyQueueTitle}>OPD Queue is Empty</Text>
              <Text style={styles.emptyQueueSubtitle}>
                No checked-in tokens pending for this session.
              </Text>
            </View>
          ) : (
            queue.slice(0, 4).map((item) => (
              <QueueCallerItem
                key={item.id}
                item={item}
                isCurrentlyServing={item.status === 'in_consultation'}
                onCallPatient={() => navigation.navigate('OPDQueueCaller')}
                onOpenNotes={() =>
                  navigation.navigate('Consultation', {
                    tokenId: item.id,
                    tokenNumber: item.tokenNumber,
                    patientId: item.patientId || 'pat-1',
                    patientName: item.patientName,
                    patientMrn: item.patientMrn,
                    vitals: item.vitals,
                  })
                }
                onCompletePatient={() => handleCompleteCurrent()}
              />
            ))
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  doctorProfileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  welcomeLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  doctorName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  doctorSub: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  notifBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  activeConsultCard: {
    backgroundColor: '#0A3B74',
    borderRadius: 20,
    padding: 18,
    marginTop: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  activeTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  servingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  servingBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  activeTokenText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#7DD3FC',
    letterSpacing: 0.5,
  },
  activePatientName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  activeComplaint: {
    fontSize: 12.5,
    color: 'rgba(224, 242, 254, 0.9)',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 14,
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  openNotesBtn: {
    flex: 1,
    backgroundColor: '#0866C6',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  openNotesText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  rxSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  rxSmallText: {
    color: '#0866C6',
    fontWeight: '800',
    fontSize: 13.5,
  },
  doneSmallBtn: {
    backgroundColor: '#DCFCE7',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  idleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    marginBottom: 18,
  },
  idleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
    marginTop: 8,
  },
  idleSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  callNextInlineButton: {
    backgroundColor: '#0866C6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
  },
  callNextInlineText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  quickActionCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#142D4E',
    textAlign: 'center',
  },
  queueHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  viewAllQueueLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllQueueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0866C6',
  },
  queueListContainer: {},
  emptyQueueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyQueueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 8,
  },
  emptyQueueSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default DoctorDashboardScreen;
