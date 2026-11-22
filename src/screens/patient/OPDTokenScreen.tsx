import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Plus,
  History,
  Clock,
  MapPin,
  Stethoscope,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { TokenHeroCard } from '../../components/patient/TokenHeroCard';
import { useOPDToken } from '../../context/OPDTokenContext';
import { useAuth } from '../../context/AuthContext';
import { mockDoctors } from '../../fixtures/mockDoctors';
import { razorpayService } from '../../services/razorpayService';

export const OPD_REGISTRATION_FEE_INR = 500;

export interface OPDTokenScreenProps {
  navigation: any;
  route?: any;
}

export const OPDTokenScreen: React.FC<OPDTokenScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentToken, tokenHistory, generateToken, shareToken, isLoading } = useOPDToken();
  const { user } = useAuth();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('doc-1');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    paymentId: string;
    tokenNumber: string;
  } | null>(null);

  const selectedDoctor =
    mockDoctors.find((d) => d.id === selectedDoctorId) || mockDoctors[0];

  // Initiate Razorpay ₹500 Checkout flow for OPD Token
  const handlePayAndGenerateToken = async () => {
    setIsProcessingPayment(true);
    try {
      // 1. Create Razorpay order (₹500 = 50000 paise)
      const mockInvoiceId = `inv_opd_${Date.now()}`;
      const order = await razorpayService.createOrder({
        invoiceId: mockInvoiceId,
        amount: OPD_REGISTRATION_FEE_INR,
        currency: 'INR',
        notes: {
          purpose: 'OPD Token Consultation Registration Fee',
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor.name,
          patientName: user?.name || 'Rahul Sharma',
        },
      });

      // 2. Open Razorpay Checkout bridge (supports native checkout bridge or verified mock in Expo Go)
      const checkoutPayload = await razorpayService.openCheckout(order, {
        name: user?.name || 'Rahul Sharma',
        email: user?.email || 'rahul@gmail.com',
        contact: user?.phone || '9876543210',
      });

      // 3. Verify Razorpay Payment Signature
      await razorpayService.verifyPayment({
        invoiceId: mockInvoiceId,
        razorpayOrderId: checkoutPayload.razorpay_order_id,
        razorpayPaymentId: checkoutPayload.razorpay_payment_id,
        razorpaySignature: checkoutPayload.razorpay_signature,
      });

      // 4. Payment Confirmed: Allocate Official OPD Token
      const createdToken = await generateToken(selectedDoctor.id, 'first_visit', {
        isPaid: true,
        paymentAmount: OPD_REGISTRATION_FEE_INR,
        paymentId: checkoutPayload.razorpay_payment_id,
      });

      setPaymentSuccessData({
        paymentId: checkoutPayload.razorpay_payment_id,
        tokenNumber: createdToken.tokenNumber,
      });
    } catch (err: any) {
      Alert.alert(
        'Payment Incomplete',
        err?.message || 'Payment could not be completed. OPD Token cannot be issued without payment.'
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setPaymentSuccessData(null);
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
        <Text style={styles.headerTitle}>OPD Token</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Active Hero Token Card */}
        {currentToken ? (
          <View>
            <TokenHeroCard
              token={currentToken}
              onViewQueuePress={() => navigation.navigate('QueueStatus')}
              onSharePress={() => shareToken(currentToken.tokenNumber)}
              showActions={true}
            />

            {/* Payment Verified Stamp */}
            <View style={styles.paymentVerifiedPill}>
              <CheckCircle2 size={15} color="#16A34A" />
              <Text style={styles.paymentVerifiedPillText}>
                OPD Registration Fee ₹{currentToken.paymentAmount || OPD_REGISTRATION_FEE_INR} Paid &amp; Confirmed
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyTokenContainer}>
            <Text style={styles.emptyTitle}>No Active Token</Text>
            <Text style={styles.emptySubtitle}>
              OPD Registration requires ₹{OPD_REGISTRATION_FEE_INR} consulting charge. Pay via Razorpay to generate your live token.
            </Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={() => setShowPaymentModal(true)}
              activeOpacity={0.85}
            >
              <CreditCard size={18} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Pay ₹{OPD_REGISTRATION_FEE_INR} &amp; Get OPD Token</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Walk-in Doctor Selection & Pay Card */}
        <View style={styles.quickIssueCard}>
          <View style={styles.quickIssueHeader}>
            <Text style={styles.quickIssueTitle}>Walk-in OPD Registration</Text>
            <View style={styles.feeBadge}>
              <Text style={styles.feeBadgeText}>Fee: ₹{OPD_REGISTRATION_FEE_INR}</Text>
            </View>
          </View>

          <View style={styles.doctorPickerContainer}>
            <Text style={styles.pickerLabel}>Select Consulting Doctor:</Text>
            {mockDoctors.slice(0, 3).map((doctor) => {
              const isSelected = selectedDoctorId === doctor.id;
              return (
                <TouchableOpacity
                  key={doctor.id}
                  style={[styles.docOptionItem, isSelected && styles.docOptionItemSelected]}
                  onPress={() => setSelectedDoctorId(doctor.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.docOptionLeft}>
                    <Stethoscope size={18} color={isSelected ? '#0866C6' : '#64748B'} />
                    <View style={styles.docOptionInfo}>
                      <Text style={[styles.docOptionName, isSelected && styles.docOptionNameSelected]}>
                        {doctor.name}
                      </Text>
                      <Text style={styles.docOptionDept}>
                        {doctor.department} • Room {doctor.roomNo?.replace(/\D/g, '') || '101'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.issueSubmitBtn}
              onPress={() => setShowPaymentModal(true)}
              activeOpacity={0.88}
            >
              <CreditCard size={18} color="#FFFFFF" />
              <Text style={styles.issueSubmitBtnText}>
                Pay ₹{OPD_REGISTRATION_FEE_INR} with Razorpay &amp; Confirm
              </Text>
            </TouchableOpacity>
            <Text style={styles.paymentGuaranteeNote}>
              * Token confirmed only after successful payment verification.
            </Text>
          </View>
        </View>

        {/* Token History Section */}
        <View style={styles.historySection}>
          <View style={styles.historyHeaderRow}>
            <History size={18} color="#0866C6" />
            <Text style={styles.historyTitle}>Recent OPD Tokens</Text>
          </View>

          {tokenHistory.length === 0 ? (
            <Text style={styles.noHistoryText}>No past tokens found.</Text>
          ) : (
            tokenHistory.map((item) => (
              <View key={item.id} style={styles.historyItemCard}>
                <View style={styles.historyCardTop}>
                  <View style={styles.historyBadge}>
                    <Text style={styles.historyTokenNo}>{item.tokenNumber}</Text>
                  </View>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyDocName}>{item.doctorName}</Text>
                    <Text style={styles.historyDept}>
                      {item.department} • ₹{item.paymentAmount || OPD_REGISTRATION_FEE_INR} Paid
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusCapsule,
                      item.status === 'completed'
                        ? styles.statusCapsuleDone
                        : styles.statusCapsuleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusCapsuleText,
                        item.status === 'completed'
                          ? styles.statusCapsuleDoneText
                          : styles.statusCapsuleActiveText,
                      ]}
                    >
                      {item.status === 'completed' ? 'Completed' : 'Active'}
                    </Text>
                  </View>
                </View>

                <View style={styles.historyCardBottom}>
                  <View style={styles.historyTimeRow}>
                    <Clock size={13} color="#64748B" />
                    <Text style={styles.historyTimeText}>
                      {new Date(item.generatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.historyTimeRow}>
                    <MapPin size={13} color="#64748B" />
                    <Text style={styles.historyTimeText}>{item.roomNo || 'Room 104'}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Razorpay OPD Payment Modal */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {paymentSuccessData ? (
              <View style={styles.modalSuccessView}>
                <View style={styles.successIconBadge}>
                  <CheckCircle2 size={44} color="#16A34A" strokeWidth={2.5} />
                </View>
                <Text style={styles.modalSuccessTitle}>Payment Successful!</Text>
                <Text style={styles.modalSuccessSub}>
                  ₹{OPD_REGISTRATION_FEE_INR} received via Razorpay. Your OPD Token is confirmed.
                </Text>

                <View style={styles.tokenHighlightBox}>
                  <Text style={styles.tokenHighlightLabel}>Confirmed Token</Text>
                  <Text style={styles.tokenHighlightValue}>{paymentSuccessData.tokenNumber}</Text>
                  <Text style={styles.tokenHighlightDoctor}>{selectedDoctor.name}</Text>
                  <Text style={styles.tokenHighlightPaymentId}>
                    Txn ID: {paymentSuccessData.paymentId}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={handleCloseModal}
                  activeOpacity={0.85}
                >
                  <Text style={styles.modalDoneBtnText}>View Token &amp; Live Queue</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.modalHeader}>
                  <CreditCard size={24} color="#0866C6" />
                  <Text style={styles.modalTitle}>OPD Registration Fee</Text>
                </View>

                <Text style={styles.modalDesc}>
                  In order to issue an OPD Token for consultation, a mandatory registration fee of{' '}
                  <Text style={styles.boldText}>₹{OPD_REGISTRATION_FEE_INR}</Text> is required.
                </Text>

                {/* Bill Breakdown Card */}
                <View style={styles.billBox}>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Consulting Doctor</Text>
                    <Text style={styles.billValue}>{selectedDoctor.name}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Department</Text>
                    <Text style={styles.billValue}>{selectedDoctor.department}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>OPD Charge</Text>
                    <Text style={styles.billValue}>₹{OPD_REGISTRATION_FEE_INR}.00</Text>
                  </View>
                  <View style={styles.billDivider} />
                  <View style={styles.billRowTotal}>
                    <Text style={styles.billTotalLabel}>Total Amount Due</Text>
                    <Text style={styles.billTotalValue}>₹{OPD_REGISTRATION_FEE_INR}.00</Text>
                  </View>
                </View>

                {/* Gateway Trust Row */}
                <View style={styles.trustBadgeRow}>
                  <ShieldCheck size={16} color="#16A34A" />
                  <Text style={styles.trustBadgeText}>
                    Secured by Razorpay • UPI, Cards, NetBanking
                  </Text>
                </View>

                {/* Modal Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={handleCloseModal}
                    disabled={isProcessingPayment}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalPayBtn, isProcessingPayment && styles.modalPayBtnDisabled]}
                    onPress={handlePayAndGenerateToken}
                    disabled={isProcessingPayment}
                    activeOpacity={0.88}
                  >
                    {isProcessingPayment ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalPayBtnText}>Pay ₹{OPD_REGISTRATION_FEE_INR} Now</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D2342',
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  paymentVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  paymentVerifiedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  emptyTokenContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0D2342',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0866C6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  quickIssueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quickIssueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickIssueTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D2342',
  },
  feeBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  feeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  doctorPickerContainer: {},
  pickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  docOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  docOptionItemSelected: {
    borderColor: '#0866C6',
    backgroundColor: '#F0F7FF',
  },
  docOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  docOptionInfo: {
    marginLeft: 10,
  },
  docOptionName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#142D4E',
  },
  docOptionNameSelected: {
    color: '#0866C6',
  },
  docOptionDept: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
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
  radioCircleSelected: {
    borderColor: '#0866C6',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0866C6',
  },
  issueSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0866C6',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 8,
    gap: 8,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  issueSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  paymentGuaranteeNote: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
  },
  historySection: {
    marginTop: 16,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginLeft: 6,
  },
  noHistoryText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 12,
  },
  historyItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyBadge: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 10,
  },
  historyTokenNo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064A91',
  },
  historyMeta: {
    flex: 1,
  },
  historyDocName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  historyDept: {
    fontSize: 11,
    color: '#64748B',
  },
  statusCapsule: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  statusCapsuleDone: {
    backgroundColor: '#DCFCE7',
  },
  statusCapsuleActive: {
    backgroundColor: '#EBF4FF',
  },
  statusCapsuleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusCapsuleDoneText: {
    color: '#15803D',
  },
  statusCapsuleActiveText: {
    color: '#0866C6',
  },
  historyCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  historyTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTimeText: {
    fontSize: 11.5,
    color: '#64748B',
    marginLeft: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0D2342',
  },
  modalDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  boldText: {
    fontWeight: '800',
    color: '#0866C6',
  },
  billBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12.5,
    color: '#64748B',
  },
  billValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  billRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0D2342',
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0866C6',
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  trustBadgeText: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  modalPayBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPayBtnDisabled: {
    opacity: 0.7,
  },
  modalPayBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSuccessView: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalSuccessTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 4,
  },
  modalSuccessSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
  },
  tokenHighlightBox: {
    width: '100%',
    backgroundColor: '#F0F7FF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  tokenHighlightLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  tokenHighlightValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0866C6',
    marginVertical: 4,
  },
  tokenHighlightDoctor: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0D2342',
  },
  tokenHighlightPaymentId: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  modalDoneBtn: {
    width: '100%',
    backgroundColor: '#0866C6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default OPDTokenScreen;
