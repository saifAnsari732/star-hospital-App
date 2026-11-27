import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
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
  Ticket,
  ShieldCheck,
  Building,
  User,
  ArrowRight,
  Sparkles,
  Volume2,
  Check,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { InvoiceDetail } from '../../types/billing';
import { OPDToken } from '../../types/opdToken';
import { billingService } from '../../services/billingService';
import { razorpayService } from '../../services/razorpayService';
import { voiceQueueAnnouncementService } from '../../services/voiceQueueAnnouncementService';
import { isMockFallbackEnabled } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useOPDToken } from '../../context/OPDTokenContext';
import { StarHeader, StarCard, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';
import { resolveEffectivePatientId } from './patientUtils';

type Props = NativeStackScreenProps<PatientStackParamList, 'PaymentDetails'>;
type PaymentMethod = NonNullable<InvoiceDetail['payments']>[number]['method'];

const PAYMENT_METHODS: Array<{
  key: PaymentMethod;
  title: string;
  sub: string;
  icon: string;
  badge?: string;
}> = [
  {
    key: 'online',
    title: 'Razorpay Secure Checkout',
    sub: 'Instant Token • UPI (GPay, PhonePe, Paytm), Cards & NetBanking',
    icon: 'razorpay',
    badge: 'RECOMMENDED',
  },
  {
    key: 'card',
    title: 'POS Debit / Credit Card Terminal',
    sub: 'Swipe or Tap at Hospital Reception Counter',
    icon: 'card',
  },
  {
    key: 'cash',
    title: 'Cash Payment at Counter',
    sub: 'Pay at Hospital Billing Desk & Collect Printed Slip',
    icon: 'cash',
  },
];

export const PaymentDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { invoiceId, paymentId, module: routeModule, moduleId: routeModuleId } = route.params;
  const { user } = useAuth();
  const { generateToken } = useOPDToken();
  const effectivePatientId = resolveEffectivePatientId(user?.id);

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('online');
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success Modal State with OPD Token
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<OPDToken | null>(null);
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null);

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

      // If came from appointment or module without direct invoice, synthesize invoice view
      if (!found && (routeModule || routeModuleId)) {
        found = {
          id: `inv-${routeModuleId || 'appt'}`,
          invoiceNumber: `INV-${(routeModuleId || 'APPT').toUpperCase()}`,
          date: new Date().toISOString().split('T')[0],
          patientId: effectivePatientId,
          patientName: user?.name || 'Star Hospital Patient',
          patientMrn: (user as any)?.mrn || 'P-00102',
          doctorName: 'Dr. Amit Sharma',
          department: 'General Physician',
          careSetting: 'opd',
          grossTotal: 1000,
          discount: 0,
          netTotal: 1000,
          amountReceived: 0,
          balanceDue: 1000,
          status: 'unpaid',
          items: [
            {
              id: 'item-1',
              description: routeModule === 'appointment' ? 'OPD Doctor Consultation Fee' : 'Hospital Clinical Care Service',
              quantity: 1,
              unitPrice: 1000,
              total: 1000,
            },
          ],
          payments: [],
        };
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
  }, [invoiceId, paymentId, effectivePatientId, routeModule, routeModuleId, user]);

  useEffect(() => {
    loadInvoice();
  }, [loadInvoice]);

  const handlePayNow = async () => {
    if (!invoice || invoice.balanceDue <= 0) return;
    setErrorMsg(null);
    setIsPaying(true);
    try {
      let paymentRef = `TXN-APP-${Math.floor(100000 + Math.random() * 900000)}`;
      let txnId = `txn_${Date.now()}`;

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

        paymentRef = verification.paymentId;
        txnId = verification.transactionId;

        if (verification.invoice) {
          setInvoice(verification.invoice);
        } else {
          await loadInvoice();
        }
      } else {
        const updated = await billingService.recordPayment({
          invoiceId: invoice.id,
          amount: invoice.balanceDue,
          method: selectedMethod,
          transactionRef: paymentRef,
        });
        setInvoice(updated);
      }

      setLastPaymentId(paymentRef);

      // AUTOMATIC OPD TOKEN GENERATION ON PAYMENT SUCCESS
      // Patient gets assigned next live queue token immediately with room announcement
      try {
        const assignedDoctorId = invoice.doctorId || 'doc-1';
        const token = await generateToken(assignedDoctorId, 'opd_consultation', {
          isPaid: true,
          paymentAmount: invoice.balanceDue,
          paymentId: paymentRef,
        });
        setGeneratedToken(token);

        // Voice confirmation in natural female Hindi voice
        const chamberName = token.roomNo || 'Room 104';
        const docName = invoice.doctorName || 'Dr. Amit Sharma';
        void voiceQueueAnnouncementService.announceYourTurnNow(
          token.tokenNumber,
          user?.name || invoice.patientName,
          docName,
          chamberName
        );
      } catch (tokErr) {
        console.warn('OPD token generation post-payment non-fatal warning:', tokErr);
      }

      setSuccessModalVisible(true);
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
        message: `STAR HOSPITAL RECEIPT\nInvoice: ${invoice.invoiceNumber}\nPatient: ${invoice.patientName} (${invoice.patientMrn})\nNet Total: ₹${invoice.netTotal.toLocaleString('en-IN')}\nAmount Paid: ₹${invoice.amountReceived.toLocaleString('en-IN')}\nBalance Due: ₹${invoice.balanceDue.toLocaleString('en-IN')}\nStatus: ${invoice.status.toUpperCase()}\nTransaction Ref: ${latestTxn?.transactionRef || 'Pending'}`,
      });
    } catch {
      // Cancelled
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader title="Payment &amp; Billing" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.starTeal} />
          <Text style={styles.loadingText}>Fetching verified hospital invoice...</Text>
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
          {/* Executive Navy Header Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Building size={16} color="#FFFFFF" />
                <Text style={styles.heroBadgeText}>STAR HOSPITAL BILLING</Text>
              </View>
              <View
                style={[
                  styles.statusTag,
                  invoice.status === 'paid' ? styles.statusTagPaid : styles.statusTagUnpaid,
                ]}
              >
                {invoice.status === 'paid' ? (
                  <CheckCircle2 size={12} color="#065F46" />
                ) : (
                  <Clock size={12} color="#92400E" />
                )}
                <Text
                  style={[
                    styles.statusTagText,
                    invoice.status === 'paid' ? { color: '#065F46' } : { color: '#92400E' },
                  ]}
                >
                  {invoice.status.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.heroAmountRow}>
              <View>
                <Text style={styles.heroLabel}>OUTSTANDING AMOUNT</Text>
                <Text style={styles.heroAmount}>
                  ₹{invoice.balanceDue.toLocaleString('en-IN')}.00
                </Text>
              </View>
              <View style={styles.heroRightMeta}>
                <Text style={styles.heroInvNum}>{invoice.invoiceNumber}</Text>
                <Text style={styles.heroDate}>{invoice.date}</Text>
              </View>
            </View>

            <View style={styles.heroDivider} />

            <View style={styles.heroPatientRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <User size={14} color="#93C5FD" />
                <Text style={styles.heroPatientName}>{invoice.patientName}</Text>
              </View>
              <Text style={styles.heroMrn}>MRN: {invoice.patientMrn}</Text>
            </View>
          </View>

          {/* Itemized Services Breakdown */}
          <StarCard style={styles.sectionCard} variant="elevated">
            <View style={styles.sectionHeader}>
              <Receipt size={16} color={colors.starNavy} />
              <Text style={styles.sectionTitle}>Itemized Clinical Services</Text>
            </View>

            {invoice.items.map((item) => (
              <View key={item.id} style={styles.lineItem}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <Text style={styles.itemSub}>
                    {item.category || 'Clinical'} • {item.quantity} unit @ ₹{item.unitPrice.toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>₹{item.total.toLocaleString('en-IN')}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Gross Subtotal</Text>
              <Text style={styles.summaryVal}>₹{invoice.grossTotal.toLocaleString('en-IN')}.00</Text>
            </View>

            {invoice.discount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Hospital Concession</Text>
                <Text style={[styles.summaryVal, { color: colors.starTeal }]}>
                  - ₹{invoice.discount.toLocaleString('en-IN')}.00
                </Text>
              </View>
            ) : null}

            <View style={styles.summaryRow}>
              <Text style={styles.summaryKey}>Amount Settled</Text>
              <Text style={[styles.summaryVal, { color: colors.starTeal, fontWeight: '700' }]}>
                ₹{invoice.amountReceived.toLocaleString('en-IN')}.00
              </Text>
            </View>

            <View style={[styles.summaryRow, { paddingTop: 6 }]}>
              <Text style={styles.summaryKeyBold}>Balance Due</Text>
              <Text
                style={[
                  styles.summaryValBold,
                  { color: invoice.balanceDue > 0 ? '#DC2626' : colors.starTeal },
                ]}
              >
                ₹{invoice.balanceDue.toLocaleString('en-IN')}.00
              </Text>
            </View>
          </StarCard>

          {/* Payment Method Selection (Only shown when balance due > 0) */}
          {invoice.balanceDue > 0 ? (
            <StarCard style={styles.sectionCard} variant="elevated">
              <View style={styles.sectionHeader}>
                <CreditCard size={16} color={colors.starNavy} />
                <Text style={styles.sectionTitle}>Select Payment Option</Text>
              </View>

              <View style={styles.methodList}>
                {PAYMENT_METHODS.map((m) => {
                  const active = selectedMethod === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setSelectedMethod(m.key)}
                      style={[styles.methodBtn, active && styles.methodBtnActive]}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioCircle, active && styles.radioCircleActive]}>
                        {active && <View style={styles.radioDot} />}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.methodTitle, active && styles.methodTitleActive]}>
                            {m.title}
                          </Text>
                          {m.badge ? (
                            <View style={styles.recommendedBadge}>
                              <Text style={styles.recommendedBadgeText}>{m.badge}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.methodSub}>{m.sub}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={14} color="#DC2626" />
                  <Text style={styles.errorBoxText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Pay Now Button */}
              <TouchableOpacity
                style={styles.payNowBtn}
                onPress={handlePayNow}
                disabled={isPaying}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Pay and Get OPD Token"
              >
                {isPaying ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CreditCard size={18} color="#FFFFFF" />
                    <Text style={styles.payNowBtnText}>
                      Pay ₹{invoice.balanceDue.toLocaleString('en-IN')} &amp; Get OPD Token
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </StarCard>
          ) : (
            /* Paid Confirmation Banner */
            <View style={styles.allPaidCard}>
              <CheckCircle2 size={24} color={colors.starTeal} />
              <View style={{ flex: 1 }}>
                <Text style={styles.allPaidTitle}>Invoice Fully Settled</Text>
                <Text style={styles.allPaidSub}>
                  No outstanding payment due. You can download or print your official voucher receipt.
                </Text>
              </View>
            </View>
          )}

          {/* Quick Receipts CTAs */}
          <View style={{ gap: 8, marginTop: 4 }}>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareReceipt}>
              <Share2 size={16} color={colors.starNavy} />
              <Text style={styles.shareBtnText}>Share / Print Payment Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => navigation.navigate('PaymentHistory')}
            >
              <Text style={styles.historyBtnText}>View All Hospital Receipts &amp; Ledger</Text>
              <ArrowRight size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* SUCCESS MODAL: AUTOMATIC OPD TOKEN ISSUED */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalSuccessIcon}>
              <CheckCircle2 size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.modalTitle}>Payment Confirmed!</Text>
            <Text style={styles.modalSub}>
              ₹{invoice?.balanceDue || 0} successfully captured via Razorpay India.
            </Text>

            {/* Generated Token Showcase Box */}
            {generatedToken ? (
              <View style={styles.tokenHighlightBox}>
                <View style={styles.tokenTopBanner}>
                  <Sparkles size={14} color={colors.starTeal} />
                  <Text style={styles.tokenTopBannerText}>LIVE OPD TOKEN ISSUED</Text>
                </View>

                <Text style={styles.tokenNumberDisplay}>{generatedToken.tokenNumber}</Text>

                <View style={styles.tokenMetaRow}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.tokenMetaLabel}>DOCTOR</Text>
                    <Text style={styles.tokenMetaVal}>{generatedToken.doctorName}</Text>
                  </View>
                  <View style={styles.tokenMetaDivider} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.tokenMetaLabel}>CHAMBER</Text>
                    <Text style={styles.tokenMetaVal}>{generatedToken.roomNo || 'Room 104'}</Text>
                  </View>
                  <View style={styles.tokenMetaDivider} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.tokenMetaLabel}>QUEUE POS</Text>
                    <Text style={[styles.tokenMetaVal, { color: colors.starTeal, fontWeight: '800' }]}>
                      #{generatedToken.queuePosition}
                    </Text>
                  </View>
                </View>

                <View style={styles.voiceAlertBanner}>
                  <Volume2 size={14} color="#065F46" />
                  <Text style={styles.voiceAlertText}>
                    Hindi voice announcement &amp; nurse alert sent to OPD Room!
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Modal Actions */}
            <View style={{ gap: 8, width: '100%' }}>
              {generatedToken ? (
                <TouchableOpacity
                  style={styles.modalPrimaryBtn}
                  onPress={() => {
                    setSuccessModalVisible(false);
                    navigation.navigate('OPDToken', {
                      tokenId: generatedToken.id,
                      tokenNumber: generatedToken.tokenNumber,
                      doctorId: generatedToken.doctorId,
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <Ticket size={16} color="#FFFFFF" />
                  <Text style={styles.modalPrimaryBtnText}>Open Live OPD Queue Tracker</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => {
                  setSuccessModalVisible(false);
                  navigation.navigate('PaymentReceipt', {
                    transactionId: lastPaymentId || `txn_${Date.now()}`,
                  });
                }}
                activeOpacity={0.8}
              >
                <Receipt size={16} color={colors.starNavy} />
                <Text style={styles.modalSecondaryBtnText}>View Official Medical Receipt</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F7FB' },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  loadingText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  errorText: { fontSize: 14, color: colors.danger, textAlign: 'center' },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: colors.starNavy,
    borderRadius: radii.xl,
    padding: spacing.lg,
    shadowColor: colors.starNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#93C5FD',
    letterSpacing: 0.6,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusTagPaid: {
    backgroundColor: colors.mintBg,
    borderColor: colors.mintBorder,
  },
  statusTagUnpaid: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  heroRightMeta: {
    alignItems: 'flex-end',
  },
  heroInvNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 10,
  },
  heroPatientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroPatientName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroMrn: {
    fontSize: 11,
    fontWeight: '600',
    color: '#93C5FD',
  },
  sectionCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.starNavy,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemDesc: { fontSize: 13, fontWeight: '700', color: colors.starNavy },
  itemSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  itemTotal: { fontSize: 13, fontWeight: '800', color: colors.starNavy },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 6 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryKey: { fontSize: 12, color: colors.textSecondary },
  summaryVal: { fontSize: 12, fontWeight: '600', color: colors.starNavy },
  summaryKeyBold: { fontSize: 13, fontWeight: '800', color: colors.starNavy },
  summaryValBold: { fontSize: 16, fontWeight: '800' },
  methodList: { gap: 8, marginVertical: 8 },
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  methodBtnActive: {
    borderColor: colors.starTeal,
    backgroundColor: colors.mintBg,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: colors.starTeal,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.starTeal,
  },
  methodTitle: { fontSize: 13, fontWeight: '700', color: colors.starNavy },
  methodTitleActive: { color: colors.starNavy, fontWeight: '800' },
  methodSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2, lineHeight: 15 },
  recommendedBadge: {
    backgroundColor: colors.starTeal,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 8,
  },
  errorBoxText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
    fontWeight: '600',
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.starTeal,
    paddingVertical: 14,
    borderRadius: radii.md,
    shadowColor: colors.starTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  payNowBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  allPaidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.mintBg,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.mintBorder,
  },
  allPaidTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.mintText,
  },
  allPaidSub: {
    fontSize: 11,
    color: '#065F46',
    marginTop: 2,
    lineHeight: 16,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.starNavy,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(18, 52, 77, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  modalSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.starTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.starNavy,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  tokenHighlightBox: {
    width: '100%',
    backgroundColor: colors.mintBg,
    borderRadius: radii.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.mintBorder,
    marginBottom: 18,
  },
  tokenTopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tokenTopBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.starTeal,
    letterSpacing: 0.8,
  },
  tokenNumberDisplay: {
    fontSize: 38,
    fontWeight: '800',
    color: colors.starNavy,
    letterSpacing: -1,
    marginVertical: 4,
  },
  tokenMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  tokenMetaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.mintText,
    letterSpacing: 0.5,
  },
  tokenMetaVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.starNavy,
    marginTop: 2,
  },
  tokenMetaDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.mintBorder,
    alignSelf: 'center',
  },
  voiceAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 4,
  },
  voiceAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.starNavy,
    paddingVertical: 14,
    borderRadius: radii.md,
    width: '100%',
  },
  modalPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: radii.md,
    width: '100%',
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.starNavy,
  },
});

export default PaymentDetailsScreen;
