import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Modal, Alert } from 'react-native';
import { Share } from '../../utils/share';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Plus,
  Pill,
  Clock,
  Calendar,
  AlertCircle,
  FileCheck2,
  Printer,
  Share2,
  X,
  Stethoscope,
  CheckCircle2,
} from 'lucide-react-native';
import {
  MedicineSearchInput,
  MedicineSuggestion,
} from '@/components/doctor/MedicineSearchInput';
import { PrescriptionItemRow } from '@/components/doctor/PrescriptionItemRow';
import { PrescriptionMedicineItem } from '@/types/prescription';
import type { AllergyItem } from '@/types/patient';
import type { Doctor } from '@/types/doctor';
import { prescriptionService } from '@/services/prescriptionService';
import { patientService } from '@/services/patientService';
import { doctorService } from '@/services/doctorService';
import { useAuth } from '@/context/AuthContext';

const FREQUENCY_OPTIONS = [
  { label: '1-0-1', hint: 'Twice daily (Morning & Night)' },
  { label: '1-1-1', hint: 'Thrice daily (Morning, Noon, Night)' },
  { label: '0-0-1', hint: 'Once daily at Bedtime' },
  { label: '1-0-0', hint: 'Once daily in Morning' },
  { label: 'SOS', hint: 'As needed for pain/fever' },
  { label: 'QID (1-1-1-1)', hint: 'Four times daily' },
];

const DURATION_PRESETS = ['3 Days', '5 Days', '7 Days', '14 Days', '30 Days'];

const INSTRUCTION_PRESETS = [
  'After meals',
  'Before meals',
  'Empty stomach in morning',
  'With plenty of water',
  'Before bedtime',
];

interface PrescriptionBuilderProps {
  navigation?: any;
  route?: any;
}

export const PrescriptionBuilderScreen: React.FC<PrescriptionBuilderProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const rawParamPatient = route?.params?.patient;
  const resolvedPatientId: string =
    route?.params?.patientId ||
    rawParamPatient?.patientId ||
    (rawParamPatient?.id && !String(rawParamPatient.id).startsWith('rx-')
      ? rawParamPatient.id
      : undefined) ||
    'pat-1';
  const doctorId = user?.id?.startsWith('doc-') ? user.id : 'doc-1';

  const [patientMeta, setPatientMeta] = useState({
    id: resolvedPatientId,
    patientName:
      route?.params?.patientName ||
      rawParamPatient?.patientName ||
      rawParamPatient?.name ||
      'Ali Khan',
    patientMrn:
      route?.params?.patientMrn ||
      rawParamPatient?.patientMrn ||
      rawParamPatient?.mrn ||
      'P-00102',
    age: route?.params?.age || rawParamPatient?.age || 34,
    gender: route?.params?.gender || rawParamPatient?.gender || 'Male',
    diagnosis:
      route?.params?.diagnosis ||
      rawParamPatient?.diagnosis ||
      'Acute Upper Respiratory Tract Infection',
    symptoms:
      route?.params?.symptoms || rawParamPatient?.symptoms || '',
    advice: route?.params?.advice || rawParamPatient?.advice || '',
  });
  const [doctorProfile, setDoctorProfile] = useState<Doctor | null>(null);
  const [allergies, setAllergies] = useState<AllergyItem[]>([]);

  useEffect(() => {
    let active = true;
    patientService
      .getProfile(resolvedPatientId)
      .then((profile) => {
        if (!active || !profile) return;
        setPatientMeta((prev) => ({
          ...prev,
          id: profile.id,
          patientName:
            route?.params?.patientName ||
            rawParamPatient?.patientName ||
            profile.name,
          patientMrn:
            route?.params?.patientMrn ||
            rawParamPatient?.patientMrn ||
            profile.mrn,
          age: route?.params?.age || rawParamPatient?.age || profile.age,
          gender:
            route?.params?.gender || rawParamPatient?.gender || profile.gender,
        }));
      })
      .catch(() => {});
    patientService
      .getAllergies(resolvedPatientId)
      .then((list) => {
        if (active) setAllergies(list);
      })
      .catch(() => {});
    doctorService
      .getDoctorById(doctorId)
      .then((doc) => {
        if (active) setDoctorProfile(doc);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [resolvedPatientId, doctorId, route?.params, rawParamPatient]);

  const patient = patientMeta;
  const doctorDisplayName = doctorProfile?.name || user?.name || 'Dr. Amit Sharma';
  const doctorQualification =
    doctorProfile?.qualification || 'MBBS, MD - General Medicine';
  const doctorDepartment = doctorProfile?.department || 'General Physician';
  const doctorRoom = doctorProfile?.roomNo || 'Room 101';

  // Medicine list (allergy-safe baseline aligned with hospital inventory IDs)
  const [items, setItems] = useState<PrescriptionMedicineItem[]>([
    {
      id: 'rx-1',
      medicineId: 'med-2',
      medicineName: 'Paracetamol 500mg',
      genericName: 'Acetaminophen',
      dosage: '500mg',
      frequency: 'SOS',
      duration: '3 Days',
      instructions: 'When fever > 100°F or severe body ache',
    },
    {
      id: 'rx-2',
      medicineId: 'med-4',
      medicineName: 'Omeprazole 20mg',
      genericName: 'Omeprazole Magnesium',
      dosage: '20mg',
      frequency: '1-0-0',
      duration: '14 Days',
      instructions: 'Empty stomach 30 mins before breakfast',
    },
  ]);

  // New Drug Line Form State
  const [selectedDrug, setSelectedDrug] = useState<MedicineSuggestion | null>(null);
  const [drugName, setDrugName] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [frequency, setFrequency] = useState('1-0-1');
  const [duration, setDuration] = useState('5 Days');
  const [instructions, setInstructions] = useState('After meals');

  // Overall Advice & Notes
  const [generalAdvice, setGeneralAdvice] = useState(
    patientMeta.advice ||
      'Maintain adequate fluid intake. Avoid self-medication. Report immediately if rash, difficulty breathing, or severe dizziness occurs.'
  );

  // Rx Document Preview Modal State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rxNumber = useMemo(
    () => `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    []
  );

  const checkAllergyConflict = (name: string, generic?: string): AllergyItem | undefined => {
    const haystack = `${name} ${generic || ''}`.toLowerCase();
    return allergies.find((al) => {
      const allergen = al.allergen.toLowerCase();
      if (haystack.includes(allergen)) return true;
      if (
        allergen.includes('penicillin') &&
        (haystack.includes('amoxicillin') ||
          haystack.includes('augmentin') ||
          haystack.includes('co-amoxiclav'))
      ) {
        return true;
      }
      if (allergen.includes('sulfa') && haystack.includes('sulf')) {
        return true;
      }
      return false;
    });
  };

  const handleSelectSuggestion = (med: MedicineSuggestion) => {
    setSelectedDrug(med);
    setDrugName(med.name);
    setDosage(med.defaultDosage);
    setFrequency(med.defaultFrequency);
    const normalizedDuration = med.defaultDuration.replace(/\bdays\b/i, 'Days');
    setDuration(normalizedDuration);
  };

  const appendMedicineLine = () => {
    const newItem: PrescriptionMedicineItem = {
      id: `rx-${Date.now()}`,
      medicineId: selectedDrug?.id,
      medicineName: drugName.trim(),
      genericName: selectedDrug?.genericName || 'Prescribed Medicine',
      dosage: dosage.trim() || '1 Unit',
      frequency: frequency.trim(),
      duration: duration.trim(),
      instructions: instructions.trim(),
    };

    setItems((prev) => [...prev, newItem]);
    // Reset form
    setSelectedDrug(null);
    setDrugName('');
    setDosage('500mg');
    setFrequency('1-0-1');
    setDuration('5 Days');
    setInstructions('After meals');
  };

  const handleAddMedicine = () => {
    if (!drugName.trim()) {
      Alert.alert('Drug Required', 'Please select or enter a medicine name.');
      return;
    }

    const conflict = checkAllergyConflict(drugName, selectedDrug?.genericName);
    if (conflict) {
      Alert.alert(
        'Allergy Warning',
        `${patient.patientName} has a documented ${conflict.severity} allergy to ${conflict.allergen} (${conflict.reaction}). Are you sure you want to add ${drugName.trim()}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add Anyway',
            style: 'destructive',
            onPress: appendMedicineLine,
          },
        ]
      );
      return;
    }

    appendMedicineLine();
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSavePrescription = () => {
    if (items.length === 0) {
      Alert.alert(
        'Empty Prescription',
        'Add at least one medicine, or this prescription says nothing.'
      );
      return;
    }
    setShowPreviewModal(true);
  };

  const handleShareRx = async () => {
    try {
      const rxText = `STAR HOSPITAL - DIGITAL PRESCRIPTION (${rxNumber})\nPatient: ${patient.patientName} (${patient.age}y, ${patient.gender})\nDiagnosis: ${patient.diagnosis || 'Routine review'}\n\nMEDICINES:\n${items
        .map(
          (m, i) =>
            `${i + 1}. ${m.medicineName} - ${m.dosage} | ${m.frequency} | ${m.duration}\n   Instructions: ${m.instructions}`
        )
        .join('\n\n')}\n\nAdvice: ${generalAdvice}\nDoctor: ${doctorDisplayName}, ${doctorQualification} (${doctorDepartment})\n${doctorRoom}, Star Hospital`;

      await Share.share({
        message: rxText,
        title: `Prescription for ${patient.patientName}`,
      });
    } catch (error: any) {
      Alert.alert('Share Error', error.message);
    }
  };

  const handlePrintRx = () => {
    Alert.alert(
      'Print Sent',
      `Prescription ${rxNumber} sent to OPD Block B Network Printer.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <ChevronLeft size={22} color="#142D4E" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Prescription Builder</Text>
          <Text style={styles.headerSubtitle}>
            {patient.patientName} • {patient.patientMrn || 'P-10022'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.previewHeaderBtn}
          onPress={handleSavePrescription}
        >
          <FileCheck2 size={16} color="#0866C6" />
          <Text style={styles.previewHeaderBtnText}>Preview Rx</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Patient Demographics Bar */}
        <View style={styles.patientBar}>
          <View style={styles.patientBarDetails}>
            <Text style={styles.patientBarName}>{patient.patientName}</Text>
            <Text style={styles.patientBarSub}>
              {patient.age} yrs • {patient.gender} • MRN: {patient.patientMrn}
            </Text>
            {patient.diagnosis ? (
              <Text style={styles.patientBarDiag}>
                Dx: {patient.diagnosis}
              </Text>
            ) : null}
          </View>
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>{items.length} Drugs</Text>
          </View>
        </View>

        {allergies.length > 0 ? (
          <View style={styles.allergyBanner}>
            <AlertCircle size={16} color="#DC2626" />
            <Text style={styles.allergyBannerText}>
              Documented Allergies:{' '}
              {allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ')}
            </Text>
          </View>
        ) : null}

        {/* Section: Add Medicine Form */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Add Medicine to Rx</Text>

          {/* Search Medicine Input */}
          <Text style={styles.fieldLabel}>1. Search or Enter Drug Name</Text>
          <MedicineSearchInput
            onSelectMedicine={handleSelectSuggestion}
            placeholder="Search e.g. Paracetamol, Augmentin..."
          />

          {drugName ? (
            <View style={styles.selectedDrugBanner}>
              <Pill size={14} color="#0866C6" />
              <Text style={styles.selectedDrugText}>Selected: {drugName}</Text>
            </View>
          ) : null}

          {/* Dosage Input */}
          <View style={styles.formRow}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>2. Dosage</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 500mg, 1 tab"
                placeholderTextColor="#94A3B8"
                value={dosage}
                onChangeText={setDosage}
              />
            </View>

            {/* Duration Input */}
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>3. Duration</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 5 Days"
                placeholderTextColor="#94A3B8"
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>

          {/* Duration Preset Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {DURATION_PRESETS.map((dur) => (
              <TouchableOpacity
                key={dur}
                style={[
                  styles.presetChip,
                  duration === dur && styles.presetChipActive,
                ]}
                onPress={() => setDuration(dur)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    duration === dur && styles.presetChipTextActive,
                  ]}
                >
                  {dur}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Frequency Dropdown Chips */}
          <Text style={styles.fieldLabel}>4. Frequency</Text>
          <View style={styles.frequencyGrid}>
            {FREQUENCY_OPTIONS.map((f) => (
              <TouchableOpacity
                key={f.label}
                style={[
                  styles.frequencyOption,
                  frequency === f.label && styles.frequencyOptionActive,
                ]}
                onPress={() => setFrequency(f.label)}
              >
                <Text
                  style={[
                    styles.frequencyLabel,
                    frequency === f.label && styles.frequencyLabelActive,
                  ]}
                >
                  {f.label}
                </Text>
                <Text style={styles.frequencyHint} numberOfLines={1}>
                  {f.hint}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Instructions Input & Presets */}
          <Text style={styles.fieldLabel}>5. Instructions</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. After meals, with warm water"
            placeholderTextColor="#94A3B8"
            value={instructions}
            onChangeText={setInstructions}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {INSTRUCTION_PRESETS.map((inst) => (
              <TouchableOpacity
                key={inst}
                style={[
                  styles.presetChip,
                  instructions === inst && styles.presetChipActive,
                ]}
                onPress={() => setInstructions(inst)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    instructions === inst && styles.presetChipTextActive,
                  ]}
                >
                  {inst}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Add Line Button */}
          <TouchableOpacity
            style={styles.addDrugButton}
            onPress={handleAddMedicine}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addDrugButtonText}>
              Add Drug to Prescription
            </Text>
          </TouchableOpacity>
        </View>

        {/* Prescribed Items List */}
        <View style={styles.itemsSection}>
          <View style={styles.itemsSectionHeader}>
            <Text style={styles.cardTitle}>
              Prescribed Medicines ({items.length})
            </Text>
            <Text style={styles.itemsSub}>
              Review or remove medications below
            </Text>
          </View>

          {items.length > 0 ? (
            items.map((item, index) => (
              <PrescriptionItemRow
                key={item.id || index}
                item={item}
                index={index}
                onDelete={handleDeleteItem}
              />
            ))
          ) : (
            <View style={styles.emptyItemsCard}>
              <Pill size={32} color="#94A3B8" />
              <Text style={styles.emptyItemsTitle}>No Medicines Added</Text>
              <Text style={styles.emptyItemsText}>
                Use the form above to search and append medications to this prescription.
              </Text>
            </View>
          )}
        </View>

        {/* General Advice / Precautions */}
        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>General Advice & Precautions</Text>
          <TextInput
            style={[styles.textInput, { minHeight: 60 }]}
            multiline
            numberOfLines={3}
            placeholder="Dietary rules, precautions, warning signs..."
            placeholderTextColor="#94A3B8"
            value={generalAdvice}
            onChangeText={setGeneralAdvice}
          />
        </View>

        {/* Issue Rx Button */}
        <TouchableOpacity
          style={styles.issueRxButton}
          onPress={handleSavePrescription}
        >
          <CheckCircle2 size={20} color="#FFFFFF" />
          <Text style={styles.issueRxButtonText}>
            Save & Generate Formatted Rx
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Printable / Shareable Rx Modal Preview */}
      <Modal
        visible={showPreviewModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowPreviewModal(false)}
            >
              <X size={22} color="#142D4E" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Prescription Document</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalIconBtn}
                onPress={handlePrintRx}
              >
                <Printer size={18} color="#0866C6" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalIconBtn}
                onPress={handleShareRx}
              >
                <Share2 size={18} color="#0866C6" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            {/* Paper Document Layout */}
            <View style={styles.paperDocument}>
              {/* Star Hospital Header */}
              <View style={styles.hospitalLetterhead}>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.hospitalBrandName}>STAR HOSPITAL</Text>
                  <Text style={styles.rxNumberText}>{rxNumber}</Text>
                </View>
                <Text style={styles.hospitalTagline}>
                  Center for Advanced Cardiology & Multispecialty Care
                </Text>
                <Text style={styles.hospitalAddress}>
                  OPD Block B, Sector G-8, Islamabad • UAN: +92 51 111-STAR (7827)
                </Text>
              </View>

              <View style={styles.docDivider} />

              {/* Doctor Details */}
              <View style={styles.doctorBlock}>
                <Text style={styles.docName}>{doctorDisplayName}</Text>
                <Text style={styles.docQual}>{doctorQualification}</Text>
                <Text style={styles.docDept}>
                  Consultant {doctorDepartment} • {doctorRoom}
                </Text>
                <Text style={styles.docReg}>Star Hospital Clinical Authority</Text>
              </View>

              <View style={styles.docDivider} />

              {/* Patient Demographics */}
              <View style={styles.patientMetaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Patient Name:</Text>
                  <Text style={styles.metaVal}>{patient.patientName}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>MRN:</Text>
                  <Text style={styles.metaVal}>{patient.patientMrn || 'P-10022'}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Age / Sex:</Text>
                  <Text style={styles.metaVal}>
                    {patient.age} Y / {patient.gender}
                  </Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Date:</Text>
                  <Text style={styles.metaVal}>
                    {new Date().toLocaleDateString('en-GB')}
                  </Text>
                </View>
              </View>

              {patient.diagnosis ? (
                <View style={styles.diagBox}>
                  <Text style={styles.diagLabel}>Diagnosis:</Text>
                  <Text style={styles.diagContent}>{patient.diagnosis}</Text>
                </View>
              ) : null}

              {/* Rx Symbol */}
              <View style={styles.rxSymbolContainer}>
                <Text style={styles.rxSymbol}>℞</Text>
              </View>

              {/* Medicines Table */}
              <View style={styles.rxTable}>
                {items.map((item, idx) => (
                  <View key={idx} style={styles.rxTableRow}>
                    <Text style={styles.rxItemIndex}>{idx + 1}.</Text>
                    <View style={styles.rxItemDetails}>
                      <Text style={styles.rxDrugName}>{item.medicineName}</Text>
                      <Text style={styles.rxDrugDosage}>
                        Dosage: {item.dosage} | Frequency: {item.frequency} | Duration: {item.duration}
                      </Text>
                      {item.instructions ? (
                        <Text style={styles.rxDrugInstructions}>
                          Instructions: {item.instructions}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>

              {/* Advice */}
              <View style={styles.adviceBlock}>
                <Text style={styles.adviceHeading}>Advice & Instructions:</Text>
                <Text style={styles.adviceText}>{generalAdvice}</Text>
              </View>

              {/* Signature Line */}
              <View style={styles.signatureRow}>
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrText}>[Digital Verification QR]</Text>
                </View>
                <View style={styles.signLineContainer}>
                  <View style={styles.signLine} />
                  <Text style={styles.signDoctor}>{doctorDisplayName}</Text>
                  <Text style={styles.signTitle}>Authorized Signature</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.completeDismissBtn, isSubmitting && { opacity: 0.7 }]}
              disabled={isSubmitting}
              onPress={async () => {
                setIsSubmitting(true);
                try {
                  const created = await prescriptionService.createPrescription({
                    patientId: patient.id,
                    doctorId,
                    date: new Date().toISOString().split('T')[0],
                    symptoms: patient.symptoms || undefined,
                    diagnosis: patient.diagnosis,
                    advice: generalAdvice,
                    items,
                  });
                  setShowPreviewModal(false);
                  Alert.alert(
                    'Prescription Issued',
                    `Prescription ${created.prescriptionNumber || rxNumber} has been finalized and added to ${patient.patientName}'s medical records.`,
                    [
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
                    'Issue Failed',
                    'Could not save this prescription to patient records. Please try again.'
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Text style={styles.completeDismissText}>
                {isSubmitting ? 'Issuing Prescription...' : 'Finalize & Close'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  previewHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  patientBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  patientBarDetails: {
    flex: 1,
  },
  patientBarName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
  },
  patientBarSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  patientBarDiag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0866C6',
    marginTop: 3,
  },
  itemCountBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 4,
  },
  selectedDrugBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  selectedDrugText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  halfField: {
    flex: 1,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#142D4E',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  frequencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  frequencyOption: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  frequencyOptionActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0866C6',
  },
  frequencyLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  frequencyLabelActive: {
    color: '#0866C6',
  },
  frequencyHint: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  addDrugButton: {
    backgroundColor: '#0866C6',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  addDrugButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  itemsSection: {
    marginBottom: 14,
  },
  itemsSectionHeader: {
    marginBottom: 8,
  },
  itemsSub: {
    fontSize: 12,
    color: '#64748B',
  },
  emptyItemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyItemsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 6,
  },
  emptyItemsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  issueRxButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  issueRxButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  // Modal styles
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeModalBtn: {
    padding: 6,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F9FF',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  paperDocument: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hospitalLetterhead: {
    alignItems: 'center',
    marginBottom: 10,
  },
  brandTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
  },
  hospitalBrandName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0866C6',
    letterSpacing: 1,
  },
  rxNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  hospitalTagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#142D4E',
    marginTop: 2,
  },
  hospitalAddress: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  docDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  doctorBlock: {
    paddingVertical: 4,
  },
  docName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  docQual: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0866C6',
  },
  docDept: {
    fontSize: 11,
    color: '#64748B',
  },
  docReg: {
    fontSize: 10,
    color: '#94A3B8',
  },
  patientMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
  },
  metaCol: {
    width: '50%',
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
  },
  diagBox: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  diagLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#142D4E',
    marginRight: 6,
  },
  diagContent: {
    fontSize: 11,
    color: '#0866C6',
    fontWeight: '600',
    flex: 1,
  },
  rxSymbolContainer: {
    marginVertical: 8,
  },
  rxSymbol: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0866C6',
  },
  rxTable: {
    marginBottom: 14,
  },
  rxTableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rxItemIndex: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0866C6',
    width: 24,
  },
  rxItemDetails: {
    flex: 1,
  },
  rxDrugName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  rxDrugDosage: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  rxDrugInstructions: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  adviceBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  adviceHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
  },
  qrPlaceholder: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 6,
    padding: 6,
  },
  qrText: {
    fontSize: 9,
    color: '#94A3B8',
  },
  signLineContainer: {
    alignItems: 'center',
    width: 140,
  },
  signLine: {
    height: 1,
    backgroundColor: '#142D4E',
    width: '100%',
    marginBottom: 4,
  },
  signDoctor: {
    fontSize: 11,
    fontWeight: '700',
    color: '#142D4E',
  },
  signTitle: {
    fontSize: 9,
    color: '#64748B',
  },
  completeDismissBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  completeDismissText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  allergyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  allergyBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
    lineHeight: 16,
  },
});
