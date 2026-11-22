import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  Clock,
  Save,
  Video,
  Stethoscope,
  User,
  CheckCircle2,
  MapPin,
} from 'lucide-react-native';
import { StarLoader, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import type { Appointment } from '../../types/appointment';

interface DaySlot {
  id: string;
  time: string;
  blocked: boolean;
  booked?: boolean;
}

interface DayAvailabilityConfig {
  morningEnabled: boolean;
  eveningEnabled: boolean;
  slotDuration: number;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DURATIONS = [10, 15, 20, 30];

const CALENDAR_DAYS = [
  { date: '2026-11-14', day: 'Sat', num: '14' },
  { date: '2026-11-15', day: 'Sun', num: '15' },
  { date: '2026-11-16', day: 'Mon', num: '16' },
  { date: '2026-11-17', day: 'Tue', num: '17' },
  { date: '2026-11-18', day: 'Wed', num: '18' },
  { date: '2026-11-19', day: 'Thu', num: '19' },
  { date: '2026-11-20', day: 'Fri', num: '20' },
];

const formatSlotMinutes = (totalMinutes: number): string => {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
};

const generateDaySlots = (
  dayPrefix: string,
  config: DayAvailabilityConfig,
  existingSlots?: DaySlot[]
): DaySlot[] => {
  const prevByTime = new Map((existingSlots || []).map((s) => [s.time, s]));
  const step = Math.max(10, config.slotDuration);
  const generated: DaySlot[] = [];

  if (config.morningEnabled) {
    for (let m = 9 * 60; m < 11 * 60; m += step) {
      const time = formatSlotMinutes(m);
      const prev = prevByTime.get(time);
      const isDefaultMonBooked =
        dayPrefix === 'Mon' && (time === '09:00 AM' || time === '09:30 AM');
      const isDefaultMonBlocked = dayPrefix === 'Mon' && time === '10:15 AM';
      generated.push({
        id: `${dayPrefix}-m-${m}`,
        time,
        blocked: prev ? prev.blocked : isDefaultMonBlocked,
        booked: prev ? prev.booked : isDefaultMonBooked,
      });
    }
  }

  if (config.eveningEnabled) {
    for (let m = 17 * 60; m < 18 * 60; m += step) {
      const time = formatSlotMinutes(m);
      const prev = prevByTime.get(time);
      generated.push({
        id: `${dayPrefix}-e-${m}`,
        time,
        blocked: prev ? prev.blocked : false,
        booked: prev ? prev.booked : false,
      });
    }
  }

  return generated;
};

const createInitialDayConfigs = (): Record<string, DayAvailabilityConfig> => {
  const configs: Record<string, DayAvailabilityConfig> = {};
  DAYS.forEach((d) => {
    configs[d] = {
      morningEnabled: true,
      eveningEnabled: d !== 'Sun',
      slotDuration: 15,
    };
  });
  return configs;
};

export const DoctorScheduleScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const doctorId = user?.id?.startsWith('doc-') ? user.id : 'doc-1';

  const [sectionTab, setSectionTab] = useState<'calendar' | 'availability'>(
    'calendar'
  );
  const [selectedDate, setSelectedDate] = useState('2026-11-14');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Weekly availability state (independent per day)
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [dayConfigs, setDayConfigs] = useState<Record<string, DayAvailabilityConfig>>(
    createInitialDayConfigs
  );
  const [slotsByDay, setSlotsByDay] = useState<Record<string, DaySlot[]>>(() => {
    const configs = createInitialDayConfigs();
    const initial: Record<string, DaySlot[]> = {};
    DAYS.forEach((d) => {
      initial[d] = generateDaySlots(d, configs[d]);
    });
    return initial;
  });

  const loadAppointments = useCallback(async () => {
    try {
      const data = await appointmentService.getAppointments({ doctorId });
      setAppointments(data);
    } catch {
      // keep previously loaded schedule
    } finally {
      setLoadingAppts(false);
      setRefreshing(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  useFocusEffect(
    useCallback(() => {
      loadAppointments();
    }, [loadAppointments])
  );

  const dateAppointments = useMemo(() => {
    return appointments.filter((a) => a.date === selectedDate);
  }, [appointments, selectedDate]);

  const currentConfig = dayConfigs[selectedDay] || {
    morningEnabled: true,
    eveningEnabled: true,
    slotDuration: 15,
  };
  const currentSlots = slotsByDay[selectedDay] || [];

  const updateDayConfig = (patch: Partial<DayAvailabilityConfig>) => {
    const nextConfig: DayAvailabilityConfig = {
      ...currentConfig,
      ...patch,
    };
    setDayConfigs((prev) => ({
      ...prev,
      [selectedDay]: nextConfig,
    }));
    setSlotsByDay((prev) => ({
      ...prev,
      [selectedDay]: generateDaySlots(selectedDay, nextConfig, prev[selectedDay]),
    }));
  };

  const handleToggleSlotBlock = (slotId: string) => {
    setSlotsByDay((prev) => {
      const updated = (prev[selectedDay] || []).map((s) =>
        s.id === slotId && !s.booked ? { ...s, blocked: !s.blocked } : s
      );
      return { ...prev, [selectedDay]: updated };
    });
  };

  const handleSaveSchedule = () => {
    const blockedCount = currentSlots.filter((s) => s.blocked).length;
    const openCount = currentSlots.filter((s) => !s.blocked && !s.booked).length;
    Alert.alert(
      'Schedule Saved',
      `${selectedDay} availability saved (${currentConfig.slotDuration} min slots, ${openCount} open, ${blockedCount} blocked).`
    );
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'arrived':
        return { bg: '#DCFCE7', text: '#16A34A' };
      case 'completed':
        return { bg: '#E0F2FE', text: '#0284C7' };
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
        <Text style={styles.title}>Schedule &amp; Calendar</Text>
        <Text style={styles.sub}>
          Daily Appointment Calendar &amp; Weekly OPD Slots
        </Text>
      </View>

      {/* Top Mode Switch */}
      <View style={styles.modeSwitch}>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            sectionTab === 'calendar' && styles.modeBtnActive,
          ]}
          onPress={() => setSectionTab('calendar')}
        >
          <Calendar
            size={15}
            color={sectionTab === 'calendar' ? '#0866C6' : '#64748B'}
          />
          <Text
            style={[
              styles.modeText,
              sectionTab === 'calendar' && styles.modeTextActive,
            ]}
          >
            Appointment Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeBtn,
            sectionTab === 'availability' && styles.modeBtnActive,
          ]}
          onPress={() => setSectionTab('availability')}
        >
          <Clock
            size={15}
            color={sectionTab === 'availability' ? '#0866C6' : '#64748B'}
          />
          <Text
            style={[
              styles.modeText,
              sectionTab === 'availability' && styles.modeTextActive,
            ]}
          >
            My Availability
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        {sectionTab === 'calendar' ? (
          <>
            {/* Horizontal Date Picker */}
            <Text style={styles.sectionLabel}>November 2026</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dateStrip}
            >
              {CALENDAR_DAYS.map((d) => {
                const active = selectedDate === d.date;
                const count = appointments.filter((a) => a.date === d.date).length;
                return (
                  <TouchableOpacity
                    key={d.date}
                    style={[styles.dateChip, active && styles.dateChipActive]}
                    onPress={() => setSelectedDate(d.date)}
                  >
                    <Text
                      style={[styles.dateDay, active && styles.dateDayActive]}
                    >
                      {d.day}
                    </Text>
                    <Text
                      style={[styles.dateNum, active && styles.dateNumActive]}
                    >
                      {d.num}
                    </Text>
                    {count > 0 ? (
                      <View
                        style={[
                          styles.countDot,
                          active && { backgroundColor: '#FFFFFF' },
                        ]}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.listHeader}>
              <Text style={styles.sectionLabel}>
                Appointments on {selectedDate} ({dateAppointments.length})
              </Text>
            </View>

            {loadingAppts ? (
              <StarLoader message="Loading appointments..." />
            ) : dateAppointments.length === 0 ? (
              <EmptyState
                title="No Appointments Scheduled"
                description="Select another date above or switch to My Availability to open new OPD slots."
              />
            ) : (
              dateAppointments.map((appt) => {
                const st = getStatusColor(appt.status);
                return (
                  <View key={appt.id} style={styles.apptCard}>
                    <View style={styles.apptTop}>
                      <View style={styles.timeBadge}>
                        <Clock size={13} color="#0866C6" />
                        <Text style={styles.timeText}>{appt.timeSlot}</Text>
                      </View>
                      <View style={[styles.statusChip, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.text }]}>
                          {appt.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.apptPatient}>{appt.patientName}</Text>
                    <Text style={styles.apptMeta}>
                      MRN: {appt.patientMrn} |{' '}
                      {appt.mode === 'video'
                        ? 'Tele-Consultation'
                        : 'In-Person OPD'}{' '}
                      {appt.tokenNo ? `| Token #${appt.tokenNo}` : ''}
                    </Text>
                    {appt.remarks ? (
                      <Text style={styles.apptRemarks}>{appt.remarks}</Text>
                    ) : null}

                    <View style={styles.apptActions}>
                      <TouchableOpacity
                        style={styles.apptBtn}
                        onPress={() =>
                          navigation.navigate('PatientDetail', {
                            patientId: appt.patientId,
                          })
                        }
                      >
                        <User size={14} color="#0866C6" />
                        <Text style={styles.apptBtnText}>Patient File</Text>
                      </TouchableOpacity>

                      {appt.mode === 'video' ? (
                        <TouchableOpacity
                          style={[styles.apptBtn, styles.apptBtnPrimary]}
                          onPress={() =>
                            navigation.navigate('VideoConsultation', {
                              appointmentId: appt.id,
                              patientId: appt.patientId,
                              patientName: appt.patientName,
                              patientMrn: appt.patientMrn,
                              roomUrl: appt.videoRoomUrl,
                            })
                          }
                        >
                          <Video size={14} color="#FFFFFF" />
                          <Text style={styles.apptBtnPrimaryText}>
                            Join Video
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.apptBtn, styles.apptBtnPrimary]}
                          onPress={() =>
                            navigation.navigate('Consultation', {
                              appointmentId: appt.id,
                              patientId: appt.patientId,
                              patientName: appt.patientName,
                              patientMrn: appt.patientMrn,
                              vitals: appt.vitals,
                            })
                          }
                        >
                          <Stethoscope size={14} color="#FFFFFF" />
                          <Text style={styles.apptBtnPrimaryText}>
                            Start Consult
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          <>
            {/* Day Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.daysScroll}
            >
              {DAYS.map((day) => {
                const active = selectedDay === day;
                return (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayPill, active && styles.dayPillActive]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayPillText,
                        active && styles.dayPillTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Session Toggles */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>
                {selectedDay} Consultation Sessions
              </Text>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Morning OPD Shift</Text>
                  <Text style={styles.switchSub}>09:00 AM - 01:00 PM</Text>
                </View>
                <Switch
                  value={currentConfig.morningEnabled}
                  onValueChange={(val) => updateDayConfig({ morningEnabled: val })}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={currentConfig.morningEnabled ? '#0866C6' : '#64748B'}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.switchTitle}>Evening OPD Shift</Text>
                  <Text style={styles.switchSub}>05:00 PM - 08:30 PM</Text>
                </View>
                <Switch
                  value={currentConfig.eveningEnabled}
                  onValueChange={(val) => updateDayConfig({ eveningEnabled: val })}
                  trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                  thumbColor={currentConfig.eveningEnabled ? '#0866C6' : '#64748B'}
                />
              </View>
            </View>

            {/* Slot Duration */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>Slot Duration (Minutes)</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    style={[
                      styles.durChip,
                      currentConfig.slotDuration === dur && styles.durChipActive,
                    ]}
                    onPress={() => updateDayConfig({ slotDuration: dur })}
                  >
                    <Text
                      style={[
                        styles.durChipText,
                        currentConfig.slotDuration === dur && styles.durChipTextActive,
                      ]}
                    >
                      {dur} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Individual Slots Grid */}
            <View style={styles.card}>
              <Text style={styles.cardHeading}>
                {selectedDay} Slots (Tap to Block / Unblock)
              </Text>
              {currentSlots.length === 0 ? (
                <Text style={styles.sub}>
                  Enable Morning or Evening OPD Shift above to generate {selectedDay} slots.
                </Text>
              ) : (
              <View style={styles.slotsGrid}>
                {currentSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.slotBox,
                      slot.booked && styles.slotBoxBooked,
                      slot.blocked && styles.slotBoxBlocked,
                    ]}
                    disabled={slot.booked}
                    onPress={() => handleToggleSlotBlock(slot.id)}
                  >
                    <Text
                      style={[
                        styles.slotTime,
                        slot.booked && styles.slotTextBooked,
                        slot.blocked && styles.slotTextBlocked,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    <Text style={styles.slotStatusText}>
                      {slot.booked
                        ? 'Booked'
                        : slot.blocked
                          ? 'Blocked'
                          : 'Open'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.saveScheduleBtn}
              onPress={handleSaveSchedule}
            >
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.saveScheduleText}>Save Availability</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
  },
  sub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modeSwitch: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTextActive: {
    color: '#0866C6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
  },
  dateStrip: {
    marginBottom: 16,
  },
  dateChip: {
    width: 58,
    height: 74,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dateChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  dateDay: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  dateDayActive: {
    color: '#E0F2FE',
  },
  dateNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
    marginTop: 2,
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0866C6',
    marginTop: 4,
  },
  listHeader: {
    marginBottom: 6,
  },
  apptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  apptTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  apptPatient: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
  },
  apptMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  apptRemarks: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  apptActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  apptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  apptBtnPrimary: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  apptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  apptBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  daysScroll: {
    marginBottom: 14,
  },
  dayPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  dayPillActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  dayPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  dayPillTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  switchSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  durChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  durChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  durChipTextActive: {
    color: '#FFFFFF',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBox: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    alignItems: 'center',
  },
  slotBoxBooked: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  slotBoxBlocked: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
  },
  slotTextBooked: {
    color: '#166534',
  },
  slotTextBlocked: {
    color: '#DC2626',
  },
  slotStatusText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  saveScheduleBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveScheduleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});

export default DoctorScheduleScreen;
