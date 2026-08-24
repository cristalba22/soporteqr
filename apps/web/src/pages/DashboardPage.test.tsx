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
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  Bar: () => <div />,
  Line: () => <div />,
}));

describe('DashboardPage', () => {
  it('muestra KPIs y acceso administrativo con datos de la API', async () => {
    dashboardMock.mockResolvedValueOnce({
      ticketsAbiertos: 9,
      ticketsResueltos: 6,
      tiempoPromedioResolucionHoras: 48,
      distribucionPorEstado: [],
      distribucionPorPrioridad: [],
      distribucionPorCategoria: [],
      activosConMasIncidencias: [],
      cargaPorTecnico: [],
      evolucionMensual: [],
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter><DashboardPage /></MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Centro de operaciones' })).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('48 h')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Abrir administracion' })).toHaveAttribute('href', '/administracion');
  });
});
