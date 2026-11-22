import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Stethoscope,
  Activity,
  FlaskConical,
  ScanLine,
  Calendar,
  FileText,
  Pill,
  CheckSquare,
  Square,
  Save,
  Plus,
  X,
  ClipboardList,
  AlertTriangle,
  Users,
} from 'lucide-react-native';
import { VitalsSummaryBadge } from '../../components/doctor';
import { patientService } from '../../services/patientService';
import { laboratoryService } from '../../services/laboratoryService';
import { appointmentService } from '../../services/appointmentService';
import { opdTokenService } from '../../services/opdTokenService';
import type { LabTest, RadiologyOrder } from '../../types/laboratory';
import type { AllergyItem, Patient } from '../../types/patient';

const ICD10_PRESETS = [
  { code: 'J06.9', title: 'Acute URI' },
  { code: 'I10', title: 'Essential Hypertension' },
  { code: 'E11.9', title: 'Type 2 Diabetes' },
  { code: 'R50.9', title: 'Pyrexia / Fever' },
  { code: 'K29.7', title: 'Gastritis' },
  { code: 'M54.5', title: 'Low Back Pain' },
];

const RADIOLOGY_MODALITIES: Array<RadiologyOrder['modality']> = [
  'X-Ray',
  'CT',
  'MRI',
  'Ultrasound',
];

const RADIOLOGY_URGENCIES: Array<RadiologyOrder['urgency']> = [
  'routine',
  'urgent',
  'emergency',
];

const RADIOLOGY_PRESETS: Record<RadiologyOrder['modality'], string[]> = {
  'X-Ray': ['Chest X-Ray (PA View)', 'Cervical Spine AP/Lat', 'Right Knee AP/Lat'],
  CT: ['CT Head Plain', 'CT Chest HRCT', 'CT Abdomen & Pelvis w/ Contrast'],
  MRI: ['MRI Brain w/o Contrast', 'MRI Lumbar Spine', 'MRI Right Shoulder'],
  Ultrasound: ['Ultrasound Whole Abdomen', 'KUB Ultrasound', 'Echocardiography 2D'],
};

const TREATMENT_CHIPS = [
  'Adequate hydration & oral fluids',
  'Low-sodium balanced diet',
  'Monitor blood pressure twice daily',
  'Complete prescribed antibiotic course',
  'Seek urgent ER care if fever > 102 F or dyspnea',
];

export const ConsultationNotesScreen: React.FC<{
  navigation?: any;
  route?: any;
}> = ({ navigation, route }) => {
  const paramObj = route?.params?.patient;
  const initialPatientId: string =
    route?.params?.patientId || paramObj?.patientId || 'pat-1';
  const initialPatientName: string =
    route?.params?.patientName || paramObj?.patientName || 'Ali Khan';
  const initialPatientMrn: string =
    route?.params?.patientMrn || paramObj?.patientMrn || 'P-00102';
  const initialTokenNumber: string =
    route?.params?.tokenNumber || paramObj?.tokenNumber || 'A-101';
  const initialTokenId: string | undefined =
    route?.params?.tokenId ||
    (typeof paramObj?.id === 'string' && paramObj.id.startsWith('tok-')
      ? paramObj.id
      : undefined);
  const initialVitals = route?.params?.vitals || paramObj?.vitals;
  const initialNotesParam: string = route?.params?.initialNotes || '';

  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId);
  const [selectedPatientName, setSelectedPatientName] =
    useState(initialPatientName);
  const [selectedPatientMrn, setSelectedPatientMrn] =
    useState(initialPatientMrn);
  const [activeTokenId, setActiveTokenId] = useState<string | undefined>(
    initialTokenId
  );
  const [activeTokenLabel, setActiveTokenLabel] = useState(initialTokenNumber);
  const [patientsList, setPatientsList] = useState<Patient[]>([]);
  const [queueTokens, setQueueTokens] = useState<
    Array<{ id: string; patientId: string; tokenNumber: string; status: string }>
  >([]);
  const [patientPickerVisible, setPatientPickerVisible] = useState(false);

  const [allergies, setAllergies] = useState<AllergyItem[]>([]);
  const [labCatalog, setLabCatalog] = useState<LabTest[]>([]);

  // Vitals state
  const [bp, setBp] = useState(
    initialVitals?.bloodPressure || initialVitals?.bp || '122/80 mmHg'
  );
  const [pulse, setPulse] = useState(initialVitals?.pulse || '76 bpm');
  const [temp, setTemp] = useState(
    initialVitals?.temperature || initialVitals?.temp || '98.8 °F'
  );
  const [spo2, setSpo2] = useState(
    initialVitals?.spo2 || initialVitals?.oxygenSaturation || '98%'
  );

  // Consultation fields
  const [chiefComplaint, setChiefComplaint] = useState(
    paramObj?.chiefComplaint ||
      (initialNotesParam.trim()
        ? initialNotesParam.trim()
        : 'Persistent cough, low-grade fever & fatigue x 3 days')
  );
  const [clinicalExam, setClinicalExam] = useState(
    'Alert, oriented x3. Mild pharyngeal erythema. Chest: bilateral vesicular breath sounds, no wheeze/crepitations. CVS: S1+S2 audible, no murmur.'
  );
  const [selectedIcd, setSelectedIcd] = useState<string[]>(['J06.9']);
  const [customDiagnosis, setCustomDiagnosis] = useState(
    'Acute Upper Respiratory Tract Infection'
  );
  const [treatmentPlan, setTreatmentPlan] = useState(
    'Symptomatic antipyretic & anti-inflammatory therapy, oral hydration, rest for 48 hours, and review if symptoms persist.'
  );

  // Diagnostic Orders: Labs
  const [selectedLabIds, setSelectedLabIds] = useState<string[]>([
    'Complete Blood Count (CBC) with ESR',
  ]);

  // Diagnostic Orders: Radiology
  const [radModality, setRadModality] =
    useState<RadiologyOrder['modality']>('X-Ray');
  const [radUrgency, setRadUrgency] =
    useState<RadiologyOrder['urgency']>('routine');
  const [radExamType, setRadExamType] = useState('Chest X-Ray (PA View)');
  const [radNotes, setRadNotes] = useState('Rule out lower respiratory infiltrate');
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>([]);

  // Notes & Follow-up
  const [doctorNotes, setDoctorNotes] = useState(
    initialNotesParam.trim()
      ? initialNotesParam.trim()
      : 'Patient counseled on red-flag signs and medication adherence.'
  );
  const [scheduleFollowUp, setScheduleFollowUp] = useState(true);
  const [followUpDays, setFollowUpDays] = useState('5');
  const [followUpBooked, setFollowUpBooked] = useState(false);

  // Summary & Save state
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    laboratoryService
      .getAvailableTests()
      .then((tests) => setLabCatalog(tests))
      .catch(() => {});
    patientService
      .getAllPatients()
      .then((list) => setPatientsList(list))
      .catch(() => {});
    opdTokenService
      .getDoctorQueue('doc-1')
      .then((q) => setQueueTokens(q.tokens || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    patientService
      .getAllergies(selectedPatientId)
      .then((a) => setAllergies(a))
      .catch(() => {});
  }, [selectedPatientId]);

  const toggleIcd = (code: string) => {
    setSelectedIcd((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleLabTest = (testName: string) => {
    setSelectedLabIds((prev) =>
      prev.includes(testName)
        ? prev.filter((t) => t !== testName)
        : [...prev, testName]
    );
  };

  const addRadiologyOrder = () => {
    if (!radExamType.trim()) {
      Alert.alert(
        'Missing Imaging Study',
        'Please specify the radiology exam or body part.'
      );
      return;
    }
    const newOrder: RadiologyOrder = {
      id: `rad-${Date.now()}`,
      patientId: selectedPatientId,
      doctorId: 'doc-1',
      examType: radExamType.trim(),
      modality: radModality,
      urgency: radUrgency,
      notes: radNotes.trim() || undefined,
      status: 'ordered',
      createdAt: new Date().toISOString(),
    };
    setRadiologyOrders((prev) => [newOrder, ...prev]);
    setRadNotes('');
  };

  const removeRadiologyOrder = (id: string) => {
    setRadiologyOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const getDiagnosisText = () => {
    const icdTitles = ICD10_PRESETS.filter((p) =>
      selectedIcd.includes(p.code)
    ).map((p) => `${p.code} - ${p.title}`);
    const parts = [...icdTitles];
    if (customDiagnosis.trim()) {
      parts.push(customDiagnosis.trim());
    }
    return parts.join('; ') || 'Clinical Consultation Assessment';
  };

  const getFollowUpDate = () => {
    const days = Math.max(1, parseInt(followUpDays || '5', 10) || 5);
    const d = new Date('2026-11-14T09:00:00Z');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const handleSaveConsultation = async () => {
    if (!chiefComplaint.trim()) {
      Alert.alert(
        'Chief Complaint Required',
        'Please enter the patient presenting complaint before saving.'
      );
      return;
    }

    setIsSaving(true);
    try {
      const diagnosisSummary = getDiagnosisText();
      const fullSummary = [
        `Complaint: ${chiefComplaint.trim()}`,
        `Exam: ${clinicalExam.trim()}`,
        `Diagnosis: ${diagnosisSummary}`,
        `Treatment Plan: ${treatmentPlan.trim()}`,
        selectedLabIds.length > 0 ? `Lab Orders: ${selectedLabIds.join(', ')}` : null,
        radiologyOrders.length > 0
          ? `Radiology: ${radiologyOrders
              .map((r) => `${r.modality} ${r.examType} (${r.urgency})`)
              .join(', ')}`
          : null,
        doctorNotes.trim() ? `Notes: ${doctorNotes.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      await patientService.addMedicalHistory({
        patientId: selectedPatientId,
        title: `OPD Consultation — ${diagnosisSummary}`,
        description: fullSummary,
        category: 'general',
        date: '2026-11-14',
        doctorName: 'Dr. Amit Sharma',
      });

      let didBookFollowUp = false;
      if (scheduleFollowUp && !followUpBooked) {
        await appointmentService.bookAppointment({
          patientId: selectedPatientId,
          doctorId: 'doc-1',
          date: getFollowUpDate(),
          startTime: '10:30 AM',
          timeSlot: '10:30 AM',
          mode: 'in_person',
          remarks: `Follow-up for ${diagnosisSummary}`,
        });
        setFollowUpBooked(true);
        didBookFollowUp = true;
      }

      if (activeTokenId && activeTokenId.startsWith('tok-')) {
        await opdTokenService.completeToken(activeTokenId).catch(() => {});
      }

      setSavedSuccess(true);
      setSummaryModalVisible(false);

      Alert.alert(
        'Consultation Saved',
        `Consultation record saved for ${selectedPatientName}.${
          didBookFollowUp
            ? ` Follow-up booked for ${getFollowUpDate()}.`
            : followUpBooked
              ? ' Follow-up appointment already booked.'
              : ''
        }`,
        [
          {
            text: 'Issue Prescription',
            onPress: handleProceedToRx,
          },
          {
            text: 'Return to Dashboard',
            onPress: () =>
              navigation?.navigate?.('DoctorTabs', {
                screen: 'DoctorDashboardTab',
              }),
          },
        ]
      );
    } catch {
      Alert.alert(
        'Save Failed',
        'Could not persist consultation record. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleProceedToRx = () => {
    const matchedPatient = patientsList.find((p) => p.id === selectedPatientId);
    navigation?.navigate?.('PrescriptionBuilder', {
      patientId: selectedPatientId,
      patientName: selectedPatientName,
      patientMrn: selectedPatientMrn,
      age: matchedPatient?.age,
      gender: matchedPatient?.gender,
      diagnosis: getDiagnosisText(),
      symptoms: chiefComplaint.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <ArrowLeft size={22} color="#142D4E" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Clinical Consultation</Text>
          <Text style={styles.headerSub}>
            {selectedPatientName} | MRN: {selectedPatientMrn}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.switchPatientBtn}
          onPress={() => setPatientPickerVisible(true)}
        >
          <Users size={14} color="#0866C6" />
          <Text style={styles.switchPatientText}>{activeTokenLabel}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Allergy Warning Banner */}
        {allergies.length > 0 ? (
          <View style={styles.allergyWarningBanner}>
            <AlertTriangle size={16} color="#DC2626" />
            <Text style={styles.allergyWarningText}>
              Allergy Alert:{' '}
              {allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ')}
            </Text>
          </View>
        ) : null}

        {savedSuccess ? (
          <View style={styles.savedBanner}>
            <Text style={styles.savedBannerText}>
              Consultation documented and archived to patient chart.
            </Text>
          </View>
        ) : null}

        {/* 1. Chief Complaint */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FileText size={16} color="#0866C6" />
            <Text style={styles.cardTitle}>Presenting Chief Complaint</Text>
          </View>
          <TextInput
            style={styles.multilineInput}
            multiline
            numberOfLines={3}
            placeholder="Describe patient symptoms, duration, and onset..."
            placeholderTextColor="#94A3B8"
            value={chiefComplaint}
            onChangeText={setChiefComplaint}
          />
        </View>

        {/* 2. Vitals Summary & Edit */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={16} color="#0866C6" />
            <Text style={styles.cardTitle}>Vitals Snapshot</Text>
          </View>
          <VitalsSummaryBadge
            vitals={{
              bp,
              pulse,
              temp,
              spO2: spo2,
            }}
          />
          <View style={styles.vitalsEditGrid}>
            <View style={styles.vitalField}>
              <Text style={styles.fieldLabel}>BP</Text>
              <TextInput
                style={styles.smallInput}
                value={bp}
                onChangeText={setBp}
              />
            </View>
            <View style={styles.vitalField}>
              <Text style={styles.fieldLabel}>Pulse</Text>
              <TextInput
                style={styles.smallInput}
                value={pulse}
                onChangeText={setPulse}
              />
            </View>
            <View style={styles.vitalField}>
              <Text style={styles.fieldLabel}>Temp</Text>
              <TextInput
                style={styles.smallInput}
                value={temp}
                onChangeText={setTemp}
              />
            </View>
            <View style={styles.vitalField}>
              <Text style={styles.fieldLabel}>SpO2</Text>
              <TextInput
                style={styles.smallInput}
                value={spo2}
                onChangeText={setSpo2}
              />
            </View>
          </View>
        </View>

        {/* 3. Clinical Examination */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Stethoscope size={16} color="#0866C6" />
            <Text style={styles.cardTitle}>Clinical Examination</Text>
          </View>
          <TextInput
            style={[styles.multilineInput, { minHeight: 84 }]}
            multiline
            placeholder="General appearance, HEENT, CVS, Respiratory, Abdomen findings..."
            placeholderTextColor="#94A3B8"
            value={clinicalExam}
            onChangeText={setClinicalExam}
          />
        </View>

        {/* 4. Diagnosis */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ClipboardList size={16} color="#0866C6" />
            <Text style={styles.cardTitle}>Clinical Diagnosis (ICD-10)</Text>
          </View>
          <View style={styles.icdWrap}>
            {ICD10_PRESETS.map((icd) => {
              const active = selectedIcd.includes(icd.code);
              return (
                <TouchableOpacity
                  key={icd.code}
                  style={[styles.icdChip, active && styles.icdChipActive]}
                  onPress={() => toggleIcd(icd.code)}
                >
                  <Text
                    style={[
                      styles.icdChipText,
                      active && styles.icdChipTextActive,
                    ]}
                  >
                    {icd.code} {icd.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            style={styles.singleInput}
            placeholder="Primary or provisional diagnosis..."
            placeholderTextColor="#94A3B8"
            value={customDiagnosis}
            onChangeText={setCustomDiagnosis}
          />
        </View>

        {/* 5. Treatment Plan */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={16} color="#16A34A" />
            <Text style={styles.cardTitle}>Treatment Plan &amp; Care Goals</Text>
          </View>
          <View style={styles.chipRowWrap}>
            {TREATMENT_CHIPS.map((hint, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.hintChip}
                onPress={() =>
                  setTreatmentPlan((prev) =>
                    prev.includes(hint)
                      ? prev
                      : prev.trim()
                        ? `${prev.trim()} ${hint}.`
                        : `${hint}.`
                  )
                }
              >
                <Plus size={11} color="#0866C6" />
                <Text style={styles.hintChipText}>{hint}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.multilineInput, { minHeight: 80 }]}
            multiline
            placeholder="Outline therapy regimen, lifestyle recommendations, precautions..."
            placeholderTextColor="#94A3B8"
            value={treatmentPlan}
            onChangeText={setTreatmentPlan}
          />
        </View>

        {/* 6. Lab Test Orders */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FlaskConical size={16} color="#0866C6" />
            <Text style={styles.cardTitle}>
              Lab Test Orders ({selectedLabIds.length} selected)
            </Text>
          </View>
          {(labCatalog.length > 0
            ? labCatalog.map((t) => ({
                label: t.name,
                sub: `${t.category} | ~${t.turnaroundHours}h`,
              }))
            : [
                { label: 'Complete Blood Count (CBC)', sub: 'Hematology | 4h' },
                { label: 'Basic Metabolic Panel (BMP)', sub: 'Biochemistry | 6h' },
                { label: 'Lipid Profile', sub: 'Biochemistry | 6h' },
                { label: 'HbA1c (Glycated Hemoglobin)', sub: 'Endocrine | 12h' },
                { label: 'Liver Function Tests (LFT)', sub: 'Biochemistry | 8h' },
              ]
          ).map((test) => {
            const checked = selectedLabIds.includes(test.label);
            return (
              <TouchableOpacity
                key={test.label}
                style={[styles.testRow, checked && styles.testRowActive]}
                onPress={() => toggleLabTest(test.label)}
              >
                {checked ? (
                  <CheckSquare size={18} color="#0866C6" />
                ) : (
                  <Square size={18} color="#94A3B8" />
                )}
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text
                    style={[
                      styles.testOrderText,
                      checked && styles.testOrderTextActive,
                    ]}
                  >
                    {test.label}
                  </Text>
                  <Text style={styles.testSubText}>{test.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 7. Radiology Orders */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ScanLine size={16} color="#7C3AED" />
            <Text style={styles.cardTitle}>
              Radiology &amp; Imaging Orders ({radiologyOrders.length})
            </Text>
          </View>

          <Text style={styles.subFieldLabel}>Imaging Modality</Text>
          <View style={styles.pillsRow}>
            {RADIOLOGY_MODALITIES.map((mod) => {
              const active = radModality === mod;
              return (
                <TouchableOpacity
                  key={mod}
                  style={[styles.modPill, active && styles.modPillActive]}
                  onPress={() => {
                    setRadModality(mod);
                    setRadExamType(RADIOLOGY_PRESETS[mod][0]);
                  }}
                >
                  <Text
                    style={[
                      styles.modPillText,
                      active && styles.modPillTextActive,
                    ]}
                  >
                    {mod}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.subFieldLabel}>Urgency Priority</Text>
          <View style={styles.pillsRow}>
            {RADIOLOGY_URGENCIES.map((urg) => {
              const active = radUrgency === urg;
              return (
                <TouchableOpacity
                  key={urg}
                  style={[
                    styles.urgPill,
                    active &&
                      (urg === 'emergency'
                        ? { backgroundColor: '#DC2626', borderColor: '#DC2626' }
                        : urg === 'urgent'
                          ? { backgroundColor: '#D97706', borderColor: '#D97706' }
                          : { backgroundColor: '#0866C6', borderColor: '#0866C6' }),
                  ]}
                  onPress={() => setRadUrgency(urg)}
                >
                  <Text
                    style={[styles.urgPillText, active && { color: '#FFFFFF' }]}
                  >
                    {urg.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.subFieldLabel}>Exam / Study Type</Text>
          <View style={styles.chipRowWrap}>
            {RADIOLOGY_PRESETS[radModality].map((study) => (
              <TouchableOpacity
                key={study}
                style={[
                  styles.hintChip,
                  radExamType === study && {
                    backgroundColor: '#EDE9FE',
                    borderColor: '#7C3AED',
                  },
                ]}
                onPress={() => setRadExamType(study)}
              >
                <Text
                  style={[
                    styles.hintChipText,
                    radExamType === study && { color: '#5B21B6' },
                  ]}
                >
                  {study}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.singleInput, { marginBottom: 8 }]}
            placeholder="Custom imaging exam..."
            placeholderTextColor="#94A3B8"
            value={radExamType}
            onChangeText={setRadExamType}
          />
          <TextInput
            style={[styles.singleInput, { marginBottom: 10 }]}
            placeholder="Clinical indication for radiologist..."
            placeholderTextColor="#94A3B8"
            value={radNotes}
            onChangeText={setRadNotes}
          />

          <TouchableOpacity
            style={styles.addRadBtn}
            onPress={addRadiologyOrder}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.addRadBtnText}>Add Radiology Order</Text>
          </TouchableOpacity>

          {radiologyOrders.map((ord) => (
            <View key={ord.id} style={styles.radOrderItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.radOrderTitle}>
                  {ord.modality}: {ord.examType}
                </Text>
                <Text style={styles.radOrderMeta}>
                  Urgency: {ord.urgency.toUpperCase()}
                  {ord.notes ? ` | ${ord.notes}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeRadiologyOrder(ord.id)}>
                <X size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* 8. Notes & Follow-up Appointment */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Calendar size={16} color="#0866C6" />
            <Text style={styles.cardTitle}>
              Consultation Notes &amp; Follow-Up
            </Text>
          </View>
          <TextInput
            style={styles.multilineInput}
            multiline
            placeholder="Additional doctor notes, counseling, or referrals..."
            placeholderTextColor="#94A3B8"
            value={doctorNotes}
            onChangeText={setDoctorNotes}
          />

          <View style={styles.followUpSwitchRow}>
            <Text style={styles.followUpLabel}>
              Book Follow-Up Appointment
            </Text>
            <Switch
              value={scheduleFollowUp}
              onValueChange={setScheduleFollowUp}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={scheduleFollowUp ? '#0866C6' : '#64748B'}
            />
          </View>

          {scheduleFollowUp ? (
            <View style={styles.followUpRow}>
              <Text style={styles.followUpLabel}>Review in</Text>
              <TextInput
                style={styles.followUpInput}
                keyboardType="numeric"
                value={followUpDays}
                onChangeText={setFollowUpDays}
              />
              <Text style={styles.followUpDaysText}>
                days ({getFollowUpDate()})
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.rxButton}
            onPress={handleProceedToRx}
          >
            <Pill size={18} color="#FFFFFF" />
            <Text style={styles.rxButtonText}>Build e-Prescription (Rx)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryBtn}
            onPress={() => setSummaryModalVisible(true)}
          >
            <FileText size={18} color="#0866C6" />
            <Text style={styles.summaryBtnText}>
              Preview Consultation Summary
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveNotesBtn, isSaving && { opacity: 0.7 }]}
            disabled={isSaving}
            onPress={handleSaveConsultation}
          >
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.saveNotesBtnText}>
              {isSaving ? 'Saving Consultation...' : 'Save Consultation Record'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Consultation Summary Preview Modal */}
      <Modal
        visible={summaryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSummaryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Consultation Summary</Text>
              <TouchableOpacity onPress={() => setSummaryModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.sumSection}>Patient</Text>
              <Text style={styles.sumVal}>
                {selectedPatientName} (MRN: {selectedPatientMrn})
              </Text>

              <Text style={styles.sumSection}>Chief Complaint</Text>
              <Text style={styles.sumVal}>{chiefComplaint}</Text>

              <Text style={styles.sumSection}>Vitals</Text>
              <Text style={styles.sumVal}>
                BP: {bp} | Pulse: {pulse} | Temp: {temp} | SpO2: {spo2}
              </Text>

              <Text style={styles.sumSection}>Clinical Exam</Text>
              <Text style={styles.sumVal}>{clinicalExam}</Text>

              <Text style={styles.sumSection}>Diagnosis</Text>
              <Text style={styles.sumVal}>{getDiagnosisText()}</Text>

              <Text style={styles.sumSection}>Treatment Plan</Text>
              <Text style={styles.sumVal}>{treatmentPlan}</Text>

              <Text style={styles.sumSection}>
                Ordered Investigations ({selectedLabIds.length + radiologyOrders.length})
              </Text>
              <Text style={styles.sumVal}>
                {selectedLabIds.length > 0
                  ? `Labs: ${selectedLabIds.join(', ')}\n`
                  : ''}
                {radiologyOrders.length > 0
                  ? `Radiology: ${radiologyOrders
                      .map((r) => `${r.modality} ${r.examType} [${r.urgency}]`)
                      .join(', ')}`
                  : selectedLabIds.length === 0
                    ? 'None ordered'
                    : ''}
              </Text>

              <Text style={styles.sumSection}>Follow-Up</Text>
              <Text style={styles.sumVal}>
                {scheduleFollowUp
                  ? `Scheduled in ${followUpDays} days (${getFollowUpDate()})`
                  : 'PRN / No scheduled follow-up'}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveNotesBtn}
              disabled={isSaving}
              onPress={handleSaveConsultation}
            >
              <Save size={16} color="#FFFFFF" />
              <Text style={styles.saveNotesBtnText}>
                Confirm &amp; Save Consultation
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Patient Picker Modal */}
      <Modal
        visible={patientPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPatientPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Select Consultation Patient</Text>
              <TouchableOpacity
                onPress={() => setPatientPickerVisible(false)}
              >
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {patientsList.map((pat) => (
                <TouchableOpacity
                  key={pat.id}
                  style={styles.patientPickRow}
                  onPress={async () => {
                    setSelectedPatientId(pat.id);
                    setSelectedPatientName(pat.name);
                    setSelectedPatientMrn(pat.mrn);
                    setSavedSuccess(false);
                    setFollowUpBooked(false);
                    setRadiologyOrders([]);
                    const patToken = queueTokens.find(
                      (t) =>
                        t.patientId === pat.id &&
                        t.status !== 'completed' &&
                        t.status !== 'cancelled'
                    );
                    setActiveTokenId(patToken?.id);
                    setActiveTokenLabel(patToken?.tokenNumber || 'Switch');
                    try {
                      const patAppts = await appointmentService.getAppointments({
                        patientId: pat.id,
                      });
                      const latestVitals = patAppts.find((a) => a.vitals)?.vitals;
                      if (latestVitals) {
                        setBp(latestVitals.bloodPressure);
                        setPulse(latestVitals.pulse);
                        setTemp(latestVitals.temperature);
                        setSpo2(latestVitals.oxygenSaturation || '98%');
                      }
                    } catch {
                      // keep editable baseline vitals
                    }
                    setPatientPickerVisible(false);
                  }}
                >
                  <Text style={styles.pickName}>{pat.name}</Text>
                  <Text style={styles.pickMeta}>
                    MRN: {pat.mrn} | {pat.age} | {pat.bloodGroup}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  switchPatientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  switchPatientText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 42,
  },
  allergyWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  allergyWarningText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#991B1B',
  },
  savedBanner: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  savedBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
  },
  multilineInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#142D4E',
    minHeight: 72,
    textAlignVertical: 'top',
  },
  singleInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 13,
    color: '#142D4E',
  },
  vitalsEditGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  vitalField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
  },
  icdWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  icdChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  icdChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  icdChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  icdChipTextActive: {
    color: '#FFFFFF',
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  hintChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  hintChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0866C6',
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
  },
  testRowActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  testOrderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#142D4E',
  },
  testOrderTextActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  testSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  subFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 4,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  modPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modPillActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  modPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modPillTextActive: {
    color: '#FFFFFF',
  },
  urgPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  urgPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  addRadBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addRadBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  radOrderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  radOrderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4C1D95',
  },
  radOrderMeta: {
    fontSize: 11,
    color: '#6D28D9',
    marginTop: 2,
  },
  followUpSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  followUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  followUpLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  followUpInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    width: 44,
    height: 32,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 13,
    color: '#0866C6',
  },
  followUpDaysText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  footerActions: {
    gap: 10,
    marginTop: 6,
  },
  rxButton: {
    backgroundColor: '#0866C6',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  rxButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  summaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#0866C6',
  },
  summaryBtnText: {
    color: '#0866C6',
    fontSize: 14,
    fontWeight: '700',
  },
  saveNotesBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveNotesBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    maxHeight: '85%',
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
  modalBody: {
    marginBottom: 14,
  },
  sumSection: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0866C6',
    textTransform: 'uppercase',
    marginTop: 10,
  },
  sumVal: {
    fontSize: 13,
    color: '#142D4E',
    marginTop: 2,
    lineHeight: 19,
  },
  patientPickRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  pickMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});

export default ConsultationNotesScreen;
