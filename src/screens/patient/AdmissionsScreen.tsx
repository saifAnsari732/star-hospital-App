import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Bed,
  Calendar,
  Stethoscope,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { patientService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { PatientAdmission } from '../../types/patient';
import { resolveEffectivePatientId } from './patientUtils';

export interface AdmissionsScreenProps {
  navigation: any;
  route?: any;
}

export const AdmissionsScreen: React.FC<AdmissionsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [admissions, setAdmissions] = useState<PatientAdmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAdmissions = useCallback(async () => {
    setErrorMsg(null);
    try {
      const items = await patientService.getAdmissions(effectivePatientId);
      setAdmissions(Array.isArray(items) ? items : []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load inpatient admissions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectivePatientId]);

  useFocusEffect(
    useCallback(() => {
      void loadAdmissions();
    }, [loadAdmissions])
  );

  const handleViewSummary = (adm: PatientAdmission) => {
    Alert.alert(
      `${adm.status === 'admitted' ? 'Admission Record' : 'Discharge Summary'} • ${adm.bedNumber}`,
      `Diagnosis: ${adm.diagnosis || 'Under clinical evaluation'}\n\nClinical Course: ${adm.notes || 'Inpatient notes recorded in ward register.'}\n\nAdmitted: ${adm.admittedAt}\n${adm.dischargedAt ? `Discharged: ${adm.dischargedAt}` : 'Status: Currently Admitted'}\nConsultant: ${adm.doctorName}`
    );
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
        <Text style={styles.headerTitle}>Inpatient Admissions</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadAdmissions();
            }}
            colors={['#0866C6']}
          />
        }
      >
        {/* Intro Banner */}
        <View style={styles.infoBanner}>
          <Bed size={22} color="#0866C6" />
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Inpatient Record History</Text>
            <Text style={styles.bannerSubtitle}>
              Ward allocations, room charges, and discharge summaries
            </Text>
          </View>
        </View>

        {loading && admissions.length === 0 ? (
          <View style={[styles.admissionCard, { alignItems: 'center', paddingVertical: 30 }]}>
            <ActivityIndicator size="large" color="#0866C6" />
            <Text style={[styles.bannerSubtitle, { marginTop: 10 }]}>
              Loading admission history...
            </Text>
          </View>
        ) : errorMsg ? (
          <View style={[styles.admissionCard, { alignItems: 'center', paddingVertical: 26 }]}>
            <AlertCircle size={28} color="#DC2626" />
            <Text style={[styles.bedNumber, { marginTop: 8 }]}>Unable to Load Admissions</Text>
            <Text style={[styles.bannerSubtitle, { textAlign: 'center', marginTop: 4 }]}>
              {errorMsg}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                void loadAdmissions();
              }}
              style={[styles.viewSummaryBtn, { marginTop: 14, paddingHorizontal: 20 }]}
            >
              <Text style={styles.viewSummaryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : admissions.length === 0 ? (
          <View style={[styles.admissionCard, { alignItems: 'center', paddingVertical: 30 }]}>
            <Bed size={30} color="#0866C6" />
            <Text style={[styles.bedNumber, { marginTop: 8 }]}>No Inpatient Admissions</Text>
            <Text style={[styles.bannerSubtitle, { textAlign: 'center', marginTop: 4 }]}>
              You have no recorded ward stays or inpatient admission records.
            </Text>
          </View>
        ) : (
          admissions.map((adm) => {
            const isAdmitted = adm.status === 'admitted';
            return (
              <View key={adm.id} style={styles.admissionCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.wardInfo}>
                    <Text style={styles.bedNumber}>{adm.bedNumber}</Text>
                    <Text style={styles.wardCategory}>{adm.wardCategory}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isAdmitted ? { backgroundColor: '#FEF3C7' } : undefined,
                    ]}
                  >
                    <CheckCircle2 size={12} color={isAdmitted ? '#B45309' : '#15803D'} />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isAdmitted ? { color: '#B45309' } : undefined,
                      ]}
                    >
                      {isAdmitted ? 'Admitted' : 'Discharged'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {adm.diagnosis ? (
                  <View style={styles.diagnosisBox}>
                    <Text style={styles.boxLabel}>Diagnosis:</Text>
                    <Text style={styles.diagnosisText}>{adm.diagnosis}</Text>
                  </View>
                ) : null}

                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Stethoscope size={15} color="#0866C6" />
                    <Text style={styles.metaText}>{adm.doctorName}</Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Calendar size={15} color="#0866C6" />
                    <Text style={styles.metaText}>
                      {adm.admittedAt}
                      {adm.dischargedAt ? ` - ${adm.dischargedAt}` : ' (Ongoing)'}
                    </Text>
                  </View>
                </View>

                {adm.notes ? (
                  <Text style={styles.notesExcerpt} numberOfLines={2}>
                    {adm.notes}
                  </Text>
                ) : null}

                <TouchableOpacity
                  style={styles.viewSummaryBtn}
                  onPress={() => handleViewSummary(adm)}
                  activeOpacity={0.8}
                >
                  <FileText size={15} color="#0866C6" style={styles.summaryIcon} />
                  <Text style={styles.viewSummaryText}>
                    {isAdmitted ? 'View Admission Details' : 'View Discharge Summary'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bannerTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064A91',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  admissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wardInfo: {
    flex: 1,
  },
  bedNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
  },
  wardCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  diagnosisBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  boxLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  diagnosisText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  notesExcerpt: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 12,
  },
  viewSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0866C6',
    backgroundColor: '#FFFFFF',
  },
  summaryIcon: {
    marginRight: 6,
  },
  viewSummaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0866C6',
  },
});

export default AdmissionsScreen;
