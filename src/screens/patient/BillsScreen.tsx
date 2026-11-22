import React, { useCallback, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  CreditCard,
  Download,
  CheckCircle2,
  Receipt,
  Clock,
  AlertCircle,
} from 'lucide-react-native';
import { InvoiceDetail } from '../../types/billing';
import { billingService } from '../../services/billingService';
import { useAuth } from '../../context/AuthContext';
import { resolveEffectivePatientId } from './patientUtils';

export interface BillsScreenProps {
  navigation: any;
  route?: any;
}

export const BillsScreen: React.FC<BillsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    setErrorMsg(null);
    try {
      const list = await billingService.getInvoices(effectivePatientId);
      setInvoices(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load hospital bills.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectivePatientId]);

  useFocusEffect(
    useCallback(() => {
      void loadInvoices();
    }, [loadInvoices])
  );

  const totalPaid = invoices.reduce((acc, inv) => acc + inv.amountReceived, 0);
  const totalDue = invoices.reduce((acc, inv) => acc + inv.balanceDue, 0);

  const handleOpenInvoice = (inv: InvoiceDetail) => {
    navigation.navigate('PaymentDetails', {
      invoiceId: inv.id,
      paymentId: inv.payments?.[0]?.id,
      transactionRef: inv.payments?.[0]?.transactionRef,
    });
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
        <Text style={styles.headerTitle}>Bills &amp; Payments</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadInvoices();
            }}
            colors={['#0866C6']}
          />
        }
      >
        {/* Total Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryIconCircle}>
              <CreditCard size={20} color="#0866C6" />
            </View>
            <View>
              <Text style={styles.summaryTitle}>Payment Overview</Text>
              <Text style={styles.summarySub}>All verified invoices</Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Total Paid</Text>
              <Text style={styles.metricVal}>PKR {totalPaid.toLocaleString()}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Balance Due</Text>
              <Text style={[styles.metricVal, { color: totalDue > 0 ? '#DC2626' : '#16A34A' }]}>
                PKR {totalDue.toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Invoices</Text>
              <Text style={styles.metricVal}>{invoices.length}</Text>
            </View>
          </View>
        </View>

        {/* Payment History Quick Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PaymentHistory')}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: '#EBF4FF',
            borderWidth: 1,
            borderColor: '#BFDBFE',
            borderRadius: 12,
            paddingVertical: 12,
            marginBottom: 18,
          }}
        >
          <Clock size={16} color="#0866C6" />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0866C6' }}>
            View Complete Payment History
          </Text>
        </TouchableOpacity>

        {/* Invoice Items List */}
        <Text style={styles.sectionHeading}>Billing History</Text>

        {loading && invoices.length === 0 ? (
          <View style={[styles.summaryCard, { alignItems: 'center', paddingVertical: 28 }]}>
            <ActivityIndicator size="large" color="#0866C6" />
            <Text style={[styles.summarySub, { marginTop: 10 }]}>Loading hospital bills...</Text>
          </View>
        ) : errorMsg ? (
          <View style={[styles.summaryCard, { alignItems: 'center', paddingVertical: 26 }]}>
            <AlertCircle size={28} color="#DC2626" />
            <Text style={[styles.summaryTitle, { marginTop: 8 }]}>Unable to Load Bills</Text>
            <Text style={[styles.summarySub, { marginTop: 4, textAlign: 'center' }]}>{errorMsg}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                void loadInvoices();
              }}
              style={[styles.downloadReceiptBtn, { marginTop: 12 }]}
            >
              <Text style={styles.downloadReceiptText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : invoices.length === 0 ? (
          <View style={[styles.summaryCard, { alignItems: 'center', paddingVertical: 28 }]}>
            <Receipt size={30} color="#0866C6" />
            <Text style={[styles.summaryTitle, { marginTop: 8 }]}>No Invoices Found</Text>
            <Text style={[styles.summarySub, { marginTop: 4, textAlign: 'center' }]}>
              Your outpatient, lab, and inpatient bills will appear here.
            </Text>
          </View>
        ) : (
          invoices.map((inv) => {
            const isPaid = inv.status === 'paid' && inv.balanceDue <= 0;
            const isPartial = inv.status === 'partial';
            const badgeBg = isPaid ? '#DCFCE7' : isPartial ? '#FEF3C7' : '#FEE2E2';
            const badgeColor = isPaid ? '#15803D' : isPartial ? '#B45309' : '#DC2626';
            const badgeLabel = isPaid ? 'Paid' : isPartial ? 'Partial Due' : 'Unpaid';

            return (
              <TouchableOpacity
                key={inv.id}
                style={styles.invoiceCard}
                onPress={() => handleOpenInvoice(inv)}
                activeOpacity={0.85}
              >
                <View style={styles.invoiceHeader}>
                  <View style={styles.invNoRow}>
                    <Receipt size={16} color="#0866C6" />
                    <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
                  </View>
                  <View style={[styles.paidBadge, { backgroundColor: badgeBg }]}>
                    {isPaid ? (
                      <CheckCircle2 size={12} color={badgeColor} />
                    ) : (
                      <Clock size={12} color={badgeColor} />
                    )}
                    <Text style={[styles.paidBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.itemsList}>
                  {inv.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <Text style={styles.itemDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                      <Text style={styles.itemPrice}>PKR {item.total.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.metaFooterRow}>
                  <View>
                    <Text style={styles.invDateText}>{inv.date}</Text>
                    {inv.doctorName ? (
                      <Text style={styles.invDocText}>{inv.doctorName}</Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.downloadReceiptBtn}
                    onPress={() => handleOpenInvoice(inv)}
                    activeOpacity={0.8}
                  >
                    <Download size={14} color="#0866C6" style={styles.downloadIcon} />
                    <Text style={styles.downloadReceiptText}>
                      {inv.balanceDue > 0 ? 'Pay / View' : 'Details / Receipt'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  summaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
  },
  summarySub: {
    fontSize: 12,
    color: '#64748B',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 12,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invNoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  itemsList: {
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  itemDesc: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#142D4E',
  },
  metaFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    paddingTop: 10,
  },
  invDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  invDocText: {
    fontSize: 11,
    color: '#0866C6',
    fontWeight: '500',
  },
  downloadReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0866C6',
  },
  downloadIcon: {
    marginRight: 4,
  },
  downloadReceiptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0866C6',
  },
});

export default BillsScreen;
