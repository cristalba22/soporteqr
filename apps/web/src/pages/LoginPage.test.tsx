import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: loginMock }),
}));

describe('LoginPage', () => {
  it('envia credenciales validas y navega al inicio', async () => {
    loginMock.mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Inicio autenticado</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Correo electronico'), { target: { value: 'admin@soporteqr.demo' } });
    fireEvent.change(screen.getByLabelText('Contrasena'), { target: { value: 'Demo1234!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('admin@soporteqr.demo', 'Demo1234!'));
    expect(await screen.findByText('Inicio autenticado')).toBeInTheDocument();
  });
});
