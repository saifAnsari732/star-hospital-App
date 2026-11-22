import { UserRole } from '../../types/user';
import { sanitizeForLog, secureLogger } from '../../utils/logger';

export interface CrashBreadcrumb {
  timestamp: string;
  category: string;
  message: string;
  data?: unknown;
}

interface NativeCrashlyticsModule {
  log: (message: string) => void;
  recordError: (error: Error, jsErrorName?: string) => void;
  setUserId: (userId: string) => Promise<null>;
  setAttributes: (attributes: Record<string, string>) => Promise<null>;
}

const MAX_BREADCRUMBS = 30;
const breadcrumbBuffer: CrashBreadcrumb[] = [];

const getNativeCrashlytics = (): NativeCrashlyticsModule | null => {
  try {
    // Optional bridge when compiled with @react-native-firebase/crashlytics in EAS native builds
    const globalAny = globalThis as Record<string, unknown>;
    const bridge = globalAny.__STAR_NATIVE_CRASHLYTICS__ as
      | (() => NativeCrashlyticsModule)
      | NativeCrashlyticsModule
      | undefined;
    if (typeof bridge === 'function') {
      return bridge();
    }
    if (bridge && typeof bridge.recordError === 'function') {
      return bridge;
    }
    return null;
  } catch {
    return null;
  }
};

export const firebaseCrashlyticsService = {
  isNativeCrashlyticsAvailable(): boolean {
    return getNativeCrashlytics() !== null;
  },

  logBreadcrumb(category: string, message: string, data?: unknown): void {
    const safeData = data !== undefined ? sanitizeForLog(data) : undefined;
    const entry: CrashBreadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message: String(sanitizeForLog(message)),
      ...(safeData !== undefined ? { data: safeData } : {}),
    };

    breadcrumbBuffer.push(entry);
    if (breadcrumbBuffer.length > MAX_BREADCRUMBS) {
      breadcrumbBuffer.shift();
    }

    const native = getNativeCrashlytics();
    if (native) {
      try {
        native.log(`[${category}] ${entry.message}`);
      } catch {
        // Ignore native bridge error
      }
    }
  },

  async setUserContext(userId: string | null, role?: UserRole): Promise<void> {
    const native = getNativeCrashlytics();
    if (!native) return;

    try {
      await native.setUserId(userId ?? '');
      if (role) {
        await native.setAttributes({ role });
      }
    } catch (err) {
      secureLogger.debug('firebaseCrashlytics', 'Failed to set Crashlytics user context', err);
    }
  },

  recordError(error: unknown, contextScope = 'App'): void {
    const normalizedError =
      error instanceof Error ? error : new Error(typeof error === 'string' ? error : 'Unknown error');
    const safeErrorPayload = sanitizeForLog(normalizedError) as {
      name?: string;
      message?: string;
    };
    const sanitizedError = new Error(safeErrorPayload.message || 'Redacted error');
    sanitizedError.name = safeErrorPayload.name || normalizedError.name;

    this.logBreadcrumb('error', `${contextScope}: ${sanitizedError.message}`);
    secureLogger.error(`Crashlytics:${contextScope}`, sanitizedError.message);

    const native = getNativeCrashlytics();
    if (native) {
      try {
        native.recordError(sanitizedError, contextScope);
      } catch (err) {
        secureLogger.debug('firebaseCrashlytics', 'Native Crashlytics recordError failed', err);
      }
    }
  },

  getRecentBreadcrumbs(): readonly CrashBreadcrumb[] {
    return [...breadcrumbBuffer];
  },

  clearBreadcrumbs(): void {
    breadcrumbBuffer.length = 0;
  },
};

export default firebaseCrashlyticsService;
