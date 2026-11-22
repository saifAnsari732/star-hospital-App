import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Share } from '../../utils/share';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FolderHeart,
  Calendar,
  Stethoscope,
  Share2,
  FileText,
  ShieldAlert,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { HealthRecordItem } from '../../types/patient';
import { patientService } from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';
import {
  StarHeader,
  StarCard,
  StarButton,
  EmptyState,
} from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';
import { resolveEffectivePatientId } from './patientUtils';

type Props = NativeStackScreenProps<PatientStackParamList, 'HealthRecords'>;

const RECORD_FILTERS = [
  { key: 'all', label: 'All Records' },
  { key: 'consultation', label: 'Consultations' },
  { key: 'discharge_summary', label: 'Discharge Summaries' },
  { key: 'vaccination', label: 'Vaccinations' },
];

export const HealthRecordsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [records, setRecords] = useState<HealthRecordItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setErrorMsg(null);
    try {
      const list = await patientService.getHealthRecords(effectivePatientId);
      setRecords(list);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load digital health records.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [effectivePatientId]);

  useFocusEffect(
    useCallback(() => {
      void loadRecords();
    }, [loadRecords])
  );

  const filteredRecords = useMemo(() => {
    if (selectedFilter === 'all') return records;
    return records.filter((r) => r.recordType === selectedFilter);
  }, [records, selectedFilter]);

  const formatTypeLabel = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const handleShareRecord = async (record: HealthRecordItem) => {
    try {
      await Share.share({
        title: record.title,
        message: `Star Hospital Health Record\nTitle: ${record.title}\nType: ${formatTypeLabel(record.recordType)}\nDoctor: ${record.doctorName} (${record.department})\nDate: ${record.date}\nSummary: ${record.summary}`,
      });
    } catch {
      // Ignore user cancel
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="Health Records"
        subtitle="Clinical Summaries & Documents"
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
              loadRecords();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* Quick Navigation Banner to Related Records */}
        <View style={styles.quickNavRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MedicalHistory')}
            style={styles.quickNavCard}
            activeOpacity={0.8}
          >
            <FileText size={18} color={colors.primary} />
            <Text style={styles.quickNavLabel}>Medical History</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Allergies')}
            style={styles.quickNavCard}
            activeOpacity={0.8}
          >
            <ShieldAlert size={18} color={colors.danger} />
            <Text style={styles.quickNavLabel}>Allergies</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {RECORD_FILTERS.map((f) => {
            const active = selectedFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setSelectedFilter(f.key)}
                style={[styles.chip, active ? styles.chipActive : undefined]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? styles.chipTextActive : undefined,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : errorMsg ? (
          <EmptyState
            title="Could Not Load Records"
            description={errorMsg}
            actionLabel="Retry"
            onAction={() => {
              setIsLoading(true);
              void loadRecords();
            }}
          />
        ) : filteredRecords.length === 0 ? (
          <EmptyState
            title="No Health Records"
            description="No digital clinical records found under this category."
            actionLabel="View Lab Reports"
            onAction={() => navigation.navigate('ReportsList')}
          />
        ) : (
          <View style={styles.list}>
            {filteredRecords.map((item) => (
              <StarCard key={item.id} style={styles.recordCard} variant="elevated">
                <View style={styles.cardHeader}>
                  <View style={styles.iconCircle}>
                    <FolderHeart size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordTitle}>{item.title}</Text>
                    <Text style={styles.recordDept}>
                      {item.department} • {formatTypeLabel(item.recordType)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.summaryText}>{item.summary}</Text>

                <View style={styles.metaFooter}>
                  <View style={styles.metaLeft}>
                    <View style={styles.metaRow}>
                      <Stethoscope size={13} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{item.doctorName}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Calendar size={13} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{item.date}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleShareRecord(item)}
                    style={styles.shareBtn}
                    activeOpacity={0.75}
                  >
                    <Share2 size={15} color={colors.primary} />
                    <Text style={styles.shareText}>Share</Text>
                  </TouchableOpacity>
                </View>
              </StarCard>
            ))}
          </View>
        )}

        <StarButton
          title="View Diagnostic & Lab Reports"
          variant="outline"
          onPress={() => navigation.navigate('ReportsList')}
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  quickNavRow: { flexDirection: 'row', gap: spacing.sm },
  quickNavCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm + 2,
  },
  quickNavLabel: { ...typography.labelMedium, color: colors.textPrimary },
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
  centerBox: { paddingVertical: spacing.xxl, alignItems: 'center' },
  list: { gap: spacing.md },
  recordCard: { padding: spacing.md, borderRadius: radii.xl },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTitle: { ...typography.labelLarge, color: colors.textPrimary },
  recordDept: { ...typography.caption, color: colors.primary, marginTop: 2 },
  summaryText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  metaFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metaLeft: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { ...typography.caption, color: colors.textSecondary },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: radii.md,
  },
  shareText: { ...typography.labelSmall, color: colors.primaryDark },
});
