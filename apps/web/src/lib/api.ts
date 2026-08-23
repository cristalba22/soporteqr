const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { accessToken: string };
        setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  isRetry?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401 && !options.isRetry && path !== '/api/auth/refresh') {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, { ...options, isRetry: true });
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (data as { mensaje?: string; message?: string }).mensaje ??
      (data as { mensaje?: string; message?: string }).message ??
      'Ocurrio un error inesperado';
    throw new ApiError(res.status, message);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
};

export async function uploadAttachment(ticketId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append('archivo', file);
  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/adjuntos`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (data as { mensaje?: string }).mensaje ?? 'No se pudo subir el adjunto');
  }
}
