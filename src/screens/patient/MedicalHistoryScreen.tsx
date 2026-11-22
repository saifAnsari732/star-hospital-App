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
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertTriangle,
  Heart,
  Syringe,
  Scissors,
  CheckCircle2,
  FolderHeart,
} from 'lucide-react-native';
import { appointmentService, patientService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { AllergyItem, MedicalHistoryItem } from '../../types/patient';
import { AppointmentVitals } from '../../types/appointment';
import {
  mergeAllergiesWithHistory,
  resolveEffectivePatientId,
} from './patientUtils';

export interface MedicalHistoryScreenProps {
  navigation: any;
  route?: any;
}

export const MedicalHistoryScreen: React.FC<MedicalHistoryScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);

  const [historyItems, setHistoryItems] = useState<MedicalHistoryItem[]>([]);
  const [allergies, setAllergies] = useState<AllergyItem[]>([]);
  const [latestVitals, setLatestVitals] = useState<AppointmentVitals | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadClinicalHistory = useCallback(async () => {
    setErrorMsg(null);
    try {
      const [hist, allgs, apts] = await Promise.all([
        patientService.getMedicalHistory(effectivePatientId),
        patientService.getAllergies(effectivePatientId),
        appointmentService.getAppointments({ patientId: effectivePatientId }),
      ]);
      setHistoryItems(hist);
      setAllergies(mergeAllergiesWithHistory(allgs, hist, effectivePatientId));
      const withVitals = apts.find((a) => Boolean(a.vitals));
      setLatestVitals(withVitals?.vitals || null);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load clinical medical history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectivePatientId]);

  useFocusEffect(
    useCallback(() => {
      void loadClinicalHistory();
    }, [loadClinicalHistory])
  );

  const vitals = latestVitals
    ? [
        latestVitals.bloodPressure
          ? { label: 'Blood Pressure', value: latestVitals.bloodPressure, unit: '' }
          : null,
        latestVitals.pulse ? { label: 'Pulse Rate', value: latestVitals.pulse, unit: '' } : null,
        latestVitals.temperature
          ? { label: 'Body Temp', value: latestVitals.temperature, unit: '' }
          : null,
        latestVitals.weight ? { label: 'Weight', value: latestVitals.weight, unit: '' } : null,
        latestVitals.oxygenSaturation
          ? { label: 'SpO2 Oxygen', value: latestVitals.oxygenSaturation, unit: '' }
          : null,
      ].filter((v): v is { label: string; value: string; unit: string } => Boolean(v))
    : [];

  const conditions = historyItems.filter(
    (item) => item.category === 'condition' || item.category === 'general'
  );
  const surgeries = historyItems.filter((item) => item.category === 'surgery');
  const immunizations = historyItems.filter((item) => item.category === 'immunization');

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
        <Text style={styles.headerTitle}>Medical History</Text>
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
              void loadClinicalHistory();
            }}
            colors={['#0866C6']}
          />
        }
      >
        {loading && historyItems.length === 0 && allergies.length === 0 ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 30 }]}>
            <ActivityIndicator size="large" color="#0866C6" />
            <Text style={[styles.quickNavSub, { marginTop: 10 }]}>Loading medical history...</Text>
          </View>
        ) : errorMsg ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 24 }]}>
            <Text style={[styles.sectionTitle, { color: '#DC2626', marginLeft: 0 }]}>
              Could Not Load History
            </Text>
            <Text style={[styles.quickNavSub, { textAlign: 'center', marginTop: 6 }]}>
              {errorMsg}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                void loadClinicalHistory();
              }}
              style={{ marginTop: 12, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EBF5FF', borderRadius: 10 }}
            >
              <Text style={{ color: '#0866C6', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Latest Clinical Vitals */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Activity size={18} color="#0866C6" />
            <Text style={styles.sectionTitle}>Latest Recorded Vitals</Text>
          </View>
          {vitals.length === 0 ? (
            <Text style={styles.quickNavSub}>
              No clinical vitals recorded from recent consultations yet.
            </Text>
          ) : (
            <View style={styles.vitalsGrid}>
              {vitals.map((v, i) => (
                <View key={i} style={styles.vitalTile}>
                  <Text style={styles.vitalLabel}>{v.label}</Text>
                  <Text style={styles.vitalVal}>
                    {v.value} {v.unit ? <Text style={styles.vitalUnit}>{v.unit}</Text> : null}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Known Allergies */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <AlertTriangle size={18} color="#DC2626" />
            <Text style={[styles.sectionTitle, { color: '#DC2626' }]}>Known Allergies</Text>
          </View>

          {allergies.length === 0 ? (
            <Text style={styles.quickNavSub}>No known allergies recorded.</Text>
          ) : (
            allergies.map((allergy) => {
              const sevLabel =
                allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1);
              return (
                <View key={allergy.id} style={styles.allergyItem}>
                  <View style={styles.allergyTopRow}>
                    <Text style={styles.allergenName}>{allergy.allergen}</Text>
                    <View
                      style={[
                        styles.severityBadge,
                        allergy.severity === 'severe'
                          ? styles.severityBadgeSevere
                          : styles.severityBadgeMild,
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          allergy.severity === 'severe'
                            ? styles.severityTextSevere
                            : styles.severityTextMild,
                        ]}
                      >
                        {sevLabel}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.allergyReaction}>Reaction: {allergy.reaction}</Text>
                  <Text style={styles.allergyDate}>
                    Recorded: {allergy.diagnosedDate || 'On file'}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* Chronic Conditions */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Heart size={18} color="#0866C6" />
            <Text style={styles.sectionTitle}>Chronic &amp; Clinical Conditions</Text>
          </View>

          {conditions.length === 0 ? (
            <Text style={styles.quickNavSub}>No chronic conditions documented.</Text>
          ) : (
            conditions.map((item) => (
              <View key={item.id} style={styles.conditionItem}>
                <Text style={styles.conditionTitle}>{item.title}</Text>
                <Text style={styles.conditionDate}>
                  Recorded: {item.date}
                  {item.doctorName ? ` • ${item.doctorName}` : ''}
                </Text>
                <Text style={styles.conditionStatus}>{item.description}</Text>
              </View>
            ))
          )}
        </View>

        {/* Surgical History */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Scissors size={18} color="#0866C6" />
            <Text style={styles.sectionTitle}>Past Surgeries &amp; Procedures</Text>
          </View>

          {surgeries.length === 0 ? (
            <Text style={styles.quickNavSub}>No surgical history documented.</Text>
          ) : (
            surgeries.map((surg) => (
              <View key={surg.id} style={styles.surgeryItem}>
                <Text style={styles.surgeryTitle}>{surg.title}</Text>
                <Text style={styles.surgeryHospital}>
                  {surg.doctorName ? `${surg.doctorName} • ` : ''}
                  {surg.date}
                </Text>
                <Text style={styles.surgeryOutcome}>{surg.description}</Text>
              </View>
            ))
          )}
        </View>

        {/* Immunization Records */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Syringe size={18} color="#16A34A" />
            <Text style={styles.sectionTitle}>Immunization Records</Text>
          </View>

          {immunizations.length === 0 ? (
            <Text style={styles.quickNavSub}>No immunization records documented.</Text>
          ) : (
            immunizations.map((im) => (
              <View key={im.id} style={styles.immuItem}>
                <View style={styles.immuLeft}>
                  <CheckCircle2 size={16} color="#16A34A" />
                  <View style={styles.immuDetails}>
                    <Text style={styles.immuName}>{im.title}</Text>
                    <Text style={styles.immuDate}>{im.date}</Text>
                  </View>
                </View>
                <Text style={styles.immuStatus}>Verified</Text>
              </View>
            ))
          )}
        </View>

        {/* Detailed Records Links */}
        <View style={styles.card}>
          <Text style={styles.sectionTitleNoIcon}>Related Medical Documents</Text>

          <TouchableOpacity
            style={styles.quickNavRow}
            onPress={() => navigation.navigate('Allergies')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Manage Allergies and Reactions"
          >
            <View style={styles.quickNavLeft}>
              <View style={[styles.quickNavIcon, { backgroundColor: '#FEE2E2' }]}>
                <AlertTriangle size={17} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.quickNavTitle}>Allergies &amp; Reactions</Text>
                <Text style={styles.quickNavSub}>{allergies.length} documented items</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickNavRow, { borderBottomWidth: 0, paddingBottom: 2 }]}
            onPress={() => navigation.navigate('HealthRecords')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Open Digital Health Records"
          >
            <View style={styles.quickNavLeft}>
              <View style={[styles.quickNavIcon, { backgroundColor: '#EBF5FF' }]}>
                <FolderHeart size={17} color="#0866C6" />
              </View>
              <View>
                <Text style={styles.quickNavTitle}>Digital Health Records</Text>
                <Text style={styles.quickNavSub}>
                  {historyItems.length > 0
                    ? `${historyItems.length} clinical entries synced`
                    : 'Discharge summaries & certificates'}
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginLeft: 8,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vitalTile: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  vitalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0866C6',
  },
  vitalUnit: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  allergyItem: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  allergyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  allergenName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  severityBadgeSevere: {
    backgroundColor: '#FEE2E2',
  },
  severityBadgeMild: {
    backgroundColor: '#FEF3C7',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  severityTextSevere: {
    color: '#DC2626',
  },
  severityTextMild: {
    color: '#D97706',
  },
  allergyReaction: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  allergyDate: {
    fontSize: 11,
    color: '#991B1B',
    marginTop: 2,
  },
  conditionItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  conditionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  conditionDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  conditionStatus: {
    fontSize: 12,
    color: '#0866C6',
    marginTop: 4,
    fontWeight: '500',
  },
  surgeryItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  surgeryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  surgeryHospital: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  surgeryOutcome: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
    marginTop: 2,
  },
  immuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  immuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  immuDetails: {
    marginLeft: 8,
  },
  immuName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#142D4E',
  },
  immuDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  immuStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  sectionTitleNoIcon: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 10,
  },
  quickNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quickNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickNavIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  quickNavSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
});

export default MedicalHistoryScreen;
