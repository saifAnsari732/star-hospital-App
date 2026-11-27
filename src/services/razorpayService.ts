import apiClient, { isMockFallbackEnabled, withMockFallback } from './apiClient';
import {
  getRazorpayRuntimeConfig,
  isPlaceholderRazorpayKey,
  isRazorpayKeyConfigured,
  RAZORPAY_CURRENCY,
  RAZORPAY_DESCRIPTION,
  RAZORPAY_MERCHANT_NAME,
  RAZORPAY_THEME_COLOR,
  type RazorpayConfig,
} from '../config/razorpay';
import type {
  CreateRazorpayOrderRequest,
  InvoiceDetail,
  RazorpayBackendEndpointMetadata,
  RazorpayCheckoutOptions,
  RazorpayCheckoutSuccessPayload,
  RazorpayOrderPrefill,
  RazorpayOrderResponse,
  VerifyRazorpayPaymentRequest,
  VerifyRazorpayPaymentResponse,
  PaymentTransaction,
  PaymentAuditLog,
  ProcessRefundRequest,
  ProcessRefundResponse,
  RazorpayWebhookPayload,
} from '../types/billing';
import { mockInvoices } from '../fixtures/mockInvoices';
import { mockPaymentTransactions, mockPaymentAuditLogs } from '../fixtures/mockPaymentTransactions';
import { secureLogger } from '../utils/logger';

export const RAZORPAY_ENDPOINTS = {
  ORDER: '/api/v1/payments/razorpay/order',
  VERIFY: '/api/v1/payments/razorpay/verify',
  WEBHOOK: '/api/v1/webhooks/razorpay',
  REFUND: '/api/v1/payments/razorpay/refund',
  TRANSACTIONS: '/api/v1/payments/transactions',
  AUDIT_LOGS: '/api/v1/payments/audit-logs',
} as const;

export interface NativeRazorpayCheckoutBridge {
  open: (options: RazorpayCheckoutOptions) => Promise<RazorpayCheckoutSuccessPayload>;
}

export interface RazorpayIntegrationStatus {
  isConfigured: boolean;
  mode: RazorpayConfig['mode'];
  currency: typeof RAZORPAY_CURRENCY;
  merchantName: typeof RAZORPAY_MERCHANT_NAME;
  themeColor: typeof RAZORPAY_THEME_COLOR;
  hasNativeCheckoutBridge: boolean;
  isMockFallbackEnabled: boolean;
  backendMetadata: RazorpayBackendEndpointMetadata;
}

const getPlaceholderBackendMetadata = (
  customNote?: string
): RazorpayBackendEndpointMetadata => ({
  orderEndpoint: RAZORPAY_ENDPOINTS.ORDER,
  verifyEndpoint: RAZORPAY_ENDPOINTS.VERIFY,
  webhookEndpoint: RAZORPAY_ENDPOINTS.WEBHOOK,
  isLiveBackendEndpoint: false,
  integrationMode: 'mock_placeholder',
  statusNote:
    customNote ||
    'Mock integration placeholder active. Deploy ICTHospital Laravel endpoints (/api/v1/payments/razorpay/order, /api/v1/payments/razorpay/verify, /api/v1/webhooks/razorpay) for live server-verified capture.',
});

const getLiveBackendMetadata = (): RazorpayBackendEndpointMetadata => ({
  orderEndpoint: RAZORPAY_ENDPOINTS.ORDER,
  verifyEndpoint: RAZORPAY_ENDPOINTS.VERIFY,
  webhookEndpoint: RAZORPAY_ENDPOINTS.WEBHOOK,
  isLiveBackendEndpoint: true,
  integrationMode: 'live',
  statusNote:
    'Connected to live ICTHospital Laravel Razorpay endpoints for server-side order creation and HMAC verification.',
});

const getNativeRazorpayBridge = (): NativeRazorpayCheckoutBridge | null => {
  try {
    const globalObj = globalThis as Record<string, unknown>;
    const bridge = globalObj.__STAR_RAZORPAY_CHECKOUT__ as
      | NativeRazorpayCheckoutBridge
      | (() => NativeRazorpayCheckoutBridge | null)
      | undefined;
    if (typeof bridge === 'function') {
      const resolved = bridge();
      return resolved && typeof resolved.open === 'function' ? resolved : null;
    }
    if (bridge && typeof bridge.open === 'function') {
      return bridge;
    }
    return null;
  } catch {
    return null;
  }
};

const createEndpointError = (
  endpoint: string,
  err: unknown
): Error & {
  statusCode?: number;
  backendMetadata?: RazorpayBackendEndpointMetadata;
} => {
  const apiErr = err as { message?: string; statusCode?: number };
  const status = apiErr?.statusCode;
  const isNotDeployed = status === 404 || status === 501 || status === 405;
  const message = isNotDeployed
    ? `ICTHospital Laravel Razorpay endpoint (${endpoint}) is not deployed yet (HTTP ${status}). Payment cannot proceed without server-side verification.`
    : apiErr?.message || `Razorpay backend request to ${endpoint} failed.`;
  const wrapped = new Error(message) as Error & {
    statusCode?: number;
    backendMetadata?: RazorpayBackendEndpointMetadata;
  };
  wrapped.statusCode = status;
  wrapped.backendMetadata = isNotDeployed
    ? getPlaceholderBackendMetadata(message)
    : status && status >= 400
      ? { ...getLiveBackendMetadata(), statusNote: message }
      : getPlaceholderBackendMetadata(message);
  return wrapped;
};

const isInvalidSignatureInput = (signature: string): boolean => {
  const trimmed = signature.trim();
  if (trimmed.length < 8) return true;
  const lower = trimmed.toLowerCase();
  return lower.includes('invalid') || lower.includes('tamper') || lower === 'fake';
};

interface MockOrderRecord {
  invoiceId: string;
  amount: number;
  status: 'created' | 'paid';
  paymentId?: string;
}

const mockOrderLedger = new Map<string, MockOrderRecord>();
let mockSequence = 0;

const nextMockTokenSuffix = (): string => {
  mockSequence += 1;
  return `${Date.now()}_${mockSequence}`;
};

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

const findInvoiceOrThrow = (invoiceId: string): InvoiceDetail => {
  const trimmed = invoiceId.trim();
  const invoice = mockInvoices.find(
    (inv) => inv.id === trimmed || inv.invoiceNumber === trimmed
  );
  if (!invoice) {
    throw new Error(`Invoice ${trimmed} not found.`);
  }
  return invoice;
};

const normalizeLiveOrderResponse = (
  responseData: RazorpayOrderResponse,
  config: RazorpayConfig
): RazorpayOrderResponse => {
  if (!responseData || typeof responseData !== 'object') {
    throw new Error('Backend returned an invalid Razorpay order payload.');
  }
  const resolvedKey = (responseData.keyId || config.keyId || '').trim();
  if (
    !responseData.orderId ||
    !Number.isInteger(responseData.amountInPaise) ||
    responseData.amountInPaise <= 0
  ) {
    throw new Error('Backend returned an invalid Razorpay order payload.');
  }
  if (!resolvedKey || isPlaceholderRazorpayKey(resolvedKey)) {
    throw new Error(
      'Razorpay public Key ID (EXPO_PUBLIC_RAZORPAY_KEY_ID) is not configured or is still a placeholder.'
    );
  }
  if (responseData.currency && responseData.currency !== RAZORPAY_CURRENCY) {
    throw new Error(
      `Unsupported Razorpay currency "${responseData.currency}". Only ${RAZORPAY_CURRENCY} is supported.`
    );
  }

  return {
    ...responseData,
    keyId: resolvedKey,
    currency: responseData.currency || RAZORPAY_CURRENCY,
    merchantName: responseData.merchantName || RAZORPAY_MERCHANT_NAME,
    themeColor: responseData.themeColor || RAZORPAY_THEME_COLOR,
    backendMetadata: responseData.backendMetadata || getLiveBackendMetadata(),
  };
};

const normalizeLiveVerifyResponse = (
  verifiedRes: VerifyRazorpayPaymentResponse
): VerifyRazorpayPaymentResponse => {
  if (!verifiedRes || typeof verifiedRes !== 'object') {
    throw new Error(
      'Backend returned an invalid Razorpay verification payload. Capture is not trusted.'
    );
  }
  if (verifiedRes.verified !== true) {
    throw new Error(
      verifiedRes.message ||
        'Backend rejected Razorpay payment signature verification. Capture is not trusted.'
    );
  }

  return {
    ...verifiedRes,
    verified: true,
    verificationStatus: verifiedRes.verificationStatus || 'verified',
    verifiedByServer: verifiedRes.verifiedByServer ?? true,
    capturedOnServer: verifiedRes.capturedOnServer ?? true,
    backendMetadata: verifiedRes.backendMetadata || getLiveBackendMetadata(),
  };
};

export const razorpayService = {
  getConfig(): RazorpayConfig {
    return getRazorpayRuntimeConfig();
  },

  getIntegrationStatus(): RazorpayIntegrationStatus {
    const config = getRazorpayRuntimeConfig();
    return {
      isConfigured: config.isConfigured,
      mode: config.mode,
      currency: config.currency,
      merchantName: config.merchantName,
      themeColor: config.themeColor,
      hasNativeCheckoutBridge: Boolean(getNativeRazorpayBridge()),
      isMockFallbackEnabled,
      backendMetadata: isMockFallbackEnabled
        ? getPlaceholderBackendMetadata()
        : getLiveBackendMetadata(),
    };
  },

  /**
   * Step 1: Request server-created Razorpay Order from ICTHospital Laravel backend.
   * Never creates orders directly against Razorpay REST API from the mobile client.
   */
  async createOrder(
    req: CreateRazorpayOrderRequest
  ): Promise<RazorpayOrderResponse> {
    const invoiceId = req?.invoiceId?.trim();
    const module = req?.module || (invoiceId ? 'invoice' : undefined);
    const moduleId = req?.moduleId?.trim() || invoiceId;
    if (!invoiceId && !moduleId) {
      throw new Error('A valid invoiceId or (module and moduleId) is required to create a Razorpay order.');
    }

    if (
      req.amount !== undefined &&
      (!Number.isFinite(req.amount) || req.amount <= 0)
    ) {
      throw new Error('Payment order amount must be a positive number.');
    }

    const config = getRazorpayRuntimeConfig();
    const requestBody: CreateRazorpayOrderRequest = {
      invoiceId,
      ...(req.amount !== undefined ? { amount: req.amount } : {}),
      currency: RAZORPAY_CURRENCY,
      ...(req.notes ? { notes: req.notes } : {}),
    };

    if (!isMockFallbackEnabled) {
      let responseData: RazorpayOrderResponse;
      try {
        responseData = await withMockFallback<RazorpayOrderResponse>(
          () =>
            apiClient.post<RazorpayOrderResponse>(
              RAZORPAY_ENDPOINTS.ORDER,
              requestBody
            ),
          () => {
            throw new Error('Mock fallback is disabled in live mode.');
          }
        );
      } catch (err) {
        throw createEndpointError(RAZORPAY_ENDPOINTS.ORDER, err);
      }

      const resolvedKey = (responseData.keyId || config.keyId || '').trim();
      if (!responseData.orderId || !Number.isInteger(responseData.amountInPaise) || responseData.amountInPaise <= 0) {
        throw new Error(
          'Backend returned an invalid Razorpay order payload.'
        );
      }
      if (!resolvedKey || isPlaceholderRazorpayKey(resolvedKey)) {
        throw new Error(
          'Razorpay public Key ID (EXPO_PUBLIC_RAZORPAY_KEY_ID) is not configured or is still a placeholder.'
        );
      }

      return {
        ...responseData,
        keyId: resolvedKey,
        currency: responseData.currency || RAZORPAY_CURRENCY,
        merchantName: responseData.merchantName || RAZORPAY_MERCHANT_NAME,
        themeColor: responseData.themeColor || RAZORPAY_THEME_COLOR,
        backendMetadata: responseData.backendMetadata || getLiveBackendMetadata(),
      };
    }

    const order = await withMockFallback<RazorpayOrderResponse>(
      () =>
        apiClient.post<RazorpayOrderResponse>(
          RAZORPAY_ENDPOINTS.ORDER,
          requestBody
        ),
      () => {
        const targetId = invoiceId || moduleId || 'inv-1';
        let invoice = mockInvoices.find((i) => i.id === targetId || i.invoiceNumber === targetId);
        if (!invoice) {
          invoice = {
            id: targetId,
            invoiceNumber: `INV-${targetId.toUpperCase()}`,
            date: new Date().toISOString().split('T')[0],
            patientId: req.notes?.patientId || 'pat-1',
            patientName: req.notes?.patientName || 'Star Patient',
            patientMrn: req.notes?.patientMrn || 'P-00102',
            doctorId: 'doc-1',
            doctorName: 'Dr. Amit Sharma',
            department: 'General Physician',
            careSetting: 'opd',
            grossTotal: req.amount || 1000,
            discount: 0,
            netTotal: req.amount || 1000,
            amountReceived: 0,
            balanceDue: req.amount || 1000,
            status: 'unpaid',
            items: [
              {
                id: `item-${Date.now()}`,
                description: 'OPD Doctor Consultation Fee',
                quantity: 1,
                unitPrice: req.amount || 1000,
                total: req.amount || 1000,
              },
            ],
            payments: [],
          };
          mockInvoices.push(invoice);
        } else if (invoice.balanceDue <= 0 && req.amount && req.amount > 0) {
          invoice.balanceDue = req.amount;
          invoice.status = 'unpaid';
        }

        const payableAmount =
          req.amount !== undefined ? req.amount : invoice.balanceDue;
        if (payableAmount > invoice.balanceDue) {
          throw new Error(
            'Order amount cannot exceed the outstanding invoice balance.'
          );
        }

        const amountInPaise = Math.round(payableAmount * 100);
        const now = Date.now();
        const orderId = `order_mock_${now}`;
        mockOrderLedger.set(orderId, {
          invoiceId: invoice.id,
          amount: payableAmount,
          status: 'created',
        });

        return {
          orderId,
          transactionId: `txn_${now}`,
          module: req.module || 'invoice',
          moduleId: req.moduleId || invoice.id,
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: payableAmount,
          amountInPaise,
          currency: RAZORPAY_CURRENCY,
          receipt: `rcpt_${invoice.invoiceNumber}_${now}`,
          keyId: config.keyId,
          merchantName: RAZORPAY_MERCHANT_NAME,
          themeColor: RAZORPAY_THEME_COLOR,
          status: 'created',
          notes: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            patientMrn: invoice.patientMrn,
            ...(req.notes || {}),
          },
          backendMetadata: getPlaceholderBackendMetadata(),
        };
      }
    );

    secureLogger.info('razorpayService', 'Created Razorpay order', {
      invoiceId: order.invoiceId,
      orderId: order.orderId,
      integrationMode: order.backendMetadata?.integrationMode,
    });

    return order;
  },

  /**
   * Build Razorpay Checkout options strictly from public key + server-created order.
   * Rejects unconfigured or placeholder Key IDs.
   */
  buildCheckoutOptions(
    order: RazorpayOrderResponse,
    prefill?: RazorpayOrderPrefill
  ): RazorpayCheckoutOptions {
    const config = getRazorpayRuntimeConfig();
    const resolvedKey = (order?.keyId || config.keyId || '').trim();

    if (!resolvedKey || isPlaceholderRazorpayKey(resolvedKey)) {
      throw new Error(
        'Razorpay public Key ID (EXPO_PUBLIC_RAZORPAY_KEY_ID) is not configured or is still a placeholder.'
      );
    }

    if (!order?.orderId?.trim()) {
      throw new Error('A server-created Razorpay orderId is required for checkout.');
    }

    if (!Number.isInteger(order.amountInPaise) || order.amountInPaise <= 0) {
      throw new Error('Razorpay checkout amountInPaise must be a positive integer.');
    }

    const mergedPrefill = prefill || order.prefill;

    return {
      key: resolvedKey,
      amount: order.amountInPaise,
      currency: order.currency || RAZORPAY_CURRENCY,
      name: order.merchantName || config.merchantName || RAZORPAY_MERCHANT_NAME,
      description: `${RAZORPAY_DESCRIPTION} (${order.invoiceNumber})`,
      order_id: order.orderId,
      ...(mergedPrefill ? { prefill: mergedPrefill } : {}),
      theme: {
        color: order.themeColor || config.themeColor || RAZORPAY_THEME_COLOR,
      },
      notes: {
        ...(order.invoiceId ? { invoiceId: order.invoiceId } : {}),
        ...(order.invoiceNumber ? { invoiceNumber: order.invoiceNumber } : {}),
        ...(order.notes || {}),
      },
    };
  },

  /**
   * Step 2: Invoke Razorpay Checkout SDK bridge (or mock simulation in offline demo mode).
   * IMPORTANT: Checkout success ONLY yields unverified payment identifiers.
   * Final capture MUST NOT be trusted until verifyPayment() succeeds on the backend.
   */
  async openCheckout(
    order: RazorpayOrderResponse,
    prefill?: RazorpayOrderPrefill
  ): Promise<RazorpayCheckoutSuccessPayload> {
    if (!order?.orderId?.trim()) {
      throw new Error('Cannot open Razorpay Checkout without a valid orderId.');
    }
    if (!Number.isInteger(order.amountInPaise) || order.amountInPaise <= 0) {
      throw new Error('Cannot open Razorpay Checkout with a non-positive amount.');
    }

    const nativeBridge = getNativeRazorpayBridge();
    if (nativeBridge) {
      const options = this.buildCheckoutOptions(order, prefill);
      const result = await nativeBridge.open(options);
      if (
        !result ||
        !result.razorpay_payment_id?.trim() ||
        !result.razorpay_order_id?.trim() ||
        !result.razorpay_signature?.trim()
      ) {
        throw new Error(
          'Razorpay Checkout returned an incomplete payment response.'
        );
      }
      if (result.razorpay_order_id !== order.orderId) {
        throw new Error(
          'Razorpay Checkout order ID mismatch. Payment verification aborted.'
        );
      }
      return {
        razorpay_payment_id: result.razorpay_payment_id.trim(),
        razorpay_order_id: result.razorpay_order_id.trim(),
        razorpay_signature: result.razorpay_signature.trim(),
        isMockCheckout: false,
      };
    }

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // If a real Razorpay public key is configured, open the official Razorpay Web Checkout SDK
      if (isRazorpayKeyConfigured(order.keyId)) {
        const loaded = await new Promise<boolean>((resolve) => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        if (loaded && (window as any).Razorpay) {
          const options = this.buildCheckoutOptions(order, prefill);
          return await new Promise<RazorpayCheckoutSuccessPayload>((resolve, reject) => {
            const rzp = new (window as any).Razorpay({
              ...options,
              handler: (response: any) => {
                if (
                  !response?.razorpay_payment_id ||
                  !response?.razorpay_order_id ||
                  !response?.razorpay_signature
                ) {
                  reject(new Error('Razorpay returned an incomplete payment response.'));
                  return;
                }
                resolve({
                  razorpay_payment_id: String(response.razorpay_payment_id),
                  razorpay_order_id: String(response.razorpay_order_id),
                  razorpay_signature: String(response.razorpay_signature),
                  isMockCheckout: false,
                });
              },
              modal: {
                ondismiss: () => {
                  reject(new Error('Payment cancelled by user in Razorpay Checkout.'));
                },
              },
            });
            rzp.on('payment.failed', (resp: any) => {
              reject(
                new Error(
                  resp?.error?.description || 'Razorpay payment failed. Please retry.'
                )
              );
            });
            rzp.open();
          });
        }
      }

      // Interactive Razorpay Checkout UI in demo/test mode (never auto-skips payment!)
      const { openInteractiveRazorpayModal } = await import(
        '../components/common/RazorpayCheckoutModal'
      );
      return await openInteractiveRazorpayModal(order, prefill);
    }

    if (!isMockFallbackEnabled) {
      throw new Error(
        'Native Razorpay Checkout SDK is unavailable in this runtime. Use an EAS development/production build with native Razorpay checkout registered, rather than Expo Go.'
      );
    }

    // Headless Node unit test environment only (no DOM/UI)
    const suffix = `${Date.now()}`;
    return {
      razorpay_payment_id: `pay_mock_${suffix}`,
      razorpay_order_id: order.orderId,
      razorpay_signature: `sig_mock_placeholder_${suffix}`,
      isMockCheckout: true,
    };
  },

  /**
   * Step 3: Submit Checkout payment identifiers to Laravel backend for authoritative
   * HMAC-SHA256 signature verification and server-side capture confirmation.
   * Never computes or trusts final payment capture on the client.
   */
  async verifyPayment(
    req: VerifyRazorpayPaymentRequest
  ): Promise<VerifyRazorpayPaymentResponse> {
    const invoiceId = req?.invoiceId?.trim();
    const transactionId = req?.transactionId?.trim();
    const razorpayOrderId = req?.razorpayOrderId?.trim();
    const razorpayPaymentId = req?.razorpayPaymentId?.trim();
    const razorpaySignature = req?.razorpaySignature?.trim();

    if ((!invoiceId && !transactionId && !req?.moduleId) || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new Error(
        'Target identifier, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required for backend payment verification.'
      );
    }

    if (isInvalidSignatureInput(razorpaySignature)) {
      throw new Error('Razorpay payment signature verification failed.');
    }

    const payload: VerifyRazorpayPaymentRequest = {
      invoiceId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    };

    if (!isMockFallbackEnabled) {
      let verifiedRes: VerifyRazorpayPaymentResponse;
      try {
        verifiedRes = await withMockFallback<VerifyRazorpayPaymentResponse>(
          () =>
            apiClient.post<VerifyRazorpayPaymentResponse>(
              RAZORPAY_ENDPOINTS.VERIFY,
              payload
            ),
          () => {
            throw new Error('Mock fallback is disabled in live mode.');
          }
        );
      } catch (err) {
        throw createEndpointError(RAZORPAY_ENDPOINTS.VERIFY, err);
      }

      if (verifiedRes.verified !== true) {
        throw new Error(
          verifiedRes.message ||
            'Backend rejected Razorpay payment signature verification. Capture is not trusted.'
        );
      }

      return {
        ...verifiedRes,
        verified: true,
        verificationStatus: verifiedRes.verificationStatus || 'verified',
        verifiedByServer: verifiedRes.verifiedByServer ?? true,
        capturedOnServer: verifiedRes.capturedOnServer ?? true,
        backendMetadata: verifiedRes.backendMetadata || getLiveBackendMetadata(),
      };
    }

    const result = await withMockFallback<VerifyRazorpayPaymentResponse>(
      () =>
        apiClient.post<VerifyRazorpayPaymentResponse>(
          RAZORPAY_ENDPOINTS.VERIFY,
          payload
        ),
      () => {
        const trackedOrder = mockOrderLedger.get(razorpayOrderId);
        const targetId = invoiceId || trackedOrder?.invoiceId || transactionId || 'inv-1';
        const invoice = mockInvoices.find((i) => i.id === targetId || i.invoiceNumber === targetId) || mockInvoices[0];
        if (trackedOrder && trackedOrder.invoiceId && trackedOrder.invoiceId !== invoice.id) {
          throw new Error('Razorpay order does not match the target invoice.');
        }

        const alreadyRecorded = invoice.payments.some(
          (p) => p.transactionRef === razorpayPaymentId
        );

        if (!alreadyRecorded && invoice.balanceDue > 0) {
          const settledAmount = Math.min(
            invoice.balanceDue,
            trackedOrder?.amount ?? invoice.balanceDue
          );
          invoice.payments.push({
            id: `pay-${Date.now()}`,
            date: new Date().toISOString(),
            amount: settledAmount,
            method: 'online',
            transactionRef: razorpayPaymentId,
            receivedBy: 'Razorpay (Mock Verification)',
          });
          invoice.amountReceived += settledAmount;
          invoice.balanceDue = Math.max(
            0,
            invoice.netTotal - invoice.amountReceived
          );
          invoice.status =
            invoice.balanceDue <= 0
              ? 'paid'
              : invoice.amountReceived > 0
                ? 'partial'
                : 'unpaid';
        }
        mockOrderLedger.delete(razorpayOrderId);

        const txn: PaymentTransaction = {
          id: `txn_${Date.now()}`,
          patientId: invoice?.patientId || 'pat-1',
          patientName: invoice?.patientName || 'Ali Khan',
          patientMrn: invoice?.patientMrn || 'P-00102',
          module: 'invoice',
          moduleId: invoice?.id || 'inv-1',
          invoiceId: invoice?.id,
          invoiceNumber: invoice?.invoiceNumber,
          amount: trackedOrder?.amount || invoice?.netTotal || 500,
          amountPaid: trackedOrder?.amount || invoice?.amountReceived || 500,
          amountRefunded: 0,
          currency: 'INR',
          status: 'paid',
          razorpayOrderId,
          razorpayPaymentId,
          receiptNumber: `rcpt_${Date.now()}`,
          paymentMethod: 'online',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return {
          verified: true,
          verificationStatus: 'mock_verified',
          paymentId: razorpayPaymentId,
          orderId: razorpayOrderId,
          transactionId: txn.id,
          transaction: txn,
          invoiceId: invoice?.id,
          invoice: invoice ? { ...invoice } : undefined,
          capturedOnServer: false,
          verifiedByServer: false,
          verifiedAt: new Date().toISOString(),
          message:
            'Offline mock verification completed. Live capture requires ICTHospital Laravel HMAC verification.',
          backendMetadata: getPlaceholderBackendMetadata(),
        };
      }
    );

    secureLogger.info('razorpayService', 'Processed Razorpay payment verification', {
      invoiceId: result.invoiceId,
      orderId: result.orderId,
      verified: result.verified,
      verificationStatus: result.verificationStatus,
    });

    return result;
  },

  /**
   * Orchestrates the full 3-step secure payment lifecycle:
   * 1) Backend order creation -> 2) Checkout -> 3) Backend signature verification.
   */
  async processInvoicePayment(
    req: CreateRazorpayOrderRequest,
    prefill?: RazorpayOrderPrefill
  ): Promise<VerifyRazorpayPaymentResponse> {
    const order = await this.createOrder(req);
    const checkoutPayload = await this.openCheckout(order, prefill);
    return this.verifyPayment({
      transactionId: order.transactionId,
      invoiceId: order.invoiceId,
      module: order.module,
      moduleId: order.moduleId,
      razorpayOrderId: checkoutPayload.razorpay_order_id,
      razorpayPaymentId: checkoutPayload.razorpay_payment_id,
      razorpaySignature: checkoutPayload.razorpay_signature,
    });
  },

  /**
   * Universal payment processor across all hospital modules:
   * (Appointment, OPD, Lab, Radiology, Pharmacy, Admission, Invoice)
   */
  async processPaymentForModule(
    req: CreateRazorpayOrderRequest,
    prefill?: RazorpayOrderPrefill
  ): Promise<VerifyRazorpayPaymentResponse> {
    return this.processInvoicePayment(req, prefill);
  },

  /**
   * Process refund request (full or partial) with staff authorization
   */
  async processRefund(req: ProcessRefundRequest): Promise<ProcessRefundResponse> {
    const transactionId = req?.transactionId?.trim();
    if (!transactionId || !req.reason?.trim()) {
      throw new Error('transactionId and reason are required to process refund.');
    }

    if (!isMockFallbackEnabled) {
      try {
        const res = await apiClient.post<ProcessRefundResponse>(
          RAZORPAY_ENDPOINTS.REFUND,
          req
        );
        return res.data;
      } catch (err) {
        throw createEndpointError(RAZORPAY_ENDPOINTS.REFUND, err);
      }
    }

    return withMockFallback<ProcessRefundResponse>(
      () => apiClient.post<ProcessRefundResponse>(RAZORPAY_ENDPOINTS.REFUND, req),
      () => {
        const txn = mockPaymentTransactions.find(
          (t) => t.id === transactionId || t.razorpayPaymentId === transactionId
        );
        if (!txn) {
          throw new Error(`Transaction ${transactionId} not found.`);
        }
        const refundAmt = req.amount !== undefined ? req.amount : (txn.amountPaid - txn.amountRefunded);
        txn.amountRefunded += refundAmt;
        txn.status = txn.amountRefunded >= txn.amountPaid ? 'refunded' : 'partially_paid';
        txn.refundReason = req.reason;
        txn.refundedAt = new Date().toISOString();
        txn.refundTransactionId = `rfnd_${Date.now()}`;

        return {
          success: true,
          refundId: txn.refundTransactionId,
          transactionId: txn.id,
          amountRefunded: refundAmt,
          status: txn.status,
          message: `Refund of ₹${refundAmt} processed.`,
          timestamp: new Date().toISOString(),
        };
      }
    );
  },

  /**
   * Get all transactions for Patient or Staff dashboard
   */
  async getTransactions(params?: {
    patientId?: string;
    status?: string;
    module?: string;
  }): Promise<PaymentTransaction[]> {
    return withMockFallback<PaymentTransaction[]>(
      () => apiClient.get<PaymentTransaction[]>(RAZORPAY_ENDPOINTS.TRANSACTIONS, { params }),
      () => {
        let list = [...mockPaymentTransactions];
        if (params?.patientId) {
          list = list.filter((t) => t.patientId === params.patientId);
        }
        if (params?.status && params.status !== 'all') {
          list = list.filter((t) => t.status === params.status);
        }
        if (params?.module && params.module !== 'all') {
          list = list.filter((t) => t.module === params.module);
        }
        return list;
      }
    );
  },

  /**
   * Get single transaction by ID or reference
   */
  async getTransactionById(transactionId: string): Promise<PaymentTransaction> {
    return withMockFallback<PaymentTransaction>(
      () => apiClient.get<PaymentTransaction>(`${RAZORPAY_ENDPOINTS.TRANSACTIONS}/${transactionId}`),
      () => {
        const found = mockPaymentTransactions.find(
          (t) => t.id === transactionId || t.razorpayPaymentId === transactionId || t.receiptNumber === transactionId
        );
        if (!found) {
          throw new Error(`Transaction ${transactionId} not found.`);
        }
        return found;
      }
    );
  },

  /**
   * Get audit logs for transaction
   */
  async getAuditLogs(transactionId?: string): Promise<PaymentAuditLog[]> {
    return withMockFallback<PaymentAuditLog[]>(
      () => apiClient.get<PaymentAuditLog[]>(RAZORPAY_ENDPOINTS.AUDIT_LOGS, { params: { transactionId } }),
      () => {
        if (!transactionId) return mockPaymentAuditLogs;
        return mockPaymentAuditLogs.filter((l) => l.transactionId === transactionId);
      }
    );
  },
};

export default razorpayService;
