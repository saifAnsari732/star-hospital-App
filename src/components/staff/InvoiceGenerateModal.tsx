import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  DollarSign,
  CreditCard,
  Building,
  CheckCircle2,
} from 'lucide-react-native';

export interface BillingLineItemInput {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceGenerateModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (data: {
    patientId?: string;
    patientName: string;
    patientMrn: string;
    careSetting: 'opd' | 'ipd' | 'emergency';
    items: BillingLineItemInput[];
    grossTotal: number;
    discount: number;
    netTotal: number;
    amountReceived: number;
    balanceDue: number;
    paymentMethod: 'cash' | 'card' | 'online' | 'insurance';
    notes?: string;
  }) => Promise<void> | void;
  prefillPatient?: {
    patientId?: string;
    patientName: string;
    mrn: string;
  };
  patients?: Array<{
    id: string;
    name: string;
    mrn: string;
  }>;
  isLoading?: boolean;
}

const DEFAULT_LINE_ITEMS = (): BillingLineItemInput[] => [
  {
    id: 'item-1',
    category: 'Consultation',
    description: 'OPD Specialist Consultation Fee',
    quantity: 1,
    unitPrice: 500,
  },
];

const BILLING_CATEGORIES = [
  'Consultation',
  'Pharmacy',
  'Laboratory',
  'Radiology',
  'Room Charge',
  'Nursing Care',
  'Procedure',
];

export const InvoiceGenerateModal: React.FC<InvoiceGenerateModalProps> = ({
  visible,
  onClose,
  onGenerate,
  prefillPatient,
  patients = [],
  isLoading = false,
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState(
    prefillPatient?.patientId || ''
  );
  const [patientName, setPatientName] = useState(
    prefillPatient?.patientName || ''
  );
  const [patientMrn, setPatientMrn] = useState(prefillPatient?.mrn || '');
  const [careSetting, setCareSetting] = useState<'opd' | 'ipd' | 'emergency'>(
    'opd'
  );
  const [items, setItems] = useState<BillingLineItemInput[]>(DEFAULT_LINE_ITEMS);
  const [discountStr, setDiscountStr] = useState('0');
  const [amountReceivedStr, setAmountReceivedStr] = useState('500');
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'card' | 'online' | 'insurance'
  >('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!visible) return;
    if (prefillPatient) {
      setSelectedPatientId(prefillPatient.patientId || '');
      setPatientName(prefillPatient.patientName || '');
      setPatientMrn(prefillPatient.mrn || '');
    } else if (patients.length > 0) {
      setSelectedPatientId(patients[0].id);
      setPatientName(patients[0].name);
      setPatientMrn(patients[0].mrn);
    } else {
      setSelectedPatientId('');
      setPatientName('');
      setPatientMrn('');
    }
    setCareSetting('opd');
    setItems(DEFAULT_LINE_ITEMS());
    setDiscountStr('0');
    setAmountReceivedStr('500');
    setPaymentMethod('cash');
    setNotes('');
  }, [visible, prefillPatient, patients]);

  // Calculations
  const grossTotal = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );
  const discount = parseFloat(discountStr) || 0;
  const netTotal = Math.max(0, grossTotal - discount);
  const amountReceived = parseFloat(amountReceivedStr) || 0;
  const balanceDue = Math.max(0, netTotal - amountReceived);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        category: 'Pharmacy',
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      Alert.alert('Notice', 'At least one billing line item is required.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (
    id: string,
    field: keyof BillingLineItemInput,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleSubmit = async () => {
    if (!patientName.trim()) {
      Alert.alert('Validation Error', 'Please enter patient name.');
      return;
    }

    const hasEmptyDesc = items.some((item) => !item.description.trim());
    if (hasEmptyDesc) {
      Alert.alert(
        'Validation Error',
        'Please enter a description for all line items.'
      );
      return;
    }

    if (grossTotal <= 0) {
      Alert.alert(
        'Validation Error',
        'Invoice total must be greater than zero.'
      );
      return;
    }

    await onGenerate({
      patientId: selectedPatientId || undefined,
      patientName: patientName.trim(),
      patientMrn: patientMrn.trim() || `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
      careSetting,
      items,
      grossTotal,
      discount,
      netTotal,
      amountReceived,
      balanceDue,
      paymentMethod,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.receiptIcon}>
                <Receipt size={20} color="#D97706" strokeWidth={2.2} />
              </View>
              <Text style={styles.headerTitle}>Generate Hospital Invoice</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={isLoading}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Patient Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Patient Information</Text>
              {patients.length > 0 && !prefillPatient ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 10 }}
                >
                  {patients.map((pat) => {
                    const active = selectedPatientId === pat.id;
                    return (
                      <TouchableOpacity
                        key={pat.id}
                        style={[
                          styles.careSettingChip,
                          {
                            flex: 0,
                            paddingHorizontal: 12,
                            marginRight: 8,
                          },
                          active && styles.careSettingChipActive,
                        ]}
                        onPress={() => {
                          setSelectedPatientId(pat.id);
                          setPatientName(pat.name);
                          setPatientMrn(pat.mrn);
                        }}
                      >
                        <Text
                          style={[
                            styles.careSettingChipText,
                            active && styles.careSettingChipTextActive,
                          ]}
                        >
                          {pat.name} ({pat.mrn})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : null}
              <View style={styles.twoCol}>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.inputLabel}>Patient Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor="#94A3B8"
                    value={patientName}
                    onChangeText={(val) => {
                      setPatientName(val);
                      setSelectedPatientId('');
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>MRN / Patient ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MRN-1002"
                    placeholderTextColor="#94A3B8"
                    value={patientMrn}
                    onChangeText={setPatientMrn}
                  />
                </View>
              </View>

              {/* Care Setting */}
              <Text style={[styles.inputLabel, { marginTop: 10 }]}>Care Setting</Text>
              <View style={styles.careSettingRow}>
                {(['opd', 'ipd', 'emergency'] as const).map((setting) => (
                  <TouchableOpacity
                    key={setting}
                    style={[
                      styles.careSettingChip,
                      careSetting === setting && styles.careSettingChipActive,
                    ]}
                    onPress={() => setCareSetting(setting)}
                  >
                    <Text
                      style={[
                        styles.careSettingChipText,
                        careSetting === setting && styles.careSettingChipTextActive,
                      ]}
                    >
                      {setting.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Line Items */}
            <View style={styles.section}>
              <View style={styles.itemsHeaderRow}>
                <Text style={styles.sectionTitle}>Invoice Line Items</Text>
                <TouchableOpacity
                  style={styles.addItemBtn}
                  onPress={handleAddItem}
                >
                  <Plus size={14} color="#0866C6" strokeWidth={2.5} />
                  <Text style={styles.addItemBtnText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {items.map((item, index) => {
                const lineTotal = (item.quantity || 0) * (item.unitPrice || 0);
                return (
                  <View key={item.id} style={styles.itemCard}>
                    <View style={styles.itemTopRow}>
                      <Text style={styles.itemIndexText}>#{index + 1}</Text>
                      <TextInput
                        style={[styles.input, { flex: 1, height: 38, marginRight: 6 }]}
                        placeholder="Description (e.g. Blood Test CBC)"
                        placeholderTextColor="#94A3B8"
                        value={item.description}
                        onChangeText={(txt) =>
                          handleUpdateItem(item.id, 'description', txt)
                        }
                      />
                      <TouchableOpacity
                        style={styles.removeItemBtn}
                        onPress={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemBottomRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.smallLabel}>Qty</Text>
                        <TextInput
                          style={[styles.input, { height: 36, textAlign: 'center' }]}
                          keyboardType="numeric"
                          value={String(item.quantity)}
                          onChangeText={(txt) =>
                            handleUpdateItem(
                              item.id,
                              'quantity',
                              parseInt(txt, 10) || 0
                            )
                          }
                        />
                      </View>

                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.smallLabel}>Unit Price (Rs.)</Text>
                        <TextInput
                          style={[styles.input, { height: 36 }]}
                          keyboardType="numeric"
                          value={String(item.unitPrice)}
                          onChangeText={(txt) =>
                            handleUpdateItem(
                              item.id,
                              'unitPrice',
                              parseFloat(txt) || 0
                            )
                          }
                        />
                      </View>

                      <View style={{ flex: 1.2, alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Text style={styles.smallLabel}>Amount</Text>
                        <Text style={styles.lineTotalText}>
                          Rs. {lineTotal.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Total Computation Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gross Total:</Text>
                <Text style={styles.summaryValue}>Rs. {grossTotal.toLocaleString()}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount (Rs.):</Text>
                <TextInput
                  style={styles.summaryInput}
                  keyboardType="numeric"
                  value={discountStr}
                  onChangeText={setDiscountStr}
                />
              </View>

              <View style={[styles.summaryRow, styles.summaryDivider]}>
                <Text style={styles.netTotalLabel}>Net Payable Amount:</Text>
                <Text style={styles.netTotalValue}>Rs. {netTotal.toLocaleString()}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount Received (Rs.):</Text>
                <TextInput
                  style={[styles.summaryInput, { borderColor: '#16A34A', color: '#15803D' }]}
                  keyboardType="numeric"
                  value={amountReceivedStr}
                  onChangeText={setAmountReceivedStr}
                />
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Balance Due:</Text>
                <Text
                  style={[
                    styles.summaryValue,
                    { color: balanceDue > 0 ? '#DC2626' : '#16A34A' },
                  ]}
                >
                  Rs. {balanceDue.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.paymentMethodsRow}>
                {(['cash', 'card', 'online', 'insurance'] as const).map(
                  (method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentChip,
                        paymentMethod === method && styles.paymentChipActive,
                      ]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        style={[
                          styles.paymentChipText,
                          paymentMethod === method && styles.paymentChipTextActive,
                        ]}
                      >
                        {method.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.generateBtn, isLoading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.4} />
                  <Text style={styles.generateBtnText}>
                    Generate &amp; Print Invoice (Rs. {netTotal.toLocaleString()})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  receiptIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#142D4E',
  },
  closeButton: {
    padding: 6,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
    marginBottom: 10,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#142D4E',
    backgroundColor: '#F8FAFC',
  },
  careSettingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  careSettingChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  careSettingChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  careSettingChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  careSettingChipTextActive: {
    color: '#FFFFFF',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0866C6',
  },
  itemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    width: 24,
  },
  removeItemBtn: {
    padding: 6,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 2,
  },
  lineTotalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064A91',
  },
  summaryCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#142D4E',
  },
  summaryInput: {
    width: 100,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    textAlign: 'right',
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#142D4E',
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#DBEAFE',
    paddingVertical: 10,
    marginVertical: 4,
  },
  netTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#064A91',
  },
  netTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0866C6',
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  paymentChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  paymentChipTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  generateBtn: {
    height: 50,
    backgroundColor: '#0866C6',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0866C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
