import { UserRole } from '@soporteqr/shared';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getDashboardSummary } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { ESTADO_LABELS, PRIORIDAD_LABELS } from '../lib/labels';

function KpiCard({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="rounded-xl border border-grafito-200 bg-white p-5 shadow-panel">
      <p className="text-sm text-grafito-500">{etiqueta}</p>
      <p className="mt-2 text-3xl font-semibold text-marino-950">{valor}</p>
    </div>
  );
}

function ChartCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-grafito-200 bg-white p-5 shadow-panel">
      <h2 className="mb-4 text-sm font-semibold text-marino-900">{titulo}</h2>
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
  }));
  const porPrioridad = data.distribucionPorPrioridad.map((p) => ({
    nombre: PRIORIDAD_LABELS[p.prioridad],
    total: p.total,
  }));
  const porCategoria = data.distribucionPorCategoria.map((c) => ({ nombre: c.categoria, total: c.total }));
  const evolucion = data.evolucionMensual.map((e) => ({ nombre: formatMes(e.mes), total: e.total }));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-marino-950 p-6 text-white shadow-panel sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Datos operativos en tiempo real
          </span>
          <h1 className="mt-3 text-2xl font-semibold">Centro de operaciones</h1>
          <p className="mt-1 text-sm text-marino-200">Rendimiento del soporte y salud del parque tecnologico</p>
        </div>
        {user?.role === UserRole.ADMINISTRADOR && (
          <Link to="/administracion" className="rounded-lg bg-turquesa-500 px-4 py-2.5 text-center text-sm font-semibold text-marino-950 hover:bg-turquesa-400">
            Abrir administracion
          </Link>
        )}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard etiqueta="Tickets abiertos" valor={String(data.ticketsAbiertos)} />
        <KpiCard etiqueta="Tickets resueltos" valor={String(data.ticketsResueltos)} />
        <KpiCard
          etiqueta="Tiempo promedio de resolucion"
          valor={`${data.tiempoPromedioResolucionHoras} h`}
        />
        <KpiCard
          etiqueta="Tasa de resolucion"
          valor={`${Math.round((data.ticketsResueltos / Math.max(1, data.ticketsAbiertos + data.ticketsResueltos)) * 100)}%`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard titulo="Tickets por estado">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porEstado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titulo="Tickets por prioridad">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porPrioridad}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titulo="Tickets por categoria">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={porCategoria}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard titulo="Evolucion mensual de tickets">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucion}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={2} dot={false} />
            </LineChart>
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
                <tr key={a.assetId}>
                  <td className="px-4 py-2 font-mono text-xs text-marino-800">{a.codigoInterno}</td>
                  <td className="px-4 py-2 text-marino-800">{a.tipo}</td>
                  <td className="px-4 py-2 text-marino-800">{a.total}</td>
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
                <tr key={t.technicianId ?? 'sin-asignar'}>
                  <td className="px-4 py-2 text-marino-800">{t.nombre}</td>
                  <td className="px-4 py-2 text-marino-800">{t.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
