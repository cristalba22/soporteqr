import type { AssetStatus, CreateAssetInput, TicketPriority, TicketStatus } from '@soporteqr/shared';

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

export interface AssetListItem {
  id: string;
  codigoInterno: string;
  publicAssetCode: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  numeroSerie: string | null;
  estado: AssetStatus;
  location: { id: string; nombre: string };
  _count: { tickets: number };
}

export interface LocationOption {
  id: string;
  nombre: string;
}

export async function getAssets(): Promise<AssetListItem[]> {
  const data = await api.get<{ assets: AssetListItem[] }>('/api/assets');
  return data.assets;
}

export async function getLocations(): Promise<LocationOption[]> {
  const data = await api.get<{ locations: LocationOption[] }>('/api/locations');
  return data.locations;
}

export async function createAsset(input: CreateAssetInput): Promise<AssetListItem> {
  const data = await api.post<{ asset: AssetListItem }>('/api/assets', input);
  return data.asset;
}

export function getAssetQrUrl(publicAssetCode: string): string {
  return `${API_BASE_URL}/api/assets/publico/${encodeURIComponent(publicAssetCode)}/qr`;
}

export interface DashboardSummary {
  ticketsAbiertos: number;
  ticketsResueltos: number;
  tiempoPromedioResolucionHoras: number;
  distribucionPorEstado: Array<{ estado: TicketStatus; total: number }>;
  distribucionPorPrioridad: Array<{ prioridad: TicketPriority; total: number }>;
  distribucionPorCategoria: Array<{ categoryId: string | null; categoria: string; total: number }>;
  activosConMasIncidencias: Array<{ assetId: string; codigoInterno: string; tipo: string; total: number }>;
  cargaPorTecnico: Array<{ technicianId: string | null; nombre: string; total: number }>;
  evolucionMensual: Array<{ mes: string; total: number }>;
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>('/api/dashboard');
}

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

export async function downloadAttachment(ticketId: string, attachmentId: string, fileName: string): Promise<void> {
  const fetchFile = async (isRetry = false): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/adjuntos/${attachmentId}`, {
      credentials: 'include',
      headers,
    });
    if (response.status === 401 && !isRetry && (await refreshAccessToken())) return fetchFile(true);
    return response;
  };

  const response = await fetchFile();
  if (!response.ok) throw new ApiError(response.status, 'No se pudo descargar el adjunto');
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
}
