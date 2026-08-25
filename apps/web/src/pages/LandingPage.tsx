import { Link } from 'react-router-dom';

const BENEFICIOS = [
  ['01', 'Menos fricción', 'El usuario escanea el equipo y reporta sin buscar teléfonos, planillas ni formularios genéricos.'],
  ['02', 'Contexto automático', 'Cada incidencia nace vinculada al activo, la sucursal y su historial técnico.'],
  ['03', 'Decisiones visibles', 'El equipo de soporte prioriza por riesgo, SLA, carga operativa y recurrencia.'],
];

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-marino-950 text-white">
      <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_75%_15%,rgba(31,199,182,0.20),transparent_36%),radial-gradient(circle_at_10%_20%,rgba(47,74,122,0.50),transparent_38%)]" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <div className="flex items-center gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-turquesa-500 text-xs font-black text-marino-950">QR</span><div><p className="font-bold">SoporteQR</p><p className="text-[10px] uppercase tracking-[0.18em] text-marino-300">Soporte conectado</p></div></div>
        <Link to="/login" className="rounded-xl border border-marino-600 px-4 py-2 text-sm font-semibold transition hover:border-turquesa-400 hover:text-turquesa-300">Ingresar a la demo</Link>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-20">
        <div>
          <span className="inline-flex rounded-full border border-turquesa-500/30 bg-turquesa-500/10 px-3 py-1 text-xs font-semibold text-turquesa-300">Gestión técnica orientada al activo</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">Del QR en el equipo a una decisión operativa.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-marino-200 sm:text-lg">SoporteQR conecta activos, incidencias y equipos técnicos en un flujo simple, trazable y medible para organizaciones con múltiples áreas o sucursales.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/login" className="rounded-xl bg-turquesa-500 px-5 py-3 text-sm font-bold text-marino-950 transition hover:bg-turquesa-400">Explorar la demo</Link><a href="#como-funciona" className="rounded-xl border border-marino-600 px-5 py-3 text-sm font-semibold hover:border-marino-300">Cómo funciona</a></div>
          <p className="mt-5 text-xs text-marino-300">Demostración con datos ficticios. Sin información de pacientes ni datos clínicos.</p>
        </div>

        <div className="relative mx-auto w-full max-w-xl rounded-[2rem] border border-marino-600 bg-marino-900/80 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-marino-700 pb-3"><div><p className="text-[10px] uppercase tracking-[0.18em] text-marino-300">Pulso operativo</p><p className="mt-1 text-sm font-semibold">Red de atención · Hoy</p></div><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" /></div>
          <div className="mt-4 grid grid-cols-3 gap-2"><MiniMetric value="14" label="Abiertos" /><MiniMetric value="3" label="En riesgo" accent /><MiniMetric value="87%" label="En SLA" /></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]"><div className="rounded-2xl bg-marino-800 p-4"><p className="text-xs font-semibold text-marino-200">Próxima mejor acción</p><div className="mt-4 space-y-3"><Signal code="T-1042" text="Monitor diagnóstico · Guardia" tone="bg-red-400" /><Signal code="T-1038" text="Impresora etiquetas · Laboratorio" tone="bg-amber-400" /><Signal code="T-1033" text="Terminal admisión · Sede Centro" tone="bg-turquesa-400" /></div></div><div className="rounded-2xl bg-gradient-to-br from-turquesa-500 to-turquesa-600 p-4 text-marino-950"><p className="text-xs font-bold">Capacidad de cierre</p><p className="mt-4 text-4xl font-semibold">+6</p><p className="mt-1 text-xs font-semibold">Alineada con la demanda</p><div className="mt-8 h-1.5 overflow-hidden rounded-full bg-marino-950/15"><div className="h-full w-4/5 rounded-full bg-marino-950" /></div></div></div>
        </div>
      </section>

      <section id="como-funciona" className="relative border-y border-marino-800 bg-white py-20 text-marino-950">
        <div className="mx-auto max-w-7xl px-5 sm:px-8"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-turquesa-600">Una cadena completa</p><h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Cada reporte conserva el contexto.</h2></div><div className="mt-10 grid gap-4 md:grid-cols-3">{BENEFICIOS.map(([numero, titulo, texto]) => <article key={numero} className="rounded-2xl border border-grafito-200 bg-grafito-100/60 p-6"><span className="font-mono text-xs font-bold text-turquesa-600">{numero}</span><h3 className="mt-8 text-xl font-semibold">{titulo}</h3><p className="mt-3 text-sm leading-6 text-grafito-500">{texto}</p></article>)}</div></div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8"><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-turquesa-300">Flujo de 5 minutos</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Escanear. Asignar. Resolver. Aprender.</h2><p className="mt-4 text-sm leading-6 text-marino-200">Empleado, técnico y administrador trabajan sobre el mismo historial, con permisos distintos y una auditoría común.</p></div><ol className="grid gap-3 sm:grid-cols-2"><Step number="1" text="El empleado escanea el QR y reporta." /><Step number="2" text="El responsable prioriza y asigna." /><Step number="3" text="El técnico registra la resolución." /><Step number="4" text="El dashboard transforma actividad en señales." /></ol></div></section>

      <footer className="relative border-t border-marino-800 px-5 py-8 text-center text-xs text-marino-300"><p>SoporteQR es una herramienta de gestión técnica. Su alcance excluye historias clínicas y datos de pacientes.</p></footer>
    </main>
  );
}

function MiniMetric({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) { return <div className={`rounded-xl p-3 ${accent ? 'bg-red-400/10' : 'bg-marino-800'}`}><p className={`text-xl font-semibold ${accent ? 'text-red-300' : 'text-white'}`}>{value}</p><p className="text-[10px] text-marino-300">{label}</p></div>; }
function Signal({ code, text, tone }: { code: string; text: string; tone: string }) { return <div className="flex items-center gap-3"><span className={`h-2 w-2 shrink-0 rounded-full ${tone}`} /><div><p className="font-mono text-[10px] font-bold text-turquesa-300">{code}</p><p className="text-[11px] text-marino-200">{text}</p></div></div>; }
function Step({ number, text }: { number: string; text: string }) { return <li className="flex items-center gap-4 rounded-2xl border border-marino-700 bg-marino-900 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-turquesa-500 text-sm font-bold text-marino-950">{number}</span><p className="text-sm font-semibold text-marino-200">{text}</p></li>; }
