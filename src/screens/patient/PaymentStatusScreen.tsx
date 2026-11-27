import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Receipt,
  FileText,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import { StarHeader, StarCard, StarButton } from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'PaymentStatus'>;

export const PaymentStatusScreen: React.FC<Props> = ({ navigation, route }) => {
  const { transactionId, status, message, receiptNumber, amount } = route.params;

  const isSuccess = status === 'paid';
  const isPending = status === 'pending';
  const isFailed = status === 'failed';
  const isRefunded = status === 'refunded';
  const isPartial = status === 'partially_paid';

  const getStatusConfig = () => {
    if (isSuccess) {
      return {
        title: 'Payment Successful!',
        sub: 'Your transaction has been securely captured and verified on Star Hospital servers.',
        color: colors.starTeal,
        bgLight: colors.mintBg,
        borderColor: colors.mintBorder,
        icon: <CheckCircle2 size={48} color={colors.starTeal} />,
        badgeText: 'VERIFIED & PAID',
      };
    }
    if (isPending) {
      return {
        title: 'Payment Pending',
        sub: 'Your transaction is awaiting confirmation or bank settlement.',
        color: '#D97706',
        bgLight: '#FFFBEB',
        borderColor: '#FDE68A',
        icon: <Clock size={48} color="#D97706" />,
        badgeText: 'PENDING SETTLEMENT',
      };
    }
    if (isRefunded) {
      return {
        title: 'Payment Refunded',
        sub: 'This transaction has been refunded back to the original payment source.',
        color: '#6366F1',
        bgLight: '#EEF2FF',
        borderColor: '#C7D2FE',
        icon: <RotateCcw size={48} color="#6366F1" />,
        badgeText: 'REFUND COMPLETED',
      };
    }
    if (isPartial) {
      return {
        title: 'Partially Paid',
        sub: 'A partial deposit was received. The remaining balance remains outstanding.',
        color: '#0866C6',
        bgLight: '#EFF6FF',
        borderColor: '#BFDBFE',
        icon: <CreditCard size={48} color="#0866C6" />,
        badgeText: 'PARTIAL PAYMENT',
      };
    }
    return {
      title: 'Payment Failed',
      sub: message || 'Payment was declined or cancelled. Your card/account was not debited.',
      color: colors.danger,
      bgLight: '#FEF2F2',
      borderColor: '#FECACA',
      icon: <XCircle size={48} color={colors.danger} />,
      badgeText: 'FAILED / DECLINED',
    };
  };

  const config = getStatusConfig();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="Transaction Status"
        onBackPress={() => navigation.navigate('Bills')}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Hero */}
        <View style={[styles.heroCard, { backgroundColor: config.bgLight, borderColor: config.borderColor }]}>
          <View style={styles.iconContainer}>{config.icon}</View>
          <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
            <Text style={styles.statusBadgeText}>{config.badgeText}</Text>
          </View>
          <Text style={styles.heroTitle}>{config.title}</Text>
          <Text style={styles.heroSub}>{config.sub}</Text>
          {amount !== undefined ? (
            <Text style={styles.amountText}>₹{amount.toLocaleString('en-IN')}.00</Text>
          ) : null}
        </View>

        {/* Transaction Summary Card */}
        <StarCard style={styles.detailsCard} variant="elevated">
          <View style={styles.cardHeader}>
            <ShieldCheck size={18} color={colors.starTeal} />
            <Text style={styles.cardHeaderTitle}>Security & Audit Verification</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TRANSACTION ID</Text>
            <Text style={styles.detailValMono}>{transactionId}</Text>
          </View>

          {receiptNumber ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>RECEIPT NO.</Text>
              <Text style={styles.detailValBold}>{receiptNumber}</Text>
            </View>
          ) : null}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PAYMENT GATEWAY</Text>
            <Text style={styles.detailVal}>Razorpay India (Automated)</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>HOSPITAL SYSTEM</Text>
            <Text style={styles.detailVal}>Star Hospital ICTHospital 12</Text>
          </View>
        </StarCard>

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          {isSuccess || isPartial ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('PaymentReceipt', { transactionId })}
              activeOpacity={0.8}
            >
              <Receipt size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>View Detailed Hospital Receipt</Text>
            </TouchableOpacity>
          ) : isFailed ? (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <RotateCcw size={18} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Retry Payment</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('PaymentHistory')}
            activeOpacity={0.8}
          >
            <FileText size={18} color={colors.starNavy} />
            <Text style={styles.secondaryBtnText}>View All Hospital Receipts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => navigation.navigate('PatientTabs')}
            activeOpacity={0.8}
          >
            <Text style={styles.outlineBtnText}>Return to Patient Home</Text>
            <ArrowRight size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  heroCard: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1.5,
  },
  iconContainer: {
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.starNavy,
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
  },
  amountText: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.starNavy,
    letterSpacing: -0.5,
  },
  detailsCard: {
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.starNavy,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.starNavy,
  },
  detailValBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.starNavy,
  },
  detailValMono: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.starNavy,
    fontFamily: 'monospace',
  },
  actionsContainer: {
    gap: spacing.sm,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.starTeal,
    paddingVertical: 14,
    borderRadius: radii.md,
    shadowColor: colors.starTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.danger,
    paddingVertical: 14,
    borderRadius: radii.md,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.starNavy,
    paddingVertical: 13,
    borderRadius: radii.md,
  },
  secondaryBtnText: {
    color: colors.starNavy,
    fontSize: 14,
    fontWeight: '700',
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  outlineBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default PaymentStatusScreen;
