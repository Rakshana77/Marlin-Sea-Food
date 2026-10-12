// Centralized API Client for Marine Seafoods PWA
import { ApiResponse, ApiErrorResponse } from '../types/api';

// Configurable API Base URL
const DEFAULT_API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// Token storage key
const TOKEN_KEY = 'marine_pos_auth_token';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null): void => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in private browsing
  }
};

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

// Global 401 callback listener for session expiration
let unauthorizedListener: (() => void) | null = null;
export const setOnUnauthorized = (cb: () => void) => {
  unauthorizedListener = cb;
};

// Global 403 callback listener for permission denied
let forbiddenListener: ((msg: string) => void) | null = null;
export const setOnForbidden = (cb: (msg: string) => void) => {
  forbiddenListener = cb;
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, timeoutMs = 15000, headers = {}, ...customConfig } = options;

  // Build full URL
  let fullUrl = endpoint.startsWith('http')
    ? endpoint
    : `${DEFAULT_API_BASE.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  if (params) {
    const urlObj = new URL(fullUrl, window.location.origin);
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        urlObj.searchParams.append(key, String(val));
      }
    });
    fullUrl = endpoint.startsWith('http') ? urlObj.toString() : `${urlObj.pathname}${urlObj.search}`;
  }

  // Check offline status before network call
  if (!navigator.onLine) {
    throw new ApiError(
      'You are currently offline. Please check your internet connection.',
      'NETWORK_OFFLINE',
      0
    );
  }

  const token = getStoredToken();
  const reqHeaders: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const isReadRequest = !customConfig.method || customConfig.method.toUpperCase() === 'GET';
  const maxAttempts = isReadRequest ? 2 : 1;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(fullUrl, {
        ...customConfig,
        headers: reqHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP 401 Unauthorized
      if (response.status === 401) {
        setStoredToken(null);
        if (unauthorizedListener) unauthorizedListener();
        throw new ApiError('Session expired or invalid credentials. Please log in again.', 'UNAUTHORIZED', 401);
      }

      // Handle HTTP 403 Forbidden
      if (response.status === 403) {
        const errorMsg = 'Access Denied: Your account role does not have permission for this operational module.';
        if (forbiddenListener) forbiddenListener(errorMsg);
        throw new ApiError(errorMsg, 'FORBIDDEN', 403);
      }

      const json = (await response.json()) as ApiResponse<T>;

      if (!response.ok || !json.success) {
        const errResponse = json as ApiErrorResponse;
        const message = errResponse.error?.message || `Request failed with status ${response.status}`;
        const code = errResponse.error?.code || `HTTP_${response.status}`;
        const details = errResponse.error?.details;
        throw new ApiError(message, code, response.status, details);
      }

      return json.data;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      lastError = err;

      // Do not retry 4xx client errors, auth failures, or forbidden
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        throw err;
      }

      // If it's a GET request and we have retry attempts left, wait briefly and retry
      if (isReadRequest && attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        continue;
      }
    }
  }

  if (lastError instanceof ApiError) {
    throw lastError;
  }

  if (lastError instanceof DOMException && lastError.name === 'AbortError') {
    throw new ApiError(
      'Request timed out. Please verify transaction status before retrying.',
      'REQUEST_TIMEOUT',
      408
    );
  }

  const networkErr = lastError as Error;
  throw new ApiError(
    networkErr?.message || 'Network error encountered. Check connection.',
    'NETWORK_ERROR',
    0
  );
}
