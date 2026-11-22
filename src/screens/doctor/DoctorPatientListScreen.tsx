import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  UserPlus,
  Stethoscope,
  Pill,
  ChevronRight,
  Clock,
  Phone,
} from 'lucide-react-native';
import { StarLoader, EmptyState } from '../../components/common';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { opdTokenService } from '../../services/opdTokenService';
import type { Patient } from '../../types/patient';

const BLOOD_FILTERS = ['All', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const DoctorPatientListScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [todayPatientIds, setTodayPatientIds] = useState<Set<string>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<'today' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [bloodFilter, setBloodFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatients = useCallback(async () => {
    try {
      const [allPats, appts, queueView] = await Promise.all([
        patientService.getAllPatients(),
        appointmentService.getAppointments({ doctorId: 'doc-1' }),
        opdTokenService.getDoctorQueue('doc-1'),
      ]);

      const todayIds = new Set<string>();
      const todayIso = '2026-11-14';
      appts
        .filter(
          (a) =>
            a.status !== 'cancelled' &&
            (a.date === todayIso || a.status === 'arrived')
        )
        .forEach((a) => todayIds.add(a.patientId));
      queueView.tokens
        .filter((t) => t.status !== 'cancelled')
        .forEach((t) => todayIds.add(t.patientId));
      if (todayIds.size === 0 && allPats.length > 0) {
        todayIds.add(allPats[0].id);
      }

      setPatients(allPats);
      setTodayPatientIds(todayIds);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useFocusEffect(
    useCallback(() => {
      loadPatients();
    }, [loadPatients])
  );

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (viewMode === 'today' && !todayPatientIds.has(p.id)) {
        return false;
      }
      if (bloodFilter !== 'All' && p.bloodGroup !== bloodFilter) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.phone.includes(q)
        );
      }
      return true;
    });
  }, [patients, viewMode, todayPatientIds, bloodFilter, searchQuery]);

  const renderPatientCard = ({ item }: { item: Patient }) => {
    const isToday = todayPatientIds.has(item.id);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() =>
          navigation.navigate('PatientDetail', {
            patientId: item.id,
            patient: item,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.name}</Text>
              {isToday ? (
                <View style={styles.todayBadge}>
                  <Clock size={10} color="#0866C6" />
                  <Text style={styles.todayBadgeText}>Today</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.metaText}>
              MRN: {item.mrn} | {item.age} |{' '}
              {item.gender === 'female' ? 'Female' : 'Male'}
            </Text>
          </View>
          <View style={styles.bloodBadge}>
            <Text style={styles.bloodText}>{item.bloodGroup}</Text>
          </View>
        </View>

        <View style={styles.contactRow}>
          <Phone size={12} color="#64748B" />
          <Text style={styles.phoneText}>{item.phone}</Text>
          <ChevronRight size={16} color="#94A3B8" />
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate('PatientDetail', {
                patientId: item.id,
                patient: item,
              })
            }
          >
            <Text style={styles.actionBtnText}>History & Vitals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() =>
              navigation.navigate('Consultation', {
                patientId: item.id,
                patientName: item.name,
                patientMrn: item.mrn,
                patient: item,
              })
            }
          >
            <Stethoscope size={13} color="#FFFFFF" />
            <Text style={styles.actionBtnPrimaryText}>Consult</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              navigation.navigate('PrescriptionBuilder', {
                patientId: item.id,
                patientName: item.name,
                patientMrn: item.mrn,
                patientAge: item.age,
                patientGender: item.gender === 'female' ? 'Female' : 'Male',
                patient: item,
              })
            }
          >
            <Pill size={13} color="#0866C6" />
            <Text style={styles.actionBtnText}>Rx</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topHeader}>
        <Text style={styles.pageTitle}>My Patients</Text>
        <Text style={styles.pageSub}>
          {viewMode === 'today'
            ? "Today's OPD & Scheduled Roster"
            : 'Complete Patient Clinical Directory'}
        </Text>
      </View>

      {/* Today's Patients vs All Patients Toggle */}
      <View style={styles.modeSwitchRow}>
        <TouchableOpacity
          style={[
            styles.modeTab,
            viewMode === 'today' && styles.modeTabActive,
          ]}
          onPress={() => setViewMode('today')}
        >
          <Text
            style={[
              styles.modeTabText,
              viewMode === 'today' && styles.modeTabTextActive,
            ]}
          >
            Today&apos;s Patients ({todayPatientIds.size})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, viewMode === 'all' && styles.modeTabActive]}
          onPress={() => setViewMode('all')}
        >
          <Text
            style={[
              styles.modeTabText,
              viewMode === 'all' && styles.modeTabTextActive,
            ]}
          >
            All Patients ({patients.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Search size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name, MRN, or phone..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Blood Group Filter Chips */}
      <View style={styles.filterChipsRow}>
        {BLOOD_FILTERS.map((bg) => {
          const active = bloodFilter === bg;
          return (
            <TouchableOpacity
              key={bg}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setBloodFilter(bg)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {bg}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <StarLoader message="Loading patient records..." />
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={renderPatientCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadPatients();
              }}
              tintColor="#0866C6"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Matching Patients"
              description="Adjust your search filter or switch to All Patients."
              actionLabel={viewMode === 'today' ? 'Show All Patients' : undefined}
              onAction={
                viewMode === 'today' ? () => setViewMode('all') : undefined
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
  },
  pageSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  modeSwitchRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 9,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTabTextActive: {
    color: '#0866C6',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#142D4E',
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0866C6',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  todayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0866C6',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bloodBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bloodText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  phoneText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  actionBtnPrimary: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default DoctorPatientListScreen;
