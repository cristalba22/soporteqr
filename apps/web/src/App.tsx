import { UserRole } from '@soporteqr/shared';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';

const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })),
);
const AssetDetailPage = lazy(() =>
  import('./pages/AssetDetailPage').then((module) => ({ default: module.AssetDetailPage })),
);
const AssetsPage = lazy(() =>
  import('./pages/AssetsPage').then((module) => ({ default: module.AssetsPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const ReportarPage = lazy(() =>
  import('./pages/ReportarPage').then((module) => ({ default: module.ReportarPage })),
);
const TicketDetallePage = lazy(() =>
  import('./pages/TicketDetallePage').then((module) => ({ default: module.TicketDetallePage })),
);
const TicketNuevoPage = lazy(() =>
  import('./pages/TicketNuevoPage').then((module) => ({ default: module.TicketNuevoPage })),
);
const TicketsPage = lazy(() =>
  import('./pages/TicketsPage').then((module) => ({ default: module.TicketsPage })),
);

export function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-grafito-100 text-sm font-semibold text-grafito-500">
          Cargando SoporteQR…
        </div>
      }
    >
      <Routes>
        <Route path="/reportar/:publicAssetCode" element={<ReportarPage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/presentacion" element={<Navigate to="/" replace />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/tickets/nuevo" element={<TicketNuevoPage />} />
            <Route path="/tickets/:id" element={<TicketDetallePage />} />
            <Route element={<RoleRoute roles={[UserRole.ADMINISTRADOR, UserRole.TECNICO]} />}>
              <Route path="/activos" element={<AssetsPage />} />
              <Route path="/activos/:id" element={<AssetDetailPage />} />
            </Route>
            <Route element={<RoleRoute roles={[UserRole.ADMINISTRADOR, UserRole.TECNICO]} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
            </Route>
            <Route element={<RoleRoute roles={[UserRole.ADMINISTRADOR]} />}>
              <Route path="/administracion" element={<AdminPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
