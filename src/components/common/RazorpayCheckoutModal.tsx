import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import {
  RazorpayCheckoutSuccessPayload,
  RazorpayOrderPrefill,
  RazorpayOrderResponse,
} from '../../types/billing';

interface PendingCheckoutRequest {
  order: RazorpayOrderResponse;
  prefill?: RazorpayOrderPrefill;
  resolve: (payload: RazorpayCheckoutSuccessPayload) => void;
  reject: (err: Error) => void;
}

type CheckoutListener = (req: PendingCheckoutRequest | null) => void;
let activeListener: CheckoutListener | null = null;

/**
 * Opens the interactive Razorpay Checkout modal and waits for the user to
 * explicitly complete payment, simulate failure, or cancel/dismiss.
 */
export function openInteractiveRazorpayModal(
  order: RazorpayOrderResponse,
  prefill?: RazorpayOrderPrefill
): Promise<RazorpayCheckoutSuccessPayload> {
  return new Promise((resolve, reject) => {
    if (!activeListener) {
      reject(new Error('Razorpay Checkout UI is not mounted.'));
      return;
    }
    activeListener({ order, prefill, resolve, reject });
  });
}

type PaymentTab = 'upi' | 'card' | 'netbanking' | 'wallet';

export const RazorpayCheckoutModal: React.FC = () => {
  const [request, setRequest] = useState<PendingCheckoutRequest | null>(null);
  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [upiId, setUpiId] = useState('rahul@okicici');
  const [cardNumber, setCardNumber] = useState('4111 •••• •••• 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    activeListener = (req) => {
      setInlineError(null);
      setIsProcessing(false);
      setActiveTab('upi');
      setRequest(req);
    };
    return () => {
      activeListener = null;
    };
  }, []);

  if (!request) return null;

  const { order, prefill } = request;
  const amountInRupees = (order.amountInPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleDismiss = () => {
    if (isProcessing) return;
    const rej = request.reject;
    setRequest(null);
    rej(new Error('Payment cancelled by user in Razorpay Checkout.'));
  };

  const handleSimulateFailure = () => {
    if (isProcessing) return;
    setInlineError('Bank declined transaction (OTP/Insufficient funds). Retry or close.');
  };

  const handleCompletePayment = () => {
    setInlineError(null);
    if (activeTab === 'upi' && !upiId.includes('@')) {
      setInlineError('Please enter a valid UPI ID (e.g. name@okaxis or name@ybl).');
      return;
    }
    if (activeTab === 'card' && (cardNumber.replace(/\D/g, '').length < 8 || cardCvv.length < 3)) {
      setInlineError('Please enter valid card details.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const suffix = `${Date.now()}`;
      const res = request.resolve;
      setRequest(null);
      setIsProcessing(false);
      res({
        razorpay_payment_id: `pay_rzp_${suffix}`,
        razorpay_order_id: order.orderId,
        razorpay_signature: `sig_hmac_sha256_${suffix}`,
        isMockCheckout: true,
      });
    }, 900);
  };

  return (
    <Modal
      visible={!!request}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Razorpay Executive Navy Header */}
          <View style={styles.header}>
            <View style={styles.merchantRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>SH</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.merchantTitleRow}>
                  <Text style={styles.merchantName}>{order.merchantName || 'Star Hospital'}</Text>
                  <View style={styles.testBadge}>
                    <Text style={styles.testBadgeText}>TEST MODE</Text>
                  </View>
                </View>
                <Text style={styles.orderIdText} numberOfLines={1}>
                  Order: {order.orderId}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDismiss}
                style={styles.closeBtn}
                accessibilityLabel="Close Razorpay Checkout"
              >
                <X size={18} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <View style={styles.amountRow}>
              <View>
                <Text style={styles.amountLabel}>PAYABLE AMOUNT</Text>
                <Text style={styles.amountValue}>₹{amountInRupees}</Text>
              </View>
              <View style={styles.verifiedPill}>
                <ShieldCheck size={13} color="#18A999" />
                <Text style={styles.verifiedPillText}>Razorpay Trusted</Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Contact Prefill Strip */}
            <View style={styles.prefillStrip}>
              <Text style={styles.prefillText} numberOfLines={1}>
                {prefill?.name || order.prefill?.name || 'Patient'} •{' '}
                {prefill?.contact || order.prefill?.contact || '+91 98765 43210'}
              </Text>
            </View>

            <Text style={styles.sectionLabel}>SELECT PAYMENT METHOD</Text>

            {/* Method Tabs */}
            <View style={styles.tabsRow}>
              {[
                { key: 'upi' as PaymentTab, label: 'UPI / QR', Icon: Smartphone },
                { key: 'card' as PaymentTab, label: 'Card', Icon: CreditCard },
                { key: 'netbanking' as PaymentTab, label: 'Netbanking', Icon: Building2 },
                { key: 'wallet' as PaymentTab, label: 'Wallet', Icon: Wallet },
              ].map(({ key, label, Icon }) => {
                const active = activeTab === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tabBtn, active && styles.tabBtnActive]}
                    onPress={() => {
                      setActiveTab(key);
                      setInlineError(null);
                    }}
                  >
                    <Icon size={16} color={active ? '#12344D' : '#64748B'} />
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Method Content */}
            {activeTab === 'upi' ? (
              <View style={styles.methodCard}>
                <Text style={styles.inputLabel}>UPI ID / VPA</Text>
                <TextInput
                  style={styles.input}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="username@okaxis"
                  autoCapitalize="none"
                />
                <View style={styles.upiAppsRow}>
                  {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                    <TouchableOpacity
                      key={app}
                      style={styles.upiChip}
                      onPress={() => setUpiId(`patient@${app.toLowerCase()}`)}
                    >
                      <Text style={styles.upiChipText}>{app}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : activeTab === 'card' ? (
              <View style={styles.methodCard}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  keyboardType="numeric"
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
                    <TextInput
                      style={styles.input}
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.input}
                      value={cardCvv}
                      onChangeText={setCardCvv}
                      secureTextEntry
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                </View>
              </View>
            ) : activeTab === 'netbanking' ? (
              <View style={styles.methodCard}>
                <Text style={styles.inputLabel}>Select Bank</Text>
                <View style={styles.bankGrid}>
                  {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak'].map((bank) => {
                    const selected = selectedBank === bank;
                    return (
                      <TouchableOpacity
                        key={bank}
                        style={[styles.bankChip, selected && styles.bankChipActive]}
                        onPress={() => setSelectedBank(bank)}
                      >
                        <Text
                          style={[
                            styles.bankChipText,
                            selected && { color: '#12344D', fontWeight: '700' },
                          ]}
                        >
                          {bank}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              <View style={styles.methodCard}>
                <Text style={styles.inputLabel}>Supported Wallets</Text>
                <Text style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
                  Amazon Pay, Mobikwik, Freecharge &amp; Ola Money linked automatically via{' '}
                  {prefill?.contact || '+91 98765 43210'}.
                </Text>
              </View>
            )}

            {inlineError ? (
              <View style={styles.errorBox}>
                <AlertTriangle size={15} color="#DC2626" />
                <Text style={styles.errorText}>{inlineError}</Text>
              </View>
            ) : null}

            {/* Primary Pay Button */}
            <TouchableOpacity
              style={[styles.payBtn, isProcessing && { opacity: 0.75 }]}
              onPress={handleCompletePayment}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              {isProcessing ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.payBtnText}>Authenticating with Bank...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Lock size={16} color="#FFFFFF" />
                  <Text style={styles.payBtnText}>Pay ₹{amountInRupees}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Test Mode Secondary Actions */}
            <View style={styles.footerActions}>
              <TouchableOpacity onPress={handleSimulateFailure} disabled={isProcessing}>
                <Text style={styles.failTestText}>Simulate Failed Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDismiss} disabled={isProcessing}>
                <Text style={styles.cancelText}>Cancel Payment</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.securedFooter}>
              <CheckCircle2 size={12} color="#18A999" />
              <Text style={styles.securedFooterText}>
                256-bit SSL Encrypted • Secured by Razorpay
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 50px rgba(15, 23, 42, 0.35)' }
      : { elevation: 12 }),
  },
  header: {
    backgroundColor: '#12344D',
    padding: 18,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#18A999',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  merchantTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  merchantName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  testBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testBadgeText: {
    color: '#1E293B',
    fontSize: 9,
    fontWeight: '800',
  },
  orderIdText: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  amountLabel: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  amountValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(24, 169, 153, 0.16)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedPillText: {
    color: '#A7F3D0',
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    padding: 18,
    maxHeight: 500,
  },
  prefillStrip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  prefillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  tabBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#12344D',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#12344D',
    fontWeight: '700',
  },
  methodCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0F172A',
  },
  upiAppsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  upiChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  upiChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#12344D',
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  bankChipActive: {
    borderColor: '#12344D',
    backgroundColor: '#EFF6FF',
  },
  bankChipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  payBtn: {
    backgroundColor: '#18A999',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  failTestText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  securedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 16,
    paddingBottom: 6,
  },
  securedFooterText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
});
