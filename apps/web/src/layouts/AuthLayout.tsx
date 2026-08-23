import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-marino-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-marino-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-turquesa-400">
            SoporteQR
          </span>
          <p className="mt-3 text-sm text-grafito-300">
            Gestion de activos e incidencias tecnicas por codigo QR
          </p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-panel">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
