import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Ticket,
  Search,
  User,
  Stethoscope,
  Clock,
  CheckCircle2,
  ListOrdered,
} from 'lucide-react-native';
import { StarHeader, StarLoader } from '../../components/common';
import { patientService } from '../../services/patientService';
import { doctorService } from '../../services/doctorService';
import { opdTokenService } from '../../services/opdTokenService';
import type { Patient } from '../../types/patient';
import type { Doctor } from '../../types/doctor';
import type { OPDToken } from '../../types/opdToken';

type VisitKind = 'first_visit' | 'follow_up' | 'emergency';

export const OPDTokenGenerateScreen: React.FC<{
  navigation?: any;
  route?: any;
}> = ({ navigation, route }) => {
  const paramPatientId: string | undefined = route?.params?.patientId;
  const paramPatientName: string | undefined = route?.params?.patientName;
  const paramDoctorId: string | undefined = route?.params?.doctorId;

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(
    paramPatientId || 'pat-1'
  );
  const [selectedDoctorId, setSelectedDoctorId] = useState(
    paramDoctorId || 'doc-1'
  );
  const [visitType, setVisitType] = useState<VisitKind>('first_visit');
  const [patientQuery, setPatientQuery] = useState('');
  const [waitingCount, setWaitingCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [issuedToken, setIssuedToken] = useState<OPDToken | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [pats, docs] = await Promise.all([
        patientService.getAllPatients(),
        doctorService.getAllDoctors(),
      ]);
      setPatients(pats);
      setDoctors(docs);

      if (paramPatientId) {
        setSelectedPatientId(paramPatientId);
      } else if (pats[0]) {
        setSelectedPatientId(pats[0].id);
      }
      if (paramDoctorId) {
        setSelectedDoctorId(paramDoctorId);
      } else if (docs[0]) {
        setSelectedDoctorId(docs[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [paramPatientId, paramDoctorId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    opdTokenService
      .getDoctorQueue(selectedDoctorId)
      .then((q) => setWaitingCount(q.waitingCount))
      .catch(() => {});
  }, [selectedDoctorId, issuedToken]);

  const filteredPatients = patients.filter((p) => {
    if (!patientQuery.trim()) return true;
    const q = patientQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  const displayedPatients = useMemo(() => {
    const top = filteredPatients.slice(0, 6);
    if (selectedPatient && !top.some((p) => p.id === selectedPatient.id)) {
      return [selectedPatient, ...top];
    }
    return top;
  }, [filteredPatients, selectedPatient]);

  const handleGenerateToken = async () => {
    if (!selectedPatientId || !selectedDoctorId) {
      Alert.alert(
        'Selection Required',
        'Please select both patient and consulting doctor.'
      );
      return;
    }
    setGenerating(true);
    try {
      const token = await opdTokenService.generateToken({
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        department: selectedDoctor?.department,
        visitType,
      });
      setIssuedToken(token);
      Alert.alert(
        'OPD Token Issued',
        `Token ${token.tokenNumber} generated for ${
          selectedPatient?.name || paramPatientName || token.patientName
        }.`
      );
    } catch {
      Alert.alert('Token Error', 'Failed to issue OPD queue token.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading && doctors.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarHeader
          title="OPD Token Generation"
          onBackPress={() => navigation?.goBack?.()}
        />
        <StarLoader message="Loading doctors & patient registry..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="OPD Token Generation"
        subtitle="Walk-in & Checked-In Queue Desk"
        onBackPress={() => navigation?.goBack?.()}
        rightAction={
          <TouchableOpacity
            style={styles.queueNavBtn}
            onPress={() => navigation?.navigate?.('StaffOPDQueue')}
          >
            <ListOrdered size={17} color="#0866C6" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Issued Token Receipt Card */}
        {issuedToken ? (
          <View style={styles.receiptCard}>
            <View style={styles.receiptTop}>
              <CheckCircle2 size={20} color="#16A34A" />
              <Text style={styles.receiptHeading}>Active OPD Token Issued</Text>
            </View>
            <Text style={styles.bigToken}>{issuedToken.tokenNumber}</Text>
            <Text style={styles.receiptPatient}>
              {issuedToken.patientName} ({issuedToken.patientMrn || 'OPD'})
            </Text>
            <Text style={styles.receiptMeta}>
              {issuedToken.doctorName} | {issuedToken.department}
            </Text>
            <Text style={styles.receiptWait}>
              Queue Position #{issuedToken.queuePosition} | Est. Wait:{' '}
              {issuedToken.estimatedWaitMinutes} mins
            </Text>

            <TouchableOpacity
              style={styles.openQueueBtn}
              onPress={() => navigation?.navigate?.('StaffOPDQueue')}
            >
              <ListOrdered size={16} color="#FFFFFF" />
              <Text style={styles.openQueueBtnText}>Open Live OPD Queue</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 1. Select Patient */}
        <Text style={styles.sectionLabel}>1. Select Registered Patient</Text>
        <View style={styles.searchBar}>
          <Search size={17} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by patient name, MRN, or phone..."
            placeholderTextColor="#94A3B8"
            value={patientQuery}
            onChangeText={setPatientQuery}
          />
        </View>

        <View style={styles.listCard}>
          {displayedPatients.map((pat) => {
            const active = selectedPatientId === pat.id;
            return (
              <TouchableOpacity
                key={pat.id}
                style={[styles.selectRow, active && styles.selectRowActive]}
                onPress={() => {
                  setSelectedPatientId(pat.id);
                  setIssuedToken(null);
                }}
              >
                <User size={16} color={active ? '#0866C6' : '#64748B'} />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.rowTitle,
                      active && { color: '#0866C6' },
                    ]}
                  >
                    {pat.name}
                  </Text>
                  <Text style={styles.rowSub}>
                    MRN {pat.mrn} | {pat.phone}
                  </Text>
                </View>
                {active ? <CheckCircle2 size={16} color="#0866C6" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. Visit Priority / Type */}
        <Text style={styles.sectionLabel}>2. Visit Type</Text>
        <View style={styles.chipRow}>
          {(
            [
              { key: 'first_visit', label: 'Walk-in / First Visit' },
              { key: 'follow_up', label: 'Follow-up' },
              { key: 'emergency', label: 'Urgent / Priority' },
            ] as const
          ).map((v) => (
            <TouchableOpacity
              key={v.key}
              style={[
                styles.visitChip,
                visitType === v.key && styles.visitChipActive,
              ]}
              onPress={() => setVisitType(v.key)}
            >
              <Text
                style={[
                  styles.visitChipText,
                  visitType === v.key && styles.visitChipTextActive,
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3. Select Doctor */}
        <Text style={styles.sectionLabel}>3. Consulting Doctor &amp; Chamber</Text>
        <View style={styles.listCard}>
          {doctors.map((doc) => {
            const active = selectedDoctorId === doc.id;
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.selectRow, active && styles.selectRowActive]}
                onPress={() => {
                  setSelectedDoctorId(doc.id);
                  setIssuedToken(null);
                }}
              >
                <Stethoscope
                  size={16}
                  color={active ? '#0866C6' : '#64748B'}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.rowTitle,
                      active && { color: '#0866C6' },
                    ]}
                  >
                    {doc.name}
                  </Text>
                  <Text style={styles.rowSub}>
                    {doc.department} | {doc.roomNo || 'OPD Wing'}
                  </Text>
                </View>
                {active ? <CheckCircle2 size={16} color="#0866C6" /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Queue Load Notice */}
        <View style={styles.queueBanner}>
          <Clock size={16} color="#0866C6" />
          <Text style={styles.queueBannerText}>
            Current waiting tokens for {selectedDoctor?.name || 'doctor'}:{' '}
            {waitingCount}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.generateBtn, generating && { opacity: 0.7 }]}
          disabled={generating}
          onPress={handleGenerateToken}
        >
          <Ticket size={18} color="#FFFFFF" />
          <Text style={styles.generateBtnText}>
            {generating ? 'Issuing OPD Token...' : 'Issue OPD Queue Token'}
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
  queueNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 38,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 2,
    borderColor: '#16A34A',
    alignItems: 'center',
    marginBottom: 18,
  },
  receiptTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  receiptHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  bigToken: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0866C6',
    marginVertical: 6,
  },
  receiptPatient: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  receiptMeta: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  receiptWait: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 6,
  },
  openQueueBtn: {
    marginTop: 12,
    backgroundColor: '#0866C6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  openQueueBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
    marginTop: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectRowActive: {
    backgroundColor: '#EFF6FF',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
  },
  rowSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  visitChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  visitChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  visitChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  visitChipTextActive: {
    color: '#FFFFFF',
  },
  queueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  queueBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  generateBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default OPDTokenGenerateScreen;
