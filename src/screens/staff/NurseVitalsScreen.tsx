import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  HeartPulse,
  CheckCircle2,
  BedDouble,
  Clock,
  Activity,
  X,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { VitalsInputForm } from '../../components/staff/VitalsInputForm';
import { StaffKpiCard } from '../../components/staff/StaffKpiCard';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { bedService } from '../../services/bedService';
import { patientService } from '../../services/patientService';
import type { Appointment, AppointmentVitals } from '../../types/appointment';

export const NurseVitalsScreen: React.FC<{
  navigation?: any;
  route?: any;
}> = ({ navigation, route }) => {
  const { user } = useAuth();
  const paramPatientId: string | undefined = route?.params?.patientId;
  const paramPatientName: string | undefined = route?.params?.patientName;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [freeBedsCount, setFreeBedsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [filterMode, setFilterMode] = useState<'awaiting' | 'recorded' | 'all'>(
    'all'
  );
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [saving, setSaving] = useState(false);
  const hasAutoOpenedRef = useRef(false);

  const loadTriageData = useCallback(async () => {
    try {
      const [allAppts, availBeds, targetedPatient] = await Promise.all([
        appointmentService.getAppointments(
          paramPatientId ? { patientId: paramPatientId } : undefined
        ),
        bedService.getBeds(undefined, 'available'),
        paramPatientId
          ? patientService.getProfile(paramPatientId).catch(() => null)
          : Promise.resolve(null),
      ]);
      let sorted = [...allAppts].sort((a, b) => {
        if (a.status === 'arrived' && b.status !== 'arrived') return -1;
        if (a.status !== 'arrived' && b.status === 'arrived') return 1;
        return 0;
      });
      if (paramPatientId && sorted.length === 0 && targetedPatient) {
        const nowTime = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        sorted = [
          {
            id: `walkin-${targetedPatient.id}`,
            patientId: targetedPatient.id,
            patientName: targetedPatient.name,
            patientMrn: targetedPatient.mrn,
            doctorId: 'doc-1',
            doctorName: 'OPD Triage Desk',
            doctorDepartment: 'OPD Triage',
            date: new Date().toISOString().split('T')[0],
            timeSlot: 'Walk-in',
            startTime: nowTime,
            endTime: nowTime,
            status: 'arrived',
            mode: 'in_person',
          },
        ];
      }
      setAppointments(sorted);
      setFreeBedsCount(availBeds.length);

      if (paramPatientId && sorted.length > 0 && !hasAutoOpenedRef.current) {
        hasAutoOpenedRef.current = true;
        setSelectedAppt(sorted[0]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [paramPatientId]);

  useEffect(() => {
    loadTriageData();
  }, [loadTriageData]);

  useFocusEffect(
    useCallback(() => {
      loadTriageData();
    }, [loadTriageData])
  );

  const metrics = useMemo(() => {
    const awaiting = appointments.filter((a) => !a.vitals?.bloodPressure).length;
    const recorded = appointments.filter((a) => !!a.vitals?.bloodPressure).length;
    return { awaiting, recorded };
  }, [appointments]);

  const visibleAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (filterMode === 'awaiting') return !a.vitals?.bloodPressure;
      if (filterMode === 'recorded') return !!a.vitals?.bloodPressure;
      return true;
    });
  }, [appointments, filterMode]);

  const handleSaveVitals = async (vitals: AppointmentVitals) => {
    if (!selectedAppt) return;
    setSaving(true);
    try {
      const enriched: AppointmentVitals = {
        ...vitals,
        recordedBy: user?.name || 'Nursing Officer',
        recordedAt: new Date().toISOString(),
      };
      if (selectedAppt.id.startsWith('walkin-')) {
        await patientService.addMedicalHistory({
          patientId: selectedAppt.patientId,
          title: 'Nursing Triage Vitals Recorded',
          description: `BP: ${enriched.bloodPressure}, Pulse: ${enriched.pulse}, Temp: ${enriched.temperature}, SpO2: ${enriched.oxygenSaturation || 'N/A'}`,
          category: 'general',
          date: new Date().toISOString().split('T')[0],
          doctorName: user?.name || 'Nursing Officer',
        });
        const updatedName = selectedAppt.patientName;
        const targetId = selectedAppt.id;
        setAppointments((prev) =>
          prev.map((a) => (a.id === targetId ? { ...a, vitals: enriched } : a))
        );
        setSelectedAppt(null);
        Alert.alert(
          'Vitals Recorded',
          `Triage vitals for ${updatedName} saved to patient record.`
        );
      } else {
        await appointmentService.updateVitals({
          appointmentId: selectedAppt.id,
          vitals: enriched,
        });
        const updatedName = selectedAppt.patientName;
        setSelectedAppt(null);
        await loadTriageData();
        Alert.alert(
          'Vitals Recorded',
          `Triage vitals for ${updatedName} saved and pushed to attending doctor queue.`
        );
      }
    } catch {
      Alert.alert('Save Failed', 'Unable to update patient vitals.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarHeader
          title="Nurse Station & Vitals"
          onBackPress={
            navigation?.canGoBack?.() ? () => navigation.goBack() : undefined
          }
        />
        <StarLoader message="Loading nursing triage queue..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Nurse Dashboard & Vitals"
        subtitle={
          paramPatientName
            ? `Patient: ${paramPatientName}`
            : `${metrics.awaiting} awaiting triage capture`
        }
        onBackPress={
          navigation?.canGoBack?.() ? () => navigation.goBack() : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadTriageData();
            }}
            tintColor="#0866C6"
          />
        }
      >
        {/* Nurse Dashboard Metrics */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Awaiting Vitals"
              value={metrics.awaiting}
              icon={Clock}
              theme="orange"
              onPress={() => setFilterMode('awaiting')}
            />
          </View>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Vitals Recorded"
              value={metrics.recorded}
              icon={CheckCircle2}
              theme="green"
              onPress={() => setFilterMode('recorded')}
            />
          </View>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Free Beds"
              value={freeBedsCount}
              icon={BedDouble}
              theme="blue"
              onPress={() => navigation?.navigate?.('AdmissionBed')}
            />
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(
            [
              { key: 'all', label: `All (${appointments.length})` },
              { key: 'awaiting', label: `Pending (${metrics.awaiting})` },
              { key: 'recorded', label: `Completed (${metrics.recorded})` },
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filterMode === f.key && styles.filterChipActive,
              ]}
              onPress={() => setFilterMode(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filterMode === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Patient Triage Cards */}
        {visibleAppointments.length === 0 ? (
          <EmptyState
            title="No patients matching triage filter"
            description="All checked-in OPD patients have up-to-date vitals."
          />
        ) : (
          visibleAppointments.map((appt) => {
            const hasVitals = !!appt.vitals?.bloodPressure;
            return (
              <View key={appt.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.heartIcon}>
                    <HeartPulse size={20} color="#16A34A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{appt.patientName}</Text>
                    <Text style={styles.patientMeta}>
                      MRN {appt.patientMrn} | {appt.doctorName}
                    </Text>
                    <Text style={styles.slotMeta}>
                      {appt.date} | {appt.timeSlot} |{' '}
                      {appt.status.toUpperCase()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: hasVitals ? '#DCFCE7' : '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: hasVitals ? '#166534' : '#92400E' },
                      ]}
                    >
                      {hasVitals ? 'RECORDED' : 'PENDING'}
                    </Text>
                  </View>
                </View>

                {hasVitals ? (
                  <View style={styles.vitalsSummary}>
                    <View style={styles.vitalPill}>
                      <Activity size={12} color="#0866C6" />
                      <Text style={styles.vitalPillText}>
                        BP: {appt.vitals?.bloodPressure}
                      </Text>
                    </View>
                    {appt.vitals?.pulse ? (
                      <View style={styles.vitalPill}>
                        <Text style={styles.vitalPillText}>
                          HR: {appt.vitals.pulse}
                        </Text>
                      </View>
                    ) : null}
                    {appt.vitals?.temperature ? (
                      <View style={styles.vitalPill}>
                        <Text style={styles.vitalPillText}>
                          Temp: {appt.vitals.temperature}
                        </Text>
                      </View>
                    ) : null}
                    {appt.vitals?.oxygenSaturation ? (
                      <View style={styles.vitalPill}>
                        <Text style={styles.vitalPillText}>
                          SpO2: {appt.vitals.oxygenSaturation}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.captureBtn,
                    hasVitals && styles.captureBtnSecondary,
                  ]}
                  onPress={() => setSelectedAppt(appt)}
                >
                  <HeartPulse
                    size={15}
                    color={hasVitals ? '#0866C6' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.captureBtnText,
                      hasVitals && { color: '#0866C6' },
                    ]}
                  >
                    {hasVitals ? 'Update Patient Vitals' : 'Record Vitals'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Vitals Entry Modal */}
      <Modal
        visible={!!selectedAppt}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAppt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Vitals Entry</Text>
              <TouchableOpacity onPress={() => setSelectedAppt(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {selectedAppt ? (
              <VitalsInputForm
                patientName={`${selectedAppt.patientName} (${selectedAppt.patientMrn})`}
                initialVitals={selectedAppt.vitals}
                isLoading={saving}
                onCancel={() => setSelectedAppt(null)}
                onSave={handleSaveVitals}
              />
            ) : null}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 34,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCell: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heartIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  patientMeta: {
    fontSize: 12,
    color: '#475569',
    marginTop: 1,
  },
  slotMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  vitalsSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  vitalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  vitalPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  captureBtn: {
    marginTop: 12,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  captureBtnSecondary: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  captureBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
});

export default NurseVitalsScreen;
