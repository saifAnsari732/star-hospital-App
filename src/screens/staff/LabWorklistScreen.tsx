import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  FlaskConical,
  Edit3,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { LabResultForm } from '../../components/staff/LabResultForm';
import { StaffKpiCard } from '../../components/staff/StaffKpiCard';
import { laboratoryService } from '../../services/laboratoryService';
import type { DiagnosticReportItem } from '../../types/laboratory';

type WorklistStatusFilter =
  | 'all'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'verified';

export const LabWorklistScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const [reports, setReports] = useState<DiagnosticReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WorklistStatusFilter>('all');
  const [activeReport, setActiveReport] = useState<DiagnosticReportItem | null>(
    null
  );

  const loadWorklist = useCallback(async () => {
    try {
      const data = await laboratoryService.getDiagnosticReports();
      setReports(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWorklist();
  }, [loadWorklist]);

  useFocusEffect(
    useCallback(() => {
      loadWorklist();
    }, [loadWorklist])
  );

  const counts = useMemo(() => {
    const pending = reports.filter(
      (r) => r.status === 'pending' || r.status === 'in_progress'
    ).length;
    const completed = reports.filter((r) => r.status === 'completed').length;
    const verified = reports.filter((r) => r.status === 'verified').length;
    return { pending, completed, verified };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          item.testName.toLowerCase().includes(q) ||
          item.reportNumber.toLowerCase().includes(q) ||
          item.patientName.toLowerCase().includes(q) ||
          (item.patientMrn || '').toLowerCase().includes(q) ||
          item.doctorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reports, statusFilter, searchQuery]);

  const getStatusStyle = (status: DiagnosticReportItem['status']) => {
    switch (status) {
      case 'verified':
        return { bg: '#DCFCE7', text: '#166534', label: 'VERIFIED' };
      case 'completed':
        return { bg: '#DBEAFE', text: '#1E40AF', label: 'COMPLETED' };
      case 'in_progress':
        return { bg: '#FEF3C7', text: '#92400E', label: 'IN PROGRESS' };
      default:
        return { bg: '#FFEDD5', text: '#9A3412', label: 'PENDING' };
    }
  };

  if (loading && reports.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarHeader
          title="Laboratory Worklist"
          onBackPress={
            navigation?.canGoBack?.() ? () => navigation.goBack() : undefined
          }
        />
        <StarLoader message="Loading diagnostic worklist..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Laboratory Worklist"
        subtitle={`${counts.pending} active requests`}
        onBackPress={
          navigation?.canGoBack?.() ? () => navigation.goBack() : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadWorklist();
            }}
            tintColor="#0866C6"
          />
        }
      >
        {/* KPI Strip */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Pending / Active"
              value={counts.pending}
              icon={Clock}
              theme="orange"
            />
          </View>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Completed"
              value={counts.completed}
              icon={FlaskConical}
              theme="blue"
            />
          </View>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Verified"
              value={counts.verified}
              icon={CheckCircle2}
              theme="green"
            />
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search test, report #, patient, MRN, or doctor..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(
            [
              { key: 'all', label: `All (${reports.length})` },
              { key: 'pending', label: 'Pending' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'completed', label: 'Completed' },
              { key: 'verified', label: 'Verified' },
            ] as const
          ).map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                statusFilter === f.key && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  statusFilter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Worklist Cards */}
        {filteredReports.length === 0 ? (
          <EmptyState
            title="No matching lab requests"
            description="Try adjusting status filters or search terms."
          />
        ) : (
          filteredReports.map((item) => {
            const st = getStatusStyle(item.status);
            const hasAbnormal = (item.results || []).some((r) => r.isAbnormal);
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() =>
                  navigation?.navigate?.('StaffLabTestDetail', {
                    reportId: item.id,
                    report: item,
                  })
                }
              >
                <View style={styles.cardTop}>
                  <View style={styles.iconBox}>
                    <FlaskConical size={20} color="#0866C6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.testTitle}>{item.testName}</Text>
                    <Text style={styles.testMeta}>
                      {item.reportNumber} | {item.category} | {item.date}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.text }]}>
                      {st.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.patientInfo}>
                  <Text style={styles.patientText}>
                    Patient: {item.patientName} ({item.patientMrn || 'N/A'})
                  </Text>
                  <Text style={styles.doctorText}>
                    Requested by: {item.doctorName}
                  </Text>
                </View>

                {hasAbnormal ? (
                  <View style={styles.abnormalBanner}>
                    <AlertCircle size={13} color="#DC2626" />
                    <Text style={styles.abnormalText}>
                      Contains flagged abnormal value(s)
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionOutlineBtn}
                    onPress={() =>
                      navigation?.navigate?.('StaffLabTestDetail', {
                        reportId: item.id,
                        report: item,
                      })
                    }
                  >
                    <FileText size={14} color="#0866C6" />
                    <Text style={styles.actionOutlineText}>Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionPrimaryBtn}
                    onPress={() => setActiveReport(item)}
                  >
                    <Edit3 size={14} color="#FFFFFF" />
                    <Text style={styles.actionPrimaryText}>Enter Results</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionUploadBtn}
                    onPress={() =>
                      navigation?.navigate?.('StaffLabTestDetail', {
                        reportId: item.id,
                        report: item,
                      })
                    }
                  >
                    <Upload size={14} color="#0F766E" />
                    <Text style={styles.actionUploadText}>Upload PDF</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Lab Result Entry Modal */}
      <Modal
        visible={!!activeReport}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveReport(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lab Result Entry</Text>
              <TouchableOpacity onPress={() => setActiveReport(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            {activeReport ? (
              <LabResultForm
                testName={activeReport.testName}
                patientName={activeReport.patientName}
                initialParameters={activeReport.results}
                initialSummary={activeReport.resultSummary}
                onCancel={() => setActiveReport(null)}
                onSave={async (payload) => {
                  try {
                    const targetTestName = activeReport.testName;
                    await laboratoryService.saveLabResults({
                      reportId: activeReport.id,
                      results: payload.results,
                      resultSummary: payload.summary,
                      markCompleted: payload.markCompleted,
                    });
                    setActiveReport(null);
                    await loadWorklist();
                    Alert.alert(
                      'Results Saved',
                      `${targetTestName} updated and ${
                        payload.markCompleted ? 'released to clinician chart.' : 'saved as draft.'
                      }`
                    );
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
    paddingBottom: 34,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  kpiCell: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  filterRow: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  testMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  patientInfo: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 2,
  },
  patientText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  doctorText: {
    fontSize: 12,
    color: '#64748B',
  },
  abnormalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  abnormalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  actionOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  actionPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0866C6',
  },
  actionPrimaryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  actionUploadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
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
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
});

export default LabWorklistScreen;
