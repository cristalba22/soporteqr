import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-grafito-100">
        <p className="text-sm text-grafito-500">Cargando sesion...</p>
      </div>
    );
  }

  if (!user) {
    if (location.pathname === '/') return <Navigate to="/presentacion" replace />;
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
