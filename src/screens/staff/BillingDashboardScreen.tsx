import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Modal,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Plus,
  Search,
  DollarSign,
  Receipt,
  CreditCard,
  History,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { InvoiceGenerateModal } from '../../components/staff/InvoiceGenerateModal';
import { StaffKpiCard } from '../../components/staff/StaffKpiCard';
import { StarLoader, EmptyState } from '../../components/common';
import { billingService } from '../../services/billingService';
import { patientService } from '../../services/patientService';
import type { InvoiceDetail, InvoicePayment, InvoiceStatus } from '../../types/billing';
import type { Patient } from '../../types/patient';

export const BillingDashboardScreen: React.FC<{
  navigation?: any;
  route?: any;
}> = ({ navigation, route }) => {
  const filterPatientId: string | undefined = route?.params?.patientId;

  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  // Cross-platform Collect Payment Modal
  const [collectingInvoice, setCollectingInvoice] =
    useState<InvoiceDetail | null>(null);
  const [collectAmountStr, setCollectAmountStr] = useState('');
  const [collectMethod, setCollectMethod] =
    useState<InvoicePayment['method']>('cash');
  const [collectRef, setCollectRef] = useState('');
  const [recordingPay, setRecordingPay] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      const [list, patList] = await Promise.all([
        billingService.getInvoices(filterPatientId),
        patientService.getAllPatients(),
      ]);
      setInvoices(list);
      setPatients(patList);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterPatientId]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices])
  );

  const prefillPatient = useMemo(() => {
    if (!filterPatientId) return undefined;
    const matched = patients.find((p) => p.id === filterPatientId);
    if (!matched) return undefined;
    return {
      patientId: matched.id,
      patientName: matched.name,
      mrn: matched.mrn,
    };
  }, [filterPatientId, patients]);

  const metrics = useMemo(() => {
    const collected = invoices.reduce((sum, i) => sum + i.amountReceived, 0);
    const pending = invoices.reduce((sum, i) => sum + i.balanceDue, 0);
    return { collected, pending };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.patientName.toLowerCase().includes(q) ||
          inv.patientMrn.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, statusFilter, searchQuery]);

  const handleGenerateInvoice = async (data: {
    patientId?: string;
    patientName: string;
    patientMrn: string;
    careSetting: 'opd' | 'ipd' | 'emergency';
    items: Array<{
      description: string;
      category?: string;
      quantity: number;
      unitPrice: number;
    }>;
    discount: number;
    amountReceived: number;
    paymentMethod: 'cash' | 'card' | 'online' | 'insurance';
  }) => {
    const matchedPatient =
      patients.find((p) => p.id === data.patientId) ||
      patients.find(
        (p) =>
          p.mrn.toLowerCase() === data.patientMrn.trim().toLowerCase() ||
          p.name.toLowerCase() === data.patientName.trim().toLowerCase()
      );
    const resolvedPatientId =
      data.patientId || filterPatientId || matchedPatient?.id || patients[0]?.id || 'pat-1';

    setGeneratingInvoice(true);
    try {
      const created = await billingService.createInvoice({
        patientId: resolvedPatientId,
        careSetting: data.careSetting,
        items: data.items,
        discount: data.discount,
      });

      if (data.amountReceived > 0) {
        await billingService.recordPayment({
          invoiceId: created.id,
          amount: data.amountReceived,
          method: data.paymentMethod,
        });
      }

      await loadInvoices();
      setIsGenerateModalVisible(false);
      Alert.alert(
        'Invoice Generated',
        `Invoice ${created.invoiceNumber} created for ${matchedPatient?.name || data.patientName || created.patientName}.`
      );
    } catch {
      Alert.alert('Generation Failed', 'Unable to generate invoice. Please retry.');
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const openCollectModal = (invoice: InvoiceDetail) => {
    setCollectingInvoice(invoice);
    setCollectAmountStr(String(invoice.balanceDue));
    setCollectMethod('cash');
    setCollectRef('');
  };

  const handleSubmitPayment = async () => {
    if (!collectingInvoice) return;
    const amount = parseFloat(collectAmountStr);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        'Invalid Amount',
        'Please enter a payment amount greater than zero.'
      );
      return;
    }

    setRecordingPay(true);
    try {
      const updated = await billingService.recordPayment({
        invoiceId: collectingInvoice.id,
        amount: Math.min(amount, collectingInvoice.balanceDue),
        method: collectMethod,
        transactionRef: collectRef.trim() || undefined,
      });
      setCollectingInvoice(null);
      await loadInvoices();
      Alert.alert(
        'Payment Recorded',
        `Rs. ${Math.min(amount, collectingInvoice.balanceDue).toLocaleString()} collected via ${collectMethod.toUpperCase()} for ${updated.invoiceNumber}.`
      );
    } catch {
      Alert.alert('Payment Error', 'Failed to record invoice payment.');
    } finally {
      setRecordingPay(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack?.()}
        >
          <ArrowLeft size={22} color="#142D4E" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Billing &amp; Cashier</Text>
          <Text style={styles.headerSub}>
            Invoices, Collections &amp; Payment History
          </Text>
        </View>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation?.navigate?.('StaffPaymentHistory')}
        >
          <History size={16} color="#0866C6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.newInvBtn}
          onPress={() => setIsGenerateModalVisible(true)}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.newInvText}>Invoice</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadInvoices();
            }}
            tintColor="#0866C6"
          />
        }
      >
        {/* Revenue KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiWrap}>
            <StaffKpiCard
              label="Total Collected"
              value={`Rs. ${metrics.collected.toLocaleString()}`}
              icon={DollarSign}
              theme="green"
              onPress={() => navigation?.navigate?.('StaffPaymentHistory')}
            />
          </View>
          <View style={styles.kpiWrap}>
            <StaffKpiCard
              label="Outstanding Due"
              value={`Rs. ${metrics.pending.toLocaleString()}`}
              icon={CreditCard}
              theme="orange"
            />
          </View>
        </View>

        {/* Search & Filter */}
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search invoice #, patient name, or MRN..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.filterRow}>
          {(['all', 'unpaid', 'partial', 'paid'] as const).map((st) => {
            const active = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {st.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <StarLoader message="Loading billing ledger..." />
        ) : filteredInvoices.length === 0 ? (
          <EmptyState
            title="No Invoices Found"
            description="No hospital invoices match your active filter."
            actionLabel="Generate New Invoice"
            onAction={() => setIsGenerateModalVisible(true)}
          />
        ) : (
          filteredInvoices.map((inv) => (
            <View key={inv.id} style={styles.invoiceCard}>
              <View style={styles.invTopRow}>
                <View style={styles.invLeft}>
                  <View style={styles.invIconBox}>
                    <Receipt size={18} color="#0866C6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.invNumber}>
                      {inv.invoiceNumber} | {inv.careSetting.toUpperCase()}
                    </Text>
                    <Text style={styles.invPatient}>
                      {inv.patientName} ({inv.patientMrn})
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    inv.status === 'paid' && styles.statusPaid,
                    inv.status === 'unpaid' && styles.statusUnpaid,
                    inv.status === 'partial' && styles.statusPartial,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      inv.status === 'paid' && styles.textPaid,
                      inv.status === 'unpaid' && styles.textUnpaid,
                      inv.status === 'partial' && styles.textPartial,
                    ]}
                  >
                    {inv.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.amountStrip}>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Net Total</Text>
                  <Text style={styles.amountVal}>
                    Rs. {inv.netTotal.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Paid</Text>
                  <Text style={[styles.amountVal, { color: '#16A34A' }]}>
                    Rs. {inv.amountReceived.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Balance Due</Text>
                  <Text
                    style={[
                      styles.amountVal,
                      inv.balanceDue > 0 && { color: '#DC2626' },
                    ]}
                  >
                    Rs. {inv.balanceDue.toLocaleString()}
                  </Text>
                </View>
              </View>

              {inv.balanceDue > 0 ? (
                <TouchableOpacity
                  style={styles.collectActionBtn}
                  onPress={() => openCollectModal(inv)}
                >
                  <CreditCard size={15} color="#FFFFFF" />
                  <Text style={styles.collectActionText}>
                    Collect Payment (Rs. {inv.balanceDue.toLocaleString()})
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.paidReceiptRow}
                  onPress={() => navigation?.navigate?.('StaffPaymentHistory')}
                >
                  <CheckCircle2 size={14} color="#16A34A" />
                  <Text style={styles.paidReceiptText}>
                    Settled — View Payment Receipt History
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Generate Invoice Modal */}
      <InvoiceGenerateModal
        visible={isGenerateModalVisible}
        onClose={() => setIsGenerateModalVisible(false)}
        onGenerate={handleGenerateInvoice}
        prefillPatient={prefillPatient}
        patients={patients.map((p) => ({ id: p.id, name: p.name, mrn: p.mrn }))}
        isLoading={generatingInvoice}
      />

      {/* Cross-Platform Payment Collection Modal */}
      <Modal
        visible={Boolean(collectingInvoice)}
        transparent
        animationType="slide"
        onRequestClose={() => setCollectingInvoice(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Collect Payment</Text>
              <TouchableOpacity onPress={() => setCollectingInvoice(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {collectingInvoice ? (
              <>
                <View style={styles.summaryBox}>
                  <Text style={styles.sumPatient}>
                    {collectingInvoice.patientName} (
                    {collectingInvoice.invoiceNumber})
                  </Text>
                  <Text style={styles.sumDue}>
                    Balance Due: Rs.{' '}
                    {collectingInvoice.balanceDue.toLocaleString()}
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>Amount to Collect (Rs.)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={collectAmountStr}
                  onChangeText={setCollectAmountStr}
                />

                <Text style={styles.fieldLabel}>Payment Channel</Text>
                <View style={styles.methodsRow}>
                  {(['cash', 'card', 'online', 'insurance'] as const).map(
                    (m) => {
                      const active = collectMethod === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.methodPill,
                            active && styles.methodPillActive,
                          ]}
                          onPress={() => setCollectMethod(m)}
                        >
                          <Text
                            style={[
                              styles.methodText,
                              active && { color: '#FFFFFF' },
                            ]}
                          >
                            {m.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                <Text style={styles.fieldLabel}>
                  Transaction / Receipt Reference (Optional)
                </Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. POS-88412 or Bank Ref"
                  placeholderTextColor="#94A3B8"
                  value={collectRef}
                  onChangeText={setCollectRef}
                />

                <TouchableOpacity
                  style={[
                    styles.submitPayBtn,
                    recordingPay && { opacity: 0.7 },
                  ]}
                  disabled={recordingPay}
                  onPress={handleSubmitPayment}
                >
                  <Text style={styles.submitPayText}>
                    {recordingPay
                      ? 'Recording Payment...'
                      : 'Confirm Payment & Issue Receipt'}
                  </Text>
                </TouchableOpacity>
              </>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
  },
  historyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newInvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0866C6',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  newInvText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  kpiWrap: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#142D4E',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  invTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  invLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  invIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0866C6',
  },
  invPatient: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPaid: {
    backgroundColor: '#DCFCE7',
  },
  statusUnpaid: {
    backgroundColor: '#FEE2E2',
  },
  statusPartial: {
    backgroundColor: '#FEF3C7',
  },
  textPaid: {
    color: '#166534',
  },
  textUnpaid: {
    color: '#DC2626',
  },
  textPartial: {
    color: '#92400E',
  },
  amountStrip: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  amountCol: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  amountVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#142D4E',
    marginTop: 2,
  },
  collectActionBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  collectActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  paidReceiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  paidReceiptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
  summaryBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  sumPatient: {
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  sumDue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0866C6',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 6,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#142D4E',
    marginBottom: 6,
  },
  methodsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  methodPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  methodPillActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  methodText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  submitPayBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  submitPayText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});

export default BillingDashboardScreen;
