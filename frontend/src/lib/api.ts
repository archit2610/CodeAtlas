import { API_URL } from './constants';

/**
 * Fetch wrapper for CodeAtlas API calls.
 * The browser sends the anonymous visitor cookie with every request so local
 * repository and conversation history can be reopened without an account.
 */
export type CustomRequestInit = RequestInit;

export async function fetchApi<T>(
  path: string,
  options: CustomRequestInit = {}
): Promise<{ data: T; message: string; success: boolean; statusCode: number }> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = `Server Error (HTTP ${response.status})`;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorJson = await response.clone().json();
        errorMsg = errorJson.message || errorJson.error || errorMsg;
      } else {
        errorMsg = (await response.clone().text()).slice(0, 300) || errorMsg;
      }
    } catch {
      errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: CustomRequestInit) =>
    fetchApi<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: CustomRequestInit) =>
    fetchApi<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: CustomRequestInit) =>
    fetchApi<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: CustomRequestInit) =>
    fetchApi<T>(path, { ...options, method: 'DELETE' }),
};
