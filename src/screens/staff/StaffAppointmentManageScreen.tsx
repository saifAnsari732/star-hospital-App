import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarPlus,
  Ticket,
  HeartPulse,
  X,
  LogOut,
} from 'lucide-react-native';
import { StarLoader, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { hasStaffPermission } from '../../components/staff/staffPermissions';
import { appointmentService } from '../../services/appointmentService';
import { opdTokenService } from '../../services/opdTokenService';
import { mockAppointments } from '../../fixtures/mockAppointments';
import type { Appointment, AppointmentStatus } from '../../types/appointment';

const RESCHEDULE_SLOTS = [
  '09:30 AM',
  '10:30 AM',
  '11:30 AM',
  '02:00 PM',
  '04:30 PM',
];

export const StaffAppointmentManageScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const designation = user?.designation;
  const canBook = hasStaffPermission(designation, 'appointments:book');
  const canCheckin = hasStaffPermission(designation, 'appointments:checkin');
  const canCheckout = hasStaffPermission(designation, 'appointments:checkout');
  const canVitals = hasStaffPermission(designation, 'vitals:record');

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>(
    'all'
  );

  // Reschedule modal
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('2026-11-16');
  const [newSlot, setNewSlot] = useState('10:30 AM');

  const loadAppointments = useCallback(async () => {
    try {
      const list = await appointmentService.getAppointments();
      setAppointments(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          a.patientName.toLowerCase().includes(q) ||
          a.patientMrn.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [appointments, statusFilter, searchQuery]);

  const handleCheckIn = async (appt: Appointment) => {
    if (!canCheckin) return;
    try {
      await appointmentService.checkInAppointment(appt.id);
      let issuedLabel = appt.tokenNo ? `A-${appt.tokenNo}` : undefined;
      if (!appt.tokenNo) {
        const token = await opdTokenService.generateToken({
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          visitType: 'first_visit',
        });
        issuedLabel = token.tokenNumber;
        const parsedNum = parseInt(token.tokenNumber.replace(/\D/g, ''), 10);
        const fixtureItem = mockAppointments.find((m) => m.id === appt.id);
        if (fixtureItem && !Number.isNaN(parsedNum)) {
          fixtureItem.tokenNo = parsedNum;
        }
      }
      await loadAppointments();
      Alert.alert(
        'Patient Checked In',
        `${appt.patientName} marked Arrived${issuedLabel ? ` with OPD Token ${issuedLabel}` : ''}.`
      );
    } catch {
      Alert.alert('Check-In Failed', 'Could not check in patient. Please try again.');
    }
  };

  const handleCheckOut = async (appt: Appointment) => {
    if (!canCheckout) return;
    try {
      appt.status = 'completed';
      const fixtureItem = mockAppointments.find((m) => m.id === appt.id);
      if (fixtureItem) {
        fixtureItem.status = 'completed';
      }
      try {
        const q = await opdTokenService.getDoctorQueue(appt.doctorId);
        const matchingTok = q.tokens.find(
          (t) =>
            t.patientId === appt.patientId &&
            (t.status === 'arrived' || t.status === 'in_consultation')
        );
        if (matchingTok) {
          await opdTokenService.completeToken(matchingTok.id);
        }
      } catch {}
      await loadAppointments();
      Alert.alert(
        'Patient Checked Out',
        `${appt.patientName} visit with ${appt.doctorName} marked Completed & Checked Out.`
      );
    } catch {
      Alert.alert('Check-Out Failed', 'Could not complete check-out.');
    }
  };

  const handleCancel = (appt: Appointment) => {
    if (!canBook) return;
    Alert.alert(
      'Cancel Appointment',
      `Cancel appointment for ${appt.patientName} with ${appt.doctorName}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Visit',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.cancelAppointment(appt.id);
              await loadAppointments();
            } catch {
              Alert.alert('Cancellation Failed', 'Unable to cancel appointment.');
            }
          },
        },
      ]
    );
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleAppt || !canBook) return;
    try {
      await appointmentService.rescheduleAppointment({
        appointmentId: rescheduleAppt.id,
        newDate: newDate.trim() || '2026-11-16',
        newTimeSlot: newSlot,
      });
      setRescheduleAppt(null);
      await loadAppointments();
      Alert.alert(
        'Appointment Rescheduled',
        `Updated to ${newDate} at ${newSlot}.`
      );
    } catch {
      Alert.alert('Reschedule Failed', 'Could not reschedule this appointment.');
    }
  };

  const getBadgeStyle = (status: AppointmentStatus) => {
    switch (status) {
      case 'arrived':
        return { bg: '#DCFCE7', text: '#166534' };
      case 'completed':
        return { bg: '#E0F2FE', text: '#0369A1' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626' };
      default:
        return { bg: '#EFF6FF', text: '#0866C6' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <ArrowLeft size={22} color="#142D4E" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Appointment Desk</Text>
          <Text style={styles.headerSub}>
            Check-In, Check-Out &amp; Scheduling
          </Text>
        </View>
        {canBook ? (
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation?.navigate?.('StaffBookAppointment')}
          >
            <CalendarPlus size={16} color="#FFFFFF" />
            <Text style={styles.bookBtnText}>Book</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patient, MRN, or doctor..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterStrip}
      >
        {(
          ['all', 'scheduled', 'arrived', 'completed', 'cancelled'] as const
        ).map((st) => {
          const active = statusFilter === st;
          return (
            <TouchableOpacity
              key={st}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {st.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <StarLoader message="Loading appointments..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadAppointments();
              }}
              tintColor="#0866C6"
            />
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              title="No Appointments Matching Filter"
              description="Try clearing search criteria or book a new appointment."
              actionLabel={canBook ? 'Book Appointment' : undefined}
              onAction={
                canBook
                  ? () => navigation?.navigate?.('StaffBookAppointment')
                  : undefined
              }
            />
          ) : (
            filtered.map((appt) => {
              const badge = getBadgeStyle(appt.status);
              return (
                <View key={appt.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientName}>{appt.patientName}</Text>
                      <Text style={styles.meta}>
                        MRN: {appt.patientMrn} | {appt.doctorName}
                      </Text>
                    </View>
                    <View
                      style={[styles.statusBadge, { backgroundColor: badge.bg }]}
                    >
                      <Text
                        style={[styles.statusText, { color: badge.text }]}
                      >
                        {appt.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timeStrip}>
                    <Calendar size={13} color="#0866C6" />
                    <Text style={styles.timeText}>{appt.date}</Text>
                    <Clock size={13} color="#0866C6" />
                    <Text style={styles.timeText}>{appt.timeSlot}</Text>
                    {appt.tokenNo ? (
                      <Text style={styles.tokenText}>
                        | Token #{appt.tokenNo}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.actionsRow}>
                    {canCheckin && appt.status === 'scheduled' ? (
                      <TouchableOpacity
                        style={styles.primaryActionBtn}
                        onPress={() => handleCheckIn(appt)}
                      >
                        <Ticket size={14} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>
                          Check-In &amp; Token
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {canCheckout && appt.status === 'arrived' ? (
                      <TouchableOpacity
                        style={[
                          styles.primaryActionBtn,
                          { backgroundColor: '#16A34A' },
                        ]}
                        onPress={() => handleCheckOut(appt)}
                      >
                        <LogOut size={14} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>Check-Out</Text>
                      </TouchableOpacity>
                    ) : null}

                    {canVitals && appt.status === 'arrived' ? (
                      <TouchableOpacity
                        style={styles.secondaryActionBtn}
                        onPress={() =>
                          navigation?.navigate?.('NurseVitals', {
                            patientId: appt.patientId,
                          })
                        }
                      >
                        <HeartPulse size={14} color="#16A34A" />
                        <Text
                          style={[
                            styles.secondaryActionText,
                            { color: '#16A34A' },
                          ]}
                        >
                          Vitals
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    {appt.status === 'scheduled' && canBook ? (
                      <>
                        <TouchableOpacity
                          style={styles.secondaryActionBtn}
                          onPress={() => {
                            setRescheduleAppt(appt);
                            setNewDate(appt.date);
                            setNewSlot(appt.timeSlot);
                          }}
                        >
                          <Clock size={14} color="#0866C6" />
                          <Text style={styles.secondaryActionText}>
                            Reschedule
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cancelIconBtn}
                          onPress={() => handleCancel(appt)}
                        >
                          <XCircle size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Reschedule Modal */}
      <Modal
        visible={Boolean(rescheduleAppt)}
        transparent
        animationType="slide"
        onRequestClose={() => setRescheduleAppt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Appointment</Text>
              <TouchableOpacity onPress={() => setRescheduleAppt(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>New Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.modalInput}
              value={newDate}
              onChangeText={setNewDate}
            />
            <Text style={styles.fieldLabel}>Select Slot</Text>
            <View style={styles.slotsRow}>
              {RESCHEDULE_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.slotChip,
                    newSlot === slot && styles.slotChipActive,
                  ]}
                  onPress={() => setNewSlot(slot)}
                >
                  <Text
                    style={[
                      styles.slotChipText,
                      newSlot === slot && styles.slotChipTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRescheduleAppt(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmReschedule}
              >
                <Text style={styles.modalConfirmText}>Save Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
  },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0866C6',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#142D4E',
  },
  filterStrip: {
    paddingHorizontal: 16,
    maxHeight: 46,
    marginVertical: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    alignSelf: 'center',
  },
  chipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  meta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
  },
  tokenText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#0866C6',
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  cancelIconBtn: {
    width: 40,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#142D4E',
    marginBottom: 12,
  },
  slotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  slotChipTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default StaffAppointmentManageScreen;
