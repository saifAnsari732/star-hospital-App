import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquarePlus,
  PhoneCall,
  CheckCircle2,
  X,
} from 'lucide-react-native';
import { PatientStackParamList } from '../../navigation/navigationTypes';
import {
  StarHeader,
  StarCard,
  StarInput,
  StarButton,
} from '../../components/common';
import { colors, typography, spacing, radii } from '../../theme';

type Props = NativeStackScreenProps<PatientStackParamList, 'HelpSupport'>;

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'OPD Token',
    question: 'How does the live OPD Token queue work?',
    answer:
      'Once you check in for your appointment or generate an instant OPD token, your token number (e.g. A-102) appears on the Home screen and Queue Status view with real-time serving updates and estimated wait time.',
  },
  {
    id: 'faq-2',
    category: 'Appointments',
    question: 'Can I reschedule or cancel a confirmed appointment?',
    answer:
      'Yes. Open My Appointments, tap any scheduled visit to view Appointment Details, and choose Reschedule or Cancel Visit before the consultation begins.',
  },
  {
    id: 'faq-3',
    category: 'Reports',
    question: 'When are my Lab and Radiology reports uploaded?',
    answer:
      'Routine blood tests (CBC, Biochemistry) are usually ready within 4 to 6 hours. X-Ray and CT reports appear under My Reports & Radiology Reports once verified by the consultant pathologist or radiologist.',
  },
  {
    id: 'faq-4',
    category: 'Billing',
    question: 'Where can I view invoices and payment receipts?',
    answer:
      'Visit Profile -> My Bills or Payment History to view itemized invoices, settle pending balances, and share official payment receipts.',
  },
  {
    id: 'faq-5',
    category: 'Telemedicine',
    question: 'How do I join a Video Consultation?',
    answer:
      'Open your scheduled Video appointment from Appointment Details to enter the Telemedicine Waiting Room and verify microphone and camera readiness.',
  },
];

export const HelpSupportScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(FAQS[0].id);

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketRef, setTicketRef] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSubmitTicket = () => {
    if (!subject.trim() || !message.trim()) {
      setTicketError('Please enter both a subject and description.');
      return;
    }
    setTicketError(null);
    const refId = `HLP-${Math.floor(10000 + Math.random() * 90000)}`;
    setTicketRef(refId);
    setSubject('');
    setMessage('');
    setTicketModalOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StarHeader
        title="Help & Support"
        subtitle="Patient Desk & FAQs"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {ticketRef ? (
          <View style={styles.successBanner}>
            <CheckCircle2 size={18} color={colors.success} />
            <Text style={styles.successText}>
              Support inquiry logged locally (Ref: {ticketRef}). For urgent
              assistance, call Star Hospital Patient Helpline directly.
            </Text>
          </View>
        ) : null}

        <StarInput
          placeholder="Search help topics (token, reports, refund)..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={colors.textSecondary} />}
        />

        {/* Quick Support Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ContactHospital')}
            style={styles.quickCard}
            activeOpacity={0.8}
          >
            <PhoneCall size={22} color={colors.primary} />
            <Text style={styles.quickTitle}>Call Hospital</Text>
            <Text style={styles.quickSub}>24/7 Helpline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTicketModalOpen(true)}
            style={styles.quickCard}
            activeOpacity={0.8}
          >
            <MessageSquarePlus size={22} color={colors.tealAccent} />
            <Text style={styles.quickTitle}>Raise Inquiry</Text>
            <Text style={styles.quickSub}>Patient Care Desk</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>

        <View style={styles.faqList}>
          {filteredFaqs.length === 0 ? (
            <StarCard style={styles.faqCard} variant="elevated">
              <Text style={styles.faqQuestion}>No matching help articles found</Text>
              <Text style={styles.faqAnswer}>
                Try another keyword or clear the search box to browse all topics.
              </Text>
              <View style={{ marginTop: 10 }}>
                <StarButton
                  title="Clear Search"
                  variant="outline"
                  size="sm"
                  onPress={() => setSearchQuery('')}
                />
              </View>
            </StarCard>
          ) : (
            filteredFaqs.map((item) => {
              const expanded = expandedId === item.id;
              return (
                <StarCard key={item.id} style={styles.faqCard} variant="elevated">
                  <TouchableOpacity
                    onPress={() => setExpandedId(expanded ? null : item.id)}
                    style={styles.faqHeader}
                    activeOpacity={0.75}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.faqCategory}>{item.category}</Text>
                      <Text style={styles.faqQuestion}>{item.question}</Text>
                    </View>
                    {expanded ? (
                      <ChevronUp size={20} color={colors.primary} />
                    ) : (
                      <ChevronDown size={20} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  {expanded && <Text style={styles.faqAnswer}>{item.answer}</Text>}
                </StarCard>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Raise Support Ticket Modal */}
      <Modal
        visible={ticketModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setTicketModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Patient Support Inquiry</Text>
              <TouchableOpacity onPress={() => setTicketModalOpen(false)}>
                <X size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <StarInput
              label="Subject"
              placeholder="e.g. Lab report clarification or billing query"
              value={subject}
              onChangeText={setSubject}
            />
            <StarInput
              label="Message"
              placeholder="Describe how our team can help you..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
            />

            {ticketError ? (
              <Text style={styles.errorText}>{ticketError}</Text>
            ) : null}

            <StarButton
              title="Submit Support Request"
              onPress={handleSubmitTicket}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  successText: { ...typography.bodySmall, color: colors.success, flex: 1, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  quickCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  quickTitle: { ...typography.labelLarge, color: colors.textPrimary, marginTop: 4 },
  quickSub: { ...typography.caption, color: colors.textSecondary },
  sectionHeading: { ...typography.h4, color: colors.textPrimary, marginTop: spacing.xs },
  faqList: { gap: spacing.sm },
  faqCard: { padding: spacing.md, borderRadius: radii.xl },
  faqHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  faqCategory: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  faqQuestion: { ...typography.labelLarge, color: colors.textPrimary },
  faqAnswer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  errorText: { ...typography.caption, color: colors.danger },
});
