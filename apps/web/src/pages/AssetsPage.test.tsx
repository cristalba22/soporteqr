import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AssetsPage } from './AssetsPage';

const { assetsMock, locationsMock } = vi.hoisted(() => ({ assetsMock: vi.fn(), locationsMock: vi.fn() }));
vi.mock('../lib/api', () => ({
  getAssets: assetsMock,
  getLocations: locationsMock,
  createAsset: vi.fn(),
  updateAsset: vi.fn(),
  getAssetQrUrl: () => 'http://localhost/qr',
}));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { role: 'ADMINISTRADOR' } }) }));

describe('AssetsPage', () => {
  it('conecta el activo con sus tickets y permite abrir su edición', async () => {
    const location = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Central' };
    locationsMock.mockResolvedValue([location]);
    assetsMock.mockResolvedValue([{ id: 'asset-1', codigoInterno: 'IMP-001', publicAssetCode: 'QR-DEMO', tipo: 'Impresora', marca: 'Epson', modelo: 'L3250', numeroSerie: 'SERIE-1', estado: 'ACTIVO', location, _count: { tickets: 3 } }]);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(<QueryClientProvider client={queryClient}><MemoryRouter><AssetsPage /></MemoryRouter></QueryClientProvider>);

    expect(await screen.findByRole('heading', { name: 'Activos conectados' })).toBeInTheDocument();
    expect((await screen.findAllByRole('link', { name: 'Tickets' }))[0]).toHaveAttribute('href', '/tickets?assetId=asset-1&assetCode=IMP-001');
    fireEvent.click((await screen.findAllByRole('button', { name: 'Editar' }))[0]!);
    expect(screen.getByRole('heading', { name: 'Editar IMP-001' })).toBeInTheDocument();
  });
});
