import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Share } from '../../utils/share';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Receipt,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  User,
  ArrowLeft,
  AlertCircle,
  FileCheck,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { PaymentTransaction, PaymentAuditLog } from '../../types/billing';
import { razorpayService } from '../../services/razorpayService';
import { StarHeader, StarCard, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'PaymentReceipt'>;

export const PaymentReceiptScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId } = route.params;

  const [txn, setTxn] = useState<PaymentTransaction | null>(null);
  const [auditLogs, setAuditLogs] = useState<PaymentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchReceiptData = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const [t, logs] = await Promise.all([
          razorpayService.getTransactionById(transactionId),
          razorpayService.getAuditLogs(transactionId),
        ]);
        setTxn(t);
        setAuditLogs(logs);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Unable to load official payment receipt.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptData();
  }, [transactionId]);

  const handleShare = async () => {
    if (!txn) return;
    try {
      await Share.share({
        title: `Official Star Hospital Receipt - ${txn.receiptNumber}`,
        message: `STAR HOSPITAL OFFICIAL PAYMENT RECEIPT\nReceipt: ${txn.receiptNumber}\nTxn ID: ${txn.id}\nPatient: ${txn.patientName} (${txn.patientMrn})\nModule: ${txn.module.toUpperCase()}\nAmount Paid: ₹${txn.amountPaid.toLocaleString('en-IN')}\nStatus: ${txn.status.toUpperCase()}\nPayment Gateway: Razorpay India\nTimestamp: ${txn.createdAt}`,
      });
    } catch {
      // Ignore share dismissal
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="Official Receipt"
        subtitle="Verified Medical Bill"
        onBackPress={() => navigation.goBack()}
        rightAction={
          txn ? (
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Share2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.starTeal} />
          <Text style={styles.loadingText}>Loading official hospital receipt...</Text>
        </View>
      ) : errorMsg || !txn ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color={colors.danger} />
          <Text style={styles.errorText}>{errorMsg || 'Receipt record not found.'}</Text>
          <StarButton title="Go Back" onPress={() => navigation.goBack()} variant="outline" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Hospital Receipt Voucher */}
          <View style={styles.receiptVoucher}>
            {/* Header Voucher */}
            <View style={styles.voucherHeader}>
              <View style={styles.logoBadge}>
                <Building2 size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.hospitalTitle}>STAR HOSPITAL</Text>
                <Text style={styles.hospitalSub}>Healthcare Systems & Medical Center</Text>
                <Text style={styles.hospitalMeta}>ICTHospital 12 • Sector F-8, Islamabad</Text>
              </View>
            </View>

            <View style={styles.dashedDivider} />

            {/* Receipt Meta */}
            <View style={styles.metaRow}>
              <View>
                <Text style={styles.metaLabel}>RECEIPT NUMBER</Text>
                <Text style={styles.metaValBold}>{txn.receiptNumber}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>DATE & TIME</Text>
                <Text style={styles.metaVal}>{txn.createdAt.replace('T', ' ').substring(0, 16)}</Text>
              </View>
            </View>

            {/* Patient Info */}
            <View style={styles.patientInfoBox}>
              <View style={styles.patientRow}>
                <User size={14} color={colors.starNavy} />
                <Text style={styles.patientLabel}>Patient:</Text>
                <Text style={styles.patientName}>{txn.patientName}</Text>
              </View>
              <View style={styles.patientRow}>
                <Text style={styles.patientLabel}>MRN:</Text>
                <Text style={styles.patientMrn}>{txn.patientMrn}</Text>
                <Text style={styles.patientLabel}>Module:</Text>
                <View style={styles.moduleTag}>
                  <Text style={styles.moduleTagText}>{txn.module.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            {/* Itemized Line */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCol, { flex: 2 }]}>DESCRIPTION</Text>
              <Text style={[styles.tableCol, { flex: 1, textAlign: 'right' }]}>AMOUNT</Text>
            </View>

            <View style={styles.tableRow}>
              <View style={{ flex: 2 }}>
                <Text style={styles.itemTitle}>
                  {txn.module.toUpperCase()} Service Charge ({txn.moduleId})
                </Text>
                {txn.invoiceNumber ? (
                  <Text style={styles.itemSub}>Invoice: {txn.invoiceNumber}</Text>
                ) : null}
              </View>
              <Text style={styles.itemAmount}>₹{txn.amount.toLocaleString('en-IN')}.00</Text>
            </View>

            <View style={styles.solidDivider} />

            {/* Totals */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Gross Amount:</Text>
              <Text style={styles.totalVal}>₹{txn.amount.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount Paid (Captured):</Text>
              <Text style={[styles.totalVal, { color: colors.starTeal, fontWeight: '800' }]}>
                ₹{txn.amountPaid.toLocaleString('en-IN')}.00
              </Text>
            </View>
            {txn.amountRefunded > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount Refunded:</Text>
                <Text style={[styles.totalVal, { color: colors.danger, fontWeight: '800' }]}>
                  -₹{txn.amountRefunded.toLocaleString('en-IN')}.00
                </Text>
              </View>
            ) : null}

            <View style={styles.dashedDivider} />

            {/* Gateway Security Stamp */}
            <View style={styles.gatewayStampRow}>
              <ShieldCheck size={20} color={colors.starTeal} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stampTitle}>Razorpay Server Verified</Text>
                <Text style={styles.stampSub}>Order: {txn.razorpayOrderId || 'N/A'}</Text>
                <Text style={styles.stampSub}>Payment: {txn.razorpayPaymentId || 'N/A'}</Text>
              </View>
              <View style={styles.paidStampBadge}>
                <Text style={styles.paidStampText}>{txn.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* Audit Logs Accordion/List */}
          <StarCard style={styles.auditCard} variant="elevated">
            <View style={styles.auditHeader}>
              <FileCheck size={16} color={colors.starNavy} />
              <Text style={styles.auditHeaderTitle}>Immutable Payment Audit Trail</Text>
            </View>

            {auditLogs.map((log) => (
              <View key={log.id} style={styles.auditRow}>
                <View style={styles.auditDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.auditAction}>{log.action.replace('_', ' ').toUpperCase()}</Text>
                  <Text style={styles.auditDetails}>{log.details}</Text>
                  <Text style={styles.auditTime}>{log.timestamp.replace('T', ' ').substring(0, 19)} • By {log.performedBy}</Text>
                </View>
              </View>
            ))}
          </StarCard>

          {/* Action CTAs */}
          <View style={{ gap: 10, marginTop: 4 }}>
            <TouchableOpacity style={styles.shareVoucherBtn} onPress={handleShare}>
              <Share2 size={16} color="#FFFFFF" />
              <Text style={styles.shareVoucherBtnText}>Share Official Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.navigate('Bills')}>
              <Text style={styles.doneBtnText}>Back to Bills &amp; Invoices</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
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
  errorText: {
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.starNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptVoucher: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: colors.starNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.starNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospitalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.starNavy,
    letterSpacing: 0.5,
  },
  hospitalSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.starTeal,
  },
  hospitalMeta: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  solidDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.starNavy,
    marginTop: 2,
  },
  metaValBold: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.starNavy,
    marginTop: 2,
  },
  patientInfoBox: {
    backgroundColor: colors.mintBg,
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.mintBorder,
    marginBottom: 14,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  patientLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mintText,
  },
  patientName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.starNavy,
  },
  patientMrn: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.starTeal,
    marginRight: 8,
  },
  moduleTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.mintBorder,
  },
  moduleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.starNavy,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableCol: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.starNavy,
  },
  itemSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  itemAmount: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: colors.starNavy,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.starNavy,
  },
  gatewayStampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stampTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.starNavy,
  },
  stampSub: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: 'monospace',
    marginTop: 1,
  },
  paidStampBadge: {
    backgroundColor: colors.starTeal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidStampText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  auditCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  auditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  auditHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.starNavy,
    letterSpacing: 0.4,
  },
  auditRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  auditDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.starTeal,
    marginTop: 4,
  },
  auditAction: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.starNavy,
  },
  auditDetails: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
    lineHeight: 15,
  },
  auditTime: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
  shareVoucherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.starTeal,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  shareVoucherBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  doneBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  doneBtnText: {
    color: colors.starNavy,
    fontSize: 13,
    fontWeight: '700',
  },
});

export default PaymentReceiptScreen;
