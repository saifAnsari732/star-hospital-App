import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Activity,
  Heart,
  Thermometer,
  Scale,
  Wind,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import { AppointmentVitals } from '../../types/appointment';

export interface VitalsInputFormProps {
  initialVitals?: AppointmentVitals;
  onSave: (vitals: AppointmentVitals) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
  patientName?: string;
}

export const VitalsInputForm: React.FC<VitalsInputFormProps> = ({
  initialVitals,
  onSave,
  onCancel,
  isLoading = false,
  patientName,
}) => {
  // Parse initial BP into systolic and diastolic if provided
  const parseBp = (bp?: string) => {
    if (!bp) return { systolic: '', diastolic: '' };
    const parts = bp.replace(/[^0-9/]/g, '').split('/');
    return {
      systolic: parts[0] || '',
      diastolic: parts[1] || '',
    };
  };

  const initialBp = parseBp(initialVitals?.bloodPressure);

  const [systolic, setSystolic] = useState(initialBp.systolic);
  const [diastolic, setDiastolic] = useState(initialBp.diastolic);
  const [pulse, setPulse] = useState(
    initialVitals?.pulse?.replace(/[^0-9.]/g, '') || ''
  );
  const [temperature, setTemperature] = useState(
    initialVitals?.temperature?.replace(/[^0-9.]/g, '') || ''
  );
  const [weight, setWeight] = useState(
    initialVitals?.weight?.replace(/[^0-9.]/g, '') || ''
  );
  const [oxygenSaturation, setOxygenSaturation] = useState(
    initialVitals?.oxygenSaturation?.replace(/[^0-9.]/g, '') || ''
  );
  const [respiratoryRate, setRespiratoryRate] = useState(
    initialVitals?.respiratoryRate?.replace(/[^0-9.]/g, '') || ''
  );

  // Quick Clinical Assessment Checks
  const systolicNum = parseFloat(systolic);
  const diastolicNum = parseFloat(diastolic);
  const pulseNum = parseFloat(pulse);
  const tempNum = parseFloat(temperature);
  const spo2Num = parseFloat(oxygenSaturation);

  const isBpHypertensive =
    (systolicNum && systolicNum >= 140) || (diastolicNum && diastolicNum >= 90);
  const isBpHypotensive =
    (systolicNum && systolicNum < 90) || (diastolicNum && diastolicNum < 60);
  const isFever = tempNum && tempNum >= 100.4;
  const isHypoxia = spo2Num && spo2Num < 95;
  const isTachycardia = pulseNum && pulseNum > 100;
  const isBradycardia = pulseNum && pulseNum < 60;

  const handleSubmit = async () => {
    if (!systolic && !pulse && !temperature && !weight && !oxygenSaturation) {
      Alert.alert('Incomplete Form', 'Please enter at least one vital sign.');
      return;
    }

    const compiledVitals: AppointmentVitals = {
      bloodPressure:
        systolic || diastolic
          ? `${systolic || '--'}/${diastolic || '--'} mmHg`
          : undefined,
      pulse: pulse ? `${pulse} bpm` : undefined,
      temperature: temperature ? `${temperature} °F` : undefined,
      weight: weight ? `${weight} kg` : undefined,
      oxygenSaturation: oxygenSaturation ? `${oxygenSaturation} %` : undefined,
      respiratoryRate: respiratoryRate ? `${respiratoryRate} /min` : undefined,
      recordedAt: new Date().toISOString(),
    };

    await onSave(compiledVitals);
  };

  return (
    <View style={styles.container}>
      {patientName && (
        <View style={styles.patientBanner}>
          <Text style={styles.patientBannerLabel}>Recording Vitals for:</Text>
          <Text style={styles.patientBannerName}>{patientName}</Text>
        </View>
      )}

      {/* Blood Pressure Row */}
      <View style={styles.fieldGroup}>
        <View style={styles.fieldHeader}>
          <View style={styles.labelRow}>
            <Activity size={18} color="#0866C6" strokeWidth={2.2} />
            <Text style={styles.fieldLabel}>Blood Pressure (BP)</Text>
          </View>
          <Text style={styles.unitTag}>mmHg</Text>
        </View>

        <View style={styles.bpInputsRow}>
          <View style={styles.bpSubInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="120"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={3}
              value={systolic}
              onChangeText={setSystolic}
            />
            <Text style={styles.subInputLabel}>Systolic</Text>
          </View>

          <Text style={styles.bpSlash}>/</Text>

          <View style={styles.bpSubInputContainer}>
            <TextInput
              style={styles.input}
              placeholder="80"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={3}
              value={diastolic}
              onChangeText={setDiastolic}
            />
            <Text style={styles.subInputLabel}>Diastolic</Text>
          </View>
        </View>

        {isBpHypertensive && (
          <View style={styles.warningPill}>
            <AlertTriangle size={14} color="#DC2626" />
            <Text style={styles.warningText}>High Blood Pressure Warning</Text>
          </View>
        )}
        {isBpHypotensive && (
          <View style={styles.warningPill}>
            <AlertTriangle size={14} color="#D97706" />
            <Text style={[styles.warningText, { color: '#D97706' }]}>
              Low Blood Pressure Alert
            </Text>
          </View>
        )}
      </View>

      {/* Pulse & Temperature Grid */}
      <View style={styles.twoColumnRow}>
        {/* Pulse */}
        <View style={styles.columnField}>
          <View style={styles.fieldHeader}>
            <View style={styles.labelRow}>
              <Heart size={16} color="#DC2626" strokeWidth={2.2} />
              <Text style={styles.fieldLabel}>Pulse / HR</Text>
            </View>
            <Text style={styles.unitTag}>bpm</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="72"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={3}
            value={pulse}
            onChangeText={setPulse}
          />
          {isTachycardia && (
            <Text style={styles.subWarningText}>Elevated HR</Text>
          )}
          {isBradycardia && (
            <Text style={styles.subWarningText}>Low HR</Text>
          )}
        </View>

        {/* Temperature */}
        <View style={styles.columnField}>
          <View style={styles.fieldHeader}>
            <View style={styles.labelRow}>
              <Thermometer size={16} color="#D97706" strokeWidth={2.2} />
              <Text style={styles.fieldLabel}>Body Temp</Text>
            </View>
            <Text style={styles.unitTag}>°F</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="98.6"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            maxLength={5}
            value={temperature}
            onChangeText={setTemperature}
          />
          {isFever && (
            <Text style={styles.subWarningText}>Fever detected</Text>
          )}
        </View>
      </View>

      {/* SpO2 & Weight Grid */}
      <View style={styles.twoColumnRow}>
        {/* Oxygen Saturation */}
        <View style={styles.columnField}>
          <View style={styles.fieldHeader}>
            <View style={styles.labelRow}>
              <Wind size={16} color="#0866C6" strokeWidth={2.2} />
              <Text style={styles.fieldLabel}>SpO2</Text>
            </View>
            <Text style={styles.unitTag}>%</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="98"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={3}
            value={oxygenSaturation}
            onChangeText={setOxygenSaturation}
          />
          {isHypoxia && (
            <Text style={styles.subWarningText}>Hypoxia warning (&lt;95%)</Text>
          )}
        </View>

        {/* Weight */}
        <View style={styles.columnField}>
          <View style={styles.fieldHeader}>
            <View style={styles.labelRow}>
              <Scale size={16} color="#16A34A" strokeWidth={2.2} />
              <Text style={styles.fieldLabel}>Weight</Text>
            </View>
            <Text style={styles.unitTag}>kg</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="68.5"
            placeholderTextColor="#94A3B8"
            keyboardType="decimal-pad"
            maxLength={5}
            value={weight}
            onChangeText={setWeight}
          />
        </View>
      </View>

      {/* Respiratory Rate (Optional) */}
      <View style={styles.fieldGroup}>
        <View style={styles.fieldHeader}>
          <View style={styles.labelRow}>
            <Activity size={16} color="#64748B" strokeWidth={2} />
            <Text style={styles.fieldLabel}>Respiratory Rate (Optional)</Text>
          </View>
          <Text style={styles.unitTag}>breaths/min</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="16"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          maxLength={3}
          value={respiratoryRate}
          onChangeText={setRespiratoryRate}
        />
      </View>

      {/* Buttons */}
      <View style={styles.actionRow}>
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.saveButtonText}>Save Vitals</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientBanner: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#0866C6',
  },
  patientBannerLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  patientBannerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#064A91',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#142D4E',
  },
  unitTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0866C6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bpInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bpSubInputContainer: {
    flex: 1,
  },
  subInputLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  bpSlash: {
    fontSize: 24,
    fontWeight: '300',
    color: '#CBD5E1',
    paddingBottom: 16,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  columnField: {
    flex: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#142D4E',
    backgroundColor: '#F8FAFC',
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  subWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0866C6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
