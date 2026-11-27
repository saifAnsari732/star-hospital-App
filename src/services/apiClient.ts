import axios, {
  AxiosInstance,
  AxiosResponse,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ApiErrorResponse } from '../types/api';

import { Platform } from 'react-native';

export const AUTH_TOKEN_STORAGE_KEY = '@star_hospital_auth_token';
export const USER_INFO_STORAGE_KEY = '@star_hospital_user_info';
export const ROLE_STORAGE_KEY = '@star_hospital_user_role';

// Default configuration for ICTHospital Laravel backend
const envApiBaseUrl =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL
    ? process.env.EXPO_PUBLIC_API_BASE_URL.trim()
    : '';
const envTimeoutMs =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_TIMEOUT_MS
    ? Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS)
    : NaN;
const envUseMock =
  typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_USE_MOCK_API !== undefined
    ? process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false'
    : true;

// On Web/iOS, 10.0.2.2 is unreachable Android-specific IP. Automatically use localhost or relative path on Web.
const defaultPlatformBaseUrl =
  Platform.OS === 'web'
    ? 'http://localhost:8000'
    : Platform.OS === 'android'
    ? 'http://10.0.2.2:8000'
    : 'http://localhost:8000';

export const DEFAULT_API_BASE_URL =
  envApiBaseUrl && !(Platform.OS === 'web' && envApiBaseUrl.includes('10.0.2.2'))
    ? envApiBaseUrl
    : defaultPlatformBaseUrl;
export const API_TIMEOUT_MS =
  Number.isFinite(envTimeoutMs) && envTimeoutMs > 0 ? envTimeoutMs : (Platform.OS === 'web' ? 2500 : 10000);

// Enable mock fallback by default for offline demo and automated testing unless explicitly disabled
export let isMockFallbackEnabled = envUseMock;

export const setMockFallbackEnabled = (enabled: boolean): void => {
  isMockFallbackEnabled = enabled;
};

// Create the core Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request Interceptor: Attach Bearer token from AsyncStorage
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // If AsyncStorage read fails, proceed without token
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

interface AxiosLikeError {
  response?: {
    status: number;
    data?: { message?: string; errors?: Record<string, string[]> };
  };
  request?: unknown;
  message?: string;
}

// Response Interceptor: Format responses and centralize error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: unknown) => {
    let formattedError: ApiErrorResponse = {
      success: false,
      message: 'Network request failed. Please check your internet connection.',
      statusCode: 500,
    };

    const err = error as AxiosLikeError;
    if (err && (err.response || err.request || err.message)) {
      if (err.response) {
        const data = err.response.data;
        formattedError = {
          success: false,
          message: data?.message || `Request failed with status ${err.response.status}`,
          errors: data?.errors,
          statusCode: err.response.status,
        };

        // Handle 401 Unauthorized - Token expired or invalid
        if (err.response.status === 401) {
          try {
            await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          } catch {
            // Ignore storage clear failure
          }
        }
      } else if (err.request) {
        formattedError = {
          success: false,
          message: 'Server unreachable. Working in offline mock mode.',
          statusCode: 0,
        };
      } else {
        formattedError = {
          success: false,
          message: err.message || 'An unexpected error occurred.',
          statusCode: 500,
        };
      }
    }

    return Promise.reject(formattedError);
  }
);

/**
 * Executes an API request with simulated delay and safe fallback to mock fixture data.
 * When backend is not reachable or returns an error, it returns genuine mock fixtures.
 */
export async function withMockFallback<T>(
  apiCall: () => Promise<AxiosResponse<ApiResponse<T> | T>>,
  mockFactory: () => T | Promise<T>,
  simulatedDelayMs: number = 200
): Promise<T> {
  if (!isMockFallbackEnabled) {
    const res = await apiCall();
    const data = res.data;
    if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
      return (data as ApiResponse<T>).data;
    }
    return data as T;
  }

  try {
    const res = await apiCall();
    const data = res.data;
    if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
      return (data as ApiResponse<T>).data;
    }
    return data as T;
  } catch {
    // Simulated realistic network latency for mock data
    if (simulatedDelayMs > 0) {
      await new Promise((resolve) => {
        if (typeof globalThis !== 'undefined' && globalThis.setTimeout) {
          globalThis.setTimeout(resolve, simulatedDelayMs);
        } else {
          resolve(undefined);
        }
      });
    }
    return await mockFactory();
  }
}

/**
 * Authentication token helpers
 */
export const apiClient = {
  instance: axiosInstance,

  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.get<T>(url, config);
  },

  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.post<T>(url, data, config);
  },

  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.put<T>(url, data, config);
  },

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return axiosInstance.delete<T>(url, config);
  },

  async setAuthToken(token: string): Promise<void> {
    await AsyncStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  },

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  },

  async clearAuthToken(): Promise<void> {
    await AsyncStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    await AsyncStorage.removeItem(USER_INFO_STORAGE_KEY);
    await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
  },
};

export default apiClient;
