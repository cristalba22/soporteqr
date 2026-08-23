import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LoginPage } from './pages/LoginPage';
import { ReportarPage } from './pages/ReportarPage';
import { TicketDetallePage } from './pages/TicketDetallePage';
import { TicketNuevoPage } from './pages/TicketNuevoPage';
import { TicketsPage } from './pages/TicketsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

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
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
