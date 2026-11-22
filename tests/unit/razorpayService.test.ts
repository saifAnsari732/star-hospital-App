import fs from 'fs';
import path from 'path';
import axios from 'axios';
import {
  buildRazorpayConfig,
  getRazorpayKeyMode,
  isPlaceholderRazorpayKey,
  isRazorpayKeyConfigured,
  RAZORPAY_CURRENCY,
  RAZORPAY_MERCHANT_NAME,
  RAZORPAY_THEME_COLOR,
} from '../../src/config/razorpay';
import { razorpayService, RAZORPAY_ENDPOINTS } from '../../src/services/razorpayService';
import { apiClient, setMockFallbackEnabled } from '../../src/services/apiClient';
import { mockAdapter } from '../../src/services/mock/mockAdapter';
import { mockInvoices } from '../../src/fixtures/mockInvoices';

const REPO_ROOT = path.resolve(__dirname, '../..');
const FORBIDDEN_KEY_SECRET = ['RAZORPAY', 'KEY', 'SECRET'].join('_');
const FORBIDDEN_WEBHOOK_SECRET = ['RAZORPAY', 'WEBHOOK', 'SECRET'].join('_');

function collectFilesRecursive(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('Razorpay Config & Payment Service Unit Tests', () => {
  const originalEnvKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
  const inv4Snapshot = JSON.parse(
    JSON.stringify(mockInvoices.find((inv) => inv.id === 'inv-4'))
  );

  afterEach(() => {
    setMockFallbackEnabled(true);
    mockAdapter.reset();
    if (originalEnvKey === undefined) {
      delete process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
    } else {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = originalEnvKey;
    }
    delete (globalThis as Record<string, unknown>).__STAR_RAZORPAY_CHECKOUT__;

    const inv4 = mockInvoices.find((inv) => inv.id === 'inv-4');
    if (inv4 && inv4Snapshot) {
      Object.assign(inv4, JSON.parse(JSON.stringify(inv4Snapshot)));
    }
    jest.restoreAllMocks();
  });

  describe('Security & Secret Isolation', () => {
    it('never references or bundles RAZORPAY_KEY_SECRET or RAZORPAY_WEBHOOK_SECRET anywhere in src/ or app.json', () => {
      const srcFiles = collectFilesRecursive(path.join(REPO_ROOT, 'src'));
      const filesToScan = [...srcFiles, path.join(REPO_ROOT, 'app.json')];

      for (const filePath of filesToScan) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(content).not.toContain(FORBIDDEN_KEY_SECRET);
        expect(content).not.toContain(FORBIDDEN_WEBHOOK_SECRET);
      }
    });

    it('keeps .env.example and .env free of assigned Razorpay secrets while documenting EXPO_PUBLIC_RAZORPAY_KEY_ID', () => {
      const envExample = fs.readFileSync(path.join(REPO_ROOT, '.env.example'), 'utf8');
      expect(envExample).toContain('EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_razorpay_key_id');

      const uncommentedAssignments = envExample
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));

      for (const line of uncommentedAssignments) {
        expect(line).not.toContain(FORBIDDEN_KEY_SECRET);
        expect(line).not.toContain(FORBIDDEN_WEBHOOK_SECRET);
      }

      const envPath = path.join(REPO_ROOT, '.env');
      expect(fs.existsSync(envPath)).toBe(true);
      const envContent = fs.readFileSync(envPath, 'utf8');
      expect(envContent).toContain('EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_live_TWLWfA0Ba2tiwG');
      expect(envContent).not.toContain(FORBIDDEN_KEY_SECRET);
      expect(envContent).not.toContain(FORBIDDEN_WEBHOOK_SECRET);
    });
  });

  describe('Razorpay Config & Placeholder Detection', () => {
    it('exposes Star Hospital merchant defaults (INR, Star Hospital, #0866C6)', () => {
      const config = buildRazorpayConfig('rzp_test_1DP5mmOlF5G5ag');
      expect(RAZORPAY_CURRENCY).toBe('INR');
      expect(RAZORPAY_MERCHANT_NAME).toBe('Star Hospital');
      expect(RAZORPAY_THEME_COLOR).toBe('#0866C6');
      expect(config.currency).toBe('INR');
      expect(config.merchantName).toBe('Star Hospital');
      expect(config.themeColor).toBe('#0866C6');
      expect(config.theme).toEqual({ color: '#0866C6' });
    });

    it('detects missing, placeholder, and malformed Razorpay keys as unconfigured', () => {
      const placeholders = [
        undefined,
        '',
        '   ',
        'rzp_test_your_razorpay_key_id',
        'rzp_live_your_razorpay_key_id',
        'your_razorpay_key_id',
        'placeholder_key',
        'replace_me_123456',
        'rzp_test_xxxxxxxxxxxx',
        'rzp_test_00000000',
        'rzp_test_1234567890',
        'sk_live_notapublickey123',
        'rzp_test_short',
      ];

      for (const candidate of placeholders) {
        expect(isPlaceholderRazorpayKey(candidate)).toBe(true);
        expect(isRazorpayKeyConfigured(candidate)).toBe(false);
        expect(getRazorpayKeyMode(candidate)).toBe('unconfigured');

        const cfg = buildRazorpayConfig(candidate ?? '');
        expect(cfg.isConfigured).toBe(false);
        expect(cfg.keyId).toBe('');
        expect(cfg.mode).toBe('unconfigured');
      }
    });

    it('recognizes real public test and live Razorpay Key IDs', () => {
      expect(isRazorpayKeyConfigured('rzp_live_TWLWfA0Ba2tiwG')).toBe(true);
      expect(getRazorpayKeyMode('rzp_live_TWLWfA0Ba2tiwG')).toBe('live');

      expect(isRazorpayKeyConfigured('rzp_test_1DP5mmOlF5G5ag')).toBe(true);
      expect(getRazorpayKeyMode('rzp_test_1DP5mmOlF5G5ag')).toBe('test');

      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_your_razorpay_key_id';
      jest.resetModules();
      const reloadedPlaceholder = require('../../src/config/razorpay');
      expect(reloadedPlaceholder.isRazorpayConfigured).toBe(false);
      expect(reloadedPlaceholder.RAZORPAY_KEY_ID).toBe('');

      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_TWLWfA0Ba2tiwG';
      jest.resetModules();
      const reloadedLive = require('../../src/config/razorpay');
      expect(reloadedLive.isRazorpayConfigured).toBe(true);
      expect(reloadedLive.RAZORPAY_KEY_ID).toBe('rzp_live_TWLWfA0Ba2tiwG');
    });
  });

  describe('Order Creation, Checkout & Server Verification', () => {
    it('creates a server-style Razorpay order in mock placeholder mode with integer paise and metadata', async () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_TWLWfA0Ba2tiwG';

      const order = await razorpayService.createOrder({ invoiceId: 'inv-4' });
      expect(order.orderId).toMatch(/^order_mock_/);
      expect(order.invoiceId).toBe('inv-4');
      expect(order.invoiceNumber).toBe('INV-10030');
      expect(order.amount).toBe(1500);
      expect(order.amountInPaise).toBe(150000);
      expect(order.currency).toBe('INR');
      expect(order.merchantName).toBe('Star Hospital');
      expect(order.themeColor).toBe('#0866C6');
      expect(order.keyId).toBe('rzp_live_TWLWfA0Ba2tiwG');
      expect(order.backendMetadata.orderEndpoint).toBe(RAZORPAY_ENDPOINTS.ORDER);
      expect(order.backendMetadata.verifyEndpoint).toBe(RAZORPAY_ENDPOINTS.VERIFY);
      expect(order.backendMetadata.isLiveBackendEndpoint).toBe(false);
      expect(order.backendMetadata.integrationMode).toBe('mock_placeholder');
    });

    it('rejects invalid order inputs, paid invoices, and placeholder keys during checkout options building', async () => {
      await expect(razorpayService.createOrder({ invoiceId: '   ' })).rejects.toThrow(
        'valid invoiceId is required'
      );
      await expect(razorpayService.createOrder({ invoiceId: 'inv-missing' })).rejects.toThrow(
        'not found'
      );
      await expect(razorpayService.createOrder({ invoiceId: 'inv-1' })).rejects.toThrow(
        'no outstanding balance'
      );
      await expect(
        razorpayService.createOrder({ invoiceId: 'inv-4', amount: 0 })
      ).rejects.toThrow('positive number');
      await expect(
        razorpayService.createOrder({ invoiceId: 'inv-4', amount: 99999 })
      ).rejects.toThrow('cannot exceed');

      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_your_razorpay_key_id';
      const orderWithPlaceholder = await razorpayService.createOrder({ invoiceId: 'inv-4' });
      expect(orderWithPlaceholder.keyId).toBe('');
      expect(() => razorpayService.buildCheckoutOptions(orderWithPlaceholder)).toThrow(
        'not configured or is still a placeholder'
      );
    });

    it('never marks an invoice paid on Checkout alone and requires backend verifyPayment', async () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_TWLWfA0Ba2tiwG';

      const order = await razorpayService.createOrder({ invoiceId: 'inv-4', amount: 500 });
      const checkout = await razorpayService.openCheckout(order);
      expect(checkout.razorpay_order_id).toBe(order.orderId);
      expect(checkout.isMockCheckout).toBe(true);

      // Invoice MUST still be unpaid before backend verification is called
      const invBeforeVerify = mockInvoices.find((i) => i.id === 'inv-4');
      expect(invBeforeVerify?.status).toBe('unpaid');
      expect(invBeforeVerify?.balanceDue).toBe(1500);

      // Missing/invalid signature verification fails
      await expect(
        razorpayService.verifyPayment({
          invoiceId: 'inv-4',
          razorpayOrderId: order.orderId,
          razorpayPaymentId: checkout.razorpay_payment_id,
          razorpaySignature: 'invalid_sig',
        })
      ).rejects.toThrow('signature verification failed');

      // Valid verification completes partial payment with mock_verified status (not server-captured)
      const verified = await razorpayService.verifyPayment({
        invoiceId: 'inv-4',
        razorpayOrderId: order.orderId,
        razorpayPaymentId: checkout.razorpay_payment_id,
        razorpaySignature: checkout.razorpay_signature,
      });
      expect(verified.verified).toBe(true);
      expect(verified.verificationStatus).toBe('mock_verified');
      expect(verified.verifiedByServer).toBe(false);
      expect(verified.capturedOnServer).toBe(false);
      expect(verified.invoice?.status).toBe('partial');
      expect(verified.invoice?.balanceDue).toBe(1000);
    });

    it('uses registered native checkout bridge and rejects mismatched order IDs', async () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1DP5mmOlF5G5ag';

      const openMock = jest.fn(async (options) => ({
        razorpay_payment_id: 'pay_native_12345',
        razorpay_order_id: options.order_id,
        razorpay_signature: 'sig_native_abcdef123456',
      }));
      (globalThis as Record<string, unknown>).__STAR_RAZORPAY_CHECKOUT__ = {
        open: openMock,
      };

      const result = await razorpayService.processInvoicePayment(
        { invoiceId: 'inv-4' },
        { name: 'Ali Khan', email: 'ali.khan@gmail.com', contact: '+919876543210' }
      );

      expect(openMock).toHaveBeenCalledTimes(1);
      const passedOptions = openMock.mock.calls[0][0];
      expect(passedOptions.key).toBe('rzp_test_1DP5mmOlF5G5ag');
      expect(passedOptions.currency).toBe('INR');
      expect(passedOptions.name).toBe('Star Hospital');
      expect(passedOptions.theme).toEqual({ color: '#0866C6' });
      expect(result.paymentId).toBe('pay_native_12345');
      expect(result.invoice?.status).toBe('paid');

      // Tampered order_id returned by checkout must abort
      (globalThis as Record<string, unknown>).__STAR_RAZORPAY_CHECKOUT__ = {
        open: async () => ({
          razorpay_payment_id: 'pay_bad',
          razorpay_order_id: 'order_tampered',
          razorpay_signature: 'sig_valid_123456',
        }),
      };
      const inv4 = mockInvoices.find((i) => i.id === 'inv-4')!;
      inv4.status = 'unpaid';
      inv4.balanceDue = 1500;
      inv4.amountReceived = 0;

      const freshOrder = await razorpayService.createOrder({ invoiceId: 'inv-4' });
      await expect(razorpayService.openCheckout(freshOrder)).rejects.toThrow(
        'order ID mismatch'
      );
    });

    it('enforces live backend verification and surfaces placeholder guidance when backend routes are missing', async () => {
      setMockFallbackEnabled(false);
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_TWLWfA0Ba2tiwG';

      const postSpy = jest.spyOn(apiClient, 'post').mockRejectedValueOnce({
        success: false,
        statusCode: 404,
        message: 'Route not found',
      });

      await expect(razorpayService.createOrder({ invoiceId: 'inv-4' })).rejects.toThrow(
        'not deployed yet'
      );
      expect(postSpy).toHaveBeenCalledWith(RAZORPAY_ENDPOINTS.ORDER, {
        invoiceId: 'inv-4',
        currency: 'INR',
      });

      // Live backend rejecting signature must NEVER trust capture
      postSpy.mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            verified: false,
            verificationStatus: 'failed',
            paymentId: 'pay_live_1',
            orderId: 'order_live_1',
            invoiceId: 'inv-4',
            capturedOnServer: false,
            verifiedByServer: false,
            verifiedAt: new Date().toISOString(),
            message: 'HMAC mismatch on server',
          },
        },
      } as any);

      await expect(
        razorpayService.verifyPayment({
          invoiceId: 'inv-4',
          razorpayOrderId: 'order_live_1',
          razorpayPaymentId: 'pay_live_1',
          razorpaySignature: 'sig_live_12345678',
        })
      ).rejects.toThrow('HMAC mismatch on server');
    });
  });

  describe('MockAdapterEngine Razorpay Endpoints', () => {
    it('supports POST /api/v1/payments/razorpay/order and /verify with invoice settlement', async () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_live_TWLWfA0Ba2tiwG';

      const createdInvoice = await mockAdapter.createInvoice({
        patientId: 'pat-1',
        careSetting: 'opd',
        items: [{ description: 'Cardiology Consult', quantity: 1, unitPrice: 2000 }],
      });

      const orderRes = await mockAdapter.createRazorpayOrder({
        invoiceId: createdInvoice.data.id,
      });
      expect(orderRes.success).toBe(true);
      expect(orderRes.data.amountInPaise).toBe(200000);
      expect(orderRes.data.currency).toBe('INR');
      expect(orderRes.data.keyId).toBe('rzp_live_TWLWfA0Ba2tiwG');

      const verifyRes = await mockAdapter.verifyRazorpayPayment({
        invoiceId: createdInvoice.data.id,
        razorpayOrderId: orderRes.data.orderId,
        razorpayPaymentId: 'pay_mock_adapter_1',
        razorpaySignature: 'sig_mock_adapter_12345',
      });
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.data.verified).toBe(true);
      expect(verifyRes.data.verificationStatus).toBe('mock_verified');
      expect(verifyRes.data.capturedOnServer).toBe(false);
      expect(verifyRes.data.invoice?.status).toBe('paid');
      expect(verifyRes.data.invoice?.balanceDue).toBe(0);
    });

    it('routes /api/v1/payments/razorpay/order and /verify through attachAxios', async () => {
      process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1DP5mmOlF5G5ag';
      const testAxios = axios.create({ baseURL: 'http://localhost:8000' });
      mockAdapter.attachAxios(testAxios);

      const createdInvoice = await mockAdapter.createInvoice({
        patientId: 'pat-1',
        careSetting: 'opd',
        items: [{ description: 'Lab Panel', quantity: 1, unitPrice: 1200 }],
      });

      const orderHttp = await testAxios.post(RAZORPAY_ENDPOINTS.ORDER, {
        invoiceId: createdInvoice.data.id,
      });
      expect(orderHttp.status).toBe(200);
      expect(orderHttp.data.success).toBe(true);
      expect(orderHttp.data.data.amountInPaise).toBe(120000);
      expect(orderHttp.data.data.keyId).toBe('rzp_test_1DP5mmOlF5G5ag');

      const verifyHttp = await testAxios.post(RAZORPAY_ENDPOINTS.VERIFY, {
        invoiceId: createdInvoice.data.id,
        razorpayOrderId: orderHttp.data.data.orderId,
        razorpayPaymentId: 'pay_axios_123',
        razorpaySignature: 'sig_axios_12345678',
      });
      expect(verifyHttp.status).toBe(200);
      expect(verifyHttp.data.data.verified).toBe(true);
      expect(verifyHttp.data.data.invoice.status).toBe('paid');
    });
  });
});
