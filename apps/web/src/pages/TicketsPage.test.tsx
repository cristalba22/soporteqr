import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TicketsPage } from './TicketsPage';

const { apiGetMock, locationsMock, categoriesMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  locationsMock: vi.fn(),
  categoriesMock: vi.fn(),
}));
const { authState } = vi.hoisted(() => ({ authState: { user: { role: 'TECNICO' } } }));

vi.mock('../lib/api', () => ({
  api: { get: apiGetMock },
  getLocations: locationsMock,
  getCategories: categoriesMock,
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => authState }));

describe('TicketsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user.role = 'TECNICO';
  });

  it('mantiene filtros conectados y muestra el SLA de la cola', async () => {
    locationsMock.mockResolvedValue([
      { id: '11111111-1111-4111-8111-111111111111', nombre: 'Central' },
    ]);
    categoriesMock.mockResolvedValue([
      { id: '22222222-2222-4222-8222-222222222222', nombre: 'Hardware' },
    ]);
    apiGetMock.mockResolvedValue({
      total: 1,
      page: 1,
      pageSize: 20,
      tickets: [
        {
          id: 'ticket-1',
          numero: 'SOP-2026-0001',
          titulo: 'Impresora detenida',
          estado: 'NUEVO',
          prioridad: 'CRITICA',
          createdAt: new Date(Date.now() - 30 * 3_600_000).toISOString(),
          asset: { tipo: 'Impresora', codigoInterno: 'IMP-001' },
          location: { nombre: 'Central' },
          reportante: { nombre: 'Empleado Demo' },
          tecnico: null,
        },
      ],
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={['/?assetId=33333333-3333-4333-8333-333333333333&assetCode=IMP-001']}
        >
          <TicketsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Cola de tickets' })).toBeInTheDocument();
    expect(screen.getByText('Activo: IMP-001')).toBeInTheDocument();
    expect((await screen.findAllByText(/Fuera de SLA/)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /Kanban/ }));
    expect(screen.getAllByText('Sin tickets en esta etapa')).toHaveLength(4);
    expect(screen.getByText('Impresora detenida')).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledWith(
      expect.stringContaining('assetId=33333333-3333-4333-8333-333333333333'),
    );
  });

  it('muestra al empleado un historial personal sin controles operativos', async () => {
    authState.user.role = 'EMPLEADO';
    apiGetMock.mockResolvedValue({
      total: 1,
      page: 1,
      pageSize: 20,
      tickets: [
        {
          id: 'ticket-propio',
          numero: 'SOP-2026-0010',
          titulo: 'Mi monitor no enciende',
          estado: 'NUEVO',
          prioridad: 'MEDIA',
          createdAt: new Date().toISOString(),
          asset: { tipo: 'Monitor', codigoInterno: 'MON-001' },
          location: { nombre: 'Consultorios' },
          reportante: { nombre: 'Empleado actual' },
          tecnico: null,
        },
      ],
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <TicketsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Mis solicitudes' })).toBeInTheDocument();
    expect(await screen.findByText('Mi monitor no enciende')).toBeInTheDocument();
    expect(screen.queryByText('Sin responsable')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Sucursal')).not.toBeInTheDocument();
    expect(locationsMock).not.toHaveBeenCalled();
    expect(categoriesMock).not.toHaveBeenCalled();
  });
});
