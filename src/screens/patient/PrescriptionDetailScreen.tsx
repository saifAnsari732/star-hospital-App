import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Share } from '../../utils/share';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Download,
  Pill,
  CheckCircle,
  FileText,
  Building,
} from 'lucide-react-native';
import { prescriptionService } from '../../services';
import { Prescription } from '../../types/prescription';
import { MOCK_PRESCRIPTIONS } from './MyPrescriptionsScreen';

export interface PrescriptionDetailScreenProps {
  navigation: any;
  route: {
    params?: {
      prescriptionId?: string;
    };
  };
}

export const PrescriptionDetailScreen: React.FC<PrescriptionDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const [downloading, setDownloading] = useState<boolean>(false);

  const prescriptionId = route.params?.prescriptionId || 'rx-1';
  const fallbackRx =
    MOCK_PRESCRIPTIONS.find((p) => p.id === prescriptionId) || MOCK_PRESCRIPTIONS[0];
  const [prescription, setPrescription] = useState<Prescription>(fallbackRx);

  useEffect(() => {
    let active = true;
    prescriptionService
      .getPrescriptionById(prescriptionId)
      .then((rx) => {
        if (active && rx) {
          setPrescription(rx);
        }
      })
      .catch(() => {
        // Fallback already populated
      });
    return () => {
      active = false;
    };
  }, [prescriptionId]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Prescription ${prescription.prescriptionNumber}`,
        message:
          `Star Hospital Prescription: ${prescription.prescriptionNumber}\n` +
          `Doctor: ${prescription.doctorName} (${prescription.doctorDepartment})\n` +
          `Patient: ${prescription.patientName} (MRN: ${prescription.patientMrn})\n` +
          `Diagnosis: ${prescription.diagnosis}\n` +
          `Date: ${prescription.date}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const medsSummary = (prescription.items || [])
        .map((m) => `- ${m.medicineName} (${m.dosage}, ${m.frequency} for ${m.duration})`)
        .join('\n');
      await Share.share({
        title: `Star Hospital Prescription ${prescription.prescriptionNumber}`,
        message:
          `STAR HOSPITAL PRESCRIPTION (${prescription.prescriptionNumber})\n` +
          `Patient: ${prescription.patientName}\n` +
          `Doctor: ${prescription.doctorName} (${prescription.doctorDepartment})\n` +
          `Diagnosis: ${prescription.diagnosis}\n\n` +
          `Medicines:\n${medsSummary || 'See clinic chart'}\n\n` +
          `Note: Official signed PDF download requires ICTHospital document endpoint integration.`,
      });
    } catch {
      Alert.alert(
        'PDF Export Notice',
        'Direct PDF binary storage requires ICTHospital document endpoint integration. Use Share to export your prescription details.'
      );
    } finally {
      setDownloading(false);
    }
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
        <Text style={styles.headerTitle}>Prescription</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share Prescription"
        >
          <Share2 size={20} color="#0866C6" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Prescription Paper Document Card */}
        <View style={styles.paperDocCard}>
          {/* Hospital Header */}
          <View style={styles.hospitalBrandingRow}>
            <View style={styles.brandingLeft}>
              <View style={styles.hospitalLogoBadge}>
                <Building size={20} color="#0866C6" />
              </View>
              <View>
                <Text style={styles.hospitalTitle}>STAR HOSPITAL</Text>
                <Text style={styles.hospitalTagline}>Care Today... Healthier Tomorrow...</Text>
              </View>
            </View>
            <View style={styles.rxBadge}>
              <Text style={styles.rxSymbol}>℞</Text>
            </View>
          </View>

          <View style={styles.paperDivider} />

          {/* Rx Meta Number and Date */}
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>PRESCRIPTION NO.</Text>
              <Text style={styles.metaValue}>{prescription.prescriptionNumber}</Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaLabel}>DATE</Text>
              <Text style={styles.metaValue}>{prescription.date}</Text>
            </View>
          </View>

          <View style={styles.paperDivider} />

          {/* Patient Details */}
          <View style={styles.patientInfoBox}>
            <Text style={styles.boxTitle}>PATIENT INFORMATION</Text>
            <View style={styles.infoGridRow}>
              <View style={styles.infoCol}>
                <Text style={styles.fieldLabel}>Name:</Text>
                <Text style={styles.fieldVal}>{prescription.patientName}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.fieldLabel}>MRN:</Text>
                <Text style={styles.fieldVal}>{prescription.patientMrn}</Text>
              </View>
            </View>
            <View style={styles.infoGridRow}>
              <View style={styles.infoCol}>
                <Text style={styles.fieldLabel}>Age / Gender:</Text>
                <Text style={styles.fieldVal}>
                  {prescription.patientAge} Yrs / {prescription.patientGender}
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.fieldLabel}>Validity:</Text>
                <Text style={styles.fieldVal}>{prescription.validity || '15 Days'}</Text>
              </View>
            </View>
          </View>

          {/* Doctor Details */}
          <View style={styles.doctorInfoBox}>
            <Text style={styles.boxTitle}>CONSULTING PHYSICIAN</Text>
            <Text style={styles.docName}>{prescription.doctorName}</Text>
            <Text style={styles.docQual}>{prescription.doctorQualification}</Text>
            <Text style={styles.docDept}>{prescription.doctorDepartment}</Text>
          </View>

          {/* Diagnosis & Symptoms */}
          {prescription.diagnosis ? (
            <View style={styles.diagnosisBox}>
              <Text style={styles.boxTitle}>DIAGNOSIS &amp; CLINICAL IMPRESSION</Text>
              <Text style={styles.diagnosisVal}>{prescription.diagnosis}</Text>
              {prescription.symptoms ? (
                <Text style={styles.symptomsVal}>Symptoms: {prescription.symptoms}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Medicines List */}
          <View style={styles.medicinesSection}>
            <View style={styles.medSectionHeader}>
              <Pill size={16} color="#0866C6" />
              <Text style={styles.medSectionTitle}>Rx Prescribed Medicines</Text>
            </View>

            {prescription.items.map((item, idx) => (
              <TouchableOpacity
                key={item.id || idx}
                style={styles.medicineItemCard}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`View details for ${item.medicineName}`}
                onPress={() =>
                  navigation.navigate('MedicineDetails', {
                    medicineId: item.medicineId,
                    medicineName: item.medicineName,
                    genericName: item.genericName,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration,
                    instructions: item.instructions,
                  })
                }
              >
                <View style={styles.medIndexBadge}>
                  <Text style={styles.medIndexText}>{idx + 1}</Text>
                </View>

                <View style={styles.medDetails}>
                  <View style={styles.medNameRow}>
                    <Text style={styles.medName}>{item.medicineName}</Text>
                    <View style={styles.dosagePill}>
                      <Text style={styles.dosagePillText}>{item.dosage}</Text>
                    </View>
                    <ChevronRight size={15} color="#94A3B8" style={{ marginLeft: 4 }} />
                  </View>

                  <View style={styles.scheduleRow}>
                    <Text style={styles.scheduleLabel}>Frequency: </Text>
                    <Text style={styles.scheduleVal}>{item.frequency}</Text>
                    <Text style={styles.scheduleLabel}> • Duration: </Text>
                    <Text style={styles.scheduleVal}>{item.duration}</Text>
                  </View>

                  <Text style={styles.instructionsText}>Note: {item.instructions} • Tap for info</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Advice */}
          {prescription.advice ? (
            <View style={styles.adviceBox}>
              <Text style={styles.boxTitle}>GENERAL ADVICE &amp; INSTRUCTIONS</Text>
              <Text style={styles.adviceText}>{prescription.advice}</Text>
            </View>
          ) : null}

          {/* Digital Signature */}
          <View style={styles.signatureRow}>
            <View style={styles.verifiedStamp}>
              <CheckCircle size={16} color="#16A34A" />
              <Text style={styles.verifiedStampText}>Digitally Signed by Star Hospital</Text>
            </View>
            <View style={styles.signatureCol}>
              <Text style={styles.signatureName}>{prescription.doctorName}</Text>
              <Text style={styles.signatureSub}>Registered Medical Practitioner</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.downloadBtn}
            onPress={handleDownload}
            disabled={downloading}
            activeOpacity={0.85}
          >
            <Download size={18} color="#FFFFFF" style={styles.actionBtnIcon} />
            <Text style={styles.downloadBtnText}>
              {downloading ? 'Downloading PDF...' : 'Download PDF'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.orderMedsBtn}
            onPress={() =>
              Alert.alert(
                'Hospital Pharmacy Counter',
                `Direct home-delivery checkout is staged for backend integration. Show prescription ${prescription.prescriptionNumber} at Star Hospital Pharmacy Counter (Ground Floor) to collect your medicines.`
              )
            }
            activeOpacity={0.85}
          >
            <FileText size={18} color="#0866C6" style={styles.actionBtnIcon} />
            <Text style={styles.orderMedsBtnText}>Pharmacy Dispense Info</Text>
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
  headerActionBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  paperDocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  hospitalBrandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hospitalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064A91',
    letterSpacing: 0.5,
  },
  hospitalTagline: {
    fontSize: 11,
    color: '#2196F3',
  },
  rxBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxSymbol: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0866C6',
  },
  paperDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  patientInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  boxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0866C6',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  infoCol: {
    flex: 1,
    flexDirection: 'row',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#64748B',
    marginRight: 4,
  },
  fieldVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#142D4E',
  },
  doctorInfoBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
  },
  docQual: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  docDept: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0866C6',
    marginTop: 2,
  },
  diagnosisBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  diagnosisVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  symptomsVal: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  medicinesSection: {
    marginBottom: 14,
  },
  medSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  medSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    marginLeft: 6,
  },
  medicineItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  medIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  medIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  medDetails: {
    flex: 1,
  },
  medNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  medName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    flex: 1,
  },
  dosagePill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  dosagePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0866C6',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  scheduleLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  scheduleVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#142D4E',
  },
  instructionsText: {
    fontSize: 12,
    color: '#0866C6',
    fontStyle: 'italic',
  },
  adviceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  adviceText: {
    fontSize: 13,
    color: '#142D4E',
    lineHeight: 18,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  verifiedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedStampText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
    marginLeft: 4,
  },
  signatureCol: {
    alignItems: 'flex-end',
  },
  signatureName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  signatureSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  actionsRow: {
    gap: 10,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0866C6',
    borderRadius: 12,
    height: 50,
  },
  actionBtnIcon: {
    marginRight: 8,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  orderMedsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0866C6',
    borderRadius: 12,
    height: 50,
  },
  orderMedsBtnText: {
    color: '#0866C6',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default PrescriptionDetailScreen;
