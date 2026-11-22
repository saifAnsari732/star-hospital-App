import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  HeartPulse,
  FileText,
  Pill,
  FlaskConical,
  Stethoscope,
  Video,
  Plus,
  X,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Activity,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { VitalsSummaryBadge } from '../../components/doctor';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { laboratoryService } from '../../services/laboratoryService';
import { prescriptionService } from '../../services/prescriptionService';
import type {
  Patient,
  MedicalHistoryItem,
  AllergyItem,
} from '../../types/patient';
import type { Appointment } from '../../types/appointment';
import type { DiagnosticReportItem } from '../../types/laboratory';
import type { Prescription } from '../../types/prescription';

type DetailTab = 'history' | 'allergies' | 'vitals' | 'records';

export const DoctorPatientDetailsScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const paramPatient = route?.params?.patient;
  const resolvedPatientId: string =
    route?.params?.patientId || paramPatient?.id || 'pat-1';
  const initialTab: DetailTab = route?.params?.initialTab || 'history';

  const [activeTab, setActiveTab] = useState<DetailTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [patient, setPatient] = useState<Patient | null>(paramPatient || null);
  const [history, setHistory] = useState<MedicalHistoryItem[]>([]);
  const [allergies, setAllergies] = useState<AllergyItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reports, setReports] = useState<DiagnosticReportItem[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Add medical history modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] =
    useState<MedicalHistoryItem['category']>('condition');
  const [newDescription, setNewDescription] = useState('');
  const [savingHistory, setSavingHistory] = useState(false);

  const loadPatientData = useCallback(async () => {
    setError(null);
    try {
      const [pat, hist, allg, appts, reps, rxs] = await Promise.all([
        patientService.getProfile(resolvedPatientId),
        patientService.getMedicalHistory(resolvedPatientId),
        patientService.getAllergies(resolvedPatientId),
        appointmentService.getAppointments({ patientId: resolvedPatientId }),
        laboratoryService.getDiagnosticReports({ patientId: resolvedPatientId }),
        prescriptionService.getPrescriptions(resolvedPatientId),
      ]);
      setPatient(pat);
      setHistory(hist);
      setAllergies(allg);
      setAppointments(appts);
      setReports(reps);
      setPrescriptions(rxs);
    } catch {
      setError('Unable to load full clinical patient profile. Please retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [resolvedPatientId]);

  useEffect(() => {
    loadPatientData();
  }, [loadPatientData]);

  useFocusEffect(
    useCallback(() => {
      loadPatientData();
    }, [loadPatientData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPatientData();
  };

  const vitalsHistory = appointments.filter((a) => Boolean(a.vitals));
  const latestVitals = vitalsHistory[0]?.vitals;

  const handleSaveHistory = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      Alert.alert(
        'Incomplete Note',
        'Please provide both a condition/event title and clinical summary.'
      );
      return;
    }

    setSavingHistory(true);
    try {
      const added = await patientService.addMedicalHistory({
        patientId: resolvedPatientId,
        title: newTitle.trim(),
        description: newDescription.trim(),
        category: newCategory,
        date: new Date().toISOString().split('T')[0],
        doctorName: 'Attending Physician',
      });
      setHistory((prev) => [added, ...prev]);
      setNewTitle('');
      setNewDescription('');
      setAddModalVisible(false);
    } catch {
      Alert.alert('Save Failed', 'Could not add medical history record.');
    } finally {
      setSavingHistory(false);
    }
  };

  if (loading && !patient) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarHeader title="Patient Details" onBackPress={() => navigation.goBack()} />
        <StarLoader message="Loading clinical dossier..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Patient Clinical Record"
        subtitle={patient?.mrn || resolvedPatientId}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0866C6"
          />
        }
      >
        {error ? (
          <View style={styles.errorBanner}>
            <AlertTriangle size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadPatientData}>
              <Text style={styles.retryLink}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Patient Overview Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {patient?.name ? patient.name.charAt(0).toUpperCase() : 'P'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.patientName}>
                {patient?.name || 'Patient Record'}
              </Text>
              <Text style={styles.patientMeta}>
                MRN: {patient?.mrn || 'N/A'} | {patient?.age || '--'} |{' '}
                {patient?.gender === 'female'
                  ? 'Female'
                  : patient?.gender === 'male'
                    ? 'Male'
                    : 'Other'}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.bloodBadge}>
                  <Text style={styles.bloodBadgeText}>
                    Blood: {patient?.bloodGroup || 'Unknown'}
                  </Text>
                </View>
                {allergies.length > 0 ? (
                  <View style={styles.allergyAlertBadge}>
                    <ShieldAlert size={12} color="#DC2626" />
                    <Text style={styles.allergyAlertText}>
                      {allergies.length} Known{' '}
                      {allergies.length === 1 ? 'Allergy' : 'Allergies'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.nkdaBadge}>
                    <CheckCircle2 size={12} color="#16A34A" />
                    <Text style={styles.nkdaText}>NKDA</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.contactStrip}>
            <View style={styles.contactItem}>
              <Phone size={13} color="#64748B" />
              <Text style={styles.contactText}>{patient?.phone || 'N/A'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Mail size={13} color="#64748B" />
              <Text style={styles.contactText} numberOfLines={1}>
                {patient?.email || 'N/A'}
              </Text>
            </View>
            <View style={styles.contactItem}>
              <MapPin size={13} color="#64748B" />
              <Text style={styles.contactText} numberOfLines={1}>
                {patient?.address ? `${patient.address}, ${patient.city}` : 'N/A'}
              </Text>
            </View>
            {patient?.emergencyContact ? (
              <View style={styles.emergencyRow}>
                <Text style={styles.emergencyLabel}>Emergency Contact:</Text>
                <Text style={styles.emergencyValue}>
                  {patient.emergencyContact.name} ({patient.emergencyContact.relation}) —{' '}
                  {patient.emergencyContact.phone}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Doctor Quick Actions */}
          <View style={styles.quickActionRow}>
            <TouchableOpacity
              style={[styles.quickBtn, styles.quickBtnPrimary]}
              onPress={() =>
                navigation.navigate('Consultation', {
                  patientId: patient?.id || resolvedPatientId,
                  patientName: patient?.name,
                  patientMrn: patient?.mrn,
                  vitals: latestVitals,
                  patient,
                })
              }
            >
              <Stethoscope size={15} color="#FFFFFF" />
              <Text style={styles.quickBtnPrimaryText}>Start Consult</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() =>
                navigation.navigate('PrescriptionBuilder', {
                  patientId: patient?.id || resolvedPatientId,
                  patientName: patient?.name,
                  patientMrn: patient?.mrn,
                  patientAge: patient?.age,
                  patientGender:
                    patient?.gender === 'female' ? 'Female' : 'Male',
                  patient,
                })
              }
            >
              <Pill size={15} color="#0866C6" />
              <Text style={styles.quickBtnText}>Write Rx</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBtn}
              onPress={() =>
                navigation.navigate('VideoConsultation', {
                  patientId: patient?.id || resolvedPatientId,
                  patientName: patient?.name,
                  patientMrn: patient?.mrn,
                })
              }
            >
              <Video size={15} color="#0866C6" />
              <Text style={styles.quickBtnText}>Tele-Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sub-Tabs */}
        <View style={styles.tabBar}>
          {(
            [
              { key: 'history', label: 'History' },
              { key: 'allergies', label: 'Allergies' },
              { key: 'vitals', label: 'Vitals' },
              { key: 'records', label: 'Labs & Rx' },
            ] as Array<{ key: DetailTab; label: string }>
          ).map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabPill, active && styles.tabPillActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab 1: Medical History */}
        {activeTab === 'history' ? (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>
                Medical & Surgical History ({history.length})
              </Text>
              <TouchableOpacity
                style={styles.addNoteBtn}
                onPress={() => setAddModalVisible(true)}
              >
                <Plus size={14} color="#0866C6" />
                <Text style={styles.addNoteText}>Add Note</Text>
              </TouchableOpacity>
            </View>

            {history.length === 0 ? (
              <EmptyState
                title="No Medical History Recorded"
                description="No prior conditions, surgeries, or chronic clinical entries are recorded for this patient."
                actionLabel="Add History Note"
                onAction={() => setAddModalVisible(true)}
              />
            ) : (
              history.map((item) => (
                <View key={item.id} style={styles.detailCard}>
                  <View style={styles.detailCardTop}>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>
                        {item.category.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.dateLabel}>{item.date}</Text>
                  </View>
                  <Text style={styles.detailTitle}>{item.title}</Text>
                  <Text style={styles.detailDesc}>{item.description}</Text>
                  {item.doctorName ? (
                    <Text style={styles.recordedBy}>
                      Recorded by {item.doctorName}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* Tab 2: Allergies */}
        {activeTab === 'allergies' ? (
          <View>
            <Text style={styles.sectionHeading}>
              Patient Allergies ({allergies.length})
            </Text>
            {allergies.length === 0 ? (
              <EmptyState
                title="No Known Drug Allergies (NKDA)"
                description="No medication, food, or environmental allergies flagged on this patient's profile."
              />
            ) : (
              allergies.map((item) => {
                const isSevere = item.severity === 'severe';
                const isMod = item.severity === 'moderate';
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.detailCard,
                      isSevere && styles.severeAllergyCard,
                    ]}
                  >
                    <View style={styles.detailCardTop}>
                      <View style={styles.allergyTitleWrap}>
                        <AlertTriangle
                          size={16}
                          color={
                            isSevere
                              ? '#DC2626'
                              : isMod
                                ? '#D97706'
                                : '#0866C6'
                          }
                        />
                        <Text style={styles.detailTitle}>{item.allergen}</Text>
                      </View>
                      <View
                        style={[
                          styles.severityBadge,
                          isSevere
                            ? styles.severitySevere
                            : isMod
                              ? styles.severityMod
                              : styles.severityMild,
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityText,
                            isSevere
                              ? { color: '#DC2626' }
                              : isMod
                                ? { color: '#B45309' }
                                : { color: '#0866C6' },
                          ]}
                        >
                          {item.severity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.detailDesc}>
                      Reaction: {item.reaction}
                    </Text>
                    {item.diagnosedDate ? (
                      <Text style={styles.recordedBy}>
                        Documented: {item.diagnosedDate}
                      </Text>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {/* Tab 3: Vitals */}
        {activeTab === 'vitals' ? (
          <View>
            <Text style={styles.sectionHeading}>
              Recorded Vital Signs ({vitalsHistory.length})
            </Text>
            {vitalsHistory.length === 0 ? (
              <EmptyState
                title="No Vitals Recorded Yet"
                description="Triage nurses or attending doctors have not recorded vital signs for recent visits."
              />
            ) : (
              vitalsHistory.map((appt) => (
                <View key={appt.id} style={styles.detailCard}>
                  <View style={styles.detailCardTop}>
                    <View style={styles.allergyTitleWrap}>
                      <HeartPulse size={16} color="#0866C6" />
                      <Text style={styles.detailTitle}>
                        Visit: {appt.date} ({appt.timeSlot})
                      </Text>
                    </View>
                    <Text style={styles.dateLabel}>{appt.doctorDepartment}</Text>
                  </View>
                  <View style={{ marginTop: 10 }}>
                    <VitalsSummaryBadge vitals={appt.vitals} />
                  </View>
                  <View style={styles.vitalsBreakdownGrid}>
                    <View style={styles.vitalMetric}>
                      <Text style={styles.vitalLabel}>Resp. Rate</Text>
                      <Text style={styles.vitalValue}>
                        {appt.vitals?.respiratoryRate || '--'}
                      </Text>
                    </View>
                    <View style={styles.vitalMetric}>
                      <Text style={styles.vitalLabel}>Weight</Text>
                      <Text style={styles.vitalValue}>
                        {appt.vitals?.weight || '--'}
                      </Text>
                    </View>
                    <View style={styles.vitalMetric}>
                      <Text style={styles.vitalLabel}>Recorded By</Text>
                      <Text style={styles.vitalValue} numberOfLines={1}>
                        {appt.vitals?.recordedBy || 'Nursing Triage'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}

        {/* Tab 4: Labs & Rx */}
        {activeTab === 'records' ? (
          <View>
            <Text style={styles.sectionHeading}>
              Diagnostic Reports ({reports.length})
            </Text>
            {reports.length === 0 ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailDesc}>
                  No laboratory or radiology reports found.
                </Text>
              </View>
            ) : (
              reports.map((rep) => (
                <View key={rep.id} style={styles.detailCard}>
                  <View style={styles.detailCardTop}>
                    <View style={styles.allergyTitleWrap}>
                      <FlaskConical size={15} color="#0866C6" />
                      <Text style={styles.detailTitle}>{rep.testName}</Text>
                    </View>
                    <View style={styles.categoryChip}>
                      <Text style={styles.categoryChipText}>
                        {rep.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dateLabel}>
                    {rep.reportNumber} | {rep.category} | {rep.date}
                  </Text>
                  {rep.resultSummary ? (
                    <Text style={[styles.detailDesc, { marginTop: 6 }]}>
                      {rep.resultSummary}
                    </Text>
                  ) : null}
                </View>
              ))
            )}

            <Text style={[styles.sectionHeading, { marginTop: 14 }]}>
              Recent Prescriptions ({prescriptions.length})
            </Text>
            {prescriptions.length === 0 ? (
              <View style={styles.detailCard}>
                <Text style={styles.detailDesc}>No prior prescriptions on file.</Text>
              </View>
            ) : (
              prescriptions.map((rx) => (
                <View key={rx.id} style={styles.detailCard}>
                  <View style={styles.detailCardTop}>
                    <View style={styles.allergyTitleWrap}>
                      <FileText size={15} color="#16A34A" />
                      <Text style={styles.detailTitle}>{rx.prescriptionNumber}</Text>
                    </View>
                    <Text style={styles.dateLabel}>{rx.date}</Text>
                  </View>
                  <Text style={styles.detailDesc}>
                    Dx: {rx.diagnosis || 'General OPD Consultation'} ({rx.items.length}{' '}
                    medicines)
                  </Text>
                  <View style={styles.rxMedChips}>
                    {rx.items.slice(0, 3).map((m, idx) => (
                      <View key={idx} style={styles.medChip}>
                        <Text style={styles.medChipText}>
                          {m.medicineName} {m.dosage}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>

      {/* Add History Note Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medical History Entry</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.catRow}>
              {(
                ['condition', 'surgery', 'allergy', 'immunization', 'general'] as const
              ).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catPill,
                    newCategory === cat && styles.catPillActive,
                  ]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      newCategory === cat && styles.catPillTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Type 2 Diabetes Mellitus"
              placeholderTextColor="#94A3B8"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text style={styles.inputLabel}>Clinical Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Diagnosed year, severity, ongoing treatment..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={newDescription}
              onChangeText={setNewDescription}
            />

            <TouchableOpacity
              style={[styles.saveBtn, savingHistory && { opacity: 0.7 }]}
              onPress={handleSaveHistory}
              disabled={savingHistory}
            >
              <Activity size={16} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {savingHistory ? 'Saving...' : 'Save to Medical Record'}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
  },
  retryLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0866C6',
  },
  profileInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
  },
  patientMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  bloodBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bloodBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0866C6',
  },
  allergyAlertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  allergyAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  nkdaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nkdaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  contactStrip: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  emergencyRow: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  emergencyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  emergencyValue: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  quickBtnPrimary: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  quickBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  quickBtnText: {
    color: '#0866C6',
    fontWeight: '700',
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabPillActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0866C6',
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 10,
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addNoteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  severeAllergyCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  detailCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  allergyTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  categoryChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0866C6',
  },
  dateLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 4,
  },
  detailDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  recordedBy: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  severitySevere: {
    backgroundColor: '#FEE2E2',
  },
  severityMod: {
    backgroundColor: '#FEF3C7',
  },
  severityMild: {
    backgroundColor: '#EFF6FF',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  vitalsBreakdownGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  vitalMetric: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  vitalValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 2,
  },
  rxMedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  medChip: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  medChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 6,
    marginTop: 8,
  },
  catRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textTransform: 'capitalize',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#142D4E',
  },
  textArea: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: '#0866C6',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default DoctorPatientDetailsScreen;
