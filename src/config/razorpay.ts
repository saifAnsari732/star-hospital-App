/**
 * Star Hospital — Razorpay Public Checkout Configuration
 *
 * Security Note:
 * Only the publishable Key ID (EXPO_PUBLIC_RAZORPAY_KEY_ID) belongs in the mobile client.
 * Server-side API secrets and webhook signing secrets must remain exclusively on the
 * ICTHospital Laravel backend.
 */

declare const process: {
  env?: Record<string, string | undefined>;
};

export const RAZORPAY_CURRENCY = 'INR' as const;
export const RAZORPAY_MERCHANT_NAME = 'Star Hospital' as const;
export const RAZORPAY_THEME_COLOR = '#0866C6' as const;
export const RAZORPAY_DESCRIPTION = 'Star Hospital Medical & OPD Billing' as const;

export type RazorpayMode = 'live' | 'test' | 'unconfigured';

export interface RazorpayConfig {
  keyId: string;
  isConfigured: boolean;
  mode: RazorpayMode;
  currency: typeof RAZORPAY_CURRENCY;
  merchantName: typeof RAZORPAY_MERCHANT_NAME;
  description: string;
  themeColor: typeof RAZORPAY_THEME_COLOR;
  theme: {
    color: typeof RAZORPAY_THEME_COLOR;
  };
}

const KNOWN_PLACEHOLDER_KEYS = new Set<string>([
  'rzp_test_your_razorpay_key_id',
  'rzp_live_your_razorpay_key_id',
  'rzp_test_your_key_id',
  'rzp_live_your_key_id',
  'rzp_test_placeholder',
  'rzp_live_placeholder',
  'rzp_test_12345678',
  'rzp_test_1234567890',
  'rzp_live_1234567890',
  'your_razorpay_key_id',
]);

const VALID_RAZORPAY_PUBLIC_KEY_PATTERN = /^rzp_(test|live)_([A-Za-z0-9]{8,})$/;

export const isPlaceholderRazorpayKey = (value?: string): boolean => {
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;

  const normalized = trimmed.toLowerCase();
  if (KNOWN_PLACEHOLDER_KEYS.has(normalized)) {
    return true;
  }

  if (
    normalized.startsWith('your_') ||
    normalized.startsWith('your-') ||
    normalized.startsWith('placeholder') ||
    normalized.startsWith('replace_') ||
    normalized.startsWith('sample_') ||
    normalized.startsWith('demo_') ||
    normalized.startsWith('<') ||
    normalized.includes('your_razorpay') ||
    normalized.includes('xxxxxxxx') ||
    normalized.includes('example') ||
    normalized.includes('dummy')
  ) {
    return true;
  }

  const match = VALID_RAZORPAY_PUBLIC_KEY_PATTERN.exec(trimmed);
  if (!match) {
    return true;
  }

  const suffix = match[2];
  const suffixLower = suffix.toLowerCase();
  if (
    suffixLower.includes('placeholder') ||
    suffixLower.includes('changeme') ||
    suffixLower.includes('sample') ||
    suffixLower.includes('dummy') ||
    suffixLower.includes('example') ||
    suffixLower.includes('your')
  ) {
    return true;
  }

  // Reject repeated single-character placeholders like rzp_test_00000000 or rzp_test_aaaaaaaa
  if (/^(.)\1+$/.test(suffix)) {
    return true;
  }

  // Reject purely sequential numeric dummy suffixes like 12345678
  if (/^0?123456789?0?$/.test(suffix)) {
    return true;
  }

  return false;
};

export const isRazorpayKeyConfigured = (value?: string): boolean =>
  !isPlaceholderRazorpayKey(value);

export const getRazorpayKeyMode = (value?: string): RazorpayMode => {
  if (isPlaceholderRazorpayKey(value)) {
    return 'unconfigured';
  }
  const trimmed = (value || '').trim();
  if (trimmed.startsWith('rzp_live_')) {
    return 'live';
  }
  if (trimmed.startsWith('rzp_test_')) {
    return 'test';
  }
  return 'unconfigured';
};

/**
 * Direct `process.env?.EXPO_PUBLIC_RAZORPAY_KEY_ID` lookup is required so
 * `babel-preset-expo` statically detects and inlines it in Metro/EAS builds.
 */
const readEnvRazorpayKeyId = (): string | undefined => {
  try {
    return process.env?.EXPO_PUBLIC_RAZORPAY_KEY_ID;
  } catch {
    return undefined;
  }
};

export const buildRazorpayConfig = (keyIdOverride?: string): RazorpayConfig => {
  const rawKey =
    keyIdOverride !== undefined ? keyIdOverride : readEnvRazorpayKeyId();
  const trimmedKey = typeof rawKey === 'string' ? rawKey.trim() : '';
  const configured = isRazorpayKeyConfigured(trimmedKey);
  const mode = getRazorpayKeyMode(trimmedKey);

  return {
    keyId: configured ? trimmedKey : '',
    isConfigured: configured,
    mode,
    currency: RAZORPAY_CURRENCY,
    merchantName: RAZORPAY_MERCHANT_NAME,
    description: RAZORPAY_DESCRIPTION,
    themeColor: RAZORPAY_THEME_COLOR,
    theme: {
      color: RAZORPAY_THEME_COLOR,
    },
  };
};

export const getRazorpayRuntimeConfig = (): RazorpayConfig => buildRazorpayConfig();

export const razorpayConfig: RazorpayConfig = buildRazorpayConfig();
export const RAZORPAY_KEY_ID: string = razorpayConfig.keyId;
export const isRazorpayConfigured: boolean = razorpayConfig.isConfigured;

export default razorpayConfig;
