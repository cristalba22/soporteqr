import { UserRole } from '@soporteqr/shared';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

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
  { to: '/administracion', label: 'Administración', roles: [UserRole.ADMINISTRADOR] },
];

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.EMPLEADO]: 'Empleado',
  [UserRole.TECNICO]: 'Técnico',
  [UserRole.ADMINISTRADOR]: 'Administrador',
};

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const items = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  const sidebar = (
    <>
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-turquesa-500 text-sm font-bold text-marino-950">
          QR
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">SoporteQR</p>
          <p className="text-xs text-marino-300">Activos e incidencias</p>
        </div>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3" aria-label="Navegación principal">
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
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-grafito-100 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-marino-950 text-white lg:flex">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-grafito-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-turquesa-500 text-sm font-bold text-marino-950">QR</span>
          <div>
            <p className="text-sm font-bold text-marino-950">SoporteQR</p>
            <p className="text-[11px] text-grafito-500">{user ? ROLE_LABELS[user.role] : ''}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuAbierto}
          aria-controls="menu-movil"
          onClick={() => setMenuAbierto((actual) => !actual)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-grafito-200 bg-white text-marino-950 shadow-sm"
        >
          <span className="sr-only">Menú</span>
          <span className="space-y-1.5" aria-hidden="true">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
      </header>

      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
            className="absolute inset-0 bg-marino-950/60 backdrop-blur-sm"
          />
          <aside id="menu-movil" className="relative flex h-full w-[min(82vw,20rem)] flex-col bg-marino-950 text-white shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
