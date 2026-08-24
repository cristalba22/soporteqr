import { useQuery } from '@tanstack/react-query';
import { TicketPriority, TicketStatus } from '@soporteqr/shared';
import { Link, useSearchParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
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

export function TicketsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const estado = searchParams.get('estado') ?? '';
  const prioridad = searchParams.get('prioridad') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = 20;

  const updateFilter = (key: 'estado' | 'prioridad', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const updatePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    if (nextPage > 1) next.set('page', String(nextPage));
    else next.delete('page');
    setSearchParams(next);
  };

  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  if (prioridad) params.set('prioridad', prioridad);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tickets', estado, prioridad, page],
    queryFn: () => api.get<TicketListResponse>(`/api/tickets?${params.toString()}`),
  });

  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-marino-950">Tickets</h1>
          <p className="mt-1 text-sm text-grafito-500">
            Incidencias reportadas sobre activos informaticos
          </p>
        </div>
        {user?.role === 'EMPLEADO' && (
          <Link
            to="/tickets/nuevo"
            className="rounded-lg bg-turquesa-500 px-4 py-2.5 text-sm font-semibold text-marino-950 transition-colors hover:bg-turquesa-400"
          >
            Nuevo ticket
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={estado}
          onChange={(e) => updateFilter('estado', e.target.value)}
          className="rounded-lg border border-grafito-300 bg-white px-3 py-2 text-sm text-marino-800 outline-none focus:border-turquesa-500"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((value) => (
            <option key={value} value={value}>
              {ESTADO_LABELS[value]}
            </option>
          ))}
        </select>
        <select
          value={prioridad}
          onChange={(e) => updateFilter('prioridad', e.target.value)}
          className="rounded-lg border border-grafito-300 bg-white px-3 py-2 text-sm text-marino-800 outline-none focus:border-turquesa-500"
        >
          <option value="">Todas las prioridades</option>
          {PRIORIDADES.map((value) => (
            <option key={value} value={value}>
              {PRIORIDAD_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-grafito-200 bg-white shadow-panel">
        {isLoading && <p className="p-6 text-sm text-grafito-500">Cargando tickets...</p>}
        {isError && <p className="p-6 text-sm text-red-600">No se pudieron cargar los tickets.</p>}
        {data && data.tickets.length === 0 && (
          <p className="p-6 text-sm text-grafito-500">No hay tickets con estos filtros.</p>
        )}
        {data && data.tickets.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="bg-grafito-100 text-xs uppercase tracking-wide text-grafito-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Ticket</th>
                <th className="px-4 py-3 font-semibold">Activo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Prioridad</th>
                <th className="px-4 py-3 font-semibold">Tecnico</th>
                <th className="px-4 py-3 font-semibold">Ubicacion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grafito-200">
              {data.tickets.map((ticket) => (
                <tr key={ticket.id} className="transition-colors hover:bg-grafito-100/60">
                  <td className="px-4 py-3">
                    <Link to={`/tickets/${ticket.id}`} className="block">
                      <span className="font-mono text-xs text-grafito-500">{ticket.numero}</span>
                      <p className="font-medium text-marino-900">{ticket.titulo}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-marino-800">
                    {ticket.asset.tipo}
                    <span className="block text-xs text-grafito-500">{ticket.asset.codigoInterno}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${ESTADO_CLASSES[ticket.estado]}`}
                    >
                      {ESTADO_LABELS[ticket.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${PRIORIDAD_CLASSES[ticket.prioridad]}`}
                    >
                      {PRIORIDAD_LABELS[ticket.prioridad]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-marino-800">{ticket.tecnico?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-marino-800">{ticket.location.nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && data.total > pageSize && (
        <div className="flex items-center justify-between text-sm text-grafito-500">
          <span>
            Pagina {page} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updatePage(page - 1)}
              className="rounded-lg border border-grafito-300 px-3 py-1.5 font-medium text-marino-800 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPaginas}
              onClick={() => updatePage(page + 1)}
              className="rounded-lg border border-grafito-300 px-3 py-1.5 font-medium text-marino-800 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
