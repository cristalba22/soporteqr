import { TicketPriority, TicketStatus, UserRole } from '@soporteqr/shared';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { api, getCategories, getLocations } from '../lib/api';
import { ESTADO_CLASSES, ESTADO_LABELS, PRIORIDAD_CLASSES, PRIORIDAD_LABELS } from '../lib/labels';

interface TicketListItem {
  id: string;
  numero: string;
  titulo: string;
  estado: TicketStatus;
  prioridad: TicketPriority;
  createdAt: string;
  asset: { tipo: string; codigoInterno: string };
  location: { nombre: string };
  reportante: { nombre: string };
  tecnico: { nombre: string } | null;
}

interface TicketListResponse {
  tickets: TicketListItem[];
  total: number;
  page: number;
  pageSize: number;
}

const ESTADOS = Object.values(TicketStatus);
const PRIORIDADES = Object.values(TicketPriority);
const SLA_HORAS = 24;
const ESTADOS_CERRADOS = new Set<TicketStatus>([TicketStatus.RESUELTO, TicketStatus.CERRADO]);

const antiguedadHoras = (createdAt: string) => Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000));
const formatAntiguedad = (horas: number) => horas < 24 ? `${horas} h` : `${Math.floor(horas / 24)} d ${horas % 24} h`;

function SlaBadge({ ticket }: { ticket: TicketListItem }) {
  if (ESTADOS_CERRADOS.has(ticket.estado)) {
    return <span className="rounded-full bg-grafito-100 px-2 py-1 text-[11px] font-semibold text-grafito-500">Finalizado</span>;
  }
  const horas = antiguedadHoras(ticket.createdAt);
  const vencido = horas > SLA_HORAS;
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ${vencido ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{vencido ? 'Fuera de SLA' : 'Dentro de SLA'} · {formatAntiguedad(horas)}</span>;
}

export function TicketsPage() {
  const { user } = useAuth();
  const esEmpleado = user?.role === UserRole.EMPLEADO;
  const [searchParams, setSearchParams] = useSearchParams();
  const estado = searchParams.get('estado') ?? '';
  const prioridad = searchParams.get('prioridad') ?? '';
  const locationId = searchParams.get('locationId') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';
  const assetId = searchParams.get('assetId') ?? '';
  const assetCode = searchParams.get('assetCode') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = 20;
  const vista = searchParams.get('vista') === 'finalizados' ? 'FINALIZADOS' : searchParams.get('vista') === 'abiertos' ? 'ABIERTOS' : '';

  const updateFilter = (key: 'estado' | 'prioridad' | 'locationId' | 'categoryId', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };
  const clearAsset = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('assetId');
    next.delete('assetCode');
    next.delete('page');
    setSearchParams(next);
  };
  const clearAll = () => setSearchParams({});
  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) next.set('page', String(nextPage));
    else next.delete('page');
    setSearchParams(next);
  };
  const updateVista = (value: '' | 'ABIERTOS' | 'FINALIZADOS') => {
    const next = new URLSearchParams();
    if (value === 'ABIERTOS') next.set('vista', 'abiertos');
    if (value === 'FINALIZADOS') next.set('vista', 'finalizados');
    setSearchParams(next);
  };

  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (esEmpleado) {
    if (vista) params.set('vista', vista);
  } else {
    if (estado) params.set('estado', estado);
    if (prioridad) params.set('prioridad', prioridad);
    if (locationId) params.set('locationId', locationId);
    if (categoryId) params.set('categoryId', categoryId);
    if (assetId) params.set('assetId', assetId);
  }

  const ticketsQuery = useQuery({
    queryKey: ['tickets', esEmpleado ? 'empleado' : 'gestor', vista, estado, prioridad, locationId, categoryId, assetId, page],
    queryFn: () => api.get<TicketListResponse>(`/api/tickets?${params.toString()}`),
  });
  const locationsQuery = useQuery({ queryKey: ['locations'], queryFn: getLocations, enabled: !esEmpleado });
  const categoriesQuery = useQuery({ queryKey: ['admin-categories'], queryFn: getCategories, enabled: !esEmpleado });
  const abiertosQuery = useQuery({
    queryKey: ['tickets', 'empleado', 'resumen', 'abiertos'],
    queryFn: () => api.get<TicketListResponse>('/api/tickets?vista=ABIERTOS&page=1&pageSize=1'),
    enabled: esEmpleado,
  });
  const finalizadosQuery = useQuery({
    queryKey: ['tickets', 'empleado', 'resumen', 'finalizados'],
    queryFn: () => api.get<TicketListResponse>('/api/tickets?vista=FINALIZADOS&page=1&pageSize=1'),
    enabled: esEmpleado,
  });
  const data = ticketsQuery.data;
  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
  const abiertosVisibles = data?.tickets.filter((ticket) => !ESTADOS_CERRADOS.has(ticket.estado)).length ?? 0;
  const criticosVisibles = data?.tickets.filter((ticket) => ticket.prioridad === TicketPriority.CRITICA && !ESTADOS_CERRADOS.has(ticket.estado)).length ?? 0;
  const sinAsignarVisibles = data?.tickets.filter((ticket) => !ticket.tecnico && !ESTADOS_CERRADOS.has(ticket.estado)).length ?? 0;
  const filtrosActivos = [estado, prioridad, locationId, categoryId, assetId].filter(Boolean).length;
  const dashboardUrl = locationId ? `/dashboard?rango=30d&locationId=${encodeURIComponent(locationId)}` : '/dashboard?rango=30d';

  if (esEmpleado) {
    return (
      <EmployeeTicketsView
        data={data}
        isLoading={ticketsQuery.isLoading}
        isError={ticketsQuery.isError}
        vista={vista}
        onVistaChange={updateVista}
        abiertos={abiertosQuery.data?.total ?? 0}
        finalizados={finalizadosQuery.data?.total ?? 0}
        page={page}
        totalPaginas={totalPaginas}
        pageSize={pageSize}
        onPageChange={updatePage}
      />
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-4 rounded-3xl bg-marino-950 p-6 text-white shadow-panel sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-turquesa-300">Operación diaria</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Cola de tickets</h1>
          <p className="mt-1 text-sm text-marino-200">Prioriza, asigna y resuelve incidencias sin perder el contexto del dashboard.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role !== 'EMPLEADO' && <Link to={dashboardUrl} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-marino-100 hover:bg-white/10">Volver al pulso</Link>}
          {user?.role === 'EMPLEADO' && <Link to="/tickets/nuevo" className="rounded-xl bg-turquesa-500 px-4 py-2.5 text-sm font-semibold text-marino-950 hover:bg-turquesa-400">Nuevo ticket</Link>}
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <QueueMetric label="Resultados" value={data?.total ?? 0} detail={filtrosActivos ? `${filtrosActivos} filtros activos` : 'Vista completa'} color="bg-marino-600" />
        <QueueMetric label="Abiertos visibles" value={abiertosVisibles} detail="En esta página" color="bg-turquesa-500" />
        <QueueMetric label="Críticos visibles" value={criticosVisibles} detail={criticosVisibles ? 'Requieren prioridad' : 'Sin urgencias'} color="bg-red-500" />
        <QueueMetric label="Sin responsable" value={sinAsignarVisibles} detail={sinAsignarVisibles ? 'Listos para asignar' : 'Carga distribuida'} color="bg-amber-500" />
      </section>

      <section aria-label="Filtros de tickets" className="rounded-2xl border border-grafito-200 bg-white p-4 shadow-panel">
        <div className="flex flex-wrap items-center gap-3">
          <FilterSelect label="Estado" value={estado} onChange={(value) => updateFilter('estado', value)} options={ESTADOS.map((value) => ({ value, label: ESTADO_LABELS[value] }))} empty="Todos los estados" />
          <FilterSelect label="Prioridad" value={prioridad} onChange={(value) => updateFilter('prioridad', value)} options={PRIORIDADES.map((value) => ({ value, label: PRIORIDAD_LABELS[value] }))} empty="Todas las prioridades" />
          <FilterSelect label="Sucursal" value={locationId} onChange={(value) => updateFilter('locationId', value)} options={(locationsQuery.data ?? []).map((item) => ({ value: item.id, label: item.nombre }))} empty="Todas las sucursales" />
          <FilterSelect label="Categoría" value={categoryId} onChange={(value) => updateFilter('categoryId', value)} options={(categoriesQuery.data ?? []).map((item) => ({ value: item.id, label: item.nombre }))} empty="Todas las categorías" />
          {filtrosActivos > 0 && <button type="button" onClick={clearAll} className="self-end px-2 py-2 text-xs font-semibold text-red-600 hover:text-red-700">Limpiar filtros</button>}
        </div>
        {assetId && <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-turquesa-50 px-3 py-1.5 text-xs font-semibold text-turquesa-800">Activo: {assetCode || assetId}<button type="button" onClick={clearAsset} aria-label="Quitar filtro de activo" className="text-base leading-none text-turquesa-700">×</button></div>}
      </section>

      <section className="overflow-hidden rounded-2xl border border-grafito-200 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-grafito-200 px-5 py-4">
          <div><h2 className="font-semibold text-marino-950">Incidencias</h2><p className="text-xs text-grafito-500">SLA operativo de {SLA_HORAS} horas</p></div>
          {data && <span className="rounded-full bg-grafito-100 px-3 py-1 text-xs font-semibold text-grafito-600">{data.total} tickets</span>}
        </div>
        {ticketsQuery.isLoading && <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-grafito-100" />)}</div>}
        {ticketsQuery.isError && <p className="p-6 text-sm text-red-600">No se pudieron cargar los tickets.</p>}
        {data?.tickets.length === 0 && <div className="p-10 text-center"><p className="font-semibold text-marino-900">No hay tickets en esta cola</p><p className="mt-1 text-sm text-grafito-500">Probá quitando alguno de los filtros activos.</p></div>}

        {data && data.tickets.length > 0 && <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-grafito-100 text-xs uppercase tracking-wide text-grafito-500"><tr><th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Activo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Prioridad</th><th className="px-4 py-3">SLA</th><th className="px-4 py-3">Responsable</th><th className="px-4 py-3">Sucursal</th></tr></thead>
              <tbody className="divide-y divide-grafito-200">{data.tickets.map((ticket) => <tr key={ticket.id} className="group hover:bg-grafito-100/60"><td className="px-4 py-3"><Link to={`/tickets/${ticket.id}`} className="block"><span className="font-mono text-[11px] text-grafito-500">{ticket.numero}</span><p className="font-semibold text-marino-900 group-hover:text-turquesa-700">{ticket.titulo}</p><span className="text-xs text-grafito-500">Reportó {ticket.reportante.nombre}</span></Link></td><td className="px-4 py-3 text-marino-800">{ticket.asset.tipo}<span className="block font-mono text-xs text-grafito-500">{ticket.asset.codigoInterno}</span></td><td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${ESTADO_CLASSES[ticket.estado]}`}>{ESTADO_LABELS[ticket.estado]}</span></td><td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${PRIORIDAD_CLASSES[ticket.prioridad]}`}>{PRIORIDAD_LABELS[ticket.prioridad]}</span></td><td className="px-4 py-3"><SlaBadge ticket={ticket} /></td><td className="px-4 py-3 text-marino-800">{ticket.tecnico?.nombre ?? <span className="font-semibold text-amber-700">Sin asignar</span>}</td><td className="px-4 py-3 text-grafito-600">{ticket.location.nombre}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="divide-y divide-grafito-200 lg:hidden">{data.tickets.map((ticket) => <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="block p-4 hover:bg-grafito-100/60"><div className="flex items-start justify-between gap-3"><div><span className="font-mono text-[11px] text-grafito-500">{ticket.numero}</span><p className="mt-1 font-semibold text-marino-950">{ticket.titulo}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${PRIORIDAD_CLASSES[ticket.prioridad]}`}>{PRIORIDAD_LABELS[ticket.prioridad]}</span></div><div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[10px] ${ESTADO_CLASSES[ticket.estado]}`}>{ESTADO_LABELS[ticket.estado]}</span><SlaBadge ticket={ticket} /><span className="text-xs text-grafito-500">{ticket.asset.codigoInterno} · {ticket.location.nombre}</span></div></Link>)}</div>
        </>}
      </section>

      {data && data.total > pageSize && <div className="flex items-center justify-between text-sm text-grafito-500"><span>Página {page} de {totalPaginas}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => updatePage(page - 1)} className="rounded-lg border border-grafito-300 px-3 py-1.5 font-medium text-marino-800 disabled:opacity-40">Anterior</button><button type="button" disabled={page >= totalPaginas} onClick={() => updatePage(page + 1)} className="rounded-lg border border-grafito-300 px-3 py-1.5 font-medium text-marino-800 disabled:opacity-40">Siguiente</button></div></div>}
    </div>
  );
}

function EmployeeTicketsView({
  data,
  isLoading,
  isError,
  vista,
  onVistaChange,
  abiertos,
  finalizados,
  page,
  totalPaginas,
  pageSize,
  onPageChange,
}: {
  data?: TicketListResponse;
  isLoading: boolean;
  isError: boolean;
  vista: '' | 'ABIERTOS' | 'FINALIZADOS';
  onVistaChange: (value: '' | 'ABIERTOS' | 'FINALIZADOS') => void;
  abiertos: number;
  finalizados: number;
  page: number;
  totalPaginas: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-5 rounded-3xl bg-marino-950 p-6 text-white shadow-panel sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-turquesa-300">Seguimiento personal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Mis solicitudes</h1>
          <p className="mt-1 max-w-xl text-sm text-marino-200">Acá aparecen únicamente los incidentes que cargaste vos y su avance.</p>
        </div>
        <Link to="/tickets/nuevo" className="rounded-xl bg-turquesa-500 px-4 py-2.5 text-center text-sm font-semibold text-marino-950 hover:bg-turquesa-400">Reportar un problema</Link>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <QueueMetric label="Mis solicitudes" value={abiertos + finalizados} detail="Historial personal" color="bg-marino-600" />
        <QueueMetric label="En seguimiento" value={abiertos} detail="Pendientes o en proceso" color="bg-turquesa-500" />
        <QueueMetric label="Finalizadas" value={finalizados} detail="Resueltas o cerradas" color="bg-emerald-500" />
      </section>

      <section aria-label="Filtrar mis solicitudes" className="flex flex-wrap gap-2 rounded-2xl border border-grafito-200 bg-white p-3 shadow-panel">
        {([
          ['', 'Todas'],
          ['ABIERTOS', 'En seguimiento'],
          ['FINALIZADOS', 'Finalizadas'],
        ] as const).map(([value, label]) => (
          <button key={value || 'todas'} type="button" onClick={() => onVistaChange(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${vista === value ? 'bg-marino-950 text-white' : 'text-grafito-600 hover:bg-grafito-100'}`}>{label}</button>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-grafito-200 bg-white shadow-panel">
        <div className="flex items-center justify-between border-b border-grafito-200 px-5 py-4">
          <div><h2 className="font-semibold text-marino-950">Historial</h2><p className="text-xs text-grafito-500">Ordenado desde el más reciente</p></div>
          {data && <span className="rounded-full bg-grafito-100 px-3 py-1 text-xs font-semibold text-grafito-600">{data.total} solicitudes</span>}
        </div>
        {isLoading && <div className="space-y-3 p-5">{[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-grafito-100" />)}</div>}
        {isError && <p className="p-6 text-sm text-red-600">No pudimos cargar tus solicitudes.</p>}
        {data?.tickets.length === 0 && <div className="p-10 text-center"><p className="font-semibold text-marino-900">No hay solicitudes en esta vista</p><p className="mt-1 text-sm text-grafito-500">Cuando reportes un problema vas a poder seguirlo desde acá.</p><Link to="/tickets/nuevo" className="mt-4 inline-flex rounded-xl bg-turquesa-500 px-4 py-2 text-sm font-semibold text-marino-950">Crear mi primera solicitud</Link></div>}
        {data && data.tickets.length > 0 && <div className="divide-y divide-grafito-200">{data.tickets.map((ticket) => (
          <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="grid gap-4 p-5 transition-colors hover:bg-grafito-100/60 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] text-grafito-500">{ticket.numero}</span><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${ESTADO_CLASSES[ticket.estado]}`}>{ESTADO_LABELS[ticket.estado]}</span></div>
              <h3 className="mt-2 font-semibold text-marino-950">{ticket.titulo}</h3>
              <p className="mt-1 text-sm text-grafito-500">{ticket.asset.tipo} · {ticket.asset.codigoInterno} · {ticket.location.nombre}</p>
            </div>
            <div className="sm:text-right"><p className="text-xs text-grafito-500">Creado el</p><p className="mt-1 text-sm font-medium text-marino-800">{new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(new Date(ticket.createdAt))}</p><p className="mt-2 text-xs font-semibold text-turquesa-700">Ver seguimiento →</p></div>
          </Link>
        ))}</div>}
      </section>

      {data && data.total > pageSize && <div className="flex items-center justify-between text-sm text-grafito-500"><span>Página {page} de {totalPaginas}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-grafito-300 px-3 py-1.5 font-medium text-marino-800 disabled:opacity-40">Anterior</button><button type="button" disabled={page >= totalPaginas} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-grafito-300 px-3 py-1.5 font-medium text-marino-800 disabled:opacity-40">Siguiente</button></div></div>}
    </div>
  );
}

function QueueMetric({ label, value, detail, color }: { label: string; value: number; detail: string; color: string }) {
  return <article className="rounded-2xl border border-grafito-200 bg-white p-4 shadow-panel"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-grafito-500">{label}</p><p className="mt-2 text-3xl font-semibold text-marino-950">{value}</p></div><span className={`h-3 w-3 rounded-full ${color}`} /></div><p className="mt-1 text-xs text-grafito-500">{detail}</p></article>;
}

function FilterSelect({ label, value, onChange, options, empty }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; empty: string }) {
  return <label className="min-w-44 flex-1 text-xs font-semibold text-grafito-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-grafito-200 bg-white px-3 py-2.5 text-sm font-medium text-marino-900 outline-none focus:border-turquesa-500"><option value="">{empty}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
