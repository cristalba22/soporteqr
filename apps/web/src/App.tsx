import { UserRole } from '@soporteqr/shared';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ReportarPage } from './pages/ReportarPage';
import { TicketDetallePage } from './pages/TicketDetallePage';
import { TicketNuevoPage } from './pages/TicketNuevoPage';
import { TicketsPage } from './pages/TicketsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';

export function App() {
  return (
    <Routes>
      <Route path="/reportar/:publicAssetCode" element={<ReportarPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<TicketsPage />} />
          <Route path="/tickets/nuevo" element={<TicketNuevoPage />} />
          <Route path="/tickets/:id" element={<TicketDetallePage />} />
          <Route element={<RoleRoute roles={[UserRole.ADMINISTRADOR, UserRole.TECNICO]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
