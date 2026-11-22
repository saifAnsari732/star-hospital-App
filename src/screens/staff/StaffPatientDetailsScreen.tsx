import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Phone,
  Mail,
  MapPin,
  Ticket,
  CalendarPlus,
  HeartPulse,
  Receipt,
  FlaskConical,
  Pill,
  BedDouble,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react-native';
import { StarHeader, StarLoader } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import {
  canViewBillingSummary,
  hasStaffPermission,
} from '../../components/staff/staffPermissions';
import { patientService } from '../../services/patientService';
import { appointmentService } from '../../services/appointmentService';
import { billingService } from '../../services/billingService';
import type { Patient, PatientAdmission } from '../../types/patient';
import type { Appointment } from '../../types/appointment';
import type { InvoiceDetail } from '../../types/billing';

export const StaffPatientDetailsScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const { user } = useAuth();
  const designation = user?.designation;

  const paramPatient = route?.params?.patient;
  const patientId: string =
    route?.params?.patientId || paramPatient?.id || 'pat-1';

  const canToken = hasStaffPermission(designation, 'opd:token_generate');
  const canBook = hasStaffPermission(designation, 'appointments:book');
  const canVitals = hasStaffPermission(designation, 'vitals:record');
  const canBilling = canViewBillingSummary(designation);
  const canLab = hasStaffPermission(designation, 'lab:worklist');
  const canPharmacy = hasStaffPermission(designation, 'pharmacy:worklist');
  const canBeds = hasStaffPermission(designation, 'beds:view');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(paramPatient || null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [admissions, setAdmissions] = useState<PatientAdmission[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);

  const loadDetails = useCallback(async () => {
    try {
      const [pat, appts, adm] = await Promise.all([
        patientService.getProfile(patientId),
        appointmentService.getAppointments({ patientId }),
        patientService.getAdmissions(patientId),
      ]);
      setPatient(pat);
      setAppointments(appts);
      setAdmissions(adm);

      if (canBilling) {
        const invs = await billingService.getInvoices(patientId);
        setInvoices(invs);
      } else {
        setInvoices([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId, canBilling]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [loadDetails])
  );

  if (loading && !patient) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarHeader title="Patient Details" onBackPress={() => navigation.goBack()} />
        <StarLoader message="Loading patient profile..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Patient Profile"
        subtitle={patient?.mrn || patientId}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadDetails();
            }}
            tintColor="#0866C6"
          />
        }
      >
        {/* Demographics Card */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {patient?.name ? patient.name.charAt(0).toUpperCase() : 'P'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{patient?.name || 'Patient'}</Text>
              <Text style={styles.meta}>
                MRN: {patient?.mrn} | {patient?.age} |{' '}
                {patient?.gender === 'female'
                  ? 'Female'
                  : patient?.gender === 'other'
                    ? 'Other'
                    : 'Male'}
              </Text>
              <View style={styles.bloodBadge}>
                <Text style={styles.bloodText}>
                  Blood Group: {patient?.bloodGroup || 'O+'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoItem}>
            <Phone size={14} color="#0866C6" />
            <Text style={styles.infoText}>{patient?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Mail size={14} color="#0866C6" />
            <Text style={styles.infoText}>{patient?.email || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <MapPin size={14} color="#0866C6" />
            <Text style={styles.infoText}>
              {patient?.address ? `${patient.address}, ${patient.city}` : 'N/A'}
            </Text>
          </View>
          {patient?.cnic ? (
            <View style={styles.infoItem}>
              <ShieldCheck size={14} color="#0866C6" />
              <Text style={styles.infoText}>ID: {patient.cnic}</Text>
            </View>
          ) : null}
        </View>

        {/* Designation-Permitted Actions */}
        <Text style={styles.sectionHeading}>Permitted Workflow Actions</Text>
        <View style={styles.actionsGrid}>
          {canToken ? (
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() =>
                navigation.navigate('TokenGeneration', {
                  patientId: patient?.id || patientId,
                  patientName: patient?.name,
                  patientPhone: patient?.phone,
                })
              }
            >
              <Ticket size={18} color="#0866C6" />
              <Text style={styles.actionTileText}>Generate OPD Token</Text>
            </TouchableOpacity>
          ) : null}

          {canBook ? (
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() =>
                navigation.navigate('StaffBookAppointment', {
                  patientId: patient?.id || patientId,
                  patientName: patient?.name,
                })
              }
            >
              <CalendarPlus size={18} color="#0866C6" />
              <Text style={styles.actionTileText}>Book Appointment</Text>
            </TouchableOpacity>
          ) : null}

          {canVitals ? (
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() =>
                navigation.navigate('NurseVitals', {
                  patientId: patient?.id || patientId,
                  patientName: patient?.name,
                })
              }
            >
              <HeartPulse size={18} color="#16A34A" />
              <Text style={styles.actionTileText}>Record Vitals</Text>
            </TouchableOpacity>
          ) : null}

          {canBilling ? (
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() =>
                navigation.navigate('BillingInvoice', {
                  patientId: patient?.id || patientId,
                })
              }
            >
              <Receipt size={18} color="#0284C7" />
              <Text style={styles.actionTileText}>Billing &amp; Invoice</Text>
            </TouchableOpacity>
          ) : null}

          {canLab ? (
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('LabEntry')}
            >
              <FlaskConical size={18} color="#D97706" />
              <Text style={styles.actionTileText}>Lab Worklist</Text>
            </TouchableOpacity>
          ) : null}

          {canPharmacy ? (
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('PharmacyDispense')}
            >
              <Pill size={18} color="#7C3AED" />
              <Text style={styles.actionTileText}>Dispense Rx</Text>
            </TouchableOpacity>
          ) : null}

          {canBeds ? (
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('AdmissionBed')}
            >
              <BedDouble size={18} color="#0866C6" />
              <Text style={styles.actionTileText}>Ward / Beds</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Recent Visits */}
        <Text style={styles.sectionHeading}>
          Appointments ({appointments.length})
        </Text>
        <View style={styles.card}>
          {appointments.length === 0 ? (
            <Text style={styles.emptySubText}>
              No appointments recorded for this patient.
            </Text>
          ) : (
            appointments.slice(0, 4).map((a) => (
              <View key={a.id} style={styles.rowBlock}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {a.doctorName} ({a.doctorDepartment})
                  </Text>
                  <Text style={styles.rowMeta}>
                    {a.date} at {a.timeSlot} | {a.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Ward Admissions */}
        <Text style={styles.sectionHeading}>
          Admissions History ({admissions.length})
        </Text>
        <View style={styles.card}>
          {admissions.length === 0 ? (
            <Text style={styles.emptySubText}>No inpatient admissions.</Text>
          ) : (
            admissions.map((adm) => (
              <View key={adm.id} style={styles.rowBlock}>
                <Text style={styles.rowTitle}>
                  {adm.wardCategory} - Bed {adm.bedNumber} ({adm.status.toUpperCase()})
                </Text>
                <Text style={styles.rowMeta}>
                  Doctor: {adm.doctorName} | Admitted: {adm.admittedAt.split('T')[0]}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Billing Summary ONLY for billing/admin */}
        {canBilling ? (
          <>
            <Text style={styles.sectionHeading}>
              Patient Billing Ledger ({invoices.length})
            </Text>
            <View style={styles.card}>
              {invoices.length === 0 ? (
                <Text style={styles.emptySubText}>No invoices on file.</Text>
              ) : (
                invoices.map((inv) => (
                  <View key={inv.id} style={styles.rowBlock}>
                    <View style={styles.invRowTop}>
                      <Text style={styles.rowTitle}>{inv.invoiceNumber}</Text>
                      <Text
                        style={[
                          styles.invBal,
                          inv.balanceDue > 0 && { color: '#DC2626' },
                        ]}
                      >
                        Due: Rs. {inv.balanceDue}
                      </Text>
                    </View>
                    <Text style={styles.rowMeta}>
                      Net: Rs. {inv.netTotal} | Status: {inv.status.toUpperCase()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        ) : (
          <View style={styles.rbacNotice}>
            <AlertTriangle size={14} color="#64748B" />
            <Text style={styles.rbacNoticeText}>
              Financial billing balances are hidden for non-billing staff designations.
            </Text>
          </View>
        )}
      </ScrollView>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#0866C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0866C6',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#142D4E',
  },
  meta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  bloodBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  bloodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  actionTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTileText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#142D4E',
    flex: 1,
  },
  rowBlock: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#142D4E',
  },
  rowMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emptySubText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  invRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invBal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  rbacNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 10,
  },
  rbacNoticeText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
});

export default StaffPatientDetailsScreen;
