import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Share } from '../../utils/share';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  FileSpreadsheet,
  FlaskConical,
  ScanLine,
  AlertCircle,
} from 'lucide-react-native';
import { ReportCard } from '../../components/patient/ReportCard';
import { laboratoryService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { DiagnosticReportItem } from '../../types/laboratory';
import { resolveEffectivePatientId } from './patientUtils';

export interface MyReportsScreenProps {
  navigation: any;
  route?: any;
}

export const MOCK_REPORTS: DiagnosticReportItem[] = [
  {
    id: 'rep-1',
    reportNumber: 'REP-8821',
    type: 'lab',
    testName: 'Blood Test Report',
    category: 'Hematology',
    date: '15 Nov 2026',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientMrn: 'P-00102',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    technicianName: 'Zubair Qureshi, MLT',
    status: 'completed',
    resultSummary: 'Complete Blood Count within normal reference boundaries. Mild reactive lymphocyte count.',
    fileSize: '1.2 MB',
    results: [
      {
        parameter: 'Hemoglobin (Hb)',
        value: '14.5',
        unit: 'g/dL',
        referenceRange: '13.5 - 17.5',
        isAbnormal: false,
        flag: 'Normal',
      },
      {
        parameter: 'Total Leucocyte Count (WBC)',
        value: '7,800',
        unit: '/mcL',
        referenceRange: '4,500 - 11,000',
        isAbnormal: false,
        flag: 'Normal',
      },
      {
        parameter: 'Platelet Count',
        value: '265,000',
        unit: '/mcL',
        referenceRange: '150,000 - 450,000',
        isAbnormal: false,
        flag: 'Normal',
      },
      {
        parameter: 'RBC Count',
        value: '5.1',
        unit: 'mil/mcL',
        referenceRange: '4.5 - 5.9',
        isAbnormal: false,
        flag: 'Normal',
      },
      {
        parameter: 'Erythrocyte Sedimentation Rate (ESR)',
        value: '12',
        unit: 'mm/hr',
        referenceRange: '0 - 15',
        isAbnormal: false,
        flag: 'Normal',
      },
    ],
  },
  {
    id: 'rep-2',
    reportNumber: 'REP-8740',
    type: 'radiology',
    testName: 'X-Ray Report',
    category: 'Radiology',
    date: '10 Oct 2026',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientMrn: 'P-00102',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priya Mehta',
    technicianName: 'Sana Tariq, Radiographer',
    status: 'verified',
    resultSummary: 'Chest PA view demonstrates clear lung fields. Normal cardiac contour and cardiothoracic ratio.',
    fileSize: '3.4 MB',
    results: [
      {
        parameter: 'Cardiothoracic Ratio',
        value: '0.45',
        unit: 'ratio',
        referenceRange: '< 0.50',
        isAbnormal: false,
        flag: 'Normal',
      },
      {
        parameter: 'Costophrenic Angles',
        value: 'Sharp & Clear',
        unit: '',
        referenceRange: 'Clear bilaterally',
        isAbnormal: false,
        flag: 'Normal',
      },
      {
        parameter: 'Bony Cage & Soft Tissues',
        value: 'Intact',
        unit: '',
        referenceRange: 'Normal architecture',
        isAbnormal: false,
        flag: 'Normal',
      },
    ],
  },
  {
    id: 'rep-3',
    reportNumber: 'REP-8610',
    type: 'radiology',
    testName: 'CT Scan Report',
    category: 'Radiology',
    date: '02 Sep 2026',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientMrn: 'P-00102',
    doctorId: 'doc-3',
    doctorName: 'Dr. Rakesh Verma',
    technicianName: 'Imran Shah, CT Technologist',
    status: 'completed',
    resultSummary: 'Non-contrast Knee CT reveals no fracture, dislocation, or joint effusion. Minor soft tissue inflammation.',
    fileSize: '8.1 MB',
    results: [
      {
        parameter: 'Tibiofemoral Joint Alignment',
        value: 'Anatomical',
        unit: '',
        referenceRange: 'Normal',
        isAbnormal: false,
        flag: 'Normal',
      },
      {
        parameter: 'Patellofemoral Articulation',
        value: 'Congruent',
        unit: '',
        referenceRange: 'Normal',
        isAbnormal: false,
        flag: 'Normal',
      },
      {
        parameter: 'Joint Effusion',
        value: 'None detected',
        unit: '',
        referenceRange: 'Absent',
        isAbnormal: false,
        flag: 'Normal',
      },
    ],
  },
];

export const MyReportsScreen: React.FC<MyReportsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [activeTab, setActiveTab] = useState<'all' | 'lab' | 'radiology'>('all');
  const [reports, setReports] = useState<DiagnosticReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setErrorMsg(null);
    try {
      const data = await laboratoryService.getDiagnosticReports({
        patientId: effectivePatientId,
      });
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load your diagnostic reports.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectivePatientId]);

  useFocusEffect(
    useCallback(() => {
      void loadReports();
    }, [loadReports])
  );

  const displayedReports =
    activeTab === 'all'
      ? reports
      : reports.filter((r) => r.type === activeTab);

  const handleOpenDetail = (report: DiagnosticReportItem) => {
    navigation.navigate('ReportDetail', {
      reportId: report.id,
      title: report.testName,
    });
  };

  const handleDownload = async (report: DiagnosticReportItem) => {
    setDownloadingId(report.id);
    try {
      const res = await laboratoryService.downloadReport(report.id);
      await Share.share({
        title: `Star Hospital Report: ${report.testName}`,
        message:
          `Star Hospital Diagnostic Report\n` +
          `Test: ${report.testName} (${report.reportNumber})\n` +
          `Date: ${report.date}\n` +
          `Summary: ${report.resultSummary || 'Available in Report Details'}\n` +
          `Reference File: ${res.fileName} (${res.downloadUrl})`,
      });
    } catch {
      Alert.alert(
        'PDF Export Unavailable',
        'Direct PDF file download requires ICTHospital document storage. You can view full verified parameters in Report Details.'
      );
    } finally {
      setDownloadingId(null);
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
        <Text style={styles.headerTitle}>My Reports</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Diagnostic Shortcuts */}
      <View style={styles.quickBar}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('LabTestBooking')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Book Lab Test"
        >
          <FlaskConical size={16} color="#0866C6" />
          <Text style={styles.quickActionText}>Book Lab Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionCard, styles.quickActionTeal]}
          onPress={() => navigation.navigate('RadiologyReports')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="View Radiology Reports"
        >
          <ScanLine size={16} color="#0F766E" />
          <Text style={[styles.quickActionText, { color: '#0F766E' }]}>Radiology Scans</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          onPress={() => setActiveTab('all')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'all' }}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({reports.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'lab' && styles.tabButtonActive]}
          onPress={() => setActiveTab('lab')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'lab' }}
        >
          <Text style={[styles.tabText, activeTab === 'lab' && styles.tabTextActive]}>
            Lab Reports
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'radiology' && styles.tabButtonActive]}
          onPress={() => setActiveTab('radiology')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'radiology' }}
        >
          <Text style={[styles.tabText, activeTab === 'radiology' && styles.tabTextActive]}>
            Radiology
          </Text>
        </TouchableOpacity>
      </View>

      {/* Reports List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadReports();
            }}
            colors={['#0866C6']}
          />
        }
      >
        {loading && reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#0866C6" />
            <Text style={styles.emptySubtitle}>Loading diagnostic reports...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.emptyContainer}>
            <AlertCircle size={32} color="#DC2626" />
            <Text style={styles.emptyTitle}>Unable to Load Reports</Text>
            <Text style={styles.emptySubtitle}>{errorMsg}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                void loadReports();
              }}
              style={[styles.quickActionCard, { marginTop: 14, paddingHorizontal: 20, flex: 0 }]}
            >
              <Text style={styles.quickActionText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : displayedReports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileSpreadsheet size={32} color="#0866C6" />
            <Text style={styles.emptyTitle}>No Reports Available</Text>
            <Text style={styles.emptySubtitle}>Your laboratory and radiology test results will be posted here.</Text>
          </View>
        ) : (
          displayedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() => handleOpenDetail(report)}
              onDownloadPress={() => handleDownload(report)}
              isDownloading={downloadingId === report.id}
            />
          ))
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
  quickBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F5F9FF',
  },
  quickActionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EBF5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 10,
  },
  quickActionTeal: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0866C6',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0866C6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default MyReportsScreen;
