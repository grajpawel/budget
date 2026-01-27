import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

export function useApiClient() {
  const { getAccessToken } = useAuth();

  return async function <T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const token = await getAccessToken();
    const headers = {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return apiClient<T>(endpoint, { ...options, headers });
  };
}
