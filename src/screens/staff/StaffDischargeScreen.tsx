import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BedDouble,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { canViewBillingSummary } from '../../components/staff/staffPermissions';
import { bedService } from '../../services/bedService';
import { billingService } from '../../services/billingService';
import type { HospitalBed } from '../../types/bed';

export const StaffDischargeScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const canSeeBilling = canViewBillingSummary(user?.designation);
  const [occupiedBeds, setOccupiedBeds] = useState<HospitalBed[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedBed, setSelectedBed] = useState<HospitalBed | null>(null);
  const [unpaidDue, setUnpaidDue] = useState(0);
  const [dischargeNotes, setDischargeNotes] = useState(
    'Vitals stable at discharge. Discharge summary and follow-up schedule provided.'
  );
  const [submitting, setSubmitting] = useState(false);

  const loadOccupied = useCallback(async () => {
    try {
      const beds = await bedService.getBeds(undefined, 'occupied');
      setOccupiedBeds(beds);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOccupied();
  }, [loadOccupied]);

  useFocusEffect(
    useCallback(() => {
      loadOccupied();
    }, [loadOccupied])
  );

  const handleSelectForDischarge = async (bed: HospitalBed) => {
    setSelectedBed(bed);
    setUnpaidDue(0);
    if (canSeeBilling && bed.currentPatient?.patientId) {
      try {
        const invs = await billingService.getInvoices(
          bed.currentPatient.patientId
        );
        const totalDue = invs.reduce((sum, i) => sum + i.balanceDue, 0);
        setUnpaidDue(totalDue);
      } catch {}
    }
  };

  const handleConfirmDischarge = async () => {
    if (!selectedBed || !selectedBed.currentPatient) return;
    setSubmitting(true);
    try {
      await bedService.dischargePatient({
        bedId: selectedBed.id,
        patientId: selectedBed.currentPatient.patientId,
        dischargeNotes: dischargeNotes.trim() || undefined,
      });

      const dischargedName = selectedBed.currentPatient.patientName;
      const bedNum = selectedBed.bedNumber;
      setSelectedBed(null);
      await loadOccupied();
      Alert.alert(
        'Discharge Completed',
        `${dischargedName} has been discharged from Bed ${bedNum}. Bed is now available.`
      );
    } catch {
      Alert.alert(
        'Discharge Failed',
        'Could not process patient discharge.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Discharge Management"
        subtitle="IPD Bed Release & Clearance"
        onBackPress={() => navigation.goBack()}
      />

      {loading ? (
        <StarLoader message="Loading admitted ward patients..." />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadOccupied();
              }}
              tintColor="#0866C6"
            />
          }
        >
          <View style={styles.infoBanner}>
            <BedDouble size={18} color="#0866C6" />
            <Text style={styles.infoBannerText}>
              {occupiedBeds.length} active inpatient bed(s) currently occupied
            </Text>
          </View>

          {occupiedBeds.length === 0 ? (
            <EmptyState
              title="No Admitted Patients Pending Discharge"
              description="All inpatient beds checked are currently free."
              actionLabel="View Bed Availability"
              onAction={() => navigation.navigate('AdmissionBed')}
            />
          ) : (
            occupiedBeds.map((bed) => (
              <View key={bed.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.bedTag}>
                    <Text style={styles.bedTagText}>{bed.bedNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>
                      {bed.currentPatient?.patientName || 'Admitted Patient'}
                    </Text>
                    <Text style={styles.meta}>
                      MRN: {bed.currentPatient?.mrn || 'N/A'} | {bed.wardName} (
                      {bed.category})
                    </Text>
                    <Text style={styles.meta}>
                      Attending: {bed.currentPatient?.doctorName || 'Consultant'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.dischargeBtn}
                  onPress={() => handleSelectForDischarge(bed)}
                >
                  <LogOut size={15} color="#FFFFFF" />
                  <Text style={styles.dischargeBtnText}>
                    Initiate Discharge &amp; Release Bed
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Discharge Confirmation Modal */}
      <Modal
        visible={Boolean(selectedBed)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBed(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Finalize Inpatient Discharge</Text>
              <TouchableOpacity onPress={() => setSelectedBed(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedBed ? (
              <>
                <View style={styles.patientBox}>
                  <Text style={styles.boxName}>
                    {selectedBed.currentPatient?.patientName}
                  </Text>
                  <Text style={styles.boxMeta}>
                    Bed {selectedBed.bedNumber} | {selectedBed.wardName} | Rate:
                    Rs. {selectedBed.dailyRate}/day
                  </Text>
                </View>

                {canSeeBilling ? (
                  unpaidDue > 0 ? (
                    <View style={styles.dueWarn}>
                      <AlertTriangle size={16} color="#B45309" />
                      <Text style={styles.dueWarnText}>
                        Billing Clearance Notice: Patient has Rs.{' '}
                        {unpaidDue.toLocaleString()} balance due on account.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.clearedBox}>
                      <CheckCircle2 size={16} color="#16A34A" />
                      <Text style={styles.clearedText}>
                        Financial billing account cleared for discharge.
                      </Text>
                    </View>
                  )
                ) : null}

                <View style={styles.inputLabelRow}>
                  <FileText size={13} color="#0866C6" />
                  <Text style={styles.inputLabel}>Discharge Summary Notes</Text>
                </View>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  numberOfLines={3}
                  value={dischargeNotes}
                  onChangeText={setDischargeNotes}
                />

                <TouchableOpacity
                  style={[styles.confirmBtn, submitting && { opacity: 0.7 }]}
                  disabled={submitting}
                  onPress={handleConfirmDischarge}
                >
                  <Text style={styles.confirmBtnText}>
                    {submitting
                      ? 'Releasing Bed...'
                      : 'Confirm Discharge & Free Bed'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F9FF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 38,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  infoBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#064A91',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  bedTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bedTagText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  meta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dischargeBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dischargeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
  patientBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  boxName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  boxMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dueWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  dueWarnText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  clearedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  clearedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 10,
    minHeight: 78,
    textAlignVertical: 'top',
    fontSize: 13,
    color: '#142D4E',
    marginBottom: 14,
  },
  confirmBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});

export default StaffDischargeScreen;
