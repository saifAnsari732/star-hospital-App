import apiClient, { withMockFallback } from './apiClient';
import {
  InvoiceDetail,
  CreateInvoiceRequest,
  RecordPaymentRequest,
} from '../types/billing';
import { mockInvoices } from '../fixtures/mockInvoices';
import { mockPatients } from '../fixtures/mockPatients';

export const billingService = {
  /**
   * Get all invoices for a patient or overall hospital billing
   */
  async getInvoices(patientId?: string): Promise<InvoiceDetail[]> {
    return withMockFallback(
      () =>
        apiClient.get<InvoiceDetail[]>('/api/v1/billing/invoices', {
          params: { patientId },
        } as any),
      () => {
        if (!patientId) return mockInvoices;
        return mockInvoices.filter((inv) => inv.patientId === patientId);
      }
    );
  },

  /**
   * Get single invoice breakdown and payment history
   */
  async getInvoiceById(invoiceId: string): Promise<InvoiceDetail> {
    return withMockFallback(
      () =>
        apiClient.get<InvoiceDetail>(`/api/v1/billing/invoices/${invoiceId}`),
      () => {
        const found = mockInvoices.find(
          (inv) => inv.id === invoiceId || inv.invoiceNumber === invoiceId
        );
        return found || mockInvoices[0];
      }
    );
  },

  /**
   * Generate a new itemized hospital invoice
   */
  async createInvoice(req: CreateInvoiceRequest): Promise<InvoiceDetail> {
    return withMockFallback(
      () =>
        apiClient.post<InvoiceDetail>('/api/v1/billing/invoices', req),
      () => {
        const pat =
          mockPatients.find((p) => p.id === req.patientId) || mockPatients[0];

        let grossTotal = 0;
        const items = req.items.map((item, idx) => {
          const total = item.quantity * item.unitPrice;
          grossTotal += total;
          return {
            id: `ii-${Date.now()}-${idx}`,
            description: item.description,
            category: item.category || 'General Service',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total,
          };
        });

        const discount = req.discount || 0;
        const netTotal = Math.max(0, grossTotal - discount);
        const nextNum = mockInvoices.length + 10031;

        const newInvoice: InvoiceDetail = {
          id: `inv-${Date.now()}`,
          invoiceNumber: `INV-${nextNum}`,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          patientId: pat.id,
          patientName: pat.name,
          patientMrn: pat.mrn,
          careSetting: req.careSetting,
          grossTotal,
          discount,
          netTotal,
          amountReceived: 0,
          balanceDue: netTotal,
          status: 'unpaid',
          items,
          payments: [],
        };

        mockInvoices.unshift(newInvoice);
        return newInvoice;
      }
    );
  },

  /**
   * Record payment against an invoice (Cashier / Online Gateway)
   */
  async recordPayment(req: RecordPaymentRequest): Promise<InvoiceDetail> {
    return withMockFallback(
      () =>
        apiClient.post<InvoiceDetail>(
          `/api/v1/billing/invoices/${req.invoiceId}/payments`,
          req
        ),
      () => {
        const invoice =
          mockInvoices.find((inv) => inv.id === req.invoiceId) ||
          mockInvoices[0];

        invoice.payments.push({
          id: `pay-${Date.now()}`,
          date: new Date().toISOString(),
          amount: req.amount,
          method: req.method,
          transactionRef: req.transactionRef || `TXN-${Date.now()}`,
          receivedBy: 'Hamza Tariq (Cashier)',
        });

        invoice.amountReceived += req.amount;
        invoice.balanceDue = Math.max(0, invoice.netTotal - invoice.amountReceived);

        if (invoice.balanceDue <= 0) {
          invoice.status = 'paid';
        } else if (invoice.amountReceived > 0) {
          invoice.status = 'partial';
        }

        return { ...invoice };
      }
    );
  },
};

export default billingService;
