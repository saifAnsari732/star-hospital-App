import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FlaskConical,
  Search,
  Clock,
  CheckSquare,
  Square,
  CheckCircle2,
  Home,
  Building2,
  AlertCircle,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { LabTest } from '../../types/laboratory';
import { laboratoryService } from '../../services/laboratoryService';
import {
  StarHeader,
  StarCard,
  StarButton,
  StarInput,
  EmptyState,
} from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'LabTestBooking'>;

const CATEGORIES = ['All', 'Hematology', 'Biochemistry', 'Radiology'];

export const LabTestBookingScreen: React.FC<Props> = ({ navigation, route }) => {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    route.params?.preselectedTestId ? [route.params.preselectedTestId] : []
  );
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [collectionType, setCollectionType] = useState<'lab' | 'home'>('lab');
  const [preferredDate, setPreferredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.preselectedTestId) {
      setSelectedIds((prev) =>
        prev.includes(route.params!.preselectedTestId!)
          ? prev
          : [...prev, route.params!.preselectedTestId!]
      );
    }
  }, [route.params?.preselectedTestId]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const list = await laboratoryService.getAvailableTests();
        setTests(list);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to load available laboratory tests.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const catMatch =
        selectedCategory === 'All' || t.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const queryMatch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);
      return catMatch && queryMatch;
    });
  }, [tests, selectedCategory, searchQuery]);

  const toggleTest = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedTests = useMemo(
    () => tests.filter((t) => selectedIds.includes(t.id)),
    [tests, selectedIds]
  );

  const totalAmount = useMemo(
    () => selectedTests.reduce((sum, item) => sum + item.price, 0),
    [selectedTests]
  );

  const handleConfirmBooking = async () => {
    if (selectedTests.length === 0) {
      setErrorMsg('Select at least one laboratory or radiology test.');
      return;
    }
    const cleanDate = preferredDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      setErrorMsg('Enter a valid preferred date in YYYY-MM-DD format.');
      return;
    }
    const parsed = new Date(`${cleanDate}T00:00:00`);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (Number.isNaN(parsed.getTime()) || parsed < todayStart) {
      setErrorMsg('Preferred sample collection date cannot be in the past.');
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      setBookingRef(`LAB-${Math.floor(100000 + Math.random() * 900000)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookingRef) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <StarHeader
          title="Lab Booking Confirmed"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.centerContainer}>
          <StarCard style={styles.successCard} variant="elevated">
            <View style={styles.successIcon}>
              <CheckCircle2 size={46} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Lab Order Scheduled</Text>
            <Text style={styles.refPill}>Order Ref: {bookingRef}</Text>
            <Text style={styles.successDesc}>
              {selectedTests.length} diagnostic test(s) scheduled for{' '}
              {preferredDate} (
              {collectionType === 'lab'
                ? 'Hospital Sample Counter'
                : 'Home Phlebotomy Request'}
              ). Estimated total: PKR {totalAmount.toLocaleString()}.
            </Text>
            <View style={styles.integrationNotice}>
              <AlertCircle size={15} color={colors.primary} />
              <Text style={styles.integrationNoticeText}>
                ICTHospital Lab Order submission endpoint is staging locally.
                Present this order reference at Star Hospital Diagnostic Reception
                for billing & sample collection.
              </Text>
            </View>
            <StarButton
              title="View My Diagnostic Reports"
              onPress={() => navigation.replace('ReportsList')}
              fullWidth
            />
          </StarCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader title="Book Lab Test" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StarInput
          placeholder="Search CBC, Lipid Profile, X-Ray..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={colors.textSecondary} />}
        />

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.chip, active ? styles.chipActive : undefined]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? styles.chipTextActive : undefined,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sample Collection Option */}
        <StarCard style={styles.collectionCard} variant="elevated">
          <Text style={styles.subLabel}>Sample Collection Method</Text>
          <View style={styles.collectionToggle}>
            <TouchableOpacity
              onPress={() => setCollectionType('lab')}
              style={[
                styles.collectionBtn,
                collectionType === 'lab' ? styles.collectionBtnActive : undefined,
              ]}
            >
              <Building2
                size={16}
                color={
                  collectionType === 'lab' ? colors.white : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.collectionBtnText,
                  collectionType === 'lab'
                    ? styles.collectionBtnTextActive
                    : undefined,
                ]}
              >
                Visit Hospital Lab
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCollectionType('home')}
              style={[
                styles.collectionBtn,
                collectionType === 'home' ? styles.collectionBtnActive : undefined,
              ]}
            >
              <Home
                size={16}
                color={
                  collectionType === 'home' ? colors.white : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.collectionBtnText,
                  collectionType === 'home'
                    ? styles.collectionBtnTextActive
                    : undefined,
                ]}
              >
                Home Collection
              </Text>
            </TouchableOpacity>
          </View>
          <StarInput
            label="Preferred Date (YYYY-MM-DD)"
            value={preferredDate}
            onChangeText={setPreferredDate}
          />
        </StarCard>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginVertical: spacing.xl }}
          />
        ) : filteredTests.length === 0 ? (
          <EmptyState
            title="No Matching Tests"
            description="Try adjusting your search keyword or category filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedCategory('All');
              setSearchQuery('');
            }}
          />
        ) : (
          <View style={styles.testsList}>
            {filteredTests.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleTest(item.id)}
                  activeOpacity={0.8}
                >
                  <StarCard
                    style={[
                      styles.testCard,
                      selected ? styles.testCardSelected : undefined,
                    ]}
                    variant="elevated"
                  >
                    <View style={styles.testHeader}>
                      <View style={styles.testIconWrap}>
                        <FlaskConical size={20} color={colors.primary} />
                      </View>
                      <View style={styles.testTitleWrap}>
                        <Text style={styles.testName}>{item.name}</Text>
                        <Text style={styles.testCode}>
                          {item.code} • {item.category}
                        </Text>
                      </View>
                      {selected ? (
                        <CheckSquare size={22} color={colors.primary} />
                      ) : (
                        <Square size={22} color={colors.border} />
                      )}
                    </View>

                    <Text style={styles.testDesc}>{item.description}</Text>

                    {item.preparationInstructions ? (
                      <Text style={styles.prepText}>
                        Prep: {item.preparationInstructions}
                      </Text>
                    ) : null}

                    <View style={styles.testFooter}>
                      <View style={styles.tatRow}>
                        <Clock size={14} color={colors.tealAccent} />
                        <Text style={styles.tatText}>
                          Report in ~{item.turnaroundHours}h
                        </Text>
                      </View>
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>
                          PKR {item.price.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </StarCard>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={colors.danger} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Checkout Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomCount}>
            {selectedTests.length} test{selectedTests.length === 1 ? '' : 's'}{' '}
            selected
          </Text>
          <Text style={styles.bottomTotal}>
            PKR {totalAmount.toLocaleString()}
          </Text>
        </View>
        <View style={{ minWidth: 168 }}>
          <StarButton
            title={isSubmitting ? 'Booking...' : 'Confirm Lab Order'}
            onPress={handleConfirmBooking}
            loading={isSubmitting}
            disabled={isSubmitting || selectedTests.length === 0}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 120,
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
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { ...typography.labelMedium, color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  collectionCard: { padding: spacing.md, borderRadius: radii.xl },
  subLabel: { ...typography.labelMedium, color: colors.textPrimary, marginBottom: spacing.xs },
  collectionToggle: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.md },
  collectionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  collectionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  collectionBtnText: { ...typography.labelMedium, color: colors.textSecondary },
  collectionBtnTextActive: { color: colors.white },
  testsList: { gap: spacing.sm },
  testCard: {
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  testCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F0F7FF',
  },
  testHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  testIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testTitleWrap: { flex: 1 },
  testName: { ...typography.labelLarge, color: colors.textPrimary },
  testCode: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  testDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  prepText: {
    ...typography.caption,
    color: colors.primaryDark,
    marginTop: spacing.xs,
    fontWeight: '600',
  },
  testFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  tatRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tatText: { ...typography.caption, color: colors.textSecondary },
  priceBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  priceBadgeText: { ...typography.labelMedium, color: colors.primaryDark },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.dangerLight,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  errorText: { ...typography.bodySmall, color: colors.danger, flex: 1 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomCount: { ...typography.caption, color: colors.textSecondary },
  bottomTotal: { ...typography.h3, color: colors.primary },
  successCard: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: radii.xl,
    alignItems: 'center',
  },
  successIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: { ...typography.h3, color: colors.textPrimary },
  refPill: {
    ...typography.labelLarge,
    color: colors.primary,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginVertical: spacing.sm,
  },
  successDesc: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 21,
  },
  integrationNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  integrationNoticeText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
});
