import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_15%_10%,rgba(31,199,182,0.16),transparent_30%),radial-gradient(circle_at_85%_90%,rgba(47,74,122,0.35),transparent_35%),#07111f] px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-marino-900 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-turquesa-400">
            SoporteQR
          </span>
          <p className="mt-3 text-sm text-grafito-300">
            Gestión de activos e incidencias técnicas por código QR
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
