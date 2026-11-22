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
  Phone,
  Ticket,
  CalendarPlus,
  HeartPulse,
  ChevronRight,
} from 'lucide-react-native';
import { StarLoader, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { hasStaffPermission } from '../../components/staff/staffPermissions';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import type { Patient } from '../../types/patient';

export const StaffPatientSearchScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const designation = user?.designation;

  const canRegister = hasStaffPermission(designation, 'patients:register');
  const canGenerateToken = hasStaffPermission(designation, 'opd:token_generate');
  const canBookAppt = hasStaffPermission(designation, 'appointments:book');
  const canRecordVitals = hasStaffPermission(designation, 'vitals:record');

  const [patients, setPatients] = useState<Patient[]>([]);
  const [todayIds, setTodayIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'today'>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDirectory = useCallback(async () => {
    try {
      const [allPats, appts] = await Promise.all([
        patientService.getAllPatients(),
        appointmentService.getAppointments(),
      ]);
      const setIds = new Set<string>();
      appts
        .filter((a) => a.status === 'arrived' || a.date === '2026-11-14')
        .forEach((a) => setIds.add(a.patientId));
      setPatients(allPats);
      setTodayIds(setIds);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  useFocusEffect(
    useCallback(() => {
      loadDirectory();
    }, [loadDirectory])
  );

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      if (filterMode === 'today' && !todayIds.has(p.id)) {
        return false;
      }
      if (query.trim().length > 0) {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          p.phone.includes(q)
        );
      }
      return true;
    });
  }, [patients, filterMode, todayIds, query]);

  const renderPatient = ({ item }: { item: Patient }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() =>
          navigation.navigate('StaffPatientDetails', {
            patientId: item.id,
            patient: item,
          })
        }
      >
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              MRN: {item.mrn} | {item.age} |{' '}
              {item.gender === 'female'
                ? 'Female'
                : item.gender === 'other'
                  ? 'Other'
                  : 'Male'}{' '}
              | Blood: {item.bloodGroup}
            </Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </View>

        <View style={styles.phoneRow}>
          <Phone size={12} color="#64748B" />
          <Text style={styles.phoneText}>{item.phone}</Text>
          {todayIds.has(item.id) ? (
            <View style={styles.todayChip}>
              <Text style={styles.todayChipText}>Today OPD</Text>
            </View>
          ) : null}
        </View>

        {(canGenerateToken || canBookAppt || canRecordVitals) ? (
          <View style={styles.actionsRow}>
            {canGenerateToken ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  navigation.navigate('TokenGeneration', {
                    patientId: item.id,
                    patientName: item.name,
                    patientPhone: item.phone,
                  })
                }
              >
                <Ticket size={13} color="#0866C6" />
                <Text style={styles.actionText}>OPD Token</Text>
              </TouchableOpacity>
            ) : null}

            {canBookAppt ? (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() =>
                  navigation.navigate('StaffBookAppointment', {
                    patientId: item.id,
                    patientName: item.name,
                  })
                }
              >
                <CalendarPlus size={13} color="#0866C6" />
                <Text style={styles.actionText}>Book Appt</Text>
              </TouchableOpacity>
            ) : null}

            {canRecordVitals ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.nurseBtn]}
                onPress={() =>
                  navigation.navigate('NurseVitals', {
                    patientId: item.id,
                    patientName: item.name,
                  })
                }
              >
                <HeartPulse size={13} color="#16A34A" />
                <Text style={[styles.actionText, { color: '#16A34A' }]}>
                  Record Vitals
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Patient Directory</Text>
          <Text style={styles.subtitle}>
            Search registered patients by Name, MRN, or Phone
          </Text>
        </View>
        {canRegister ? (
          <TouchableOpacity
            style={styles.newPatientBtn}
            onPress={() => navigation.navigate('StaffPatientReg')}
          >
            <UserPlus size={16} color="#FFFFFF" />
            <Text style={styles.newPatientText}>New</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, MRN (e.g. P-00102), or phone..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabPill, filterMode === 'all' && styles.tabPillActive]}
          onPress={() => setFilterMode('all')}
        >
          <Text
            style={[
              styles.tabText,
              filterMode === 'all' && styles.tabTextActive,
            ]}
          >
            All Registered ({patients.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabPill,
            filterMode === 'today' && styles.tabPillActive,
          ]}
          onPress={() => setFilterMode('today')}
        >
          <Text
            style={[
              styles.tabText,
              filterMode === 'today' && styles.tabTextActive,
            ]}
          >
            Today&apos;s OPD ({todayIds.size})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <StarLoader message="Searching patient registry..." />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderPatient}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadDirectory();
              }}
              tintColor="#0866C6"
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Patients Found"
              description="Try another MRN, phone number, or name."
              actionLabel={canRegister ? 'Register New Patient' : undefined}
              onAction={
                canRegister
                  ? () => navigation.navigate('StaffPatientReg')
                  : undefined
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#142D4E',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  newPatientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0866C6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  newPatientText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#142D4E',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabPillActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
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
    marginBottom: 10,
  },
  cardTop: {
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
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  meta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  phoneText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    fontWeight: '600',
  },
  todayChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  todayChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16A34A',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
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
  nurseBtn: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
});

export default StaffPatientSearchScreen;
