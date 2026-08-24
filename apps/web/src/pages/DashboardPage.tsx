import { UserRole } from '@soporteqr/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getDashboardSummary } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ESTADO_HEX, ESTADO_LABELS, PRIORIDAD_HEX, PRIORIDAD_LABELS } from '../lib/labels';

function KpiCard({
  etiqueta,
  valor,
  acento,
}: {
  etiqueta: string;
  valor: string;
  acento: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-grafito-200 bg-white p-5 shadow-panel">
      <span className="h-10 w-1.5 rounded-full" style={{ backgroundColor: acento }} aria-hidden />
      <div>
        <p className="text-sm text-grafito-500">{etiqueta}</p>
        <p className="mt-1 text-3xl font-semibold text-marino-950">{valor}</p>
      </div>
    </div>
  );
}

function ChartCard({
  titulo,
  leyenda,
  children,
}: {
  titulo: string;
  leyenda?: { nombre: string; color: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-grafito-200 bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-marino-900">{titulo}</h2>
        {leyenda && (
          <ul className="flex flex-wrap gap-3">
            {leyenda.map((item) => (
              <li key={item.nombre} className="flex items-center gap-1.5 text-xs text-grafito-500">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.nombre}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="h-64">{children}</div>
    </div>
  );
}

const formatMes = (mes: string) =>
  new Date(mes).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardSummary,
  });

  if (isLoading) {
    return <p className="text-sm text-grafito-500">Cargando metricas...</p>;
  }

  if (isError || !data) {
    return <p className="text-sm text-red-600">No se pudieron cargar las metricas del dashboard.</p>;
  }

  const porEstado = data.distribucionPorEstado.map((e) => ({
    nombre: ESTADO_LABELS[e.estado],
    total: e.total,
    color: ESTADO_HEX[e.estado],
  }));
  const porPrioridad = data.distribucionPorPrioridad.map((p) => ({
    nombre: PRIORIDAD_LABELS[p.prioridad],
    total: p.total,
    color: PRIORIDAD_HEX[p.prioridad],
  }));
  const porCategoria = data.distribucionPorCategoria.map((c) => ({ nombre: c.categoria, total: c.total }));
  const evolucion = data.evolucionMensual.map((e) => ({ nombre: formatMes(e.mes), total: e.total }));
  const tasaResolucion = Math.round(
    (data.ticketsResueltos / Math.max(1, data.ticketsAbiertos + data.ticketsResueltos)) * 100,
  );
  const maxCategoria = Math.max(1, ...porCategoria.map((c) => c.total));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-marino-950 via-marino-900 to-marino-800 p-6 text-white shadow-panel sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-turquesa-500/10 px-3 py-1 text-xs font-semibold text-turquesa-300">
            <span className="h-2 w-2 rounded-full bg-turquesa-400" /> Datos operativos en tiempo real
          </span>
          <h1 className="mt-3 text-2xl font-semibold">Centro de operaciones</h1>
          <p className="mt-1 text-sm text-marino-200">Rendimiento del soporte y salud del parque tecnologico</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-marino-300">Tasa de resolucion</p>
            <p className="text-2xl font-semibold text-turquesa-300">{tasaResolucion}%</p>
          </div>
          {user?.role === UserRole.ADMINISTRADOR && (
            <Link
              to="/administracion"
              className="rounded-lg bg-turquesa-500 px-4 py-2.5 text-center text-sm font-semibold text-marino-950 hover:bg-turquesa-400"
            >
              Abrir administracion
            </Link>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard etiqueta="Tickets abiertos" valor={String(data.ticketsAbiertos)} acento="#2f4a7a" />
        <KpiCard etiqueta="Tickets resueltos" valor={String(data.ticketsResueltos)} acento="#10b981" />
        <KpiCard
          etiqueta="Tiempo promedio de resolucion"
          valor={`${data.tiempoPromedioResolucionHoras} h`}
          acento="#1fc7b6"
        />
        <KpiCard etiqueta="Tasa de resolucion" valor={`${tasaResolucion}%`} acento="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          titulo="Tickets por estado"
          leyenda={porEstado.map((e) => ({ nombre: e.nombre, color: e.color }))}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porEstado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {porEstado.map((e) => (
                  <Cell key={e.nombre} fill={e.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          titulo="Tickets por prioridad"
          leyenda={porPrioridad.map((p) => ({ nombre: p.nombre, color: p.color }))}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porPrioridad}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {porPrioridad.map((p) => (
                  <Cell key={p.nombre} fill={p.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titulo="Tickets por categoria">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porCategoria} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="nombre" width={110} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {porCategoria.map((c) => (
                  <Cell
                    key={c.nombre}
                    fill={c.total === maxCategoria ? '#1fc7b6' : '#2f4a7a'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titulo="Evolucion mensual de tickets">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolucion}>
              <defs>
                <linearGradient id="evolucionFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1fc7b6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#1fc7b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#12a396"
                strokeWidth={2}
                fill="url(#evolucionFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-grafito-200 bg-white shadow-panel">
          <h2 className="border-b border-grafito-200 px-5 py-4 text-sm font-semibold text-marino-900">
            Activos con mas incidencias
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="bg-grafito-100 text-xs uppercase tracking-wide text-grafito-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Activo</th>
                <th className="px-4 py-2 font-semibold">Tipo</th>
                <th className="px-4 py-2 font-semibold">Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grafito-200">
              {data.activosConMasIncidencias.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-grafito-500">
                    Sin datos disponibles.
                  </td>
                </tr>
              )}
              {data.activosConMasIncidencias.map((a) => (
                <tr key={a.assetId} className="hover:bg-grafito-100/60">
                  <td className="px-4 py-2 font-mono text-xs text-marino-800">{a.codigoInterno}</td>
                  <td className="px-4 py-2 text-marino-800">{a.tipo}</td>
                  <td className="px-4 py-2">
                    <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-marino-200/40 px-2 py-0.5 font-semibold text-marino-700">
                      {a.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-hidden rounded-xl border border-grafito-200 bg-white shadow-panel">
          <h2 className="border-b border-grafito-200 px-5 py-4 text-sm font-semibold text-marino-900">
            Carga por tecnico
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="bg-grafito-100 text-xs uppercase tracking-wide text-grafito-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Tecnico</th>
                <th className="px-4 py-2 font-semibold">Tickets asignados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grafito-200">
              {data.cargaPorTecnico.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-grafito-500">
                    Sin datos disponibles.
                  </td>
                </tr>
              )}
              {data.cargaPorTecnico.map((t) => (
                <tr key={t.technicianId ?? 'sin-asignar'} className="hover:bg-grafito-100/60">
                  <td className="px-4 py-2 text-marino-800">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-turquesa-500/10 text-xs font-semibold text-turquesa-600">
                      {t.nombre.slice(0, 1).toUpperCase()}
                    </span>
                    {t.nombre}
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-marino-200/40 px-2 py-0.5 font-semibold text-marino-700">
                      {t.total}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
