/**
 * API service for IASMS. Uses /api (proxied to PHP backend in dev).
 * In production (Vercel), set VITE_API_URL to your PHP backend base URL (e.g. https://yoursite.com/iasms).
 */
const baseUrl =
  typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api'
    : '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // leave data null
    }
  }
  if (!res.ok) {
    const msg = (data && typeof data === 'object' && 'error' in data && typeof (data as { error: string }).error === 'string')
      ? (data as { error: string }).error
      : `API error: ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }
  return (data ?? {}) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};

// Auth API response types
export interface LoginResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string;
    role: 'admin' | 'supervisor' | 'student';
    staffId?: string;
    indexNumber?: string;
  };
}

export interface AuthCheckResponse {
  authenticated: boolean;
  user?: {
    id: string;
    name: string;
    role: string;
    staffId?: string;
    indexNumber?: string;
  };
}
