import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pill,
  Clock,
  Calendar,
  Building2,
  MapPin,
  AlertCircle,
  ShieldAlert,
  PackageCheck,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { MedicineStockItem } from '../../types/pharmacy';
import { pharmacyService } from '../../services/pharmacyService';
import { StarHeader, StarCard, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'MedicineDetails'>;

export const MedicineDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const {
    medicineId,
    medicineName,
    genericName,
    dosage,
    frequency,
    duration,
    instructions,
  } = route.params;

  const [stockItem, setStockItem] = useState<MedicineStockItem | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(medicineId));

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!medicineId) {
        setIsLoading(false);
        return;
      }
      try {
        const found = await pharmacyService.getMedicineById(medicineId);
        if (mounted && found) {
          setStockItem(found);
        } else if (mounted && medicineName) {
          const all = await pharmacyService.getMedicineInventory(
            medicineName.split(' ')[0]
          );
          if (mounted && all.length > 0) setStockItem(all[0]);
        }
      } catch {
        // Gracefully display route-provided prescription guidance even if pharmacy lookup fails
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [medicineId, medicineName]);

  const title = stockItem?.name || medicineName || 'Prescribed Medicine';
  const generic = stockItem?.genericName || genericName;
  const inStock = (stockItem?.availableQuantity ?? 0) > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader title="Medicine Details" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Summary */}
          <StarCard style={styles.heroCard} variant="elevated">
            <View style={styles.heroHeader}>
              <View style={styles.iconCircle}>
                <Pill size={26} color={colors.primary} />
              </View>
              <View style={styles.heroTitles}>
                <Text style={styles.medName}>{title}</Text>
                {generic ? (
                  <Text style={styles.genericName}>{generic}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.badgeRow}>
              {stockItem?.category ? (
                <View style={[styles.badgePill, { backgroundColor: colors.infoLight }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {stockItem.category}
                  </Text>
                </View>
              ) : null}
              {stockItem ? (
                <View
                  style={[
                    styles.badgePill,
                    {
                      backgroundColor: inStock
                        ? colors.successLight
                        : colors.dangerLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: inStock ? colors.success : colors.danger },
                    ]}
                  >
                    {inStock
                      ? `In Pharmacy Stock (${stockItem.availableQuantity} ${stockItem.unit})`
                      : 'Out of Stock'}
                  </Text>
                </View>
              ) : null}
            </View>
          </StarCard>

          {/* Prescribed Dosage Schedule (when navigated from PrescriptionDetail) */}
          {(dosage || frequency || duration || instructions) && (
            <StarCard style={styles.sectionCard} variant="elevated">
              <Text style={styles.sectionTitle}>Prescribed Regimen</Text>
              {dosage ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Dosage</Text>
                  <Text style={styles.detailVal}>{dosage}</Text>
                </View>
              ) : null}
              {frequency ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Frequency</Text>
                  <Text style={styles.detailVal}>{frequency}</Text>
                </View>
              ) : null}
              {duration ? (
                <View style={styles.detailRow}>
                  <Text style={styles.detailKey}>Duration</Text>
                  <Text style={styles.detailVal}>{duration}</Text>
                </View>
              ) : null}
              {instructions ? (
                <View style={styles.instructionBox}>
                  <Clock size={16} color={colors.primary} />
                  <Text style={styles.instructionText}>{instructions}</Text>
                </View>
              ) : null}
            </StarCard>
          )}

          {/* Hospital Pharmacy Inventory Information */}
          {stockItem && (
            <StarCard style={styles.sectionCard} variant="elevated">
              <Text style={styles.sectionTitle}>Star Hospital Pharmacy Info</Text>

              <View style={styles.detailRow}>
                <View style={styles.iconKeyRow}>
                  <PackageCheck size={16} color={colors.textSecondary} />
                  <Text style={styles.detailKey}>Unit Price</Text>
                </View>
                <Text style={[styles.detailVal, { color: colors.primary }]}>
                  PKR {stockItem.unitPrice} / {stockItem.unit.replace(/s$/, '')}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.iconKeyRow}>
                  <Building2 size={16} color={colors.textSecondary} />
                  <Text style={styles.detailKey}>Manufacturer</Text>
                </View>
                <Text style={styles.detailVal}>{stockItem.manufacturer}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.iconKeyRow}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={styles.detailKey}>Pharmacy Shelf</Text>
                </View>
                <Text style={styles.detailVal}>{stockItem.location}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.iconKeyRow}>
                  <Calendar size={16} color={colors.textSecondary} />
                  <Text style={styles.detailKey}>Current Batch Expiry</Text>
                </View>
                <Text style={styles.detailVal}>{stockItem.expiryDate}</Text>
              </View>
            </StarCard>
          )}

          {/* Safety & Counseling Notice */}
          <StarCard style={styles.safetyCard} variant="elevated">
            <View style={styles.safetyHeader}>
              <ShieldAlert size={18} color={colors.warning} />
              <Text style={styles.safetyTitle}>Patient Safety Guidance</Text>
            </View>
            <Text style={styles.safetyText}>
              • Complete the full prescribed course unless advised otherwise by
              your Star Hospital physician.{'\n'}
              • Store below 25°C away from direct sunlight and moisture.{'\n'}
              • Report any unexpected rash, dizziness, or breathing discomfort to
              Emergency Desk immediately.
            </Text>
          </StarCard>

          {!stockItem && !dosage && (
            <View style={styles.fallbackBox}>
              <AlertCircle size={18} color={colors.textSecondary} />
              <Text style={styles.fallbackText}>
                Pharmacy inventory metadata unavailable for this item. Consult the
                in-house Star Hospital Pharmacist at Ground Floor Counter 2.
              </Text>
            </View>
          )}

          <StarButton
            title="Check My Drug Allergies"
            variant="outline"
            onPress={() => navigation.navigate('Allergies')}
            fullWidth
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: { padding: spacing.lg, borderRadius: radii.xl },
  heroHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitles: { flex: 1 },
  medName: { ...typography.h3, color: colors.textPrimary },
  genericName: { ...typography.bodyMedium, color: colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  badgePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  badgeText: { ...typography.caption, fontWeight: '700' },
  sectionCard: { padding: spacing.lg, borderRadius: radii.xl },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailKey: { ...typography.bodySmall, color: colors.textSecondary },
  detailVal: {
    ...typography.labelMedium,
    color: colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primaryLight,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginTop: spacing.md,
  },
  instructionText: { ...typography.bodySmall, color: colors.primaryDark, flex: 1 },
  safetyCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  safetyTitle: { ...typography.h4, color: colors.textPrimary },
  safetyText: { ...typography.bodySmall, color: colors.textSecondary, lineHeight: 20 },
  fallbackBox: {
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  fallbackText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },
});
