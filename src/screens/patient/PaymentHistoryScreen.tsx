import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CreditCard,
  Receipt,
  ChevronRight,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { InvoiceDetail } from '../../types/billing';
import { billingService } from '../../services/billingService';
import { useAuth } from '../../context/AuthContext';
import { StarHeader, StarCard, StarButton, EmptyState } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';
import { resolveEffectivePatientId } from './patientUtils';

type Props = NativeStackScreenProps<PatientStackParamList, 'PaymentHistory'>;

type InvoicePaymentEntry = NonNullable<InvoiceDetail['payments']>[number];

interface PaymentListItem extends InvoicePaymentEntry {
  invoiceId: string;
  invoiceNumber: string;
  department?: string;
}

const METHOD_FILTERS = ['all', 'card', 'online', 'cash', 'insurance'] as const;

export const PaymentHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [methodFilter, setMethodFilter] =
    useState<(typeof METHOD_FILTERS)[number]>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    setErrorMsg(null);
    try {
      const list = await billingService.getInvoices(effectivePatientId);
      setInvoices(list);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load payment receipts.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [effectivePatientId]);

  useFocusEffect(
    useCallback(() => {
      void loadPayments();
    }, [loadPayments])
  );

  const allPayments = useMemo<PaymentListItem[]>(() => {
    const rows: PaymentListItem[] = [];
    invoices.forEach((inv) => {
      (inv.payments || []).forEach((p) => {
        rows.push({
          ...p,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          department: inv.department,
        });
      });
    });
    return rows.sort((a, b) => {
      const ta = Date.parse(a.date);
      const tb = Date.parse(b.date);
      if (!Number.isNaN(ta) && !Number.isNaN(tb)) return tb - ta;
      return b.date.localeCompare(a.date);
    });
  }, [invoices]);

  const filteredPayments = useMemo(() => {
    if (methodFilter === 'all') return allPayments;
    return allPayments.filter((p) => p.method === methodFilter);
  }, [allPayments, methodFilter]);

  const totalPaid = useMemo(
    () => filteredPayments.reduce((sum, p) => sum + p.amount, 0),
    [filteredPayments]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="Payment History"
        subtitle="Verified Hospital Receipts"
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
              loadPayments();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* Summary Hero Card */}
        <StarCard style={styles.summaryCard} variant="elevated">
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>Total Settled Payments</Text>
              <Text style={styles.summaryAmount}>
                PKR {totalPaid.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryIcon}>
              <CheckCircle2 size={28} color={colors.success} />
            </View>
          </View>
          <Text style={styles.summarySub}>
            {filteredPayments.length} completed transaction
            {filteredPayments.length === 1 ? '' : 's'}
          </Text>
        </StarCard>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {METHOD_FILTERS.map((m) => {
            const active = methodFilter === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setMethodFilter(m)}
                style={[styles.chip, active ? styles.chipActive : undefined]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? styles.chipTextActive : undefined,
                  ]}
                >
                  {m === 'all' ? 'All Methods' : m.toUpperCase()}
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
            title="Could Not Load Receipts"
            description={errorMsg}
            actionLabel="Retry"
            onAction={() => {
              setIsLoading(true);
              void loadPayments();
            }}
          />
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            title="No Payment Records"
            description="Paid invoices and online settlement receipts will appear here."
            actionLabel="View My Bills"
            onAction={() => navigation.navigate('Bills')}
          />
        ) : (
          <View style={styles.list}>
            {filteredPayments.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  navigation.navigate('PaymentDetails', {
                    invoiceId: item.invoiceId,
                    paymentId: item.id,
                    transactionRef: item.transactionRef,
                  })
                }
                activeOpacity={0.82}
              >
                <StarCard style={styles.paymentCard} variant="elevated">
                  <View style={styles.cardRow}>
                    <View style={styles.payIcon}>
                      <CreditCard size={20} color={colors.primary} />
                    </View>
                    <View style={styles.payMeta}>
                      <Text style={styles.invNumber}>{item.invoiceNumber}</Text>
                      <Text style={styles.txnText}>
                        {item.transactionRef || item.id.toUpperCase()} •{' '}
                        {item.method.toUpperCase()}
                      </Text>
                      <View style={styles.dateRow}>
                        <Calendar size={12} color={colors.textSecondary} />
                        <Text style={styles.dateText}>
                          {item.date.split('T')[0]}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.amountCol}>
                      <Text style={styles.amountValue}>
                        PKR {item.amount.toLocaleString()}
                      </Text>
                      <View style={styles.paidChip}>
                        <Text style={styles.paidChipText}>Paid</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={colors.textSecondary} />
                  </View>
                </StarCard>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <StarButton
          title="View All Invoices & Pending Bills"
          variant="outline"
          onPress={() => navigation.navigate('Bills')}
          fullWidth
          leftIcon={<Receipt size={16} color={colors.primary} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.white,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { ...typography.bodySmall, color: colors.textSecondary },
  summaryAmount: { ...typography.h2, color: colors.primary, marginTop: 2 },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summarySub: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
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
  list: { gap: spacing.sm },
  paymentCard: { padding: spacing.md, borderRadius: radii.xl },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  payIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payMeta: { flex: 1 },
  invNumber: { ...typography.labelLarge, color: colors.textPrimary },
  txnText: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  dateText: { ...typography.caption, color: colors.textSecondary },
  amountCol: { alignItems: 'flex-end', gap: 4 },
  amountValue: { ...typography.labelLarge, color: colors.textPrimary },
  paidChip: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  paidChipText: { ...typography.caption, color: colors.success, fontWeight: '700' },
});
