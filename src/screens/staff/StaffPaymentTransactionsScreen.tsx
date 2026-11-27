import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Filter,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  Building,
  User,
  ArrowRight,
  FileText,
  Receipt,
  X,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import { StarHeader, StarCard, StarButton, EmptyState } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';
import { PaymentTransaction, PaymentTransactionStatus, PaymentModuleType } from '../../types/billing';
import { razorpayService } from '../../services/razorpayService';
import { useAuth } from '../../context/AuthContext';
import { hasStaffPermission } from '../../components/staff/staffPermissions';

export const StaffPaymentTransactionsScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const designation = user?.designation;
  const canRefund = hasStaffPermission(designation, 'payments:refund');

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentTransactionStatus>('all');
  const [moduleFilter, setModuleFilter] = useState<'all' | PaymentModuleType>('all');

  // Refund Modal State
  const [selectedTxnForRefund, setSelectedTxnForRefund] = useState<PaymentTransaction | null>(null);
  const [refundAmountStr, setRefundAmountStr] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      const list = await razorpayService.getTransactions();
      setTransactions(list);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to load payment transactions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (moduleFilter !== 'all' && t.module !== moduleFilter) return false;
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          t.id.toLowerCase().includes(q) ||
          t.patientName.toLowerCase().includes(q) ||
          t.patientMrn.toLowerCase().includes(q) ||
          t.receiptNumber.toLowerCase().includes(q) ||
          (t.razorpayPaymentId && t.razorpayPaymentId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transactions, statusFilter, moduleFilter, searchQuery]);

  const metrics = useMemo(() => {
    const totalCollected = transactions.reduce((acc, t) => acc + t.amountPaid, 0);
    const totalRefunded = transactions.reduce((acc, t) => acc + t.amountRefunded, 0);
    const countPaid = transactions.filter((t) => t.status === 'paid').length;
    const countPending = transactions.filter((t) => t.status === 'pending').length;
    return { totalCollected, totalRefunded, countPaid, countPending };
  }, [transactions]);

  const handleOpenRefundModal = (txn: PaymentTransaction) => {
    setSelectedTxnForRefund(txn);
    setRefundAmountStr(String(txn.amountPaid - txn.amountRefunded));
    setRefundReason('');
  };

  const handleSubmitRefund = async () => {
    if (!selectedTxnForRefund) return;
    const amt = parseFloat(refundAmountStr);
    if (!amt || isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid refund amount.');
      return;
    }
    if (!refundReason.trim()) {
      Alert.alert('Reason Required', 'Please specify a clinical/administrative reason for this refund.');
      return;
    }

    setIsRefunding(true);
    try {
      const res = await razorpayService.processRefund({
        transactionId: selectedTxnForRefund.id,
        amount: amt,
        reason: refundReason.trim(),
        staffUserId: user?.id,
      });

      Alert.alert('Refund Approved', `Refund ${res.refundId} processed successfully (₹${res.amountRefunded}).`);
      setSelectedTxnForRefund(null);
      await loadTransactions();
    } catch (err: any) {
      Alert.alert('Refund Failed', err?.message || 'Unable to process refund.');
    } finally {
      setIsRefunding(false);
    }
  };

  const renderStatusBadge = (status: PaymentTransactionStatus) => {
    switch (status) {
      case 'paid':
        return (
          <View style={[styles.statusBadge, { backgroundColor: colors.mintBg, borderColor: colors.mintBorder }]}>
            <CheckCircle2 size={11} color={colors.starTeal} />
            <Text style={[styles.statusBadgeText, { color: colors.mintText }]}>PAID</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
            <Clock size={11} color="#D97706" />
            <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>PENDING</Text>
          </View>
        );
      case 'refunded':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
            <RotateCcw size={11} color="#6366F1" />
            <Text style={[styles.statusBadgeText, { color: '#4338CA' }]}>REFUNDED</Text>
          </View>
        );
      case 'partially_paid':
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <CreditCard size={11} color="#0866C6" />
            <Text style={[styles.statusBadgeText, { color: '#1E40AF' }]}>PARTIAL</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
            <XCircle size={11} color={colors.danger} />
            <Text style={[styles.statusBadgeText, { color: colors.danger }]}>FAILED</Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Payment Transactions"
        subtitle="Gateway Audits, Settlements & Refunds"
        onBackPress={() => navigation.goBack()}
      />

      {/* KPI Hero Strip */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TOTAL SETTLED</Text>
          <Text style={[styles.kpiVal, { color: colors.starTeal }]}>
            ₹{metrics.totalCollected.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>REFUNDED</Text>
          <Text style={[styles.kpiVal, { color: colors.danger }]}>
            ₹{metrics.totalRefunded.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>TRANSACTIONS</Text>
          <Text style={styles.kpiVal}>{transactions.length}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={16} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Patient, MRN, Receipt or Txn ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Status Filter Chips */}
      <View style={{ marginBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
          {(['all', 'paid', 'pending', 'partially_paid', 'refunded', 'failed'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                {st.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Module Filter Chips */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
          {(['all', 'appointment', 'opd', 'laboratory', 'radiology', 'pharmacy', 'admission', 'invoice'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.moduleChip, moduleFilter === m && styles.moduleChipActive]}
              onPress={() => setModuleFilter(m)}
            >
              <Text style={[styles.moduleChipText, moduleFilter === m && styles.moduleChipTextActive]}>
                {m.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.starTeal} />
          <Text style={styles.loadingText}>Syncing payment ledger with Razorpay gateway...</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          title="No Transactions Found"
          description="No transactions match the selected filters."
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadTransactions();
              }}
              colors={[colors.starTeal]}
            />
          }
        >
          {filteredTransactions.map((item) => (
            <View key={item.id} style={styles.transactionCard}>
              <View style={styles.cardTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.patientName}>{item.patientName}</Text>
                    <Text style={styles.patientMrn}>({item.patientMrn})</Text>
                  </View>
                  <Text style={styles.moduleMeta}>
                    Module: <Text style={styles.boldText}>{item.module.toUpperCase()}</Text> • ID: {item.moduleId}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amountText}>₹{item.amount.toLocaleString('en-IN')}</Text>
                  {renderStatusBadge(item.status)}
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardMetaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>RECEIPT</Text>
                  <Text style={styles.metaVal}>{item.receiptNumber}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>GATEWAY REF</Text>
                  <Text style={[styles.metaVal, { fontFamily: 'monospace' }]}>
                    {item.razorpayPaymentId || 'N/A (Pending)'}
                  </Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>DATE</Text>
                  <Text style={styles.metaVal}>{item.createdAt.substring(0, 10)}</Text>
                </View>
              </View>

              {/* Action Buttons: Refund or View Receipt */}
              <View style={styles.cardActionsRow}>
                {canRefund && (item.status === 'paid' || item.status === 'partially_paid') ? (
                  <TouchableOpacity
                    style={styles.refundBtn}
                    onPress={() => handleOpenRefundModal(item)}
                    activeOpacity={0.8}
                  >
                    <RotateCcw size={13} color="#DC2626" />
                    <Text style={styles.refundBtnText}>Initiate Refund</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={styles.viewVoucherBtn}
                  onPress={() => navigation.navigate('PaymentReceipt', { transactionId: item.id })}
                  activeOpacity={0.8}
                >
                  <Receipt size={13} color={colors.starNavy} />
                  <Text style={styles.viewVoucherBtnText}>View Receipt &amp; Audit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Staff Refund Modal */}
      <Modal visible={Boolean(selectedTxnForRefund)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} color="#DC2626" />
                <Text style={styles.modalTitle}>Issue Patient Refund</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedTxnForRefund(null)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Refund will be issued back via Razorpay India. Please specify reason for audit compliance.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>REFUND AMOUNT (INR)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={refundAmountStr}
                onChangeText={setRefundAmountStr}
                placeholder="Amount in Rupees"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CLINICAL / ADMINISTRATIVE REASON</Text>
              <TextInput
                style={[styles.textInput, { height: 72, textAlignVertical: 'top' }]}
                multiline
                value={refundReason}
                onChangeText={setRefundReason}
                placeholder="e.g. Doctor cancelled consultation / Duplicate test order"
              />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setSelectedTxnForRefund(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSubmitRefund}
                disabled={isRefunding}
              >
                {isRefunding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Confirm &amp; Refund</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: colors.starNavy,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    borderRadius: radii.lg,
    padding: 14,
    shadowColor: colors.starNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'center',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.6,
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.starNavy,
    padding: 0,
  },
  filterChipRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: colors.starNavy,
    borderColor: colors.starNavy,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  moduleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  moduleChipActive: {
    backgroundColor: colors.starTeal,
  },
  moduleChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  moduleChipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.starNavy,
  },
  patientMrn: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.starTeal,
  },
  moduleMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '800',
    color: colors.starNavy,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.starNavy,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 3,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  metaVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.starNavy,
    marginTop: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  refundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  refundBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  viewVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewVoucherBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.starNavy,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(18, 52, 77, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.starNavy,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.starNavy,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: '#DC2626',
  },
  modalConfirmText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default StaffPaymentTransactionsScreen;
