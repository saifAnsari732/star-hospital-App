import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Stethoscope,
  Calendar,
  Clock,
  CheckCircle2,
  Video,
  MapPin,
} from 'lucide-react-native';
import { StarHeader, StarLoader } from '../../components/common';
import { patientService } from '../../services/patientService';
import { doctorService } from '../../services/doctorService';
import { appointmentService } from '../../services/appointmentService';
import type { Patient } from '../../types/patient';
import type { Doctor } from '../../types/doctor';
import type { AppointmentMode } from '../../types/appointment';

const BOOKING_DATES = [
  '2026-11-14',
  '2026-11-15',
  '2026-11-16',
  '2026-11-17',
  '2026-11-18',
];

export const StaffBookAppointmentScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const initialPatientId: string | undefined = route?.params?.patientId;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<string[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState(
    initialPatientId || 'pat-1'
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-1');
  const [selectedDate, setSelectedDate] = useState('2026-11-15');
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');
  const [mode, setMode] = useState<AppointmentMode>('in_person');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([patientService.getAllPatients(), doctorService.getAllDoctors()])
      .then(([pats, docs]) => {
        setPatients(pats);
        setDoctors(docs);
        if (initialPatientId) {
          setSelectedPatientId(initialPatientId);
        } else if (pats[0]) {
          setSelectedPatientId(pats[0].id);
        }
        if (docs[0]) {
          setSelectedDoctorId(docs[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [initialPatientId]);

  useEffect(() => {
    doctorService
      .getDoctorSlots(selectedDoctorId, selectedDate)
      .then((available) => {
        setSlots(available);
        if (available.length > 0) {
          setSelectedSlot(available[0]);
        } else {
          setSelectedSlot('');
        }
      })
      .catch(() => {
        const fallback = ['09:00 AM', '10:30 AM', '12:00 PM', '03:00 PM'];
        setSlots(fallback);
        setSelectedSlot(fallback[0]);
      });
  }, [selectedDoctorId, selectedDate]);

  const handleBook = async () => {
    if (!selectedPatientId || !selectedDoctorId || !selectedSlot) {
      Alert.alert(
        'Incomplete Booking',
        'Please select patient, doctor, date, and time slot.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const appt = await appointmentService.bookAppointment({
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        date: selectedDate,
        startTime: selectedSlot,
        timeSlot: selectedSlot,
        mode,
        remarks: remarks.trim() || undefined,
      });

      Alert.alert(
        'Appointment Booked',
        `Confirmed for ${appt.patientName} with ${appt.doctorName} on ${appt.date} at ${appt.timeSlot}.`,
        [
          {
            text: 'Manage Appointments',
            onPress: () => navigation.navigate('StaffAppointmentManage'),
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch {
      Alert.alert('Booking Failed', 'Unable to schedule appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarHeader title="Book Appointment" onBackPress={() => navigation.goBack()} />
        <StarLoader message="Loading doctors & schedules..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Book Appointment"
        subtitle="Reception Desk Scheduler"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Selection */}
        <View style={styles.labelRow}>
          <User size={14} color="#0866C6" />
          <Text style={styles.labelText}>Select Patient</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizRow}
        >
          {patients.map((pat) => {
            const active = selectedPatientId === pat.id;
            return (
              <TouchableOpacity
                key={pat.id}
                style={[styles.selectCard, active && styles.selectCardActive]}
                onPress={() => setSelectedPatientId(pat.id)}
              >
                <Text
                  style={[
                    styles.selectTitle,
                    active && styles.selectTitleActive,
                  ]}
                >
                  {pat.name}
                </Text>
                <Text style={[styles.selectSub, active && { color: '#E0F2FE' }]}>
                  {pat.mrn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Doctor Selection */}
        <View style={styles.labelRow}>
          <Stethoscope size={14} color="#0866C6" />
          <Text style={styles.labelText}>Select Attending Doctor</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizRow}
        >
          {doctors.map((doc) => {
            const active = selectedDoctorId === doc.id;
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.selectCard, active && styles.selectCardActive]}
                onPress={() => setSelectedDoctorId(doc.id)}
              >
                <Text
                  style={[
                    styles.selectTitle,
                    active && styles.selectTitleActive,
                  ]}
                >
                  {doc.name}
                </Text>
                <Text style={[styles.selectSub, active && { color: '#E0F2FE' }]}>
                  {doc.department} | Rs. {doc.consultationFee}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Date Selection */}
        <View style={styles.labelRow}>
          <Calendar size={14} color="#0866C6" />
          <Text style={styles.labelText}>Appointment Date</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizRow}
        >
          {BOOKING_DATES.map((d) => {
            const active = selectedDate === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedDate(d)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time Slots */}
        <View style={styles.labelRow}>
          <Clock size={14} color="#0866C6" />
          <Text style={styles.labelText}>Available Time Slots</Text>
        </View>
        {slots.length === 0 ? (
          <Text style={styles.emptySlotsText}>
            No open slots found for this doctor on {selectedDate}. Select another date or doctor.
          </Text>
        ) : (
        <View style={styles.slotsWrap}>
          {slots.map((slot) => {
            const active = selectedSlot === slot;
            return (
              <TouchableOpacity
                key={slot}
                style={[styles.slotChip, active && styles.slotChipActive]}
                onPress={() => setSelectedSlot(slot)}
              >
                <Text
                  style={[
                    styles.slotChipText,
                    active && styles.slotChipTextActive,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        )}

        {/* Consultation Mode */}
        <Text style={styles.label}>Visit Mode</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[
              styles.modeOption,
              mode === 'in_person' && styles.modeOptionActive,
            ]}
            onPress={() => setMode('in_person')}
          >
            <MapPin
              size={16}
              color={mode === 'in_person' ? '#FFFFFF' : '#475569'}
            />
            <Text
              style={[
                styles.modeOptionText,
                mode === 'in_person' && { color: '#FFFFFF' },
              ]}
            >
              In-Person OPD
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeOption,
              mode === 'video' && styles.modeOptionActive,
            ]}
            onPress={() => setMode('video')}
          >
            <Video size={16} color={mode === 'video' ? '#FFFFFF' : '#475569'} />
            <Text
              style={[
                styles.modeOptionText,
                mode === 'video' && { color: '#FFFFFF' },
              ]}
            >
              Video Consultation
            </Text>
          </TouchableOpacity>
        </View>

        {/* Remarks */}
        <Text style={styles.label}>Visit Reason / Remarks (Optional)</Text>
        <TextInput
          style={styles.remarksInput}
          multiline
          numberOfLines={3}
          placeholder="Symptoms, referral info, or requested review..."
          placeholderTextColor="#94A3B8"
          value={remarks}
          onChangeText={setRemarks}
        />

        <TouchableOpacity
          style={[styles.confirmBtn, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={handleBook}
        >
          <CheckCircle2 size={18} color="#FFFFFF" />
          <Text style={styles.confirmBtnText}>
            {submitting ? 'Scheduling...' : 'Confirm Appointment Booking'}
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 40,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 8,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#142D4E',
  },
  emptySlotsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
    marginTop: 8,
  },
  horizRow: {
    marginBottom: 10,
  },
  selectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    minWidth: 150,
  },
  selectCardActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  selectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  selectTitleActive: {
    color: '#FFFFFF',
  },
  selectSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  slotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  slotChip: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  slotChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  slotChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
  },
  slotChipTextActive: {
    color: '#FFFFFF',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeOptionActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  modeOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  remarksInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 12,
    minHeight: 76,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#142D4E',
    marginBottom: 16,
  },
  confirmBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default StaffBookAppointmentScreen;
