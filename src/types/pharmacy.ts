export interface MedicineStockItem {
  id: string;
  name: string; // Brand Name e.g. "Amoxicillin 500mg"
  genericName: string; // e.g. "Amoxicillin Trihydrate"
  category: string; // e.g. "Antibiotic", "Analgesic", "Antihypertensive"
  availableQuantity: number;
  unit: string; // e.g. "tablets", "capsules", "bottles"
  unitPrice: number; // in currency units
  reorderLevel: number;
  expiryDate: string;
  manufacturer?: string;
  batchNumber?: string;
  location?: string; // Shelf location e.g. "A-12"
}

export interface PharmacyWorklistItem {
  id: string;
  prescriptionId: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorName: string;
  date: string;
  itemCount: number;
  status: 'pending' | 'dispensed' | 'partially_dispensed';
  totalAmount?: number;
}

export interface DispensePrescriptionRequest {
  prescriptionId: string;
  patientId: string;
  items: Array<{
    medicineId: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: 'cash' | 'card' | 'insurance' | 'online';
  notes?: string;
}

export interface PharmacySaleItem {
  id: string;
  prescriptionId: string;
  patientId: string;
  patientName: string;
  dispensedBy: string;
  date: string;
  items: Array<{
    medicineId: string;
    medicineName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'insurance' | 'online';
}
