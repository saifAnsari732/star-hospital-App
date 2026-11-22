import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Share } from '../../utils/share';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScanLine,
  Search,
  Download,
  Calendar,
  UserCheck,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { DiagnosticReportItem } from '../../types/laboratory';
import { laboratoryService } from '../../services/laboratoryService';
import { useAuth } from '../../context/AuthContext';
import { resolveEffectivePatientId } from './patientUtils';
import {
  StarHeader,
  StarCard,
  StarInput,
  StarButton,
  EmptyState,
} from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'RadiologyReports'>;

const MODALITY_FILTERS = ['All', 'X-Ray', 'CT Scan', 'MRI', 'Ultrasound'];

export const RadiologyReportsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [reports, setReports] = useState<DiagnosticReportItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setErrorMsg(null);
    try {
      const list = await laboratoryService.getDiagnosticReports({
        patientId: effectivePatientId,
        type: 'radiology',
      });
      setReports(list);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load radiology imaging reports.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [effectivePatientId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      const q = searchQuery.trim().toLowerCase();
      const queryMatch =
        !q ||
        rep.testName.toLowerCase().includes(q) ||
        rep.reportNumber.toLowerCase().includes(q) ||
        rep.doctorName.toLowerCase().includes(q);
      const modalityMatch =
        selectedModality === 'All' ||
        rep.testName.toLowerCase().includes(selectedModality.toLowerCase().replace(' scan', ''));
      return queryMatch && modalityMatch;
    });
  }, [reports, searchQuery, selectedModality]);

  const handleDownload = async (report: DiagnosticReportItem) => {
    try {
      const { downloadUrl } = await laboratoryService.downloadReport(report.id);
      await Share.share({
        title: report.testName,
        message: `Star Hospital Radiology Report\nReport #: ${report.reportNumber}\nScan: ${report.testName}\nDate: ${report.date}\nFindings: ${report.resultSummary || 'Available in portal'}\nFile: ${downloadUrl}`,
      });
    } catch {
      Alert.alert(
        'PDF Export Unavailable',
        `Direct PDF download for ${report.reportNumber} requires ICTHospital storage access. Full scan notes are viewable in Report Details.`
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="Radiology Reports"
        subtitle="X-Ray, CT, MRI & Ultrasound"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadReports();
            }}
            colors={[colors.primary]}
          />
        }
      >
        <StarInput
          placeholder="Search scan name, report number, doctor..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={colors.textSecondary} />}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {MODALITY_FILTERS.map((mod) => {
            const active = selectedModality === mod;
            return (
              <TouchableOpacity
                key={mod}
                onPress={() => setSelectedModality(mod)}
                style={[styles.chip, active ? styles.chipActive : undefined]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? styles.chipTextActive : undefined,
                  ]}
                >
                  {mod}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading imaging reports...</Text>
          </View>
        ) : errorMsg ? (
          <EmptyState
            title="Could Not Load Reports"
            description={errorMsg}
            actionLabel="Retry"
            onAction={loadReports}
          />
        ) : filteredReports.length === 0 ? (
          <EmptyState
            title="No Radiology Reports Found"
            description="Verified X-Ray, CT, MRI, and Ultrasound findings will appear here."
            actionLabel="Book Imaging Test"
            onAction={() => navigation.navigate('LabTestBooking')}
          />
        ) : (
          <View style={styles.list}>
            {filteredReports.map((item) => {
              const completed = item.status === 'completed' || item.status === 'verified';
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() =>
                    navigation.navigate('ReportDetail', {
                      reportId: item.id,
                      title: item.testName,
                    })
                  }
                  activeOpacity={0.82}
                >
                  <StarCard style={styles.reportCard} variant="elevated">
                    <View style={styles.cardTop}>
                      <View style={styles.scanIcon}>
                        <ScanLine size={22} color={colors.primary} />
                      </View>
                      <View style={styles.cardMeta}>
                        <Text style={styles.reportTitle}>{item.testName}</Text>
                        <Text style={styles.reportNumber}>
                          {item.reportNumber} • {item.category}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: completed
                              ? colors.successLight
                              : colors.warningLight,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: completed ? colors.success : colors.warning,
                            },
                          ]}
                        >
                          {completed ? 'Verified' : 'Processing'}
                        </Text>
                      </View>
                    </View>

                    {item.resultSummary ? (
                      <Text style={styles.summaryText} numberOfLines={3}>
                        {item.resultSummary}
                      </Text>
                    ) : null}

                    <View style={styles.infoRow}>
                      <View style={styles.infoPair}>
                        <Calendar size={14} color={colors.textSecondary} />
                        <Text style={styles.infoText}>{item.date}</Text>
                      </View>
                      <View style={styles.infoPair}>
                        <UserCheck size={14} color={colors.textSecondary} />
                        <Text style={styles.infoText}>{item.doctorName}</Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <TouchableOpacity
                        onPress={() => handleDownload(item)}
                        style={styles.downloadBtn}
                        activeOpacity={0.75}
                      >
                        <Download size={15} color={colors.primary} />
                        <Text style={styles.downloadText}>Download / Share</Text>
                      </TouchableOpacity>
                      <View style={styles.viewDetailsRow}>
                        <Text style={styles.viewDetailsText}>View Film Notes</Text>
                        <ChevronRight size={16} color={colors.primary} />
                      </View>
                    </View>
                  </StarCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.ctaBox}>
          <StarButton
            title="Schedule New Radiology / Lab Test"
            variant="outline"
            onPress={() => navigation.navigate('LabTestBooking')}
            fullWidth
            leftIcon={<Plus size={16} color={colors.primary} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  chipsRow: { gap: spacing.xs, paddingBottom: 4 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { ...typography.labelMedium, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  centerBox: { paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodyMedium, color: colors.textSecondary },
  list: { gap: spacing.md },
  reportCard: { padding: spacing.md, borderRadius: radii.xl },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scanIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: { flex: 1 },
  reportTitle: { ...typography.labelLarge, color: colors.textPrimary },
  reportNumber: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  statusText: { ...typography.caption, fontWeight: '700' },
  summaryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  infoPair: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  infoText: { ...typography.caption, color: colors.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  downloadText: { ...typography.labelSmall, color: colors.primaryDark },
  viewDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewDetailsText: { ...typography.labelMedium, color: colors.primary },
  ctaBox: { marginTop: spacing.xs },
});
