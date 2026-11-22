const SENSITIVE_KEY_PATTERN =
  /password|passcode|otp|token|secret|authorization|cookie|ssn|aadhaar|cnic|medical|diagnosis|allergy|prescription|notes|vitals|phone|mobile|email|address/i;

const BEARER_PATTERN = /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}\b/g;
const INTERNAL_TOKEN_PATTERN =
  /\b(?:star_(?:mock_|otp_|reg_)?jwt_|mock-(?:otp-)?[a-z-]+-jwt-token-)[A-Za-z0-9_-]+/gi;
const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_CANDIDATE_PATTERN = /(\+?\d[\d\s()-]{6,}\d)/g;
const ISO_DATE_ONLY_PATTERN = /^\d{4}[-/]\d{2}[-/]\d{2}$/;

const redactString = (value: string): string => {
  return value
    .replace(BEARER_PATTERN, '$1[REDACTED]')
    .replace(JWT_PATTERN, '[REDACTED_JWT]')
    .replace(INTERNAL_TOKEN_PATTERN, '[REDACTED_TOKEN]')
    .replace(EMAIL_PATTERN, '[REDACTED_EMAIL]')
    .replace(PHONE_CANDIDATE_PATTERN, (match) => {
      const trimmed = match.trim();
      if (ISO_DATE_ONLY_PATTERN.test(trimmed)) {
        return match;
      }
      const digitsOnly = trimmed.replace(/\D/g, '');
      // Require 9+ digits or explicit international '+' prefix with 8+ digits so dates/times aren't mangled
      if (digitsOnly.length >= 9 || (trimmed.startsWith('+') && digitsOnly.length >= 8)) {
        return '[REDACTED_PHONE]';
      }
      return match;
    });
};

export const sanitizeForLog = (
  input: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet()
): unknown => {
  if (depth > 4) {
    return '[MaxDepth]';
  }
  if (input === null || input === undefined) {
    return input;
  }
  if (typeof input === 'string') {
    return redactString(input);
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? 'Invalid Date' : input.toISOString();
  }
  if (input instanceof Error) {
    return {
      name: input.name,
      message: redactString(input.message),
    };
  }
  if (typeof input === 'object') {
    if (seen.has(input)) {
      return '[Circular]';
    }
    seen.add(input);
    if (Array.isArray(input)) {
      return input.map((item) => sanitizeForLog(item, depth + 1, seen));
    }
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        output[key] = '[REDACTED]';
      } else {
        output[key] = sanitizeForLog(val, depth + 1, seen);
      }
    }
    return output;
  }
  return String(input);
};

const isDevMode = (): boolean => {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }
  return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
};

export const secureLogger = {
  debug(scope: string, message: string, meta?: unknown): void {
    if (!isDevMode()) return;
    if (meta !== undefined) {
      console.log(`[${scope}] ${redactString(message)}`, sanitizeForLog(meta));
    } else {
      console.log(`[${scope}] ${redactString(message)}`);
    }
  },

  info(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.info(`[${scope}] ${redactString(message)}`, sanitizeForLog(meta));
    } else {
      console.info(`[${scope}] ${redactString(message)}`);
    }
  },

  warn(scope: string, message: string, meta?: unknown): void {
    if (meta !== undefined) {
      console.warn(`[${scope}] ${redactString(message)}`, sanitizeForLog(meta));
    } else {
      console.warn(`[${scope}] ${redactString(message)}`);
    }
  },

  error(scope: string, message: string, error?: unknown): void {
    if (error !== undefined) {
      console.error(`[${scope}] ${redactString(message)}`, sanitizeForLog(error));
    } else {
      console.error(`[${scope}] ${redactString(message)}`);
    }
  },
};

export default secureLogger;
