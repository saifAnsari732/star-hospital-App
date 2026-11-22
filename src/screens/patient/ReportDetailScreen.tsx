import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Share } from '../../utils/share';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Share2,
  Download,
  Building,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react-native';
import { laboratoryService } from '../../services';
import { DiagnosticReportItem } from '../../types/laboratory';
import { MOCK_REPORTS } from './MyReportsScreen';

export interface ReportDetailScreenProps {
  navigation: any;
  route: {
    params?: {
      reportId?: string;
      title?: string;
    };
  };
}

export const ReportDetailScreen: React.FC<ReportDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const [downloading, setDownloading] = useState<boolean>(false);

  const reportId = route.params?.reportId || 'rep-1';
  const fallbackReport = MOCK_REPORTS.find((r) => r.id === reportId) || MOCK_REPORTS[0];
  const [report, setReport] = useState<DiagnosticReportItem>(fallbackReport);

  useEffect(() => {
    let active = true;
    laboratoryService
      .getReportById(reportId)
      .then((item) => {
        if (active && item) {
          setReport(item);
        }
      })
      .catch(() => {
        // Fallback already populated
      });
    return () => {
      active = false;
    };
  }, [reportId]);

  const handleShare = async () => {
    try {
      await Share.share({
        title: `Star Hospital Report: ${report.testName}`,
        message:
          `Star Hospital Diagnostic Report: ${report.testName} (${report.reportNumber})\n` +
          `Date: ${report.date}\n` +
          `Patient: ${report.patientName} (MRN: ${report.patientMrn})\n` +
          `Doctor: ${report.doctorName}\n` +
          `Summary: ${report.resultSummary || 'Normal'}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await laboratoryService.downloadReport(report.id);
      await Share.share({
        title: `Star Hospital Report: ${report.testName}`,
        message:
          `Star Hospital Diagnostic Report\n` +
          `Test: ${report.testName} (${report.reportNumber})\n` +
          `Date: ${report.date}\n` +
          `Patient: ${report.patientName} (${report.patientMrn || 'N/A'})\n` +
          `Summary: ${report.resultSummary || 'Verified'}\n` +
          `PDF Reference: ${res.fileName} (${res.downloadUrl})`,
      });
    } catch {
      Alert.alert(
        'PDF Export Unavailable',
        'Direct PDF binary download requires ICTHospital document endpoint. Full diagnostic values remain viewable on this screen.'
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
        <Text style={styles.headerTitle}>Report Details</Text>
        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={handleShare}
          accessibilityRole="button"
          accessibilityLabel="Share Report"
        >
          <Share2 size={20} color="#0866C6" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Document Card */}
        <View style={styles.docCard}>
          {/* Hospital Header */}
          <View style={styles.brandingRow}>
            <View style={styles.logoBadge}>
              <Building size={20} color="#0866C6" />
            </View>
            <View style={styles.hospitalMeta}>
              <Text style={styles.hospitalName}>STAR HOSPITAL DIAGNOSTICS</Text>
              <Text style={styles.hospitalSub}>ISO 15189 Certified Pathology &amp; Radiology Lab</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Test & Report Meta */}
          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>REPORT NUMBER</Text>
              <Text style={styles.metaValue}>{report.reportNumber}</Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaLabel}>DATE</Text>
              <Text style={styles.metaValue}>{report.date}</Text>
            </View>
          </View>

          <View style={styles.testNamePillRow}>
            <Text style={styles.testNameTitle}>{report.testName}</Text>
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={13} color="#15803D" />
              <Text style={styles.verifiedBadgeText}>Verified</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Patient & Doctor Box */}
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient Name:</Text>
              <Text style={styles.infoVal}>{report.patientName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MRN / Ref ID:</Text>
              <Text style={styles.infoVal}>{report.patientMrn}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Referring Physician:</Text>
              <Text style={styles.infoVal}>{report.doctorName}</Text>
            </View>
            {report.technicianName ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Technologist:</Text>
                <Text style={styles.infoVal}>{report.technicianName}</Text>
              </View>
            ) : null}
          </View>

          {/* Parameters Table */}
          {report.results && report.results.length > 0 ? (
            <View style={styles.tableSection}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.colHeader, styles.colParam]}>Test Parameter</Text>
                <Text style={[styles.colHeader, styles.colResult]}>Result</Text>
                <Text style={[styles.colHeader, styles.colRef]}>Reference Range</Text>
              </View>

              {report.results.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.tableDataRow, idx % 2 === 1 && styles.tableDataRowEven]}
                >
                  <View style={styles.colParam}>
                    <Text style={styles.paramText}>{item.parameter}</Text>
                    {item.isAbnormal ? (
                      <View style={styles.abnormalBadge}>
                        <AlertCircle size={10} color="#DC2626" />
                        <Text style={styles.abnormalBadgeText}>Abnormal</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.colResult}>
                    <Text style={[styles.resultValText, item.isAbnormal && styles.resultValAbnormal]}>
                      {item.value} {item.unit}
                    </Text>
                  </View>

                  <View style={styles.colRef}>
                    <Text style={styles.refRangeText}>{item.referenceRange}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Clinical Impression */}
          {report.resultSummary ? (
            <View style={styles.impressionBox}>
              <Text style={styles.impressionLabel}>CLINICAL IMPRESSION / SUMMARY</Text>
              <Text style={styles.impressionText}>{report.resultSummary}</Text>
            </View>
          ) : null}

          {/* Signature Stamp */}
          <View style={styles.stampRow}>
            <View style={styles.stampBox}>
              <FileSpreadsheet size={16} color="#0866C6" />
              <Text style={styles.stampCaption}>Quality Control Verified</Text>
            </View>
            <View style={styles.signBox}>
              <Text style={styles.signDocName}>Dr. M. Farooq, MD</Text>
              <Text style={styles.signDesignation}>Chief Pathologist &amp; Lab Director</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.downloadPrimaryBtn}
            onPress={handleDownload}
            disabled={downloading}
            activeOpacity={0.85}
          >
            <Download size={18} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.downloadPrimaryBtnText}>
              {downloading ? 'Preparing Share Sheet...' : 'Share / Export Report'}
            </Text>
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
  docCard: {
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
  brandingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hospitalMeta: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064A91',
    letterSpacing: 0.5,
  },
  hospitalSub: {
    fontSize: 11,
    color: '#64748B',
  },
  cardDivider: {
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
  testNamePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  testNameTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
  },
  tableSection: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  colParam: {
    flex: 2,
  },
  colResult: {
    flex: 1.5,
    alignItems: 'center',
  },
  colRef: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  tableDataRowEven: {
    backgroundColor: '#F8FAFC',
  },
  paramText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#142D4E',
  },
  abnormalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 3,
  },
  abnormalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  resultValText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
  },
  resultValAbnormal: {
    color: '#DC2626',
  },
  refRangeText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
  },
  impressionBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  impressionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0866C6',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  impressionText: {
    fontSize: 13,
    color: '#142D4E',
    lineHeight: 18,
  },
  stampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stampBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stampCaption: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  signBox: {
    alignItems: 'flex-end',
  },
  signDocName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  signDesignation: {
    fontSize: 10,
    color: '#94A3B8',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  downloadPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0866C6',
    borderRadius: 12,
    height: 50,
  },
  btnIcon: {
    marginRight: 8,
  },
  downloadPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ReportDetailScreen;
