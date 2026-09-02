import { Link, Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-marino-950 px-4 py-4 text-white sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[90rem] overflow-hidden rounded-[2rem] border border-white/10 bg-marino-900 shadow-2xl sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.08fr_.92fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(31,199,182,.20),transparent_26%),radial-gradient(circle_at_90%_80%,rgba(47,74,122,.45),transparent_30%)]" />
          <div className="absolute inset-0 opacity-[.11] [background-image:linear-gradient(rgba(255,255,255,.14)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.14)_1px,transparent_1px)] [background-size:52px_52px]" />
          <Link to="/" className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-turquesa-400 text-xs font-black text-marino-950">
              QR
            </span>
            <span>
              <strong className="block text-sm">SoporteQR</strong>
              <small className="text-[9px] font-bold uppercase tracking-[.18em] text-marino-300">
                Centro de operaciones
              </small>
            </span>
          </Link>
          <div className="relative max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-turquesa-300">
              Demo interactiva
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-.05em] xl:text-6xl">
              Tres perfiles.
              <br />
              Un mismo historial.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-marino-200">
              Ingresá como empleado, técnico o administrador y recorré el circuito desde el QR hasta
              la decisión operativa.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-2">
              <MiniStat value="01" label="Reporta" />
              <MiniStat value="02" label="Resuelve" />
              <MiniStat value="03" label="Decide" />
            </div>
          </div>
          <div className="relative flex items-center justify-between border-t border-white/10 pt-5 text-[10px] text-marino-300">
            <span>Datos ficticios · Entorno seguro</span>
            <Link to="/" className="font-bold text-turquesa-300 hover:text-white">
              Volver al sitio →
            </Link>
          </div>
        </section>
        <section className="flex items-center justify-center bg-grafito-100 p-5 text-marino-950 sm:p-10 lg:p-12">
          <div className="w-full max-w-lg">
            <Link
              to="/"
              className="mb-7 inline-flex items-center gap-2 text-xs font-bold text-grafito-500 hover:text-marino-950 lg:hidden"
            >
              ← Volver a SoporteQR
            </Link>
            <div className="rounded-[1.75rem] border border-grafito-200 bg-white p-6 shadow-[0_25px_70px_-40px_rgba(5,11,22,.35)] sm:p-8">
              <Outlet />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.045] p-4">
      <span className="font-mono text-xs text-turquesa-300">{value}</span>
      <strong className="mt-5 block text-sm">{label}</strong>
    </div>
  );
}
