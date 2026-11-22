import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldAlert,
  Plus,
  Calendar,
  AlertTriangle,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { AllergyItem } from '../../types/patient';
import { patientService } from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';
import {
  StarHeader,
  StarCard,
  StarButton,
  StarInput,
  EmptyState,
} from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';
import {
  mergeAllergiesWithHistory,
  resolveEffectivePatientId,
} from './patientUtils';

type Props = NativeStackScreenProps<PatientStackParamList, 'Allergies'>;

const SEVERITY_OPTIONS: Array<AllergyItem['severity']> = [
  'mild',
  'moderate',
  'severe',
];

export const AllergiesScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [allergies, setAllergies] = useState<AllergyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [allergen, setAllergen] = useState('');
  const [severity, setSeverity] = useState<AllergyItem['severity']>('moderate');
  const [reaction, setReaction] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const loadAllergies = useCallback(async () => {
    setLoadError(null);
    try {
      const [list, history] = await Promise.all([
        patientService.getAllergies(effectivePatientId),
        patientService.getMedicalHistory(effectivePatientId),
      ]);
      setAllergies(mergeAllergiesWithHistory(list, history, effectivePatientId));
    } catch (err: any) {
      setLoadError(err?.message || 'Unable to load documented allergies.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [effectivePatientId]);

  useFocusEffect(
    useCallback(() => {
      void loadAllergies();
    }, [loadAllergies])
  );

  const handleAddAllergy = async () => {
    if (!allergen.trim() || !reaction.trim()) {
      setFormError('Please specify both allergen name and observed reaction.');
      return;
    }
    setFormError(null);
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedEntry = await patientService.addMedicalHistory({
        patientId: effectivePatientId,
        title: `${allergen.trim()} Allergy`,
        description: `${severity.toUpperCase()} severity - Reaction: ${reaction.trim()}`,
        category: 'allergy',
        date: today,
      });

      const created: AllergyItem = {
        id: savedEntry.id || `all-${Date.now()}`,
        patientId: effectivePatientId,
        allergen: allergen.trim(),
        severity,
        reaction: reaction.trim(),
        diagnosedDate: today,
      };
      setAllergies((prev) => [created, ...prev]);
      setAllergen('');
      setReaction('');
      setSeverity('moderate');
      setModalVisible(false);
      setSavedNotice(`${created.allergen} added to your medical allergy profile.`);
    } catch (err: any) {
      setFormError(err?.message || 'Unable to record allergy.');
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityBadge = (sev: AllergyItem['severity']) => {
    switch (sev) {
      case 'severe':
        return { label: 'SEVERE', bg: colors.dangerLight, fg: colors.danger };
      case 'moderate':
        return { label: 'MODERATE', bg: colors.warningLight, fg: colors.warning };
      default:
        return { label: 'MILD', bg: colors.infoLight, fg: colors.primary };
    }
  };

  const hasSevere = allergies.some((a) => a.severity === 'severe');

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="My Allergies"
        subtitle="Drug, Food & Environmental"
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
              loadAllergies();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {savedNotice ? (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color={colors.success} />
            <Text style={styles.successBannerText}>{savedNotice}</Text>
          </View>
        ) : null}

        {hasSevere && (
          <View style={styles.alertBanner}>
            <AlertTriangle size={20} color={colors.danger} />
            <Text style={styles.alertBannerText}>
              Severe allergy alert active. Star Hospital physicians and pharmacy
              dispensing systems automatically screen prescriptions against these
              records.
            </Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : loadError ? (
          <EmptyState
            title="Could Not Load Allergies"
            description={loadError}
            actionLabel="Retry"
            onAction={() => {
              setIsLoading(true);
              void loadAllergies();
            }}
          />
        ) : allergies.length === 0 ? (
          <EmptyState
            title="No Known Allergies Recorded"
            description="Add drug, food, or environmental sensitivities so clinicians can keep your care safe."
            actionLabel="Report New Allergy"
            onAction={() => setModalVisible(true)}
          />
        ) : (
          <View style={styles.list}>
            {allergies.map((item) => {
              const badge = getSeverityBadge(item.severity);
              return (
                <StarCard key={item.id} style={styles.allergyCard} variant="elevated">
                  <View style={styles.cardHeader}>
                    <View style={styles.iconWrap}>
                      <ShieldAlert size={20} color={badge.fg} />
                    </View>
                    <View style={styles.titleWrap}>
                      <Text style={styles.allergenTitle}>{item.allergen}</Text>
                      <View style={styles.dateRow}>
                        <Calendar size={12} color={colors.textSecondary} />
                        <Text style={styles.dateText}>
                          Recorded: {item.diagnosedDate || 'On file'}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.sevPill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.sevText, { color: badge.fg }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.reactionLabel}>Observed Reaction</Text>
                  <Text style={styles.reactionText}>{item.reaction}</Text>
                </StarCard>
              );
            })}
          </View>
        )}

        <StarButton
          title="Add New Allergy"
          onPress={() => setModalVisible(true)}
          fullWidth
          leftIcon={<Plus size={18} color={colors.white} />}
        />
      </ScrollView>

      {/* Add Allergy Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Allergy</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <StarInput
              label="Allergen Name"
              placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
              value={allergen}
              onChangeText={setAllergen}
            />

            <Text style={styles.severityHeading}>Severity Level</Text>
            <View style={styles.severityRow}>
              {SEVERITY_OPTIONS.map((opt) => {
                const active = severity === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSeverity(opt)}
                    style={[
                      styles.severityOption,
                      active ? styles.severityOptionActive : undefined,
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityOptionText,
                        active ? styles.severityOptionTextActive : undefined,
                      ]}
                    >
                      {opt.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <StarInput
              label="Observed Symptoms / Reaction"
              placeholder="e.g. Skin rash, hives, breathing difficulty"
              value={reaction}
              onChangeText={setReaction}
              multiline
              numberOfLines={3}
            />

            {formError ? <Text style={styles.formError}>{formError}</Text> : null}

            <StarButton
              title={isSaving ? 'Saving...' : 'Save Allergy Record'}
              onPress={handleAddAllergy}
              loading={isSaving}
              disabled={isSaving}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  centerBox: { paddingVertical: spacing.xxl, alignItems: 'center' },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  successBannerText: { ...typography.bodySmall, color: colors.success, flex: 1 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  alertBannerText: {
    ...typography.bodySmall,
    color: colors.danger,
    flex: 1,
    lineHeight: 18,
  },
  list: { gap: spacing.md },
  allergyCard: { padding: spacing.md, borderRadius: radii.xl },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: { flex: 1 },
  allergenTitle: { ...typography.h4, color: colors.textPrimary },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  dateText: { ...typography.caption, color: colors.textSecondary },
  sevPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  sevText: { ...typography.caption, fontWeight: '700' },
  reactionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  reactionText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  severityHeading: { ...typography.labelMedium, color: colors.textPrimary },
  severityRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.xs },
  severityOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  severityOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  severityOptionText: { ...typography.labelSmall, color: colors.textSecondary },
  severityOptionTextActive: { color: colors.white },
  formError: { ...typography.caption, color: colors.danger, marginBottom: spacing.xs },
});
