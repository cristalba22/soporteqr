import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

const { dashboardMock, locationsMock } = vi.hoisted(() => ({ dashboardMock: vi.fn(), locationsMock: vi.fn() }));

vi.mock('../lib/api', () => ({ getDashboardSummary: dashboardMock, getLocations: locationsMock }));
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'admin', role: 'ADMINISTRADOR' } }),
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: () => <div />,
  AreaChart: () => <div />,
  CartesianGrid: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Bar: () => <div />,
  Area: () => <div />,
  Cell: () => <div />,
}));

describe('DashboardPage', () => {
  it('muestra KPIs y acceso administrativo con datos de la API', async () => {
    locationsMock.mockResolvedValueOnce([{ id: 'loc-1', nombre: 'Casa central' }]);
    dashboardMock.mockResolvedValueOnce({
      ticketsAbiertos: 9,
      ticketsResueltos: 6,
      criticosAbiertos: 1,
      sinAsignar: 2,
      esperandoUsuario: 1,
      sinActividad: 1,
      creadosUltimos30: 9,
      variacionCreados: -10,
      resueltosUltimos30: 6,
      variacionResueltos: 20,
      brechaCapacidad: 3,
      criticosConAntiguedad: [{ id: 'ticket-1', numero: 'SOP-2026-0001', antiguedadHoras: 27 }],
      slaHoras: 24,
      tiempoPromedioResolucionHoras: 48,
      distribucionPorEstado: [],
      distribucionPorPrioridad: [],
      distribucionPorCategoria: [],
      activosConMasIncidencias: [],
      cargaPorTecnico: [],
      evolucionMensual: [],
      atencionPrioritaria: [{
        id: 'ticket-1',
        numero: 'SOP-2026-0001',
        titulo: 'Servidor sin conexión',
        prioridad: 'CRITICA',
        estado: 'NUEVO',
        createdAt: '2026-08-20T00:00:00.000Z',
        updatedAt: new Date().toISOString(),
        assetCode: 'SRV-001',
        location: 'Casa central',
        motivo: 'Prioridad critica',
        antiguedadHoras: 27,
        fueraSla: true,
        slaHoras: 24,
      }],
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><DashboardPage /></MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Pulso operativo' })).toBeInTheDocument();
    expect(screen.getByText('Próxima mejor acción')).toBeInTheDocument();
    expect(screen.getByText('Críticos abiertos')).toBeInTheDocument();
    expect(screen.getByText('SOP-2026-0001 · 1 d 3 h')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7 días' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Sucursal' })).toBeInTheDocument();
    expect(screen.getByText('Acumulando')).toBeInTheDocument();
    expect(screen.getByText('Fuera de SLA · 1 d 3 h/24 h')).toBeInTheDocument();
    expect(screen.getByText('48 h')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Administrar sistema/ })).toHaveAttribute('href', '/administracion');
  });
});
