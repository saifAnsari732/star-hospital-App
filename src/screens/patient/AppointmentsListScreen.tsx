import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, Calendar, AlertCircle } from 'lucide-react-native';
import { AppointmentCard } from '../../components/patient/AppointmentCard';
import { Appointment } from '../../types/appointment';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { resolveEffectivePatientId } from './patientUtils';

export interface AppointmentsListScreenProps {
  navigation: any;
  route?: any;
}

export const AppointmentsListScreen: React.FC<AppointmentsListScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAppointments = useCallback(() => {
    setErrorMsg(null);
    return appointmentService
      .getAppointments({ patientId: effectivePatientId })
      .then((list) => {
        setAppointments(Array.isArray(list) ? list : []);
      })
      .catch((err: any) => {
        setErrorMsg(err?.message || 'Unable to load your appointments.');
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [effectivePatientId]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      setErrorMsg(null);
      appointmentService
        .getAppointments({ patientId: effectivePatientId })
        .then((list) => {
          if (mounted) {
            setAppointments(Array.isArray(list) ? list : []);
          }
        })
        .catch((err: any) => {
          if (mounted) {
            setErrorMsg(err?.message || 'Unable to load your appointments.');
          }
        })
        .finally(() => {
          if (mounted) {
            setLoading(false);
            setRefreshing(false);
          }
        });
      return () => {
        mounted = false;
      };
    }, [effectivePatientId])
  );

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'scheduled' || a.status === 'arrived' || a.status === 'in consultation'
  );

  const pastAppointments = appointments.filter(
    (a) => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no show'
  );

  const handleCancelAppointment = (appointmentId: string) => {
    navigation.navigate('CancelAppointment', { appointmentId });
  };

  const handleReschedule = (appointment: Appointment) => {
    navigation.navigate('RescheduleAppointment', {
      appointmentId: appointment.id,
    });
  };

  const currentList = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;

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
        <Text style={styles.headerTitle}>My Appointments</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Segmented Tab Controls */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'upcoming' && styles.tabButtonActive]}
          onPress={() => setActiveTab('upcoming')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'upcoming' }}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming ({upcomingAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'past' && styles.tabButtonActive]}
          onPress={() => setActiveTab('past')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'past' }}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past ({pastAppointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadAppointments();
            }}
            colors={['#0866C6']}
          />
        }
      >
        {loading && appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#0866C6" />
            <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
              Loading your appointments...
            </Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <AlertCircle size={32} color="#DC2626" />
            </View>
            <Text style={styles.emptyTitle}>Could Not Load Appointments</Text>
            <Text style={styles.emptySubtitle}>{errorMsg}</Text>
            <TouchableOpacity
              style={[styles.bookNewButton, { marginTop: 16, paddingHorizontal: 22 }]}
              onPress={() => {
                setLoading(true);
                void loadAppointments();
              }}
            >
              <Text style={styles.bookNewButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : currentList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Calendar size={32} color="#0866C6" />
            </View>
            <Text style={styles.emptyTitle}>
              No {activeTab === 'upcoming' ? 'Upcoming' : 'Past'} Appointments
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'upcoming'
                ? 'You do not have any scheduled consultations at the moment.'
                : 'Your past consultation history will appear here.'}
            </Text>
          </View>
        ) : (
          currentList.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              showActions={activeTab === 'upcoming'}
              onPress={() =>
                navigation.navigate('AppointmentDetails', { appointmentId: appointment.id })
              }
              onCancelPress={() => handleCancelAppointment(appointment.id)}
              onReschedulePress={() => handleReschedule(appointment)}
            />
          ))
        )}
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.bookNewButton}
          onPress={() => navigation.navigate('BookAppointment')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Book New Appointment"
        >
          <Plus size={18} color="#FFFFFF" style={styles.plusIcon} />
          <Text style={styles.bookNewButtonText}>Book New Appointment</Text>
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0866C6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 90,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
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
  bookNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0866C6',
    borderRadius: 12,
    height: 50,
  },
  plusIcon: {
    marginRight: 8,
  },
  bookNewButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default AppointmentsListScreen;
