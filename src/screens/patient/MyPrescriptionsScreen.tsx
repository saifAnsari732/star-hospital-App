import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, FileText, AlertCircle } from 'lucide-react-native';
import { PrescriptionCard } from '../../components/patient/PrescriptionCard';
import { prescriptionService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { Prescription } from '../../types/prescription';
import { resolveEffectivePatientId } from './patientUtils';

export interface MyPrescriptionsScreenProps {
  navigation: any;
  route?: any;
}

export const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-1',
    prescriptionNumber: 'RX-2026-0042',
    date: '15 Nov 2026',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientAge: '32',
    patientGender: 'Male',
    patientMrn: 'P-00102',
    doctorId: 'doc-1',
    doctorName: 'Dr. Amit Sharma',
    doctorDepartment: 'General Physician',
    doctorQualification: 'MBBS, MD - General Medicine (AIIMS)',
    diagnosis: 'Acute Pharyngitis & Mild Fever',
    symptoms: 'Sore throat, fever for 2 days, mild fatigue',
    advice: 'Warm water saline gargles 3 times a day. Ample rest and hydration.',
    status: 'issued',
    validity: '15 Days',
    items: [
      {
        id: 'med-1',
        medicineName: 'Amoxicillin & Clavulanate (Augmentin)',
        dosage: '625 mg',
        frequency: 'Twice daily (1-0-1)',
        duration: '5 Days',
        instructions: 'After meals with a glass of water',
      },
      {
        id: 'med-2',
        medicineName: 'Paracetamol (Calpol)',
        dosage: '650 mg',
        frequency: 'As needed for fever (SOS)',
        duration: '3 Days',
        instructions: 'After food, minimum 6 hours gap',
      },
      {
        id: 'med-3',
        medicineName: 'Levocetirizine (Levocet)',
        dosage: '5 mg',
        frequency: 'Once daily at night (0-0-1)',
        duration: '5 Days',
        instructions: 'Before bed',
      },
    ],
  },
  {
    id: 'rx-2',
    prescriptionNumber: 'RX-2026-0038',
    date: '10 Oct 2026',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientAge: '32',
    patientGender: 'Male',
    patientMrn: 'P-00102',
    doctorId: 'doc-2',
    doctorName: 'Dr. Priya Mehta',
    doctorDepartment: 'Cardiologist',
    doctorQualification: 'MBBS, MD, DM - Cardiology',
    diagnosis: 'Mild Hypertension Screening',
    symptoms: 'Occasional morning headaches, high sodium diet',
    advice: 'Low salt diet (< 5g/day), brisk walk 30 mins daily, daily BP logging.',
    status: 'dispensed',
    validity: '30 Days',
    items: [
      {
        id: 'med-4',
        medicineName: 'Telmisartan (Telma)',
        dosage: '40 mg',
        frequency: 'Once daily morning (1-0-0)',
        duration: '30 Days',
        instructions: 'Before breakfast regularly',
      },
      {
        id: 'med-5',
        medicineName: 'Atorvastatin (Atorva)',
        dosage: '10 mg',
        frequency: 'Once daily night (0-0-1)',
        duration: '30 Days',
        instructions: 'After dinner',
      },
    ],
  },
  {
    id: 'rx-3',
    prescriptionNumber: 'RX-2026-0021',
    date: '02 Sep 2026',
    patientId: 'pat-1',
    patientName: 'Ali Khan',
    patientAge: '32',
    patientGender: 'Male',
    patientMrn: 'P-00102',
    doctorId: 'doc-3',
    doctorName: 'Dr. Rakesh Verma',
    doctorDepartment: 'Orthopedic',
    doctorQualification: 'MBBS, MS - Orthopedics',
    diagnosis: 'Right Knee Tendonitis',
    symptoms: 'Right knee pain after sports activity',
    advice: 'Hot fomentation twice daily, avoid squatting.',
    status: 'dispensed',
    validity: '10 Days',
    items: [
      {
        id: 'med-6',
        medicineName: 'Aceclofenac + Paracetamol',
        dosage: '100mg / 325mg',
        frequency: 'Twice daily (1-0-1)',
        duration: '5 Days',
        instructions: 'Strictly after food',
      },
      {
        id: 'med-7',
        medicineName: 'Pantoprazole (Pan-D)',
        dosage: '40 mg',
        frequency: 'Once daily empty stomach (1-0-0)',
        duration: '5 Days',
        instructions: '30 mins before breakfast',
      },
    ],
  },
];

export const MyPrescriptionsScreen: React.FC<MyPrescriptionsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const effectivePatientId = resolveEffectivePatientId(user?.id);
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadPrescriptions = useCallback(async () => {
    setErrorMsg(null);
    try {
      const list = await prescriptionService.getPrescriptions(effectivePatientId);
      setPrescriptions(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unable to load prescriptions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectivePatientId]);

  useFocusEffect(
    useCallback(() => {
      void loadPrescriptions();
    }, [loadPrescriptions])
  );

  const displayedPrescriptions =
    activeTab === 'recent' ? prescriptions.slice(0, 1) : prescriptions;

  const handleOpenDetail = (prescription: Prescription) => {
    navigation.navigate('PrescriptionDetail', {
      prescriptionId: prescription.id,
    });
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
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
          onPress={() => setActiveTab('all')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'all' }}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({prescriptions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'recent' && styles.tabButtonActive]}
          onPress={() => setActiveTab('recent')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'recent' }}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.tabTextActive]}>
            Recent
          </Text>
        </TouchableOpacity>
      </View>

      {/* Prescriptions List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadPrescriptions();
            }}
            colors={['#0866C6']}
          />
        }
      >
        {loading && prescriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#0866C6" />
            <Text style={[styles.emptySubtitle, { marginTop: 10 }]}>
              Loading prescriptions...
            </Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.emptyContainer}>
            <AlertCircle size={32} color="#DC2626" />
            <Text style={styles.emptyTitle}>Could Not Load Prescriptions</Text>
            <Text style={styles.emptySubtitle}>{errorMsg}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                void loadPrescriptions();
              }}
              style={{ marginTop: 12, paddingHorizontal: 18, paddingVertical: 8, backgroundColor: '#EBF5FF', borderRadius: 10 }}
            >
              <Text style={{ color: '#0866C6', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : displayedPrescriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={32} color="#0866C6" />
            <Text style={styles.emptyTitle}>No Prescriptions Found</Text>
            <Text style={styles.emptySubtitle}>Your medical prescriptions will be listed here after consultation.</Text>
          </View>
        ) : (
          displayedPrescriptions.map((rx) => (
            <PrescriptionCard
              key={rx.id}
              prescription={rx}
              onPress={() => handleOpenDetail(rx)}
              onViewPress={() => handleOpenDetail(rx)}
            />
          ))
        )}
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
  headerRightSpacer: {
    width: 36,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#0866C6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#0866C6',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default MyPrescriptionsScreen;
