import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, RefreshCw, Clock, Stethoscope, MapPin, CheckCircle2 } from 'lucide-react-native';
import { LiveQueueStepper } from '../../components/patient/LiveQueueStepper';
import { useOPDToken } from '../../context/OPDTokenContext';

export interface QueueStatusScreenProps {
  navigation: any;
  route?: any;
}

export const QueueStatusScreen: React.FC<QueueStatusScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentToken, refreshQueue, isLoading } = useOPDToken();
  const [isRefreshingLocal, setIsRefreshingLocal] = useState<boolean>(false);

  const tokenNumber = currentToken?.tokenNumber || 'A-102';
  const waitMinutes = currentToken?.estimatedWaitMinutes ?? 10;
  const doctorName = currentToken?.doctorName || 'Dr. Amit Sharma';
  const department = currentToken?.department || 'General Physician';
  const roomNo = currentToken?.roomNo || 'Room 104';
  const queuePos = currentToken?.queuePosition ?? 2;
  const patientsAhead = Math.max(0, queuePos - 1);

  const handleRefresh = async () => {
    setIsRefreshingLocal(true);
    await refreshQueue();
    setIsRefreshingLocal(false);
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
        <Text style={styles.headerTitle}>Queue Status</Text>
        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={handleRefresh}
          disabled={isLoading || isRefreshingLocal}
          accessibilityRole="button"
          accessibilityLabel="Refresh Queue"
        >
          <RefreshCw size={20} color="#0866C6" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Live Queue Card */}
        <View style={styles.heroCard}>
          <View style={styles.mintBannerBox}>
            <Text style={styles.tokenTitle}>Token {tokenNumber}</Text>
            <Text style={styles.queueStatusText}>Currently in Queue</Text>
          </View>

          {/* 3-Step Horizontal Stepper */}
          <LiveQueueStepper
            steps={currentToken?.liveSteps}
            currentTokenNumber={tokenNumber}
            servingTokenNumber={currentToken?.servingToken || 'A-101'}
          />

          {/* Estimated Wait Time Box */}
          <View style={styles.waitBoxContainer}>
            <View style={styles.waitHeaderRow}>
              <Clock size={16} color="#0866C6" />
              <Text style={styles.waitLabel}>Estimated Wait Time</Text>
            </View>
            <Text style={styles.waitValue}>~ {waitMinutes} mins</Text>
            <Text style={styles.queueCountCaption}>
              {queuePos <= 1
                ? 'You are next in line! Please wait near the consultation room.'
                : `There ${patientsAhead === 1 ? 'is' : 'are'} ${patientsAhead} ${patientsAhead === 1 ? 'patient' : 'patients'} ahead of you.`}
            </Text>
          </View>
        </View>

        {/* Doctor & Room Location Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeader}>Consultation Information</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconCircle}>
              <Stethoscope size={18} color="#0866C6" />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Consulting Doctor</Text>
              <Text style={styles.detailValue}>{doctorName}</Text>
              <Text style={styles.detailSub}>{department}</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconCircle}>
              <MapPin size={18} color="#0866C6" />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>OPD Clinic Room</Text>
              <Text style={styles.detailValue}>{roomNo}</Text>
              <Text style={styles.detailSub}>Ground Floor, North Wing</Text>
            </View>
          </View>

          <View style={styles.detailDivider} />

          <View style={styles.detailRow}>
            <View style={[styles.detailIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <CheckCircle2 size={18} color="#16A34A" />
            </View>
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Patient Check-In</Text>
              <Text style={styles.detailValue}>Arrived & Vitals Verified</Text>
              <Text style={styles.detailSub}>Please listen for your token announcement</Text>
            </View>
          </View>
        </View>

        {/* Refresh Action Button */}
        <TouchableOpacity
          style={[styles.refreshFullButton, (isLoading || isRefreshingLocal) && styles.refreshFullButtonDisabled]}
          onPress={handleRefresh}
          activeOpacity={0.85}
          disabled={isLoading || isRefreshingLocal}
          accessibilityRole="button"
          accessibilityLabel="Refresh Queue Status"
        >
          {isLoading || isRefreshingLocal ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.refreshButtonContent}>
              <RefreshCw size={18} color="#FFFFFF" style={styles.refreshBtnIcon} />
              <Text style={styles.refreshButtonText}>Refresh Queue</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142D4E',
  },
  refreshIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 12,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  mintBannerBox: {
    backgroundColor: '#E6F9EE',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tokenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D2342',
    marginBottom: 4,
  },
  queueStatusText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803D',
  },
  waitBoxContainer: {
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  waitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  waitLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginLeft: 6,
  },
  waitValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0866C6',
    letterSpacing: 0.5,
    marginVertical: 4,
  },
  queueCountCaption: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 20,
  },
  detailsHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTextCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 1,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
  },
  detailSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  refreshFullButton: {
    backgroundColor: '#0866C6',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshFullButtonDisabled: {
    opacity: 0.7,
  },
  refreshButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshBtnIcon: {
    marginRight: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default QueueStatusScreen;
