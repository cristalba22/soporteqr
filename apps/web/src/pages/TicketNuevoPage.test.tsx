import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TicketNuevoPage } from './TicketNuevoPage';

const { apiGet, apiPost } = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));

vi.mock('../lib/api', () => ({
  api: { get: apiGet, post: apiPost },
  ApiError: class ApiError extends Error {},
}));

describe('TicketNuevoPage', () => {
  it('crea un ticket validado y navega al detalle', async () => {
    apiGet.mockImplementation((path: string) => {
      if (path === '/api/categories') {
        return Promise.resolve({ categories: [{ id: '11111111-1111-4111-8111-111111111111', nombre: 'Hardware' }] });
      }
      return Promise.resolve({ asset: { codigoInterno: 'PC-001', tipo: 'PC', marca: 'Dell', modelo: 'OptiPlex', location: { nombre: 'Recepcion' } } });
    });
    apiPost.mockResolvedValueOnce({ ticket: { id: '22222222-2222-4222-8222-222222222222' } });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/tickets/nuevo?activo=AST0001']}>
          <Routes>
            <Route path="/tickets/nuevo" element={<TicketNuevoPage />} />
            <Route path="/tickets/:id" element={<p>Detalle creado</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await screen.findByRole('option', { name: 'Hardware' });
    fireEvent.change(screen.getByLabelText('Titulo'), { target: { value: 'Equipo sin respuesta' } });
    fireEvent.change(screen.getByLabelText('Descripcion'), { target: { value: 'El equipo no responde desde esta mañana.' } });
    fireEvent.change(screen.getByLabelText('Categoria'), { target: { value: '11111111-1111-4111-8111-111111111111' } });
    fireEvent.change(screen.getByLabelText('Prioridad'), { target: { value: 'ALTA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear ticket' }));

    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/api/tickets', expect.objectContaining({
      assetPublicCode: 'AST0001', titulo: 'Equipo sin respuesta', prioridad: 'ALTA',
    })));
    expect(await screen.findByText('Detalle creado')).toBeInTheDocument();
  });
});
