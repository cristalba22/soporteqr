import { UserRole } from '@soporteqr/shared';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Pulso operativo',
    icon: '⌁',
    roles: [UserRole.ADMINISTRADOR, UserRole.TECNICO],
  },
  { to: '/tickets', label: 'Tickets', icon: '◇' },
  {
    to: '/activos',
    label: 'Activos',
    icon: '▦',
    roles: [UserRole.ADMINISTRADOR, UserRole.TECNICO],
  },
  { to: '/administracion', label: 'Administración', icon: '⚙', roles: [UserRole.ADMINISTRADOR] },
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
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-turquesa-400 text-xs font-black text-marino-950 shadow-[0_0_28px_rgba(63,224,208,.2)]">
          QR
        </span>
        <div>
          <p className="text-sm font-bold leading-tight">SoporteQR</p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[.14em] text-marino-300">
            Centro de operaciones
          </p>
        </div>
      </div>
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3" aria-label="Navegación principal">
        <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[.2em] text-marino-500">
          Workspace
        </p>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/tickets'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-turquesa-400/10 text-turquesa-300 shadow-[inset_3px_0_0_#3fe0d0]'
                  : 'text-marino-200 hover:bg-white/[.045] hover:text-white'
              }`
            }
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-white/[.07] bg-white/[.035] text-xs">
              {item.icon}
            </span>
            {item.to === '/tickets' && user?.role === UserRole.EMPLEADO
              ? 'Mis solicitudes'
              : item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mx-3 mb-3 rounded-2xl border border-white/[.07] bg-white/[.035] p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            Operación conectada
          </p>
        </div>
        <p className="mt-2 text-[11px] leading-4 text-marino-300">
          API, base y almacenamiento respondiendo.
        </p>
      </div>
      <div className="border-t border-white/[.07] px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-turquesa-400 to-sky-500 text-xs font-black text-marino-950">
            {user?.nombre?.slice(0, 1)}
          </span>
          <span className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user?.nombre}</p>
            <p className="text-[10px] text-marino-300">{user ? ROLE_LABELS[user.role] : ''}</p>
          </span>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-[11px] font-semibold text-marino-200 transition-colors hover:border-turquesa-500 hover:text-turquesa-300"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-grafito-100 lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-marino-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen">
        {sidebar}
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-grafito-200 bg-white/95 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-turquesa-500 text-sm font-bold text-marino-950">
            QR
          </span>
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
          <aside
            id="menu-movil"
            className="relative flex h-full w-[min(82vw,20rem)] flex-col bg-marino-950 text-white shadow-2xl"
          >
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
