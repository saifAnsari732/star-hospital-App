import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Receipt,
  CreditCard,
  Banknote,
  Globe,
  Shield,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { billingService } from '../../services/billingService';
import type { InvoiceDetail, InvoicePayment } from '../../types/billing';

interface FlattenedPayment extends InvoicePayment {
  invoiceId: string;
  invoiceNumber: string;
  patientName: string;
  patientMrn: string;
  careSetting: InvoiceDetail['careSetting'];
}

export const StaffPaymentHistoryScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [methodFilter, setMethodFilter] = useState<
    'all' | InvoicePayment['method']
  >('all');
  const [selectedReceipt, setSelectedReceipt] =
    useState<FlattenedPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      const list = await billingService.getInvoices();
      setInvoices(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  useFocusEffect(
    useCallback(() => {
      loadPayments();
    }, [loadPayments])
  );

  const allPayments = useMemo<FlattenedPayment[]>(() => {
    const entries: FlattenedPayment[] = [];
    invoices.forEach((inv) => {
      inv.payments.forEach((pay) => {
        entries.push({
          ...pay,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          patientName: inv.patientName,
          patientMrn: inv.patientMrn,
          careSetting: inv.careSetting,
        });
      });
    });
    return entries.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [invoices]);

  const filtered = useMemo(() => {
    if (methodFilter === 'all') return allPayments;
    return allPayments.filter((p) => p.method === methodFilter);
  }, [allPayments, methodFilter]);

  const totalCollected = useMemo(
    () => filtered.reduce((acc, p) => acc + p.amount, 0),
    [filtered]
  );

  const renderMethodIcon = (method: InvoicePayment['method']) => {
    switch (method) {
      case 'card':
        return <CreditCard size={18} color="#0866C6" />;
      case 'online':
        return <Globe size={18} color="#7C3AED" />;
      case 'insurance':
        return <Shield size={18} color="#0284C7" />;
      default:
        return <Banknote size={18} color="#16A34A" />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Payment History"
        subtitle="Collected Cash, Card & Online Receipts"
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.summaryStrip}>
        <View>
          <Text style={styles.summaryLabel}>
            Total Collected ({filtered.length} txns)
          </Text>
          <Text style={styles.summaryAmount}>
            Rs. {totalCollected.toLocaleString()}
          </Text>
        </View>
        <View style={styles.verifiedTag}>
          <CheckCircle2 size={14} color="#16A34A" />
          <Text style={styles.verifiedText}>Accounts Synced</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'cash', 'card', 'online', 'insurance'] as const).map((m) => {
          const active = methodFilter === m;
          return (
            <TouchableOpacity
              key={m}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setMethodFilter(m)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <StarLoader message="Loading cashier ledger..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadPayments();
              }}
              tintColor="#0866C6"
            />
          }
        >
          {filtered.length === 0 ? (
            <EmptyState
              title="No Transactions Found"
              description="No recorded payments match the selected payment channel."
            />
          ) : (
            filtered.map((pay) => (
              <TouchableOpacity
                key={pay.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => setSelectedReceipt(pay)}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.iconBox}>
                    {renderMethodIcon(pay.method)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{pay.patientName}</Text>
                    <Text style={styles.metaText}>
                      {pay.invoiceNumber} | MRN: {pay.patientMrn}
                    </Text>
                    <Text style={styles.txnRef}>
                      Ref: {pay.transactionRef || pay.id} |{' '}
                      {pay.date.split('T')[0]}
                    </Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.amountVal}>
                      Rs. {pay.amount.toLocaleString()}
                    </Text>
                    <Text style={styles.methodTag}>
                      {pay.method.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Receipt Modal */}
      <Modal
        visible={Boolean(selectedReceipt)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.receiptCard}>
            <View style={styles.receiptHeader}>
              <Receipt size={22} color="#0866C6" />
              <Text style={styles.receiptTitle}>Official Payment Receipt</Text>
              <TouchableOpacity onPress={() => setSelectedReceipt(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedReceipt ? (
              <View style={styles.receiptBody}>
                <Text style={styles.hospitalBrand}>STAR HOSPITAL</Text>
                <Text style={styles.receiptAmount}>
                  Rs. {selectedReceipt.amount.toLocaleString()}
                </Text>

                <View style={styles.recRow}>
                  <Text style={styles.recLabel}>Patient:</Text>
                  <Text style={styles.recVal}>
                    {selectedReceipt.patientName} ({selectedReceipt.patientMrn})
                  </Text>
                </View>
                <View style={styles.recRow}>
                  <Text style={styles.recLabel}>Invoice #:</Text>
                  <Text style={styles.recVal}>
                    {selectedReceipt.invoiceNumber}
                  </Text>
                </View>
                <View style={styles.recRow}>
                  <Text style={styles.recLabel}>Payment Method:</Text>
                  <Text style={styles.recVal}>
                    {selectedReceipt.method.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.recRow}>
                  <Text style={styles.recLabel}>Reference #:</Text>
                  <Text style={styles.recVal}>
                    {selectedReceipt.transactionRef || selectedReceipt.id}
                  </Text>
                </View>
                <View style={styles.recRow}>
                  <Text style={styles.recLabel}>Received By:</Text>
                  <Text style={styles.recVal}>
                    {selectedReceipt.receivedBy || 'Accounts Cashier'}
                  </Text>
                </View>
                <View style={styles.recRow}>
                  <Text style={styles.recLabel}>Timestamp:</Text>
                  <Text style={styles.recVal}>
                    {selectedReceipt.date.split('T')[0]}
                  </Text>
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSelectedReceipt(null)}
            >
              <Text style={styles.closeBtnText}>Close Receipt</Text>
            </TouchableOpacity>
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
  summaryStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#064A91',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#BFDBFE',
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  txnRef: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
  },
  methodTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0866C6',
    marginTop: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#142D4E',
  },
  receiptBody: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  hospitalBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
    textAlign: 'center',
    letterSpacing: 1,
  },
  receiptAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#16A34A',
    textAlign: 'center',
    marginVertical: 8,
  },
  recRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  recLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  recVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
  },
  closeBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default StaffPaymentHistoryScreen;
