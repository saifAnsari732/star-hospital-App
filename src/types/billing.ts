export type InvoiceStatus = 'paid' | 'partial' | 'unpaid';

export interface InvoiceItem {
  id: string;
  description: string;
  category?: string; // e.g. "Consultation", "Pharmacy", "Laboratory", "Room Charge"
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: 'cash' | 'card' | 'online' | 'insurance';
  transactionRef?: string;
  receivedBy?: string;
}

export interface InvoiceDetail {
  id: string;
  invoiceNumber: string; // e.g. "INV-10023"
  date: string;
  dueDate?: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId?: string;
  doctorName?: string;
  department?: string;
  careSetting: 'opd' | 'ipd' | 'emergency';
  grossTotal: number;
  discount: number;
  netTotal: number;
  amountReceived: number;
  balanceDue: number;
  status: InvoiceStatus;
  items: InvoiceItem[];
  payments: InvoicePayment[];
}

export type Invoice = InvoiceDetail;

export interface CreateInvoiceRequest {
  patientId: string;
  doctorId?: string;
  careSetting: 'opd' | 'ipd' | 'emergency';
  items: Array<{
    description: string;
    category?: string;
    quantity: number;
    unitPrice: number;
  }>;
  discount?: number;
}

export interface RecordPaymentRequest {
  invoiceId: string;
  amount: number;
  method: 'cash' | 'card' | 'online' | 'insurance';
  transactionRef?: string;
}

export type RazorpayVerificationStatus =
  | 'pending_verification'
  | 'verified'
  | 'failed'
  | 'mock_verified';

export interface RazorpayBackendEndpointMetadata {
  orderEndpoint: '/api/v1/payments/razorpay/order';
  verifyEndpoint: '/api/v1/payments/razorpay/verify';
  webhookEndpoint: '/api/v1/webhooks/razorpay';
  isLiveBackendEndpoint: boolean;
  integrationMode: 'live' | 'mock_placeholder';
  statusNote: string;
}

export interface CreateRazorpayOrderRequest {
  invoiceId: string;
  amount?: number;
  currency?: 'INR';
  notes?: Record<string, string>;
}

export interface RazorpayOrderPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  amountInPaise: number;
  currency: 'INR';
  receipt: string;
  keyId: string;
  merchantName: string;
  themeColor: string;
  status: 'created' | 'attempted' | 'paid';
  prefill?: RazorpayOrderPrefill;
  notes?: Record<string, string>;
  backendMetadata: RazorpayBackendEndpointMetadata;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: 'INR';
  name: string;
  description: string;
  order_id: string;
  prefill?: RazorpayOrderPrefill;
  theme: {
    color: string;
  };
  notes?: Record<string, string>;
}

export interface RazorpayCheckoutSuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  isMockCheckout?: boolean;
}

export interface VerifyRazorpayPaymentRequest {
  invoiceId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyRazorpayPaymentResponse {
  verified: boolean;
  verificationStatus: RazorpayVerificationStatus;
  paymentId: string;
  orderId: string;
  invoiceId: string;
  invoice?: InvoiceDetail;
  capturedOnServer: boolean;
  verifiedByServer: boolean;
  verifiedAt: string;
  message: string;
  backendMetadata: RazorpayBackendEndpointMetadata;
}
