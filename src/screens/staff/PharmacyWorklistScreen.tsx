import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Pill,
  Search,
  CheckCircle2,
  AlertTriangle,
  Package,
  Clock,
  X,
  ShoppingBag,
} from 'lucide-react-native';
import { StarHeader, StarLoader, EmptyState } from '../../components/common';
import { StaffKpiCard } from '../../components/staff/StaffKpiCard';
import { pharmacyService } from '../../services/pharmacyService';
import { prescriptionService } from '../../services/prescriptionService';
import type {
  MedicineStockItem,
  PharmacyWorklistItem,
} from '../../types/pharmacy';
import type { Prescription } from '../../types/prescription';

type PharmacyTab = 'worklist' | 'inventory';
type PayMethod = 'cash' | 'card' | 'online' | 'insurance';

const estimateRxQuantity = (frequency?: string, duration?: string): number => {
  const durStr = (duration || '').toLowerCase();
  const numMatch = durStr.match(/(\d+)/);
  let days = numMatch ? parseInt(numMatch[1], 10) : 5;
  if (durStr.includes('week')) days *= 7;
  else if (durStr.includes('month')) days *= 30;
  days = Math.max(1, Math.min(90, days));

  const freq = (frequency || '').toUpperCase();
  let dosesPerDay = 2;
  if (freq.includes('1-1-1-1') || freq.includes('QID')) dosesPerDay = 4;
  else if (freq.includes('1-1-1') || freq.includes('TID')) dosesPerDay = 3;
  else if (freq.includes('1-0-1') || freq.includes('BID')) dosesPerDay = 2;
  else if (
    freq.includes('1-0-0') ||
    freq.includes('0-0-1') ||
    freq.includes('0-1-0') ||
    freq.includes('OD')
  ) {
    dosesPerDay = 1;
  } else if (freq.includes('SOS') || freq.includes('PRN')) {
    return Math.max(1, Math.min(days * 2, 10));
  }

  return Math.max(1, Math.min(180, dosesPerDay * days));
};

export const PharmacyWorklistScreen: React.FC<{ navigation?: any }> = ({
  navigation,
}) => {
  const [activeTab, setActiveTab] = useState<PharmacyTab>('worklist');
  const [worklist, setWorklist] = useState<PharmacyWorklistItem[]>([]);
  const [inventory, setInventory] = useState<MedicineStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Dispense modal state
  const [dispenseItem, setDispenseItem] =
    useState<PharmacyWorklistItem | null>(null);
  const [linkedRx, setLinkedRx] = useState<Prescription | null>(null);
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>('cash');
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [dispensing, setDispensing] = useState(false);

  const loadPharmacyData = useCallback(async () => {
    try {
      const [rxQueue, stock] = await Promise.all([
        pharmacyService.getPharmacyWorklist(),
        pharmacyService.getMedicineInventory(),
      ]);
      setWorklist(rxQueue);
      setInventory(stock);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPharmacyData();
  }, [loadPharmacyData]);

  useFocusEffect(
    useCallback(() => {
      loadPharmacyData();
    }, [loadPharmacyData])
  );

  const metrics = useMemo(() => {
    const pendingRx = worklist.filter((w) => w.status === 'pending').length;
    const dispensedRx = worklist.filter((w) => w.status === 'dispensed').length;
    const lowStockCount = inventory.filter(
      (m) => m.availableQuantity <= m.reorderLevel
    ).length;
    return {
      pendingRx,
      dispensedRx,
      lowStockCount,
      totalCatalog: inventory.length,
    };
  }, [worklist, inventory]);

  const filteredWorklist = useMemo(() => {
    if (!searchQuery.trim()) return worklist;
    const q = searchQuery.toLowerCase();
    return worklist.filter(
      (item) =>
        item.prescriptionNumber.toLowerCase().includes(q) ||
        item.patientName.toLowerCase().includes(q) ||
        item.patientMrn.toLowerCase().includes(q) ||
        item.doctorName.toLowerCase().includes(q)
    );
  }, [worklist, searchQuery]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((m) => {
      if (lowStockOnly && m.availableQuantity > m.reorderLevel) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inventory, searchQuery, lowStockOnly]);

  const openDispenseModal = async (item: PharmacyWorklistItem) => {
    setDispenseItem(item);
    setDispenseNotes('');
    setQtyOverrides({});
    setLinkedRx(null);
    try {
      const rxs = await prescriptionService.getPrescriptions(item.patientId);
      const found =
        rxs.find((r) => r.id === item.prescriptionId) || rxs[0] || null;
      setLinkedRx(found);
    } catch {
      setLinkedRx(null);
    }
  };

  const dispenseLines = useMemo(() => {
    if (linkedRx && linkedRx.items.length > 0) {
      return linkedRx.items.map((rxItem, idx) => {
        const rxNameLower = rxItem.medicineName.toLowerCase();
        const firstToken = rxNameLower.split(' ')[0];
        const stockMatch =
          inventory.find((m) => m.id === rxItem.medicineId) ||
          inventory.find((m) => m.name.toLowerCase() === rxNameLower) ||
          inventory.find((m) =>
            m.name.toLowerCase().includes(rxNameLower) ||
            rxNameLower.includes(m.name.toLowerCase()) ||
            (firstToken.length >= 4 && m.name.toLowerCase().includes(firstToken))
          );
        const rowKey = `${rxItem.id || idx}-${stockMatch?.id || rxItem.medicineName}`;
        const computedQty = estimateRxQuantity(rxItem.frequency, rxItem.duration);
        const qty = qtyOverrides[rowKey] ?? computedQty;
        const unitPrice = stockMatch?.unitPrice ?? 0;
        return {
          rowKey,
          inCatalog: Boolean(stockMatch),
          medicineId: stockMatch?.id || rxItem.medicineId || `unmapped-${idx}`,
          name: rxItem.medicineName,
          dosageInfo: `${rxItem.dosage} | ${rxItem.frequency} | ${rxItem.duration}`,
          quantity: qty,
          unitPrice,
          availableQuantity: stockMatch?.availableQuantity ?? 0,
        };
      });
    }
    const fallbackMeds = inventory.slice(0, 2);
    return fallbackMeds.map((m, idx) => {
      const rowKey = `fallback-${m.id}-${idx}`;
      return {
        rowKey,
        inCatalog: true,
        medicineId: m.id,
        name: m.name,
        dosageInfo: m.genericName,
        quantity: qtyOverrides[rowKey] ?? 10,
        unitPrice: m.unitPrice,
        availableQuantity: m.availableQuantity,
      };
    });
  }, [linkedRx, inventory, qtyOverrides]);

  const estimatedTotal = useMemo(
    () =>
      dispenseLines
        .filter((l) => l.inCatalog)
        .reduce((sum, l) => sum + l.quantity * l.unitPrice, 0),
    [dispenseLines]
  );

  const adjustLineQty = (rowKey: string, currentQty: number, delta: number) => {
    const next = Math.max(1, currentQty + delta);
    setQtyOverrides((prev) => ({ ...prev, [rowKey]: next }));
  };

  const handleConfirmDispense = async () => {
    if (!dispenseItem) return;
    const catalogLines = dispenseLines.filter((l) => l.inCatalog && l.quantity > 0);
    if (catalogLines.length === 0) {
      Alert.alert(
        'Not in Inventory',
        'None of the prescribed medicines match hospital pharmacy stock.'
      );
      return;
    }
    const overStock = catalogLines.find((l) => l.quantity > l.availableQuantity);
    if (overStock) {
      Alert.alert(
        'Insufficient Stock',
        `${overStock.name} only has ${overStock.availableQuantity} units available (requested ${overStock.quantity}). Reduce quantity before dispensing.`
      );
      return;
    }

    setDispensing(true);
    try {
      const sale = await pharmacyService.dispensePrescription({
        prescriptionId: dispenseItem.prescriptionId,
        patientId: dispenseItem.patientId,
        items: catalogLines.map((l) => ({
          medicineId: l.medicineId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        paymentMethod,
        notes: dispenseNotes.trim() || undefined,
      });
      setDispenseItem(null);
      await loadPharmacyData();
      Alert.alert(
        'Medicines Dispensed',
        `${dispenseItem.prescriptionNumber} dispensed to ${dispenseItem.patientName}. Total: Rs. ${sale.totalAmount.toLocaleString()} (${paymentMethod.toUpperCase()}). Stock levels updated.`
      );
    } catch {
      Alert.alert(
        'Dispense Failed',
        'Could not process prescription dispensing.'
      );
    } finally {
      setDispensing(false);
    }
  };

  if (loading && worklist.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <StarHeader
          title="Pharmacy & Dispensing"
          onBackPress={
            navigation?.canGoBack?.() ? () => navigation.goBack() : undefined
          }
        />
        <StarLoader message="Loading pharmacy worklist & inventory..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <StarHeader
        title="Pharmacy Workspace"
        subtitle={`${metrics.pendingRx} Rx awaiting dispense`}
        onBackPress={
          navigation?.canGoBack?.() ? () => navigation.goBack() : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPharmacyData();
            }}
            tintColor="#0866C6"
          />
        }
      >
        {/* Pharmacy Dashboard Metrics */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Pending Rx"
              value={metrics.pendingRx}
              icon={Clock}
              theme="orange"
            />
          </View>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Dispensed"
              value={metrics.dispensedRx}
              icon={CheckCircle2}
              theme="green"
            />
          </View>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Low Stock Alerts"
              value={metrics.lowStockCount}
              icon={AlertTriangle}
              theme="purple"
              onPress={() => {
                setActiveTab('inventory');
                setLowStockOnly(true);
              }}
            />
          </View>
          <View style={styles.kpiCell}>
            <StaffKpiCard
              label="Catalog Items"
              value={metrics.totalCatalog}
              icon={Package}
              theme="blue"
              onPress={() => {
                setActiveTab('inventory');
                setLowStockOnly(false);
              }}
            />
          </View>
        </View>

        {/* Segmented Mode Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'worklist' && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab('worklist')}
          >
            <ShoppingBag
              size={16}
              color={activeTab === 'worklist' ? '#FFFFFF' : '#475569'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'worklist' && styles.tabTextActive,
              ]}
            >
              Prescription Worklist
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'inventory' && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab('inventory')}
          >
            <Pill
              size={16}
              color={activeTab === 'inventory' ? '#FFFFFF' : '#475569'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'inventory' && styles.tabTextActive,
              ]}
            >
              Medicine Inventory
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'worklist'
                ? 'Search Rx #, patient name, MRN, or doctor...'
                : 'Search medicine brand, generic, or category...'
            }
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {activeTab === 'inventory' ? (
          <View style={styles.invControls}>
            <TouchableOpacity
              style={[
                styles.lowStockPill,
                lowStockOnly && styles.lowStockPillActive,
              ]}
              onPress={() => setLowStockOnly((v) => !v)}
            >
              <AlertTriangle
                size={14}
                color={lowStockOnly ? '#FFFFFF' : '#D97706'}
              />
              <Text
                style={[
                  styles.lowStockPillText,
                  lowStockOnly && { color: '#FFFFFF' },
                ]}
              >
                Low Stock Only ({metrics.lowStockCount})
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Content List */}
        {activeTab === 'worklist' ? (
          filteredWorklist.length === 0 ? (
            <EmptyState
              title="No prescriptions in worklist"
              description="Issued electronic prescriptions from OPD doctors appear here."
            />
          ) : (
            filteredWorklist.map((item) => {
              const isDispensed = item.status === 'dispensed';
              return (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.rxIconBox}>
                      <Pill size={18} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rxNum}>
                        {item.prescriptionNumber}
                      </Text>
                      <Text style={styles.rxPatient}>
                        {item.patientName} ({item.patientMrn})
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: isDispensed ? '#DCFCE7' : '#FEF3C7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: isDispensed ? '#166534' : '#92400E' },
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rxMetaRow}>
                    <Text style={styles.rxMeta}>Prescriber: {item.doctorName}</Text>
                    <Text style={styles.rxMeta}>
                      {item.itemCount} item(s) | {item.date}
                    </Text>
                  </View>

                  {!isDispensed ? (
                    <TouchableOpacity
                      style={styles.dispenseBtn}
                      onPress={() => openDispenseModal(item)}
                    >
                      <ShoppingBag size={15} color="#FFFFFF" />
                      <Text style={styles.dispenseBtnText}>
                        Verify &amp; Dispense Medicines
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.dispensedFooter}>
                      <CheckCircle2 size={14} color="#16A34A" />
                      <Text style={styles.dispensedFooterText}>
                        Dispensed{' '}
                        {item.totalAmount
                          ? `| Billed Rs. ${item.totalAmount.toLocaleString()}`
                          : ''}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })
          )
        ) : filteredInventory.length === 0 ? (
          <EmptyState
            title="No medicines found"
            description="Try clearing search or low-stock filter."
          />
        ) : (
          filteredInventory.map((med) => {
            const isLow = med.availableQuantity <= med.reorderLevel;
            return (
              <View key={med.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rxNum}>{med.name}</Text>
                    <Text style={styles.medGeneric}>
                      {med.genericName} | {med.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: isLow ? '#FEE2E2' : '#DCFCE7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: isLow ? '#B91C1C' : '#166534' },
                      ]}
                    >
                      {med.availableQuantity} {med.unit}
                    </Text>
                  </View>
                </View>

                <View style={styles.medDetailsRow}>
                  <Text style={styles.medMeta}>
                    Unit Price: Rs. {med.unitPrice}
                  </Text>
                  <Text style={styles.medMeta}>
                    Batch: {med.batchNumber || 'N/A'} | Exp: {med.expiryDate}
                  </Text>
                  <Text style={styles.medMeta}>
                    Shelf: {med.location || 'Main Rack'} | Reorder:{' '}
                    {med.reorderLevel}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Medicine Dispensing Modal */}
      <Modal
        visible={!!dispenseItem}
        animationType="slide"
        transparent
        onRequestClose={() => setDispenseItem(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Dispense {dispenseItem?.prescriptionNumber}
              </Text>
              <TouchableOpacity onPress={() => setDispenseItem(null)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalPatient}>
                Patient: {dispenseItem?.patientName} ({dispenseItem?.patientMrn}
                )
              </Text>
              <Text style={styles.modalDoctor}>
                Ordered by {dispenseItem?.doctorName}
              </Text>

              <Text style={styles.modalSubLabel}>Items to Dispense</Text>
              {dispenseLines.map((line) => {
                const insufficient =
                  line.inCatalog && line.quantity > line.availableQuantity;
                return (
                  <View key={line.rowKey} style={styles.dispenseLineCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dispenseLineName}>{line.name}</Text>
                      <Text style={styles.dispenseLineDosage}>
                        {line.dosageInfo}
                      </Text>
                      {!line.inCatalog ? (
                        <Text style={styles.dispenseLineError}>
                          Not stocked in hospital pharmacy (external Rx)
                        </Text>
                      ) : (
                        <Text
                          style={[
                            styles.dispenseLineStock,
                            insufficient && styles.dispenseLineError,
                          ]}
                        >
                          Stock: {line.availableQuantity} units
                          {insufficient ? ' (Insufficient)' : ''}
                        </Text>
                      )}
                    </View>
                    {line.inCatalog ? (
                      <View style={styles.qtyControlWrap}>
                        <View style={styles.qtyRow}>
                          <TouchableOpacity
                            style={styles.qtyStepBtn}
                            onPress={() =>
                              adjustLineQty(line.rowKey, line.quantity, -1)
                            }
                          >
                            <Text style={styles.qtyStepText}>-</Text>
                          </TouchableOpacity>
                          <Text style={styles.qtyCount}>{line.quantity}</Text>
                          <TouchableOpacity
                            style={styles.qtyStepBtn}
                            onPress={() =>
                              adjustLineQty(line.rowKey, line.quantity, 1)
                            }
                          >
                            <Text style={styles.qtyStepText}>+</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.dispenseLinePrice}>
                          Rs. {(line.quantity * line.unitPrice).toLocaleString()}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Dispense Charge</Text>
                <Text style={styles.totalVal}>
                  Rs. {estimatedTotal.toLocaleString()}
                </Text>
              </View>

              <Text style={styles.modalSubLabel}>Payment Method</Text>
              <View style={styles.methodRow}>
                {(['cash', 'card', 'online', 'insurance'] as const).map(
                  (m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.methodChip,
                        paymentMethod === m && styles.methodChipActive,
                      ]}
                      onPress={() => setPaymentMethod(m)}
                    >
                      <Text
                        style={[
                          styles.methodChipText,
                          paymentMethod === m && styles.methodChipTextActive,
                        ]}
                      >
                        {m.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <TextInput
                style={styles.notesInput}
                placeholder="Counseling notes (e.g. Take after meals, complete course)..."
                placeholderTextColor="#94A3B8"
                value={dispenseNotes}
                onChangeText={setDispenseNotes}
              />

              <TouchableOpacity
                style={[styles.confirmBtn, dispensing && { opacity: 0.7 }]}
                disabled={dispensing}
                onPress={handleConfirmDispense}
              >
                <CheckCircle2 size={17} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>
                  {dispensing
                    ? 'Processing Dispense...'
                    : 'Confirm Dispense & Deduct Stock'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
    paddingBottom: 34,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCell: {
    width: '48%',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#0866C6',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  invControls: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  lowStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lowStockPillActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  lowStockPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
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
    gap: 10,
  },
  rxIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#142D4E',
  },
  rxPatient: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginTop: 1,
  },
  medGeneric: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rxMetaRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rxMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  dispenseBtn: {
    marginTop: 12,
    backgroundColor: '#0866C6',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  dispenseBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  dispensedFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dispensedFooterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  medDetailsRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 2,
  },
  medMeta: {
    fontSize: 12,
    color: '#475569',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#142D4E',
  },
  modalPatient: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  modalDoctor: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  modalSubLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 6,
  },
  dispenseLineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 10,
  },
  dispenseLineName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#142D4E',
  },
  dispenseLineDosage: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  dispenseLineStock: {
    fontSize: 11,
    color: '#0866C6',
    fontWeight: '600',
    marginTop: 2,
  },
  dispenseLinePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#142D4E',
    marginTop: 4,
    textAlign: 'right',
  },
  dispenseLineError: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '700',
    marginTop: 2,
  },
  qtyControlWrap: {
    alignItems: 'flex-end',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyStepText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#142D4E',
  },
  qtyCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#142D4E',
    minWidth: 22,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0866C6',
  },
  methodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  methodChipActive: {
    backgroundColor: '#0866C6',
    borderColor: '#0866C6',
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  methodChipTextActive: {
    color: '#FFFFFF',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
    marginBottom: 12,
  },
  confirmBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default PharmacyWorklistScreen;
