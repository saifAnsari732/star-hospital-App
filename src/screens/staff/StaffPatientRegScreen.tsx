import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  UserPlus,
  CheckCircle2,
  Ticket,
  CalendarPlus,
  ListOrdered,
  X,
} from 'lucide-react-native';
import { StarHeader } from '../../components/common';
import { mockPatients } from '../../fixtures/mockPatients';
import { doctorService } from '../../services/doctorService';
import { opdTokenService } from '../../services/opdTokenService';
import type { BloodGroup, Patient } from '../../types/patient';
import type { Doctor } from '../../types/doctor';

const BLOOD_GROUPS: BloodGroup[] = [
  'O+',
  'O-',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
];

export const StaffPatientRegScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ageYears, setAgeYears] = useState('30');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Lahore');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  const [issueOpdToken, setIssueOpdToken] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('doc-1');
  const [submitting, setSubmitting] = useState(false);

  const [registeredPatient, setRegisteredPatient] = useState<Patient | null>(
    null
  );
  const [generatedTokenNumber, setGeneratedTokenNumber] = useState<
    string | null
  >(null);

  useEffect(() => {
    doctorService
      .getAllDoctors()
      .then((docs) => {
        setDoctors(docs);
        if (docs[0]) setSelectedDoctorId(docs[0].id);
      })
      .catch(() => {});
  }, []);

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert(
        'Required Fields',
        'Please enter Patient Full Name and Mobile Number.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const parsedAge = parseInt(ageYears.replace(/\D/g, ''), 10) || 30;
      const birthYear = Math.max(1920, new Date().getFullYear() - parsedAge);
      const mrnSuffix = String(1000 + mockPatients.length + 1);
      const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        mrn: `P-${mrnSuffix}`,
        name: fullName.trim(),
        email:
          email.trim() ||
          `${fullName.trim().toLowerCase().replace(/\s+/g, '.')}@patient.star`,
        phone: phone.trim(),
        gender,
        birthDate: `${birthYear}-01-01`,
        age: `${parsedAge} yrs`,
        bloodGroup,
        address: address.trim() || 'Hospital OPD Registration',
        city: city.trim() || 'Lahore',
        cnic: cnic.trim() || undefined,
        registeredAt: new Date().toISOString(),
        emergencyContact: emergencyName.trim()
          ? {
              name: emergencyName.trim(),
              relation: 'Family',
              phone: emergencyPhone.trim() || phone.trim(),
            }
          : undefined,
      };

      mockPatients.unshift(newPatient);

      let issuedToken: string | null = null;
      if (issueOpdToken) {
        const doc = doctors.find((d) => d.id === selectedDoctorId);
        const token = await opdTokenService.generateToken({
          patientId: newPatient.id,
          doctorId: selectedDoctorId,
          department: doc?.department,
          visitType: 'first_visit',
        });
        issuedToken = token.tokenNumber;
      }

      setRegisteredPatient(newPatient);
      setGeneratedTokenNumber(issuedToken);
    } catch {
      Alert.alert('Registration Failed', 'Could not register patient.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRegisteredPatient(null);
    setGeneratedTokenNumber(null);
    setFullName('');
    setPhone('');
    setEmail('');
    setCnic('');
    setAddress('');
    setEmergencyName('');
    setEmergencyPhone('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="New Patient Registration"
        subtitle="Create MRN & Optional Walk-in Token"
        onBackPress={() => navigation?.goBack?.()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Demographics */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Patient Demographics</Text>

          <Text style={styles.fieldLabel}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ayesha Siddiqui"
            placeholderTextColor="#94A3B8"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.fieldLabel}>Mobile Phone *</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="+92 300 1234567"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={setPhone}
          />

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Age (Years)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={ageYears}
                onChangeText={setAgeYears}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>Gender</Text>
          <View style={styles.chipRow}>
            {(['male', 'female', 'other'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, gender === g && styles.chipActive]}
                onPress={() => setGender(g)}
              >
                <Text
                  style={[
                    styles.chipText,
                    gender === g && styles.chipTextActive,
                  ]}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Blood Group</Text>
          <View style={styles.chipRow}>
            {BLOOD_GROUPS.map((bg) => (
              <TouchableOpacity
                key={bg}
                style={[styles.chip, bloodGroup === bg && styles.chipActive]}
                onPress={() => setBloodGroup(bg)}
              >
                <Text
                  style={[
                    styles.chipText,
                    bloodGroup === bg && styles.chipTextActive,
                  ]}
                >
                  {bg}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>National ID / CNIC (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="XXXXX-XXXXXXX-X"
            placeholderTextColor="#94A3B8"
            value={cnic}
            onChangeText={setCnic}
          />

          <Text style={styles.fieldLabel}>Email Address (Optional)</Text>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="patient@example.com"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.fieldLabel}>Residential Address</Text>
          <TextInput
            style={styles.input}
            placeholder="House / Street / Sector"
            placeholderTextColor="#94A3B8"
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Emergency Contact */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <Text style={styles.fieldLabel}>Contact Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Next of kin name"
            placeholderTextColor="#94A3B8"
            value={emergencyName}
            onChangeText={setEmergencyName}
          />
          <Text style={styles.fieldLabel}>Emergency Phone</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="+92 321 9876543"
            placeholderTextColor="#94A3B8"
            value={emergencyPhone}
            onChangeText={setEmergencyPhone}
          />
        </View>

        {/* Immediate Walk-in OPD Token Option */}
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>
                Issue Walk-in OPD Token Immediately
              </Text>
              <Text style={styles.helper}>
                Automatically place patient in selected doctor&apos;s queue
              </Text>
            </View>
            <Switch
              value={issueOpdToken}
              onValueChange={setIssueOpdToken}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={issueOpdToken ? '#0866C6' : '#64748B'}
            />
          </View>

          {issueOpdToken && doctors.length > 0 ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.fieldLabel}>Assign Doctor</Text>
              <View style={styles.chipRow}>
                {doctors.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    style={[
                      styles.chip,
                      selectedDoctorId === d.id && styles.chipActive,
                    ]}
                    onPress={() => setSelectedDoctorId(d.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedDoctorId === d.id && styles.chipTextActive,
                      ]}
                    >
                      {d.name} ({d.department})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={handleRegister}
        >
          <UserPlus size={18} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>
            {submitting ? 'Registering Patient...' : 'Register Patient & Issue MRN'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Registration Receipt Modal */}
      <Modal
        visible={!!registeredPatient}
        animationType="fade"
        transparent
        onRequestClose={resetForm}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <CheckCircle2 size={28} color="#16A34A" />
              <TouchableOpacity onPress={resetForm}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTitle}>Patient Registered</Text>
            <Text style={styles.modalSub}>
              {registeredPatient?.name} has been added to Star Hospital
              directory.
            </Text>

            <View style={styles.receiptBox}>
              <Text style={styles.receiptLabel}>Assigned MRN</Text>
              <Text style={styles.receiptMrn}>{registeredPatient?.mrn}</Text>
              {generatedTokenNumber ? (
                <Text style={styles.receiptTok}>
                  OPD Token Issued: {generatedTokenNumber}
                </Text>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              {generatedTokenNumber ? (
                <TouchableOpacity
                  style={styles.modalBtnPrimary}
                  onPress={() => {
                    const pat = registeredPatient;
                    resetForm();
                    navigation?.navigate?.('StaffPatientDetails', {
                      patientId: pat?.id,
                      patient: pat,
                    });
                  }}
                >
                  <CheckCircle2 size={16} color="#FFFFFF" />
                  <Text style={styles.modalBtnPrimaryText}>
                    Open Patient Chart
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.modalBtnPrimary}
                  onPress={() => {
                    const pat = registeredPatient;
                    resetForm();
                    navigation?.navigate?.('TokenGeneration', {
                      patientId: pat?.id,
                      patientName: pat?.name,
                      patientPhone: pat?.phone,
                    });
                  }}
                >
                  <Ticket size={16} color="#FFFFFF" />
                  <Text style={styles.modalBtnPrimaryText}>
                    Generate OPD Token
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.modalBtnOutline}
                onPress={() => {
                  const pat = registeredPatient;
                  resetForm();
                  navigation?.navigate?.('StaffBookAppointment', {
                    patientId: pat?.id,
                    patientName: pat?.name,
                  });
                }}
              >
                <CalendarPlus size={16} color="#0866C6" />
                <Text style={styles.modalBtnOutlineText}>Book Appointment</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnOutline}
                onPress={() => {
                  resetForm();
                  navigation?.navigate?.('StaffOPDQueue');
                }}
              >
                <ListOrdered size={16} color="#0866C6" />
                <Text style={styles.modalBtnOutlineText}>Open OPD Queue</Text>
              </TouchableOpacity>
            </View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  chip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helper: {
    fontSize: 12,
    color: '#64748B',
  },
  submitBtn: {
    backgroundColor: '#0866C6',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#142D4E',
  },
  modalSub: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    marginBottom: 14,
  },
  receiptBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 16,
  },
  receiptLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  receiptMrn: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0866C6',
    marginTop: 4,
  },
  receiptTok: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  modalActions: {
    gap: 8,
  },
  modalBtnPrimary: {
    backgroundColor: '#0866C6',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modalBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalBtnOutline: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modalBtnOutlineText: {
    color: '#0866C6',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default StaffPatientRegScreen;
