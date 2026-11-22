import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Users,
  Ticket,
  Clock,
  CheckCircle2,
  UserCheck,
  UserX,
  PhoneCall,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { hasStaffPermission } from '../../components/staff/staffPermissions';
import { opdTokenService } from '../../services/opdTokenService';
import { doctorService } from '../../services/doctorService';
import type { OPDToken } from '../../types/opdToken';
import type { Doctor } from '../../types/doctor';

export const StaffOPDQueueScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const designation = user?.designation;

  const canManageQueue = hasStaffPermission(designation, 'queue:manage');
  const canGenerateToken = hasStaffPermission(designation, 'opd:token_generate');

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-1');
  const [tokens, setTokens] = useState<OPDToken[]>([]);
  const [currentServing, setCurrentServing] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'arrived' | 'in_consultation' | 'completed'
  >('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadQueue = useCallback(async (docId: string) => {
    try {
      const [docs, queueView] = await Promise.all([
        doctorService.getAllDoctors(),
        opdTokenService.getDoctorQueue(docId),
      ]);
      setDoctors(docs);
      setTokens(queueView.tokens);
      setCurrentServing(queueView.currentServingToken || null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadQueue(selectedDoctorId);
  }, [loadQueue, selectedDoctorId]);

  useFocusEffect(
    useCallback(() => {
      loadQueue(selectedDoctorId);
    }, [loadQueue, selectedDoctorId])
  );

  const handleCallNext = async () => {
    const called = await opdTokenService.callNextToken(selectedDoctorId);
    if (called) {
      Alert.alert(
        'Queue Advanced',
        `Token ${called.tokenNumber} (${called.patientName}) called into Consultation Room.`
      );
    } else {
      Alert.alert('Queue Clear', 'No waiting tokens remaining for this doctor.');
    }
    loadQueue(selectedDoctorId);
  };

  const handleCheckOutToken = async (tok: OPDToken) => {
    await opdTokenService.completeToken(tok.id);
    Alert.alert(
      'Patient Checked Out',
      `${tok.patientName} (${tok.tokenNumber}) marked completed and checked out.`
    );
    loadQueue(selectedDoctorId);
  };

  const visibleTokens = tokens.filter((t) =>
    filterStatus === 'all' ? true : t.status === filterStatus
  );

  const waitingCount = tokens.filter((t) => t.status === 'arrived').length;
  const completedCount = tokens.filter((t) => t.status === 'completed').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="OPD Queue Management"
        subtitle={
          canManageQueue
            ? 'Reception Check-in & Live Desk Queue'
            : 'Live OPD Queue Status (View Only)'
        }
        onBackPress={() => navigation.goBack()}
        rightAction={
          canGenerateToken ? (
            <TouchableOpacity
              style={styles.issueBtn}
              onPress={() => navigation.navigate('TokenGeneration')}
            >
              <Ticket size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Doctor Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.docStrip}
      >
        {doctors.map((d) => {
          const active = selectedDoctorId === d.id;
          return (
            <TouchableOpacity
              key={d.id}
              style={[styles.docChip, active && styles.docChipActive]}
              onPress={() => setSelectedDoctorId(d.id)}
            >
              <Text
                style={[styles.docChipText, active && styles.docChipTextActive]}
              >
                {d.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Queue Metrics Bar */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricVal}>{currentServing || '--'}</Text>
          <Text style={styles.metricLabel}>Now Serving</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: '#D97706' }]}>
            {waitingCount}
          </Text>
          <Text style={styles.metricLabel}>Waiting</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricVal, { color: '#16A34A' }]}>
            {completedCount}
          </Text>
          <Text style={styles.metricLabel}>Completed</Text>
        </View>
      </View>

      {canManageQueue ? (
        <View style={styles.deskActionsBar}>
          <TouchableOpacity style={styles.deskBtn} onPress={handleCallNext}>
            <PhoneCall size={15} color="#FFFFFF" />
            <Text style={styles.deskBtnText}>Advance Next Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deskBtnSecondary}
            onPress={() => navigation.navigate('TokenGeneration')}
          >
            <Ticket size={15} color="#0866C6" />
            <Text style={styles.deskBtnSecText}>New Walk-In Token</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Status Filter */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'arrived', label: 'Waiting' },
            { key: 'in_consultation', label: 'Serving' },
            { key: 'completed', label: 'Checked Out' },
          ] as const
        ).map((tab) => {
          const active = filterStatus === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setFilterStatus(tab.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  active && styles.filterTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <StarLoader message="Refreshing live queue..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadQueue(selectedDoctorId);
              }}
              tintColor="#0866C6"
            />
          }
        >
          {visibleTokens.length === 0 ? (
            <EmptyState
              title="No Tokens in Filter"
              description="No patients match the selected queue filter right now."
            />
          ) : (
            visibleTokens.map((tok) => (
              <View key={tok.id} style={styles.tokenCard}>
                <View style={styles.tokenLeft}>
                  <View style={styles.tokenBadge}>
                    <Text style={styles.tokenBadgeText}>{tok.tokenNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{tok.patientName}</Text>
                    <Text style={styles.patientMeta}>
                      MRN: {tok.patientMrn} | Wait ~{tok.estimatedWaitMinutes}m
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusTag,
                      tok.status === 'in_consultation'
                        ? { backgroundColor: '#DCFCE7' }
                        : tok.status === 'completed'
                          ? { backgroundColor: '#E0F2FE' }
                          : { backgroundColor: '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusTagText,
                        tok.status === 'in_consultation'
                          ? { color: '#166534' }
                          : tok.status === 'completed'
                            ? { color: '#0369A1' }
                            : { color: '#92400E' },
                      ]}
                    >
                      {tok.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {canManageQueue && tok.status !== 'completed' ? (
                  <View style={styles.tokenActions}>
                    <TouchableOpacity
                      style={styles.checkoutBtn}
                      onPress={() => handleCheckOutToken(tok)}
                    >
                      <CheckCircle2 size={14} color="#16A34A" />
                      <Text style={styles.checkoutText}>
                        Check-Out / Complete
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  issueBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docStrip: {
    paddingHorizontal: 16,
    maxHeight: 46,
    marginBottom: 10,
  },
  docChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    alignSelf: 'center',
  },
  docChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  docChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  docChipTextActive: {
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0866C6',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  deskActionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 12,
  },
  deskBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0866C6',
    paddingVertical: 11,
    borderRadius: 12,
  },
  deskBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  deskBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 11,
    borderRadius: 12,
  },
  deskBtnSecText: {
    color: '#0866C6',
    fontWeight: '700',
    fontSize: 12,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#142D4E',
    borderColor: '#142D4E',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  tokenCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tokenBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tokenBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0866C6',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
  },
  patientMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tokenActions: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    paddingVertical: 9,
    borderRadius: 10,
  },
  checkoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
});

export default StaffOPDQueueScreen;
