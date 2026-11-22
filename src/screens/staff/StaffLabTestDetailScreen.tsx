import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FlaskConical,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  X,
  User,
} from 'lucide-react-native';
import { StarHeader, StarLoader } from '../../components/common';
import { LabResultForm } from '../../components/staff/LabResultForm';
import { laboratoryService } from '../../services/laboratoryService';
import type { DiagnosticReportItem } from '../../types/laboratory';

const PRESET_REPORT_FILES = [
  'Diagnostic_Lab_Report_Signed.pdf',
  'Radiology_DICOM_Summary.pdf',
  'Hematology_Pathology_Sheet.pdf',
];

export const StaffLabTestDetailScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const reportId: string = route?.params?.reportId || 'rep-1';

  const [report, setReport] = useState<DiagnosticReportItem | null>(
    route?.params?.report || null
  );
  const [loading, setLoading] = useState(!route?.params?.report);
  const [entryModalVisible, setEntryModalVisible] = useState(false);

  // Upload lab report state
  const [uploadFileName, setUploadFileName] = useState(
    `${reportId.toUpperCase()}_Verified_Report.pdf`
  );
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    try {
      const data = await laboratoryService.getReportById(reportId);
      setReport(data);
      if (data.fileUrl) {
        setUploadedFileUrl(data.fileUrl);
      }
      setUploadFileName(
        `${data.reportNumber}_${data.testName.replace(/\s+/g, '_')}.pdf`
      );
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleUploadReport = async () => {
    if (!uploadFileName.trim()) {
      Alert.alert('File Name Required', 'Select or enter a report PDF filename.');
      return;
    }
    setUploading(true);
    try {
      const updated = await laboratoryService.saveLabResults({
        reportId: report?.id || reportId,
        results: report?.results || [],
        resultSummary:
          uploadNotes.trim() ||
          report?.resultSummary ||
          `Diagnostic report PDF (${uploadFileName.trim()}) attached & released.`,
        markCompleted: true,
      });
      const fakeUrl = `https://reports.starhospital.local/files/${uploadFileName.trim()}`;
      setUploadedFileUrl(fakeUrl);
      setReport({ ...updated, status: 'verified', fileUrl: fakeUrl });
      Alert.alert(
        'Report Uploaded & Released',
        `${uploadFileName.trim()} has been attached and made visible to the attending doctor and patient.`
      );
    } catch {
      Alert.alert('Upload Failed', 'Unable to attach diagnostic PDF.');
    } finally {
      setUploading(false);
    }
  };

  if (loading && !report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarHeader title="Lab Test Details" onBackPress={() => navigation.goBack()} />
        <StarLoader message="Loading specimen details..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Lab Test Details"
        subtitle={report?.reportNumber || reportId}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Test & Specimen Card */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.iconBox}>
              <FlaskConical size={22} color="#0866C6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.testTitle}>{report?.testName}</Text>
              <Text style={styles.testSub}>
                {report?.category} | {report?.type.toUpperCase()} | {report?.date}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                report?.status === 'completed' || report?.status === 'verified'
                  ? { backgroundColor: '#DCFCE7' }
                  : { backgroundColor: '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  report?.status === 'completed' || report?.status === 'verified'
                    ? { color: '#166534' }
                    : { color: '#92400E' },
                ]}
              >
                {(report?.status || 'pending').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaRow}>
            <User size={14} color="#64748B" />
            <Text style={styles.metaText}>
              Patient: {report?.patientName} (MRN: {report?.patientMrn || 'N/A'})
            </Text>
          </View>
          <View style={styles.metaRow}>
            <FileText size={14} color="#64748B" />
            <Text style={styles.metaText}>
              Ordered by: {report?.doctorName}
            </Text>
          </View>
        </View>

        {/* Parameters Table & Result Entry */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lab Parameters &amp; Findings</Text>
            <TouchableOpacity
              style={styles.enterResultBtn}
              onPress={() => setEntryModalVisible(true)}
            >
              <Edit3 size={14} color="#FFFFFF" />
              <Text style={styles.enterResultText}>Enter Results</Text>
            </TouchableOpacity>
          </View>

          {report?.results && report.results.length > 0 ? (
            report.results.map((param, idx) => (
              <View key={idx} style={styles.paramRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paramName}>{param.parameter}</Text>
                  <Text style={styles.paramRef}>
                    Ref: {param.referenceRange} {param.unit}
                  </Text>
                </View>
                <View style={styles.paramRight}>
                  <Text
                    style={[
                      styles.paramVal,
                      param.isAbnormal && { color: '#DC2626' },
                    ]}
                  >
                    {param.value} {param.unit}
                  </Text>
                  {param.isAbnormal ? (
                    <View style={styles.flagBadge}>
                      <AlertTriangle size={10} color="#DC2626" />
                      <Text style={styles.flagText}>
                        {param.flag || 'Abnormal'}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noParamsText}>
              No numerical results entered yet. Tap &ldquo;Enter Results&rdquo; to submit lab findings.
            </Text>
          )}

          {report?.resultSummary ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Pathologist / Tech Summary</Text>
              <Text style={styles.summaryText}>{report.resultSummary}</Text>
            </View>
          ) : null}
        </View>

        {/* Upload Lab Report Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Upload &amp; Release Lab Report PDF</Text>
          <Text style={styles.uploadHelp}>
            Attach signed PDF/imaging scan and release directly to Patient Records &amp; Doctor Chart.
          </Text>

          <View style={styles.presetRow}>
            {PRESET_REPORT_FILES.map((file) => (
              <TouchableOpacity
                key={file}
                style={[
                  styles.presetChip,
                  uploadFileName === file && styles.presetChipActive,
                ]}
                onPress={() => setUploadFileName(file)}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    uploadFileName === file && styles.presetChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {file}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Report filename (e.g. CBC_Signed.pdf)"
            placeholderTextColor="#94A3B8"
            value={uploadFileName}
            onChangeText={setUploadFileName}
          />

          <TextInput
            style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
            multiline
            placeholder="Release remarks or clinical highlight notes..."
            placeholderTextColor="#94A3B8"
            value={uploadNotes}
            onChangeText={setUploadNotes}
          />

          {uploadedFileUrl ? (
            <View style={styles.attachedFileBox}>
              <CheckCircle2 size={16} color="#16A34A" />
              <View style={{ flex: 1 }}>
                <Text style={styles.attachedTitle}>Attached Report File</Text>
                <Text style={styles.attachedUrl} numberOfLines={1}>
                  {uploadedFileUrl}
                </Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.uploadBtn, uploading && { opacity: 0.7 }]}
            disabled={uploading}
            onPress={handleUploadReport}
          >
            <Upload size={17} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>
              {uploading ? 'Uploading Report...' : 'Upload & Release Report'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Lab Result Form Modal */}
      <Modal
        visible={entryModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEntryModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enter Lab Result Parameters</Text>
              <TouchableOpacity onPress={() => setEntryModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {report ? (
              <LabResultForm
                testName={report.testName}
                patientName={report.patientName}
                initialParameters={report.results}
                initialSummary={report.resultSummary}
                onCancel={() => setEntryModalVisible(false)}
                onSave={async (payload) => {
                  try {
                    const updated = await laboratoryService.saveLabResults({
                      reportId: report.id,
                      results: payload.results,
                      resultSummary: payload.summary,
                      markCompleted: payload.markCompleted,
                    });
                    setReport(updated);
                    setEntryModalVisible(false);
                    Alert.alert('Results Saved', 'Lab results saved successfully.');
                  } catch {
                    Alert.alert(
                      'Save Failed',
                      'Could not save laboratory results. Please try again.'
                    );
                  }
                }}
              />
            ) : null}
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
    paddingBottom: 38,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
  },
  testSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 6,
  },
  enterResultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0866C6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  enterResultText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paramName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  paramRef: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  paramRight: {
    alignItems: 'flex-end',
  },
  paramVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#142D4E',
  },
  flagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 2,
  },
  flagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  noParamsText: {
    fontSize: 13,
    color: '#64748B',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0866C6',
    marginBottom: 3,
  },
  summaryText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  uploadHelp: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0866C6',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#142D4E',
    marginBottom: 10,
  },
  attachedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  attachedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  attachedUrl: {
    fontSize: 11,
    color: '#15803D',
  },
  uploadBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
  },
});

export default StaffLabTestDetailScreen;
