import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  FlaskConical,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileCheck,
} from 'lucide-react-native';
import { LabTestResultParameter } from '../../types/laboratory';

export interface LabResultFormProps {
  testName?: string;
  patientName?: string;
  initialParameters?: LabTestResultParameter[];
  initialSummary?: string;
  onSave: (data: {
    results: LabTestResultParameter[];
    summary?: string;
    markCompleted: boolean;
  }) => Promise<void> | void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const DEFAULT_PARAMETERS: LabTestResultParameter[] = [
  {
    parameter: 'Hemoglobin',
    value: '',
    unit: 'g/dL',
    referenceRange: '13.5 - 17.5',
    isAbnormal: false,
    flag: 'Normal',
  },
  {
    parameter: 'Total WBC Count',
    value: '',
    unit: '/mcL',
    referenceRange: '4,500 - 11,000',
    isAbnormal: false,
    flag: 'Normal',
  },
  {
    parameter: 'Platelet Count',
    value: '',
    unit: '/mcL',
    referenceRange: '150,000 - 450,000',
    isAbnormal: false,
    flag: 'Normal',
  },
];

export const LabResultForm: React.FC<LabResultFormProps> = ({
  testName = 'Diagnostic Test',
  patientName,
  initialParameters,
  initialSummary = '',
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [parameters, setParameters] = useState<LabTestResultParameter[]>(
    initialParameters && initialParameters.length > 0
      ? initialParameters
      : DEFAULT_PARAMETERS
  );
  const [summary, setSummary] = useState(initialSummary);
  const [markCompleted, setMarkCompleted] = useState(true);

  const handleUpdateParameter = (
    index: number,
    field: keyof LabTestResultParameter,
    value: any
  ) => {
    setParameters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleToggleAbnormal = (index: number) => {
    setParameters((prev) => {
      const updated = [...prev];
      const isAbnormal = !updated[index].isAbnormal;
      updated[index] = {
        ...updated[index],
        isAbnormal,
        flag: isAbnormal ? 'High' : 'Normal',
      };
      return updated;
    });
  };

  const handleAddParameter = () => {
    setParameters((prev) => [
      ...prev,
      {
        parameter: '',
        value: '',
        unit: '',
        referenceRange: '',
        isAbnormal: false,
        flag: 'Normal',
      },
    ]);
  };

  const handleRemoveParameter = (index: number) => {
    if (parameters.length <= 1) {
      Alert.alert('Notice', 'At least one test parameter is required.');
      return;
    }
    setParameters((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const hasEmptyParam = parameters.some((p) => !p.parameter.trim());
    if (hasEmptyParam) {
      Alert.alert('Validation Error', 'Please specify a name for all parameters.');
      return;
    }

    const hasValue = parameters.some((p) => p.value.trim());
    if (!hasValue) {
      Alert.alert(
        'Validation Error',
        'Please enter values for at least one parameter.'
      );
      return;
    }

    await onSave({
      results: parameters,
      summary: summary.trim() || undefined,
      markCompleted,
    });
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrapper}>
          <FlaskConical size={20} color="#7C3AED" strokeWidth={2.2} />
        </View>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerTitle}>{testName}</Text>
          {patientName && (
            <Text style={styles.patientSubtitle}>Patient: {patientName}</Text>
          )}
        </View>
      </View>

      {/* Parameter Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.colHeader, { flex: 2 }]}>Parameter</Text>
        <Text style={[styles.colHeader, { flex: 1.5 }]}>Value</Text>
        <Text style={[styles.colHeader, { flex: 1.5 }]}>Ref. Range</Text>
        <Text style={[styles.colHeader, { flex: 0.8, textAlign: 'center' }]}>
          Flag
        </Text>
        <Text style={[styles.colHeader, { width: 32 }]}></Text>
      </View>

      {/* Parameter Rows */}
      <View style={styles.rowsContainer}>
        {parameters.map((param, index) => (
          <View
            key={`param-${index}`}
            style={[
              styles.paramRow,
              param.isAbnormal && styles.paramRowAbnormal,
            ]}
          >
            {/* Parameter Name */}
            <View style={{ flex: 2 }}>
              <TextInput
                style={styles.textInput}
                placeholder="Parameter Name"
                placeholderTextColor="#94A3B8"
                value={param.parameter}
                onChangeText={(text) =>
                  handleUpdateParameter(index, 'parameter', text)
                }
              />
            </View>

            {/* Value + Unit */}
            <View style={{ flex: 1.5, flexDirection: 'row', gap: 4 }}>
              <TextInput
                style={[
                  styles.textInput,
                  { flex: 1 },
                  param.isAbnormal && styles.inputAbnormal,
                ]}
                placeholder="Value"
                placeholderTextColor="#94A3B8"
                value={param.value}
                onChangeText={(text) =>
                  handleUpdateParameter(index, 'value', text)
                }
              />
              <TextInput
                style={[styles.textInput, { width: 44, fontSize: 11, paddingHorizontal: 4 }]}
                placeholder="Unit"
                placeholderTextColor="#94A3B8"
                value={param.unit}
                onChangeText={(text) =>
                  handleUpdateParameter(index, 'unit', text)
                }
              />
            </View>

            {/* Reference Range */}
            <View style={{ flex: 1.5 }}>
              <TextInput
                style={[styles.textInput, { fontSize: 12 }]}
                placeholder="Range"
                placeholderTextColor="#94A3B8"
                value={param.referenceRange}
                onChangeText={(text) =>
                  handleUpdateParameter(index, 'referenceRange', text)
                }
              />
            </View>

            {/* Flag / Abnormal Toggle */}
            <TouchableOpacity
              style={[
                styles.flagButton,
                param.isAbnormal ? styles.flagAbnormal : styles.flagNormal,
              ]}
              onPress={() => handleToggleAbnormal(index)}
            >
              <Text
                style={[
                  styles.flagText,
                  param.isAbnormal ? styles.flagTextAbnormal : styles.flagTextNormal,
                ]}
              >
                {param.isAbnormal ? 'ABN' : 'NORM'}
              </Text>
            </TouchableOpacity>

            {/* Remove Row */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemoveParameter(index)}
            >
              <Trash2 size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Add Parameter Button */}
      <TouchableOpacity
        style={styles.addParamButton}
        onPress={handleAddParameter}
      >
        <Plus size={16} color="#7C3AED" strokeWidth={2.4} />
        <Text style={styles.addParamText}>Add Test Parameter</Text>
      </TouchableOpacity>

      {/* Summary / Clinical Notes */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionLabel}>Technician Remarks & Summary</Text>
        <TextInput
          style={styles.summaryInput}
          placeholder="Enter findings, specimen notes, or clinical remarks..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          value={summary}
          onChangeText={setSummary}
        />
      </View>

      {/* Mark Completed Checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        activeOpacity={0.8}
        onPress={() => setMarkCompleted(!markCompleted)}
      >
        <View
          style={[
            styles.checkbox,
            markCompleted && styles.checkboxActive,
          ]}
        >
          {markCompleted && <CheckCircle size={14} color="#FFFFFF" strokeWidth={3} />}
        </View>
        <Text style={styles.checkboxLabel}>
          Mark report as completed and release to Doctor / Patient
        </Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <FileCheck size={18} color="#FFFFFF" strokeWidth={2.2} />
              <Text style={styles.submitText}>Save & Release Report</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextWrapper: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#142D4E',
  },
  patientSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  rowsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  paramRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paramRowAbnormal: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 4,
  },
  textInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#142D4E',
    backgroundColor: '#FFFFFF',
  },
  inputAbnormal: {
    borderColor: '#F43F5E',
    color: '#BE123C',
    fontWeight: '700',
  },
  flagButton: {
    width: 44,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  flagNormal: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  flagAbnormal: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  flagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  flagTextNormal: {
    color: '#15803D',
  },
  flagTextAbnormal: {
    color: '#DC2626',
  },
  deleteButton: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addParamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    marginBottom: 16,
  },
  addParamText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },
  summarySection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#142D4E',
    marginBottom: 6,
  },
  summaryInput: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: '#142D4E',
    backgroundColor: '#F8FAFC',
    textAlignVertical: 'top',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: '#142D4E',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  submitButton: {
    flex: 2,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
