import { UserRole } from '@soporteqr/shared';
import { NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', roles: [UserRole.ADMINISTRADOR, UserRole.TECNICO] },
  { to: '/', label: 'Tickets' },
  { to: '/activos', label: 'Activos', roles: [UserRole.ADMINISTRADOR, UserRole.TECNICO] },
  { to: '/administracion', label: 'Administracion', roles: [UserRole.ADMINISTRADOR] },
];

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.EMPLEADO]: 'Empleado',
  [UserRole.TECNICO]: 'Tecnico',
  [UserRole.ADMINISTRADOR]: 'Administrador',
};

export function AppLayout() {
  const { user, logout } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="flex min-h-screen bg-grafito-100">
      <aside className="flex w-64 shrink-0 flex-col bg-marino-950 text-white">
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-turquesa-500 text-sm font-bold text-marino-950">
            QR
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">SoporteQR</p>
            <p className="text-xs text-marino-300">Activos e incidencias</p>
          </div>
        </div>
        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-marino-900 text-turquesa-300'
                    : 'text-marino-200 hover:bg-marino-900/60 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-marino-900 px-4 py-4">
          <p className="truncate text-sm font-medium text-white">{user?.nombre}</p>
          <p className="text-xs text-marino-300">{user ? ROLE_LABELS[user.role] : ''}</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-3 w-full rounded-lg border border-marino-800 px-3 py-2 text-xs font-semibold text-marino-200 transition-colors hover:border-turquesa-500 hover:text-turquesa-300"
          >
            Cerrar sesion
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
