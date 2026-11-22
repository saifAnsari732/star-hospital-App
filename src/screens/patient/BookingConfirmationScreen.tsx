import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  User,
  CreditCard,
  FileCheck,
  AlertCircle,
} from 'lucide-react-native';
import { useOPDToken } from '../../context/OPDTokenContext';
import { appointmentService } from '../../services/appointmentService';
import { doctorService } from '../../services/doctorService';
import { patientService } from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrencyPKR, resolveEffectivePatientId } from './patientUtils';

export interface BookingConfirmationScreenProps {
  navigation: any;
  route: {
    params?: {
      doctorId?: string;
      doctorName?: string;
      department?: string;
      date?: string;
      time?: string;
      mode?: 'in_person' | 'video';
      appointmentId?: string;
      remarks?: string;
      consultationFee?: number;
    };
  };
}

export const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const { generateToken } = useOPDToken();
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);

  const doctorName = route.params?.doctorName || 'Dr. Amit Sharma';
  const department = route.params?.department || 'General Physician';
  const doctorId = route.params?.doctorId || 'doc-1';
  const date = route.params?.date || '2026-11-15';
  const time = route.params?.time || '09:30 AM';
  const mode = route.params?.mode || 'in_person';
  const patientName = user?.name || 'Patient';
  const [patientMrn, setPatientMrn] = useState<string>(effectivePatientId.toUpperCase());
  const [consultationFee, setConsultationFee] = useState<number>(
    route.params?.consultationFee ?? 1500
  );

  useEffect(() => {
    let active = true;
    patientService
      .getProfile(effectivePatientId)
      .then((profile) => {
        if (active && profile?.mrn) {
          setPatientMrn(profile.mrn);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [effectivePatientId]);

  useEffect(() => {
    if (route.params?.consultationFee) return;
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
  }, [doctorId, route.params?.consultationFee]);

  const [bookingStatus, setBookingStatus] = useState<'booking' | 'confirmed' | 'error'>(
    route.params?.appointmentId ? 'confirmed' : 'booking'
  );
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookedId, setBookedId] = useState<string | undefined>(route.params?.appointmentId);
  const bookingTriggeredRef = useRef<boolean>(false);

  const attemptBooking = useCallback(async () => {
    setBookingStatus('booking');
    setBookingError(null);
    try {
      const created = await appointmentService.bookAppointment({
        patientId: effectivePatientId,
        patientName,
        patientMrn,
        doctorId,
        doctorName,
        date,
        startTime: time,
        mode,
        remarks: route.params?.remarks,
      });
      if (created?.id) {
        setBookedId(created.id);
      }
      setBookingStatus('confirmed');
    } catch (err: any) {
      setBookingError(
        err?.message || 'Unable to confirm appointment slot. Please retry or pick another slot.'
      );
      setBookingStatus('error');
    }
  }, [effectivePatientId, doctorId, date, time, mode, route.params?.remarks]);

  useEffect(() => {
    if (route.params?.appointmentId || bookingTriggeredRef.current) return;
    bookingTriggeredRef.current = true;
    void attemptBooking();
  }, [route.params?.appointmentId, attemptBooking]);

  const bookingReference = bookedId?.toUpperCase() || 'PENDING';

  const handleGetOPDToken = async () => {
    try {
      await generateToken(doctorId, 'first_visit');
      navigation.navigate('OPDToken');
    } catch {
      navigation.navigate('OPDToken');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 3-Step Stepper Header */}
      <View style={styles.stepperContainer}>
        <View style={styles.stepperRow}>
          <View style={styles.stepNodeContainer}>
            <View style={[styles.stepCircle, styles.stepCircleDone]}>
              <Text style={styles.stepCheck}>✓</Text>
            </View>
            <Text style={styles.stepLabelDone}>Select Doctor</Text>
          </View>

          <View style={[styles.stepConnector, styles.stepConnectorDone]} />

          <View style={styles.stepNodeContainer}>
            <View style={[styles.stepCircle, styles.stepCircleDone]}>
              <Text style={styles.stepCheck}>✓</Text>
            </View>
            <Text style={styles.stepLabelDone}>Select Slot</Text>
          </View>

          <View style={[styles.stepConnector, styles.stepConnectorDone]} />

          <View style={styles.stepNodeContainer}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              <Text style={styles.stepNumberActive}>3</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Confirm</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {bookingStatus === 'booking' ? (
          <View style={[styles.summaryCard, { alignItems: 'center', paddingVertical: 38 }]}>
            <ActivityIndicator size="large" color="#0866C6" />
            <Text style={[styles.successTitle, { marginTop: 14, fontSize: 19 }]}>
              Confirming Appointment...
            </Text>
            <Text style={[styles.successSubtitle, { marginTop: 6 }]}>
              Reserving {time} on {date} with {doctorName}.
            </Text>
          </View>
        ) : bookingStatus === 'error' ? (
          <View style={[styles.summaryCard, { alignItems: 'center', paddingVertical: 32 }]}>
            <View style={[styles.successIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <AlertCircle size={48} color="#DC2626" />
            </View>
            <Text style={[styles.successTitle, { color: '#DC2626' }]}>
              Booking Could Not Complete
            </Text>
            <Text style={styles.successSubtitle}>
              {bookingError || 'The selected time slot could not be confirmed.'}
            </Text>
            <View style={[styles.actionsContainer, { width: '100%', marginTop: 20 }]}>
              <TouchableOpacity
                style={styles.opdTokenButton}
                onPress={() => void attemptBooking()}
                activeOpacity={0.85}
              >
                <Text style={styles.opdTokenButtonText}>Retry Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.viewApptsButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Text style={styles.viewApptsButtonText}>Choose Another Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
        {/* Success Icon & Heading */}
        <View style={styles.successHero}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={54} color="#16A34A" strokeWidth={2.2} />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your appointment has been successfully scheduled with {doctorName}.
          </Text>
          <View style={styles.refPill}>
            <Text style={styles.refPillText}>Ref: {bookingReference}</Text>
          </View>
        </View>

        {/* Detailed Booking Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCardHeader}>Appointment Details</Text>

          <View style={styles.detailRow}>
            <User size={18} color="#0866C6" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Patient</Text>
              <Text style={styles.detailValue}>{patientName} (MRN: {patientMrn})</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <FileCheck size={18} color="#0866C6" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Doctor &amp; Department</Text>
              <Text style={styles.detailValue}>{doctorName}</Text>
              <Text style={styles.detailSub}>{department}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.dateTimeSplitRow}>
            <View style={styles.splitCol}>
              <View style={styles.splitHeader}>
                <Calendar size={15} color="#0866C6" />
                <Text style={styles.splitLabel}>Date</Text>
              </View>
              <Text style={styles.splitValue}>{date}</Text>
            </View>

            <View style={styles.verticalSplitLine} />

            <View style={styles.splitCol}>
              <View style={styles.splitHeader}>
                <Clock size={15} color="#0866C6" />
                <Text style={styles.splitLabel}>Time Slot</Text>
              </View>
              <Text style={styles.splitValue}>{time}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <MapPin size={18} color="#0866C6" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Consultation Location</Text>
              <Text style={styles.detailValue}>
                {mode === 'video'
                  ? 'Online Video Consultation'
                  : 'Star Hospital — Outpatient Consultation Wing'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <CreditCard size={18} color="#0866C6" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Fee &amp; Payment</Text>
              <Text style={styles.detailValue}>
                {formatCurrencyPKR(consultationFee)} • Pay at Hospital Reception
              </Text>
            </View>
          </View>
        </View>

        {/* Action CTAs */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.opdTokenButton}
            onPress={handleGetOPDToken}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Get Live OPD Token"
          >
            <Ticket size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.opdTokenButtonText}>Get Live OPD Token</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewApptsButton}
            onPress={() => navigation.navigate('PatientTabs', { screen: 'AppointmentsTab' })}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="View All Appointments"
          >
            <Text style={styles.viewApptsButtonText}>View My Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeLink}
            onPress={() => navigation.navigate('PatientTabs', { screen: 'HomeTab' })}
            accessibilityRole="button"
            accessibilityLabel="Back to Home Dashboard"
          >
            <Text style={styles.homeLinkText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
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
  },
  stepCircleDone: {
    backgroundColor: '#16A34A',
  },
  stepCircleActive: {
    backgroundColor: '#0866C6',
  },
  stepCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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
    paddingVertical: 20,
  },
  successHero: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: '85%',
    lineHeight: 18,
  },
  refPill: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  refPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  summaryCardHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  detailSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  dateTimeSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  splitCol: {
    flex: 1,
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  splitLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 6,
  },
  splitValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  verticalSplitLine: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  opdTokenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0866C6',
    borderRadius: 12,
    height: 50,
  },
  btnIcon: {
    marginRight: 8,
  },
  opdTokenButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  viewApptsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0866C6',
    borderRadius: 12,
    height: 50,
  },
  viewApptsButtonText: {
    color: '#0866C6',
    fontSize: 15,
    fontWeight: '700',
  },
  homeLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  homeLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default BookingConfirmationScreen;
