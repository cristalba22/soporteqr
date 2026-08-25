import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { TicketsPage } from './TicketsPage';

const { apiGetMock, locationsMock, categoriesMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(), locationsMock: vi.fn(), categoriesMock: vi.fn(),
}));

vi.mock('../lib/api', () => ({
  api: { get: apiGetMock },
  getLocations: locationsMock,
  getCategories: categoriesMock,
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { role: 'TECNICO' } }) }));

describe('TicketsPage', () => {
  it('mantiene filtros conectados y muestra el SLA de la cola', async () => {
    locationsMock.mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111', nombre: 'Central' }]);
    categoriesMock.mockResolvedValue([{ id: '22222222-2222-4222-8222-222222222222', nombre: 'Hardware' }]);
    apiGetMock.mockResolvedValue({
      total: 1, page: 1, pageSize: 20,
      tickets: [{
        id: 'ticket-1', numero: 'SOP-2026-0001', titulo: 'Impresora detenida', estado: 'NUEVO', prioridad: 'CRITICA',
        createdAt: new Date(Date.now() - 30 * 3_600_000).toISOString(), asset: { tipo: 'Impresora', codigoInterno: 'IMP-001' },
        location: { nombre: 'Central' }, reportante: { nombre: 'Empleado Demo' }, tecnico: null,
      }],
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/?assetId=33333333-3333-4333-8333-333333333333&assetCode=IMP-001']}><TicketsPage /></MemoryRouter></QueryClientProvider>);

    expect(await screen.findByRole('heading', { name: 'Cola de tickets' })).toBeInTheDocument();
    expect(screen.getByText('Activo: IMP-001')).toBeInTheDocument();
    expect((await screen.findAllByText(/Fuera de SLA/)).length).toBeGreaterThan(0);
    expect(apiGetMock).toHaveBeenCalledWith(expect.stringContaining('assetId=33333333-3333-4333-8333-333333333333'));
  });
});
