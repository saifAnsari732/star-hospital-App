import apiClient, { withMockFallback } from './apiClient';
import {
  PharmacyWorklistItem,
  DispensePrescriptionRequest,
  PharmacySaleItem,
  MedicineStockItem,
} from '../types/pharmacy';
import { mockPrescriptions } from '../fixtures/mockPrescriptions';
import { mockMedicines } from '../fixtures/mockMedicines';

export const pharmacyService = {
  /**
   * Get pharmacy worklist of pending prescriptions for dispensing
   */
  async getPharmacyWorklist(): Promise<PharmacyWorklistItem[]> {
    return withMockFallback(
      () =>
        apiClient.get<PharmacyWorklistItem[]>('/api/v1/pharmacy/worklist'),
      () => {
        return mockPrescriptions.map((rx) => ({
          id: `pwl-${rx.id}`,
          prescriptionId: rx.id,
          prescriptionNumber: rx.prescriptionNumber,
          patientId: rx.patientId,
          patientName: rx.patientName,
          patientMrn: rx.patientMrn || 'P-00102',
          doctorName: rx.doctorName,
          date: rx.date,
          itemCount: rx.items.length,
          status: rx.status === 'issued' ? 'pending' : 'dispensed',
          totalAmount: rx.items.length * 120,
        }));
      }
    );
  },

  /**
   * Dispense medicines and atomically decrement inventory stock
   */
  async dispensePrescription(
    req: DispensePrescriptionRequest
  ): Promise<PharmacySaleItem> {
    return withMockFallback(
      () =>
        apiClient.post<PharmacySaleItem>(
          '/api/v1/pharmacy/dispense',
          req
        ),
      () => {
        const rx =
          mockPrescriptions.find((p) => p.id === req.prescriptionId) ||
          mockPrescriptions[0];

        rx.status = 'dispensed';

        let totalAmount = 0;
        const saleItems = req.items.map((item) => {
          const med = mockMedicines.find((m) => m.id === item.medicineId);
          if (med) {
            med.availableQuantity = Math.max(0, med.availableQuantity - item.quantity);
          }
          const itemTotal = item.quantity * item.unitPrice;
          totalAmount += itemTotal;
          return {
            medicineId: item.medicineId,
            medicineName: med?.name || 'Dispensed Medicine',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: itemTotal,
          };
        });

        const saleReceipt: PharmacySaleItem = {
          id: `sale-${Date.now()}`,
          prescriptionId: req.prescriptionId,
          patientId: req.patientId,
          patientName: rx.patientName,
          dispensedBy: 'Dr. Noman Arshad (Pharmacist)',
          date: new Date().toISOString(),
          items: saleItems,
          totalAmount,
          paymentMethod: req.paymentMethod,
        };

        return saleReceipt;
      }
    );
  },

  /**
   * Get pharmacy medicine stock inventory
   */
  async getMedicineInventory(search?: string): Promise<MedicineStockItem[]> {
    return withMockFallback(
      () =>
        apiClient.get<MedicineStockItem[]>('/api/v1/pharmacy/inventory', {
          params: { search },
        } as any),
      () => {
        if (!search) return mockMedicines;
        const q = search.toLowerCase();
        return mockMedicines.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.genericName.toLowerCase().includes(q) ||
            m.category.toLowerCase().includes(q)
        );
      }
    );
  },

  /**
   * Get medicine stock item by ID
   */
  async getMedicineById(medicineId: string): Promise<MedicineStockItem> {
    return withMockFallback(
      () =>
        apiClient.get<MedicineStockItem>(
          `/api/v1/pharmacy/inventory/${medicineId}`
        ),
      () => {
        const found = mockMedicines.find((m) => m.id === medicineId);
        return found || mockMedicines[0];
      }
    );
  },
};

export default pharmacyService;
