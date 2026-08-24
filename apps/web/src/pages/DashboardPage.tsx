import { UserRole } from '@soporteqr/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../lib/api';
import { ESTADO_HEX, ESTADO_LABELS, PRIORIDAD_CLASSES, PRIORIDAD_HEX, PRIORIDAD_LABELS } from '../lib/labels';

function ArrowIcon({ direction = 'right' }: { direction?: 'right' | 'up' | 'down' }) {
  const path = direction === 'right' ? 'M5 12h14m-6-6 6 6-6 6' : 'M12 19V5m-6 6 6-6 6 6';
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`h-4 w-4 ${direction === 'down' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function Trend({ value, inverse = false }: { value: number | null; inverse?: boolean }) {
  if (value === null) {
    return <span className="rounded-full bg-grafito-100 px-2 py-1 text-xs font-semibold text-grafito-500">Sin base anterior</span>;
  }
  const positive = inverse ? value <= 0 : value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      <ArrowIcon direction={value >= 0 ? 'up' : 'down'} />
      {Math.abs(value)}% vs. período anterior
    </span>
  );
}

function MetricCard({ eyebrow, value, detail, trend, inverseTrend }: { eyebrow: string; value: string; detail: string; trend?: number | null; inverseTrend?: boolean }) {
  return (
    <article className="group rounded-2xl border border-grafito-200 bg-white p-5 shadow-panel transition-transform hover:-translate-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-grafito-500">{eyebrow}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-tight text-marino-950">{value}</p>
        {trend !== undefined && <Trend value={trend} inverse={inverseTrend} />}
      </div>
      <p className="mt-2 text-sm text-grafito-500">{detail}</p>
    </article>
  );
}

function Panel({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-grafito-200 bg-white p-5 shadow-panel ${className}`}>
      <div className="mb-5">
        <h2 className="font-semibold text-marino-950">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-grafito-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

const formatMes = (mes: string) => new Date(mes).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
const formatHoras = (horas: number) => {
  const horasEnteras = Math.floor(horas);
  const minutos = Math.round((horas - horasEnteras) * 60);
  return minutos > 0 ? `${horasEnteras} h ${minutos} min` : `${horasEnteras} h`;
};
const tiempoRelativo = (fecha: string) => {
  const horas = Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 3_600_000));
  if (horas < 1) return 'Actualizado hace menos de 1 h';
  if (horas < 24) return `Actualizado hace ${horas} h`;
  return `Actualizado hace ${Math.floor(horas / 24)} d`;
};

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardSummary });

  if (isLoading) return <p className="text-sm text-grafito-500">Calculando el pulso operativo...</p>;
  if (isError || !data) return <p className="text-sm text-red-600">No se pudo calcular el pulso operativo.</p>;

  const porEstado = data.distribucionPorEstado.map((item) => ({ key: item.estado, nombre: ESTADO_LABELS[item.estado], total: item.total, color: ESTADO_HEX[item.estado] }));
  const porPrioridad = data.distribucionPorPrioridad.map((item) => ({ key: item.prioridad, nombre: PRIORIDAD_LABELS[item.prioridad], total: item.total, color: PRIORIDAD_HEX[item.prioridad] }));
  const porCategoria = data.distribucionPorCategoria.map((item) => ({ nombre: item.categoria, total: item.total }));
  const evolucion = data.evolucionMensual.map((item) => ({ nombre: formatMes(item.mes), total: item.total }));
  const totalTickets = data.ticketsAbiertos + data.ticketsResueltos;
  const tasaResolucion = Math.round((data.ticketsResueltos / Math.max(1, totalTickets)) * 100);
  const maxCategoria = Math.max(1, ...porCategoria.map((item) => item.total));
  const indiceControl = Math.max(0, Math.min(100, 100 - data.criticosAbiertos * 14 - data.sinAsignar * 6 - data.sinActividad * 4));
  const estadoControl = indiceControl >= 80 ? 'Operación estable' : indiceControl >= 55 ? 'Atención recomendada' : 'Intervención necesaria';
  const colorControl = indiceControl >= 80 ? '#1fc7b6' : indiceControl >= 55 ? '#f59e0b' : '#ef4444';
  const prioridadTotal = Math.max(1, porPrioridad.reduce((total, item) => total + item.total, 0));
  const maxCarga = Math.max(1, ...data.cargaPorTecnico.map((item) => item.total));
  const senales = [
    { label: 'Críticos abiertos', value: data.criticosAbiertos, detail: data.criticosAbiertos === 0 ? 'Sin emergencias activas' : 'Requieren respuesta inmediata', href: '/?prioridad=CRITICA', tone: 'text-red-300' },
    { label: 'Sin responsable', value: data.sinAsignar, detail: data.sinAsignar === 0 ? 'Todo el trabajo está asignado' : 'Esperando asignación técnica', href: '/?estado=NUEVO', tone: 'text-amber-300' },
    { label: 'Casos estancados', value: data.sinActividad, detail: data.sinActividad === 0 ? 'Flujo operativo al día' : 'Más de 24 h sin actividad', href: '/', tone: 'text-violet-300' },
  ];

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-turquesa-600">
            <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-turquesa-400 opacity-40" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-turquesa-500" /></span>
            Señal en vivo
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-marino-950">Pulso operativo</h1>
          <p className="mt-1 text-sm text-grafito-500">Lo que necesita una decisión ahora, no solamente lo que ya pasó.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-xs text-grafito-500 sm:block">Ventana móvil<strong className="block text-sm text-marino-900">Últimos 30 días</strong></span>
          {user?.role === UserRole.ADMINISTRADOR && <Link to="/administracion" className="inline-flex items-center gap-2 rounded-xl bg-marino-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-marino-800">Administrar sistema <ArrowIcon /></Link>}
        </div>
      </header>

      <section className="grid items-start gap-4 lg:grid-cols-[1.45fr_0.9fr]">
        <div className="relative overflow-hidden rounded-3xl bg-marino-950 p-6 text-white shadow-panel sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 18% 48%, rgba(31,199,182,.2), transparent 30%), linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)', backgroundSize: 'auto, 28px 28px, 28px 28px' }} />
          <div className="relative grid gap-8 md:grid-cols-[220px_1fr] md:items-center">
            <div className="mx-auto text-center">
              <div className="grid h-48 w-48 place-items-center rounded-full p-2 shadow-[0_0_70px_rgba(31,199,182,.18)]" style={{ background: `conic-gradient(${colorControl} ${indiceControl * 3.6}deg, rgba(255,255,255,.09) 0deg)` }}>
                <div className="grid h-full w-full place-items-center rounded-full border border-white/10 bg-marino-950"><div><p className="text-5xl font-semibold tracking-tight">{indiceControl}</p><p className="mt-1 text-xs uppercase tracking-[0.2em] text-marino-300">Índice de control</p></div></div>
              </div>
              <p className="mt-4 font-semibold" style={{ color: colorControl }}>{estadoControl}</p>
              <p className="mt-1 text-xs text-marino-300">Se recalcula con criticidad, asignación y actividad.</p>
            </div>
            <div>
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-marino-300">Radar de riesgo</p><span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-marino-200">{tasaResolucion}% resuelto</span></div>
                <h2 className="mt-1 text-xl font-semibold">Tres señales que mueven la operación</h2>
              </div>
              <div className="space-y-2">
                {senales.map((senal) => <Link key={senal.label} to={senal.href} className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition-colors hover:bg-white/[0.09]"><div><p className="text-sm font-medium text-white">{senal.label}</p><p className="mt-0.5 text-xs text-marino-300">{senal.detail}</p></div><div className="flex items-center gap-3"><span className={`text-3xl font-semibold ${senal.tone}`}>{senal.value}</span><span className="text-marino-400 transition-transform group-hover:translate-x-1"><ArrowIcon /></span></div></Link>)}
              </div>
            </div>
          </div>
        </div>

        <Panel title="Próxima mejor acción" subtitle="Ordenada por criticidad, asignación y tiempo sin actividad." className="min-h-[390px]">
          {data.atencionPrioritaria.length === 0 ? (
            <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-xl text-emerald-700">✓</span><p className="mt-3 font-semibold text-emerald-900">Sin bloqueos detectados</p><p className="mt-1 text-sm text-emerald-700">La operación no requiere intervención inmediata.</p></div></div>
          ) : (
            <ol className="space-y-2">
              {data.atencionPrioritaria.map((ticket, index) => <li key={ticket.id}><Link to={`/tickets/${ticket.id}`} className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-xl border border-grafito-200 p-3 transition-colors hover:border-turquesa-300 hover:bg-turquesa-50/40"><span className="grid h-8 w-8 place-items-center rounded-lg bg-marino-950 text-xs font-semibold text-white">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] text-grafito-500">{ticket.numero}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${PRIORIDAD_CLASSES[ticket.prioridad]}`}>{ticket.motivo}</span></span><span className="mt-1 block truncate text-sm font-semibold text-marino-950">{ticket.titulo}</span><span className="mt-0.5 block text-xs text-grafito-500">{ticket.assetCode} · {ticket.location} · {tiempoRelativo(ticket.updatedAt)}</span></span><span className="text-grafito-400 transition-transform group-hover:translate-x-1 group-hover:text-turquesa-600"><ArrowIcon /></span></Link></li>)}
            </ol>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard eyebrow="Demanda nueva" value={String(data.creadosUltimos30)} detail="Tickets creados en los últimos 30 días" trend={data.variacionCreados} inverseTrend />
        <MetricCard eyebrow="Capacidad de cierre" value={String(data.resueltosUltimos30)} detail="Tickets resueltos en los últimos 30 días" trend={data.variacionResueltos} />
        <MetricCard eyebrow="Velocidad de resolución" value={formatHoras(data.tiempoPromedioResolucionHoras)} detail={`${data.esperandoUsuario} esperando al usuario · ${data.ticketsAbiertos} abiertos`} />
      </section>

      <Panel title="Flujo vivo" subtitle="Cada etapa es una puerta directa a la cola de trabajo correspondiente.">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {porEstado.map((estado) => { const porcentaje = Math.round((estado.total / Math.max(1, totalTickets)) * 100); return <Link key={estado.key} to={`/?estado=${estado.key}`} className="group relative overflow-hidden rounded-xl border border-grafito-200 bg-grafito-100/50 p-4 transition-colors hover:border-grafito-300 hover:bg-white"><span className="absolute bottom-0 left-0 h-1 transition-all group-hover:h-1.5" style={{ width: `${porcentaje}%`, backgroundColor: estado.color }} /><span className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-grafito-600">{estado.nombre}</span><span className="h-2 w-2 rounded-full" style={{ backgroundColor: estado.color }} /></span><span className="mt-3 block text-2xl font-semibold text-marino-950">{estado.total}</span><span className="text-xs text-grafito-500">{porcentaje}% del total</span></Link>; })}
        </div>
      </Panel>

      <section className="grid gap-4 lg:grid-cols-2">
        <Panel title="Mapa de presión" subtitle="La mezcla de prioridades revela dónde se concentra el riesgo.">
          <div className="mb-6 flex h-3 overflow-hidden rounded-full bg-grafito-100">{porPrioridad.map((prioridad) => <span key={prioridad.key} title={`${prioridad.nombre}: ${prioridad.total}`} style={{ width: `${(prioridad.total / prioridadTotal) * 100}%`, backgroundColor: prioridad.color }} />)}</div>
          <div className="grid grid-cols-2 gap-3">{porPrioridad.map((prioridad) => <Link key={prioridad.key} to={`/?prioridad=${prioridad.key}`} className="flex items-center justify-between rounded-xl border border-grafito-200 p-3 hover:bg-grafito-100/60"><span className="flex items-center gap-2 text-sm text-grafito-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: prioridad.color }} />{prioridad.nombre}</span><strong className="text-lg text-marino-950">{prioridad.total}</strong></Link>)}</div>
        </Panel>
        <Panel title="Trayectoria de demanda" subtitle="Volumen mensual para anticipar capacidad, no sólo explicar el pasado.">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={evolucion}><defs><linearGradient id="evolucionFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1fc7b6" stopOpacity={0.42} /><stop offset="100%" stopColor="#1fc7b6" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} /><XAxis dataKey="nombre" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Area type="monotone" dataKey="total" stroke="#12a396" strokeWidth={3} fill="url(#evolucionFill)" /></AreaChart></ResponsiveContainer></div>
        </Panel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Origen de la demanda" subtitle="Categorías que más consumen capacidad técnica.">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={porCategoria} layout="vertical" margin={{ left: 8 }}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="nombre" width={105} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip /><Bar dataKey="total" radius={[0, 6, 6, 0]}>{porCategoria.map((categoria) => <Cell key={categoria.nombre} fill={categoria.total === maxCategoria ? '#1fc7b6' : '#2f4a7a'} />)}</Bar></BarChart></ResponsiveContainer></div>
        </Panel>
        <Panel title="Carga del equipo" subtitle="Distribución visible para evitar cuellos de botella y reasignar a tiempo.">
          <div className="space-y-4">{data.cargaPorTecnico.length === 0 && <p className="text-sm text-grafito-500">Sin datos disponibles.</p>}{data.cargaPorTecnico.map((tecnico) => <div key={tecnico.technicianId ?? 'sin-asignar'}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-medium text-marino-900"><span className="grid h-8 w-8 place-items-center rounded-full bg-turquesa-50 text-xs font-bold text-turquesa-700">{tecnico.nombre.slice(0, 1).toUpperCase()}</span>{tecnico.nombre}</span><span className="font-semibold text-marino-950">{tecnico.total} tickets</span></div><div className="ml-10 h-2 overflow-hidden rounded-full bg-grafito-100"><div className="h-full rounded-full bg-gradient-to-r from-turquesa-500 to-marino-600" style={{ width: `${(tecnico.total / maxCarga) * 100}%` }} /></div></div>)}</div>
        </Panel>
      </section>

      <Panel title="Activos que piden atención" subtitle="Reincidencia detectada a partir del historial real de tickets.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{data.activosConMasIncidencias.map((asset, index) => <Link key={asset.assetId} to="/activos" className="group rounded-xl border border-grafito-200 p-4 transition-colors hover:border-turquesa-300 hover:bg-turquesa-50/30"><span className="flex items-center justify-between"><span className="font-mono text-xs font-semibold text-marino-700">{asset.codigoInterno}</span><span className="text-xs font-semibold text-grafito-400">#{index + 1}</span></span><span className="mt-4 block text-sm text-grafito-600">{asset.tipo}</span><span className="mt-1 flex items-end justify-between"><strong className="text-2xl text-marino-950">{asset.total}</strong><span className="text-xs text-grafito-500">incidencias</span></span></Link>)}</div>
      </Panel>
    </div>
  );
}
