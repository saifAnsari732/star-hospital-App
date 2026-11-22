import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Share } from '../../utils/share';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  Receipt,
  CreditCard,
  Share2,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { InvoiceDetail } from '../../types/billing';
import { billingService } from '../../services/billingService';
import { razorpayService } from '../../services/razorpayService';
import { isMockFallbackEnabled } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { StarHeader, StarCard, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';
import { resolveEffectivePatientId } from './patientUtils';

type Props = NativeStackScreenProps<PatientStackParamList, 'PaymentDetails'>;
type PaymentMethod = NonNullable<InvoiceDetail['payments']>[number]['method'];

const PAYMENT_METHODS: Array<{ key: PaymentMethod; label: string }> = [
  { key: 'online', label: 'Razorpay Checkout (UPI / Cards / NetBanking)' },
  { key: 'card', label: 'POS Card Terminal' },
  { key: 'cash', label: 'Cash at Counter' },
];

export const PaymentDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { invoiceId, paymentId } = route.params;
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('online');
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentBanner, setPaymentBanner] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let found: InvoiceDetail | null = null;
      if (invoiceId) {
        found = await billingService.getInvoiceById(invoiceId);
      }
      if (!found) {
        const all = await billingService.getInvoices(effectivePatientId);
        found =
          all.find((i) => i.id === invoiceId) ||
          all.find((i) => i.payments?.some((p) => p.id === paymentId)) ||
          all[0] ||
          null;
      }
      if (!found) {
        setErrorMsg('Invoice or payment receipt could not be found.');
      } else {
        setInvoice(found);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load payment details.');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId, paymentId, effectivePatientId]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handlePayNow = async () => {
    if (!invoice || invoice.balanceDue <= 0) return;
    setErrorMsg(null);
    setIsPaying(true);
    try {
      if (selectedMethod === 'online') {
        const verification = await razorpayService.processInvoicePayment(
          {
            invoiceId: invoice.id,
            amount: invoice.balanceDue,
            currency: 'INR',
            notes: {
              patientName: invoice.patientName,
              patientMrn: invoice.patientMrn,
            },
          },
          {
            name: user?.name || invoice.patientName,
            email: user?.email,
            contact: user?.phone,
          }
        );
        if (verification.invoice) {
          setInvoice(verification.invoice);
        } else {
          await loadInvoice();
        }
        setPaymentBanner(
          verification.verificationStatus === 'mock_verified'
            ? `Razorpay Order (${verification.orderId}) & Payment (${verification.paymentId}) verified in demo mode. Deploy ICTHospital Laravel /api/v1/payments/razorpay/* for live HMAC capture.`
            : `Razorpay Payment (${verification.paymentId}) verified and captured on server.`
        );
      } else {
        const updated = await billingService.recordPayment({
          invoiceId: invoice.id,
          amount: invoice.balanceDue,
          method: selectedMethod,
          transactionRef: `TXN-APP-${Math.floor(100000 + Math.random() * 900000)}`,
        });
        setInvoice(updated);
        setPaymentBanner(
          isMockFallbackEnabled
            ? `Staging payment of PKR ${invoice.balanceDue.toLocaleString()} recorded via ${selectedMethod.toUpperCase()} (live banking gateway not yet linked).`
            : `Payment of PKR ${invoice.balanceDue.toLocaleString()} settled via ${selectedMethod.toUpperCase()}.`
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Payment recording failed. Please retry.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleShareReceipt = async () => {
    if (!invoice) return;
    try {
      const latestTxn = invoice.payments?.[invoice.payments.length - 1];
      await Share.share({
        title: `Star Hospital Receipt ${invoice.invoiceNumber}`,
        message: `STAR HOSPITAL RECEIPT\nInvoice: ${invoice.invoiceNumber}\nPatient: ${invoice.patientName} (${invoice.patientMrn})\nNet Total: PKR ${invoice.netTotal.toLocaleString()}\nAmount Paid: PKR ${invoice.amountReceived.toLocaleString()}\nBalance Due: PKR ${invoice.balanceDue.toLocaleString()}\nStatus: ${invoice.status.toUpperCase()}\nTransaction Ref: ${latestTxn?.transactionRef || 'Pending'}`,
      });
    } catch {
      // Cancelled
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader title="Payment Details" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !invoice ? (
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color={colors.danger} />
          <Text style={styles.errorText}>{errorMsg || 'Receipt not found.'}</Text>
          <StarButton title="Retry" onPress={loadInvoice} variant="outline" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {paymentBanner ? (
            <View style={styles.successBanner}>
              <CheckCircle2 size={18} color={colors.success} />
              <Text style={styles.successBannerText}>{paymentBanner}</Text>
            </View>
          ) : null}

          {/* Hero Receipt Status */}
          <StarCard style={styles.heroCard} variant="elevated">
            <View style={styles.heroRow}>
              <View
                style={[
                  styles.statusCircle,
                  {
                    backgroundColor:
                      invoice.status === 'paid'
                        ? colors.successLight
                        : colors.warningLight,
                  },
                ]}
              >
                {invoice.status === 'paid' ? (
                  <CheckCircle2 size={28} color={colors.success} />
                ) : (
                  <Clock size={28} color={colors.warning} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.invNo}>{invoice.invoiceNumber}</Text>
                <Text style={styles.invMeta}>
                  {invoice.department || 'OPD Services'} • {invoice.date}
                </Text>
              </View>
              <View style={styles.totalCol}>
                <Text style={styles.netLabel}>Net Amount</Text>
                <Text style={styles.netValue}>
                  PKR {invoice.netTotal.toLocaleString()}
                </Text>
              </View>
            </View>
          </StarCard>

          {/* Itemized Breakdown */}
          <StarCard style={styles.sectionCard} variant="elevated">
            <Text style={styles.sectionTitle}>Invoice Line Items</Text>
            {invoice.items.map((item) => (
              <View key={item.id} style={styles.lineItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <Text style={styles.itemSub}>
                    {item.quantity} x PKR {item.unitPrice.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  PKR {item.total.toLocaleString()}
                </Text>
              </View>
            ))}

            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Gross Total</Text>
              <Text style={styles.summaryVal}>
                PKR {invoice.grossTotal.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Discount</Text>
              <Text style={styles.summaryVal}>
                - PKR {invoice.discount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Amount Received</Text>
              <Text style={[styles.summaryVal, { color: colors.success }]}>
                PKR {invoice.amountReceived.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryKeyBold}>Balance Due</Text>
              <Text
                style={[
                  styles.summaryValBold,
                  {
                    color:
                      invoice.balanceDue > 0 ? colors.danger : colors.success,
                  },
                ]}
              >
                PKR {invoice.balanceDue.toLocaleString()}
              </Text>
            </View>
          </StarCard>

          {/* Recorded Transactions */}
          {invoice.payments && invoice.payments.length > 0 && (
            <StarCard style={styles.sectionCard} variant="elevated">
              <Text style={styles.sectionTitle}>Transaction Log</Text>
              {invoice.payments.map((pay) => (
                <View key={pay.id} style={styles.txnRow}>
                  <CreditCard size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txnRef}>
                      {pay.transactionRef || pay.id.toUpperCase()}
                    </Text>
                    <Text style={styles.txnSub}>
                      {pay.method.toUpperCase()} • {pay.date.split('T')[0]}
                      {pay.receivedBy ? ` • ${pay.receivedBy}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.txnAmount}>
                    PKR {pay.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </StarCard>
          )}

          {/* Pay Unpaid Balance Section */}
          {invoice.balanceDue > 0 && (
            <StarCard style={styles.sectionCard} variant="elevated">
              <Text style={styles.sectionTitle}>Settle Outstanding Balance</Text>
              <View style={styles.methodList}>
                {PAYMENT_METHODS.map((m) => {
                  const active = selectedMethod === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setSelectedMethod(m.key)}
                      style={[
                        styles.methodBtn,
                        active ? styles.methodBtnActive : undefined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.methodBtnText,
                          active ? styles.methodBtnTextActive : undefined,
                        ]}
                      >
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errorMsg ? (
                <Text style={styles.inlineError}>{errorMsg}</Text>
              ) : null}
              <StarButton
                title={
                  isPaying
                    ? 'Processing...'
                    : `Pay PKR ${invoice.balanceDue.toLocaleString()}`
                }
                onPress={handlePayNow}
                loading={isPaying}
                disabled={isPaying}
                fullWidth
              />
            </StarCard>
          )}

          <StarButton
            title="Share / Print Payment Receipt"
            variant="outline"
            onPress={handleShareReceipt}
            fullWidth
            leftIcon={<Share2 size={16} color={colors.primary} />}
          />
          <StarButton
            title="View Payment History"
            variant="ghost"
            onPress={() => navigation.navigate('PaymentHistory')}
            fullWidth
            leftIcon={<Receipt size={16} color={colors.primary} />}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: { ...typography.bodyMedium, color: colors.danger, textAlign: 'center' },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    padding: spacing.sm,
    borderRadius: radii.md,
  },
  successBannerText: { ...typography.bodySmall, color: colors.success, flex: 1 },
  heroCard: { padding: spacing.lg, borderRadius: radii.xl },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  statusCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invNo: { ...typography.h4, color: colors.textPrimary },
  invMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  totalCol: { alignItems: 'flex-end' },
  netLabel: { ...typography.caption, color: colors.textSecondary },
  netValue: { ...typography.h4, color: colors.primary },
  sectionCard: { padding: spacing.lg, borderRadius: radii.xl },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemDesc: { ...typography.bodyMedium, color: colors.textPrimary },
  itemSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  itemTotal: { ...typography.labelLarge, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryKey: { ...typography.bodySmall, color: colors.textSecondary },
  summaryVal: { ...typography.bodySmall, color: colors.textPrimary },
  summaryKeyBold: { ...typography.labelLarge, color: colors.textPrimary },
  summaryValBold: { ...typography.h4 },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  txnRef: { ...typography.labelMedium, color: colors.textPrimary },
  txnSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  txnAmount: { ...typography.labelLarge, color: colors.success },
  methodList: { gap: spacing.xs, marginBottom: spacing.md },
  methodBtn: {
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  methodBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodBtnText: { ...typography.labelMedium, color: colors.textPrimary },
  methodBtnTextActive: { color: colors.primaryDark, fontWeight: '700' },
  inlineError: { ...typography.caption, color: colors.danger, marginBottom: spacing.sm },
});
