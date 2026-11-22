import { useCallback, useEffect, useRef, useState } from 'react';
import { secureLogger } from '../utils/logger';

export interface UseApiRequestOptions<TData> {
  initialData?: TData | null;
  onSuccess?: (data: TData) => void;
  onError?: (errorMessage: string) => void;
}

export interface UseApiRequestResult<TData, TArgs extends unknown[]> {
  data: TData | null;
  error: string | null;
  isLoading: boolean;
  execute: (...args: TArgs) => Promise<TData | null>;
  reset: () => void;
  setData: React.Dispatch<React.SetStateAction<TData | null>>;
}

export const extractApiErrorMessage = (err: unknown): string => {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message;
  }
  if (typeof err === 'string' && err.trim().length > 0) {
    return err;
  }
  if (err && typeof err === 'object') {
    const record = err as {
      message?: unknown;
      response?: { data?: { message?: unknown } };
    };
    if (
      typeof record.response?.data?.message === 'string' &&
      record.response.data.message.trim().length > 0
    ) {
      return record.response.data.message;
    }
    if (typeof record.message === 'string' && record.message.trim().length > 0) {
      return record.message;
    }
  }
  return 'Unable to complete request. Please try again.';
};

export function useApiRequest<TData, TArgs extends unknown[] = []>(
  requestFn: (...args: TArgs) => Promise<TData>,
  options: UseApiRequestOptions<TData> = {}
): UseApiRequestResult<TData, TArgs> {
  const [data, setData] = useState<TData | null>(options.initialData ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isMountedRef = useRef(true);
  const activeRequestIdRef = useRef(0);
  const requestFnRef = useRef(requestFn);
  const optionsRef = useRef(options);

  requestFnRef.current = requestFn;
  optionsRef.current = options;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeRequestIdRef.current += 1;
    };
  }, []);

  const execute = useCallback(async (...args: TArgs): Promise<TData | null> => {
    const requestId = ++activeRequestIdRef.current;

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const result = await requestFnRef.current(...args);
      if (requestId !== activeRequestIdRef.current) {
        return result;
      }
      if (isMountedRef.current) {
        setData(result);
        setIsLoading(false);
      }
      optionsRef.current.onSuccess?.(result);
      return result;
    } catch (err: unknown) {
      const message = extractApiErrorMessage(err);
      secureLogger.error('useApiRequest', 'Request failed', err);
      if (requestId !== activeRequestIdRef.current) {
        return null;
      }
      if (isMountedRef.current) {
        setError(message);
        setIsLoading(false);
      }
      optionsRef.current.onError?.(message);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    activeRequestIdRef.current += 1;
    if (!isMountedRef.current) return;
    setData(optionsRef.current.initialData ?? null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
    setData,
  };
}

export default useApiRequest;
