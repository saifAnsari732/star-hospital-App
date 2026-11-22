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
  BedDouble,
  LogOut,
  X,
  UserPlus,
} from 'lucide-react-native';
import { BedGridItem } from '../../components/staff/BedGridItem';
import { StarLoader, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { hasStaffPermission } from '../../components/staff/staffPermissions';
import { bedService } from '../../services/bedService';
import { patientService } from '../../services/patientService';
import { doctorService } from '../../services/doctorService';
import type { BedStatus, HospitalBed, WardSummary } from '../../types/bed';
import type { Patient } from '../../types/patient';
import type { Doctor } from '../../types/doctor';

const WARD_FILTERS = ['All', 'General', 'ICU', 'CCU', 'Private', 'Emergency'];

export const BedAdmissionScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const canAdmit = hasStaffPermission(user?.designation, 'beds:admit');
  const canDischarge = hasStaffPermission(user?.designation, 'beds:discharge');

  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [wards, setWards] = useState<WardSummary[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedWard, setSelectedWard] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'all' | BedStatus>('all');

  // Admit Modal
  const [admitBed, setAdmitBed] = useState<HospitalBed | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState('pat-1');
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-1');
  const [admitDiagnosis, setAdmitDiagnosis] = useState('');
  const [admitting, setAdmitting] = useState(false);

  const loadBedData = useCallback(async () => {
    try {
      const [allBeds, wardSums, allPats, allDocs] = await Promise.all([
        bedService.getBeds(),
        bedService.getWardSummaries(),
        patientService.getAllPatients(),
        doctorService.getAllDoctors(),
      ]);
      setBeds(allBeds);
      setWards(wardSums);
      setPatients(allPats);
      setDoctors(allDocs);
      setSelectedPatientId((prev) =>
        allPats.some((p) => p.id === prev) ? prev : allPats[0]?.id || prev
      );
      setSelectedDoctorId((prev) =>
        allDocs.some((d) => d.id === prev) ? prev : allDocs[0]?.id || prev
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBedData();
  }, [loadBedData]);

  useFocusEffect(
    useCallback(() => {
      loadBedData();
    }, [loadBedData])
  );

  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      if (selectedWard !== 'All' && b.category !== selectedWard) return false;
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      return true;
    });
  }, [beds, selectedWard, statusFilter]);

  const counts = useMemo(() => {
    const total = beds.length;
    const avail = beds.filter((b) => b.status === 'available').length;
    const occ = beds.filter((b) => b.status === 'occupied').length;
    return { total, avail, occ };
  }, [beds]);

  const handleConfirmAdmission = async () => {
    if (!admitBed) return;
    if (!admitDiagnosis.trim()) {
      Alert.alert(
        'Diagnosis Required',
        'Please specify an admitting diagnosis.'
      );
      return;
    }
    setAdmitting(true);
    try {
      await bedService.admitPatient({
        bedId: admitBed.id,
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        diagnosis: admitDiagnosis.trim(),
      });
      setAdmitBed(null);
      setAdmitDiagnosis('');
      await loadBedData();
      Alert.alert(
        'Admission Confirmed',
        `Patient admitted to bed ${admitBed.bedNumber}.`
      );
    } catch {
      Alert.alert('Admission Error', 'Could not complete bed admission.');
    } finally {
      setAdmitting(false);
    }
  };

  const handleQuickDischarge = (bed: HospitalBed) => {
    if (!canDischarge || !bed.currentPatient) return;
    Alert.alert(
      'Discharge Patient',
      `Discharge ${bed.currentPatient.patientName} from Bed ${bed.bedNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Discharge Desk',
          onPress: () => navigation?.navigate?.('StaffDischarge'),
        },
        {
          text: 'Quick Release',
          style: 'destructive',
          onPress: async () => {
            try {
              await bedService.dischargePatient({
                bedId: bed.id,
                patientId: bed.currentPatient!.patientId,
              });
              await loadBedData();
            } catch {
              Alert.alert(
                'Discharge Failed',
                'Could not release bed right now. Please try again.'
              );
            }
          },
        },
      ]
    );
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
          <Text style={styles.headerTitle}>
            {canAdmit ? 'Ward & Admissions' : 'Bed Availability'}
          </Text>
          <Text style={styles.headerSub}>
            {counts.avail} Free / {counts.occ} Occupied ({counts.total} Total)
          </Text>
        </View>
        {canDischarge ? (
          <TouchableOpacity
            style={styles.dischargeNavBtn}
            onPress={() => navigation?.navigate?.('StaffDischarge')}
          >
            <LogOut size={15} color="#DC2626" />
            <Text style={styles.dischargeNavText}>Discharge</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadBedData();
            }}
            tintColor="#0866C6"
          />
        }
      >
        {/* Ward Occupancy Summary Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.wardSummaryStrip}
        >
          {wards.map((w) => (
            <View key={w.wardName} style={styles.wardCard}>
              <Text style={styles.wardName}>{w.wardName}</Text>
              <Text style={styles.wardAvailability}>
                {w.availableBeds} Free / {w.totalBeds} Beds
              </Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, w.occupancyRate)}%` },
                  ]}
                />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Ward Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChipsScroll}
        >
          {WARD_FILTERS.map((cat) => {
            const active = selectedWard === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedWard(cat)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status Filter */}
        <View style={styles.statusTabs}>
          {(['all', 'available', 'occupied', 'maintenance'] as const).map(
            (st) => {
              const active = statusFilter === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.statusTab, active && styles.statusTabActive]}
                  onPress={() => setStatusFilter(st)}
                >
                  <Text
                    style={[
                      styles.statusTabText,
                      active && styles.statusTabTextActive,
                    ]}
                  >
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {loading ? (
          <StarLoader message="Loading hospital bed matrix..." />
        ) : filteredBeds.length === 0 ? (
          <EmptyState
            title="No Matching Beds"
            description="Adjust ward category or status filters to view beds."
          />
        ) : (
          filteredBeds.map((bed) => (
            <BedGridItem
              key={bed.id}
              bed={bed}
              onAdmit={canAdmit ? (b) => setAdmitBed(b) : undefined}
              onDischarge={canDischarge ? handleQuickDischarge : undefined}
            />
          ))
        )}
      </ScrollView>

      {/* Admit Patient Modal */}
      <Modal
        visible={Boolean(admitBed)}
        transparent
        animationType="slide"
        onRequestClose={() => setAdmitBed(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>
                Admit to Bed {admitBed?.bedNumber}
              </Text>
              <TouchableOpacity onPress={() => setAdmitBed(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Select Patient</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {patients.map((p) => {
                const active = selectedPatientId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.pickPill, active && styles.pickPillActive]}
                    onPress={() => setSelectedPatientId(p.id)}
                  >
                    <Text
                      style={[
                        styles.pickPillText,
                        active && { color: '#FFFFFF' },
                      ]}
                    >
                      {p.name} ({p.mrn})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Admitting Consultant</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 10 }}
            >
              {doctors.map((d) => {
                const active = selectedDoctorId === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.pickPill, active && styles.pickPillActive]}
                    onPress={() => setSelectedDoctorId(d.id)}
                  >
                    <Text
                      style={[
                        styles.pickPillText,
                        active && { color: '#FFFFFF' },
                      ]}
                    >
                      {d.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Admitting Diagnosis</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Community-acquired pneumonia"
              placeholderTextColor="#94A3B8"
              value={admitDiagnosis}
              onChangeText={setAdmitDiagnosis}
            />

            <TouchableOpacity
              style={[styles.confirmAdmitBtn, admitting && { opacity: 0.7 }]}
              disabled={admitting}
              onPress={handleConfirmAdmission}
            >
              <UserPlus size={16} color="#FFFFFF" />
              <Text style={styles.confirmAdmitText}>
                {admitting ? 'Admitting...' : 'Confirm Bed Admission'}
              </Text>
            </TouchableOpacity>
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
    gap: 8,
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
  dischargeNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dischargeNavText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 38,
  },
  wardSummaryStrip: {
    marginBottom: 12,
  },
  wardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    minWidth: 165,
  },
  wardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#142D4E',
  },
  wardAvailability: {
    fontSize: 11,
    color: '#0866C6',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 6,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0866C6',
  },
  filterChipsScroll: {
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  statusTabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  statusTabActive: {
    backgroundColor: '#142D4E',
    borderColor: '#142D4E',
  },
  statusTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  statusTabTextActive: {
    color: '#FFFFFF',
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
    paddingBottom: 34,
  },
  modalTop: {
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
  pickPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  pickPillActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  pickPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
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
    marginBottom: 14,
  },
  confirmAdmitBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmAdmitText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default BedAdmissionScreen;
