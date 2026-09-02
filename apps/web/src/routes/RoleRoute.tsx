import type { UserRole } from '@soporteqr/shared';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export function RoleRoute({ roles }: { roles: UserRole[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/tickets" replace />;

  return <Outlet />;
}
