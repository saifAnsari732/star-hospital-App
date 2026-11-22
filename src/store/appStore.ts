import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_LANGUAGES, SupportedLanguageCode } from '../constants/hospital';
import { secureLogger } from '../utils/logger';

export const APP_PREFERENCES_STORAGE_KEY = '@star_hospital_app_preferences_v1';

export interface NotificationPreferences {
  pushEnabled: boolean;
  appointmentReminders: boolean;
  opdTokenAlerts: boolean;
  prescriptionAlerts: boolean;
  labReportAlerts: boolean;
}

export interface AppPreferencesState {
  hydrated: boolean;
  language: SupportedLanguageCode;
  onboardingCompleted: boolean;
  notifications: NotificationPreferences;
  recentDoctorSearches: string[];
  lastSyncedAt: string | null;
}

const VALID_LANGUAGE_CODES = new Set<string>(SUPPORTED_LANGUAGES.map((item) => item.code));

const isSupportedLanguageCode = (value: unknown): value is SupportedLanguageCode =>
  typeof value === 'string' && VALID_LANGUAGE_CODES.has(value);

const createDefaultPreferencesState = (): AppPreferencesState => ({
  hydrated: false,
  language: 'en',
  onboardingCompleted: false,
  notifications: {
    pushEnabled: true,
    appointmentReminders: true,
    opdTokenAlerts: true,
    prescriptionAlerts: true,
    labReportAlerts: true,
  },
  recentDoctorSearches: [],
  lastSyncedAt: null,
});

const sanitizeNotificationPreferences = (
  raw: unknown,
  base: NotificationPreferences
): NotificationPreferences => {
  if (!raw || typeof raw !== 'object') {
    return { ...base };
  }
  const source = raw as Record<string, unknown>;
  return {
    pushEnabled:
      typeof source.pushEnabled === 'boolean' ? source.pushEnabled : base.pushEnabled,
    appointmentReminders:
      typeof source.appointmentReminders === 'boolean'
        ? source.appointmentReminders
        : base.appointmentReminders,
    opdTokenAlerts:
      typeof source.opdTokenAlerts === 'boolean'
        ? source.opdTokenAlerts
        : base.opdTokenAlerts,
    prescriptionAlerts:
      typeof source.prescriptionAlerts === 'boolean'
        ? source.prescriptionAlerts
        : base.prescriptionAlerts,
    labReportAlerts:
      typeof source.labReportAlerts === 'boolean'
        ? source.labReportAlerts
        : base.labReportAlerts,
  };
};

type StoreListener = () => void;

class AppPreferencesStore {
  private state: AppPreferencesState = createDefaultPreferencesState();
  private listeners = new Set<StoreListener>();
  private mutationVersion = 0;

  public getState = (): AppPreferencesState => this.state;

  public subscribe = (listener: StoreListener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private emit(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private async persist(): Promise<void> {
    try {
      const { hydrated: _hydrated, ...serializable } = this.state;
      await AsyncStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(serializable));
    } catch (err) {
      secureLogger.warn('appStore', 'Failed to persist non-PHI preferences', err);
    }
  }

  public async hydrate(): Promise<AppPreferencesState> {
    const startVersion = this.mutationVersion;
    const defaults = createDefaultPreferencesState();
    try {
      const raw = await AsyncStorage.getItem(APP_PREFERENCES_STORAGE_KEY);
      if (this.mutationVersion !== startVersion) {
        return this.state;
      }
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppPreferencesState>;
        this.state = {
          ...defaults,
          language: isSupportedLanguageCode(parsed?.language)
            ? parsed.language
            : defaults.language,
          onboardingCompleted:
            typeof parsed?.onboardingCompleted === 'boolean'
              ? parsed.onboardingCompleted
              : defaults.onboardingCompleted,
          notifications: sanitizeNotificationPreferences(
            parsed?.notifications,
            defaults.notifications
          ),
          recentDoctorSearches: Array.isArray(parsed?.recentDoctorSearches)
            ? parsed.recentDoctorSearches
                .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
                .slice(0, 8)
            : [],
          lastSyncedAt:
            typeof parsed?.lastSyncedAt === 'string' ? parsed.lastSyncedAt : null,
          hydrated: true,
        };
      } else {
        this.state = { ...this.state, hydrated: true };
      }
    } catch (err) {
      if (this.mutationVersion !== startVersion) {
        return this.state;
      }
      secureLogger.warn('appStore', 'Failed to hydrate preferences; falling back to defaults', err);
      this.state = { ...defaults, hydrated: true };
    }
    this.emit();
    return this.state;
  }

  public async setLanguage(language: SupportedLanguageCode): Promise<void> {
    if (!isSupportedLanguageCode(language)) {
      return;
    }
    this.mutationVersion += 1;
    this.state = { ...this.state, language };
    this.emit();
    await this.persist();
  }

  public async updateNotificationPreferences(
    updates: Partial<NotificationPreferences>
  ): Promise<void> {
    this.mutationVersion += 1;
    this.state = {
      ...this.state,
      notifications: sanitizeNotificationPreferences(updates, this.state.notifications),
    };
    this.emit();
    await this.persist();
  }

  public async setOnboardingCompleted(completed: boolean): Promise<void> {
    this.mutationVersion += 1;
    this.state = { ...this.state, onboardingCompleted: Boolean(completed) };
    this.emit();
    await this.persist();
  }

  public async addRecentDoctorSearch(query: string): Promise<void> {
    const cleaned = query.trim();
    if (!cleaned) return;
    this.mutationVersion += 1;
    const deduped = [
      cleaned,
      ...this.state.recentDoctorSearches.filter(
        (item) => item.toLowerCase() !== cleaned.toLowerCase()
      ),
    ].slice(0, 8);
    this.state = { ...this.state, recentDoctorSearches: deduped };
    this.emit();
    await this.persist();
  }

  public async clearRecentDoctorSearches(): Promise<void> {
    this.mutationVersion += 1;
    this.state = { ...this.state, recentDoctorSearches: [] };
    this.emit();
    await this.persist();
  }

  public async markSynced(timestamp: string = new Date().toISOString()): Promise<void> {
    this.mutationVersion += 1;
    this.state = { ...this.state, lastSyncedAt: timestamp };
    this.emit();
    await this.persist();
  }

  public async resetPreferences(): Promise<void> {
    this.mutationVersion += 1;
    this.state = { ...createDefaultPreferencesState(), hydrated: true };
    this.emit();
    try {
      await AsyncStorage.removeItem(APP_PREFERENCES_STORAGE_KEY);
    } catch (err) {
      secureLogger.warn('appStore', 'Failed to clear preferences storage', err);
    }
  }
}

export const appStore = new AppPreferencesStore();

export function useAppStore(): AppPreferencesState;
export function useAppStore<T>(selector: (state: AppPreferencesState) => T): T;
export function useAppStore<T>(selector?: (state: AppPreferencesState) => T): T | AppPreferencesState {
  const snapshot = useSyncExternalStore(appStore.subscribe, appStore.getState, appStore.getState);
  return selector ? selector(snapshot) : snapshot;
}
