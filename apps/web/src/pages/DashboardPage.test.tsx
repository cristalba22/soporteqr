import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

const { dashboardMock } = vi.hoisted(() => ({ dashboardMock: vi.fn() }));

vi.mock('../lib/api', () => ({ getDashboardSummary: dashboardMock }));
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
      tiempoPromedioResolucionHoras: 48,
      distribucionPorEstado: [],
      distribucionPorPrioridad: [],
      distribucionPorCategoria: [],
      activosConMasIncidencias: [],
      cargaPorTecnico: [],
      evolucionMensual: [],
      atencionPrioritaria: [],
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
    expect(screen.getByText('48 h')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Administrar sistema/ })).toHaveAttribute('href', '/administracion');
  });
});
