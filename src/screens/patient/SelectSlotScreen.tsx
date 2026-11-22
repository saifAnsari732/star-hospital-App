import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Video, MapPin, Check } from 'lucide-react-native';
import { CalendarSlotPicker } from '../../components/patient/CalendarSlotPicker';
import { doctorService } from '../../services';
import { getDoctorAvatarSource } from '../../assets/images';

export interface SelectSlotScreenProps {
  navigation: any;
  route: {
    params?: {
      doctorId?: string;
      doctorName?: string;
      department?: string;
    };
  };
}

export const SelectSlotScreen: React.FC<SelectSlotScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const doctorName = route.params?.doctorName || 'Dr. Amit Sharma';
  const department = route.params?.department || 'General Physician';
  const doctorId = route.params?.doctorId || 'doc-1';

  const [selectedDate, setSelectedDate] = useState<string>('2026-11-15');
  const [selectedSlot, setSelectedSlot] = useState<string>('09:30 AM');
  const [consultationMode, setConsultationMode] = useState<'in_person' | 'video'>('in_person');
  const [availableSlots, setAvailableSlots] = useState<string[] | undefined>(undefined);
  const [consultationFee, setConsultationFee] = useState<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    doctorService
      .getDoctorById(doctorId)
      .then((doc) => {
        if (active && doc?.consultationFee) {
          setConsultationFee(doc.consultationFee);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [doctorId]);

  useEffect(() => {
    let active = true;
    doctorService
      .getDoctorSlots(doctorId, selectedDate)
      .then((slots) => {
        if (active && slots && slots.length > 0) {
          setAvailableSlots(slots);
          if (!slots.includes(selectedSlot)) {
            setSelectedSlot(slots[0]);
          }
        }
      })
      .catch(() => {
        // Keep picker's default schedule slots
      });
    return () => {
      active = false;
    };
  }, [doctorId, selectedDate]);

  const handleConfirm = () => {
    navigation.navigate('BookingConfirmation', {
      doctorId,
      doctorName,
      department,
      date: selectedDate,
      time: selectedSlot,
      mode: consultationMode,
      consultationFee,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go Back"
        >
          <ChevronLeft size={24} color="#142D4E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Date &amp; Time</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* 3-Step Horizontal Stepper */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperRow}>
          {/* Step 1 Done */}
          <View style={styles.stepNodeContainer}>
            <View style={[styles.stepCircle, styles.stepCircleDone]}>
              <Check size={14} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text style={styles.stepLabelDone}>Select Doctor</Text>
          </View>

          <View style={[styles.stepConnector, styles.stepConnectorDone]} />

          {/* Step 2 Active */}
          <View style={styles.stepNodeContainer}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepNumberActive}>2</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Select Slot</Text>
          </View>

          <View style={styles.stepConnector} />

          {/* Step 3 Inactive */}
          <View style={styles.stepNodeContainer}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Confirm</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Doctor Summary Header Card */}
        <View style={styles.doctorSummaryCard}>
          <View style={styles.docAvatarCircle}>
            <Image
              source={getDoctorAvatarSource(doctorName || doctorId)}
              style={styles.docAvatarImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.docTextCol}>
            <Text style={styles.docSummaryName}>{doctorName}</Text>
            <Text style={styles.docSummaryDept}>{department} • OPD Room 101</Text>
          </View>
        </View>

        {/* Consultation Mode Picker */}
        <View style={styles.modePickerContainer}>
          <Text style={styles.sectionHeading}>Consultation Type</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                consultationMode === 'in_person' && styles.modeOptionActive,
              ]}
              onPress={() => setConsultationMode('in_person')}
              activeOpacity={0.7}
            >
              <MapPin
                size={18}
                color={consultationMode === 'in_person' ? '#0866C6' : '#64748B'}
              />
              <Text
                style={[
                  styles.modeLabel,
                  consultationMode === 'in_person' && styles.modeLabelActive,
                ]}
              >
                In-Hospital Visit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeOption,
                consultationMode === 'video' && styles.modeOptionActive,
              ]}
              onPress={() => setConsultationMode('video')}
              activeOpacity={0.7}
            >
              <Video
                size={18}
                color={consultationMode === 'video' ? '#0866C6' : '#64748B'}
              />
              <Text
                style={[
                  styles.modeLabel,
                  consultationMode === 'video' && styles.modeLabelActive,
                ]}
              >
                Online Video
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar & Available Slots */}
        <CalendarSlotPicker
          initialDate={selectedDate}
          initialSlot={selectedSlot}
          availableSlots={availableSlots}
          onDateChange={setSelectedDate}
          onSlotChange={setSelectedSlot}
        />
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Proceed to confirmation"
        >
          <Text style={styles.confirmButtonText}>Confirm Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142D4E',
  },
  headerRightSpacer: {
    width: 36,
  },
  stepperContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNodeContainer: {
    alignItems: 'center',
    width: 80,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepCircleDone: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  stepCircleActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepNumberActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  stepLabelDone: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  stepLabelActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
    marginHorizontal: 4,
  },
  stepConnectorDone: {
    backgroundColor: '#16A34A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
  },
  doctorSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  docAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  docAvatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  docTextCol: {
    flex: 1,
  },
  docSummaryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
  },
  docSummaryDept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  modePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  modeOptionActive: {
    borderColor: '#0866C6',
    backgroundColor: '#EBF4FF',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modeLabelActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmButton: {
    backgroundColor: '#0866C6',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default SelectSlotScreen;
