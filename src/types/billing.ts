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

export type PaymentTransactionStatus =
  | 'pending'
  | 'paid'
  | 'partially_paid'
  | 'failed'
  | 'refunded';

export type PaymentModuleType =
  | 'appointment'
  | 'opd'
  | 'laboratory'
  | 'radiology'
  | 'pharmacy'
  | 'admission'
  | 'invoice';

export interface PaymentTransaction {
  id: string; // e.g. "txn_..."
  patientId: string;
  patientName: string;
  patientMrn: string;
  module: PaymentModuleType;
  moduleId: string; // appointmentId, labOrderId, prescriptionId, admissionId, invoiceId
  invoiceId?: string;
  invoiceNumber?: string;
  amount: number;
  amountPaid: number;
  amountRefunded: number;
  currency: 'INR';
  status: PaymentTransactionStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  receiptNumber: string;
  paymentMethod?: string;
  failureReason?: string;
  refundReason?: string;
  refundedAt?: string;
  refundTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  notes?: Record<string, string>;
}

export interface PaymentAuditLog {
  id: string;
  transactionId: string;
  action: 'order_created' | 'payment_verified' | 'webhook_processed' | 'payment_failed' | 'refund_processed' | 'status_override';
  performedBy: string; // 'patient', 'system', 'webhook', 'staff:user-id'
  details: string;
  timestamp: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface RazorpayVerificationStatusData {
  status: RazorpayVerificationStatus;
}

export interface RazorpayBackendEndpointMetadata {
  orderEndpoint: '/api/v1/payments/razorpay/order';
  verifyEndpoint: '/api/v1/payments/razorpay/verify';
  webhookEndpoint: '/api/v1/webhooks/razorpay';
  refundEndpoint?: '/api/v1/payments/razorpay/refund';
  isLiveBackendEndpoint: boolean;
  integrationMode: 'live' | 'mock_placeholder';
  statusNote: string;
}

export interface CreateRazorpayOrderRequest {
  invoiceId?: string;
  module?: PaymentModuleType;
  moduleId?: string;
  patientId?: string;
  amount?: number; // Optional on client: server computes authoritative amount
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
  transactionId: string;
  module: PaymentModuleType;
  moduleId: string;
  invoiceId?: string;
  invoiceNumber?: string;
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
  transactionId?: string;
  invoiceId?: string;
  module?: PaymentModuleType;
  moduleId?: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyRazorpayPaymentResponse {
  verified: boolean;
  verificationStatus: RazorpayVerificationStatus;
  paymentId: string;
  orderId: string;
  transactionId: string;
  transaction: PaymentTransaction;
  invoiceId?: string;
  invoice?: InvoiceDetail;
  capturedOnServer: boolean;
  verifiedByServer: boolean;
  verifiedAt: string;
  message: string;
  backendMetadata: RazorpayBackendEndpointMetadata;
}

export interface ProcessRefundRequest {
  transactionId: string;
  amount?: number; // full or partial refund
  reason: string;
  staffUserId?: string;
}

export interface ProcessRefundResponse {
  success: boolean;
  refundId: string;
  transactionId: string;
  amountRefunded: number;
  status: PaymentTransactionStatus;
  transaction?: PaymentTransaction;
  message: string;
  timestamp: string;
}

export interface RazorpayWebhookPayload {
  event: 'payment.captured' | 'payment.failed' | 'order.paid' | 'refund.processed';
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
        notes?: Record<string, string>;
        error_code?: string;
        error_description?: string;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        amount_paid: number;
        status: string;
        receipt: string;
      };
    };
    refund?: {
      entity: {
        id: string;
        payment_id: string;
        amount: number;
        status: string;
      };
    };
  };
  created_at: number;
}
