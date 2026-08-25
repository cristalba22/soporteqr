import { zodResolver } from '@hookform/resolvers/zod';
import {
  createCommentSchema,
  TICKET_STATUS_TRANSITIONS,
  TicketStatus,
  TicketPriority,
  UserRole,
  type CreateCommentInput,
} from '@soporteqr/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { api, ApiError, downloadAttachment, uploadAttachment } from '../lib/api';
import { ESTADO_CLASSES, ESTADO_LABELS, PRIORIDAD_CLASSES, PRIORIDAD_LABELS, formatFecha } from '../lib/labels';

interface Persona {
  id: string;
  nombre: string;
  email: string;
}

interface Comentario {
  id: string;
  contenido: string;
  interno: boolean;
  createdAt: string;
  author: { id: string; nombre: string };
}

interface Adjunto {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

interface HistorialItem {
  id: string;
  estadoAnterior: TicketStatus | null;
  estadoNuevo: TicketStatus | null;
  descripcion: string;
  createdAt: string;
  actor: { id: string; nombre: string };
}

interface TicketDetalle {
  id: string;
  numero: string;
  titulo: string;
  descripcion: string;
  estado: TicketStatus;
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  prioridadCalculada: TicketPriority;
  prioridadMotivo: string | null;
  diagnostico: string | null;
  solucion: string | null;
  createdAt: string;
  asset: { id: string; codigoInterno: string; publicAssetCode: string; tipo: string };
  reportante: Persona;
  tecnico: Persona | null;
  categoria: { id: string; nombre: string } | null;
  location: { id: string; nombre: string };
  comentarios: Comentario[];
  adjuntos: Adjunto[];
  historial: HistorialItem[];
}

interface Tecnico {
  id: string;
  nombre: string;
  role: UserRole;
}

export function TicketDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const esGestor = user?.role === UserRole.TECNICO || user?.role === UserRole.ADMINISTRADOR;

  const [estadoDestino, setEstadoDestino] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [solucion, setSolucion] = useState('');
  const [tecnicoId, setTecnicoId] = useState('');
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const [prioridadDestino, setPrioridadDestino] = useState('');
  const [motivoPrioridad, setMotivoPrioridad] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => api.get<{ ticket: TicketDetalle }>(`/api/tickets/${id}`),
    enabled: Boolean(id),
  });

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get<{ users: Tecnico[] }>('/api/users/technicians'),
    enabled: esGestor,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { contenido: '', interno: false },
  });

  const ticket = data?.ticket;
  const tecnicos = usuarios?.users.filter((u) => u.role === UserRole.TECNICO) ?? [];
  const transicionesValidas = ticket ? TICKET_STATUS_TRANSITIONS[ticket.estado] : [];

  const onComentar = async (input: CreateCommentInput) => {
    if (!id) return;
    try {
      await api.post(`/api/tickets/${id}/comentarios`, input);
      reset({ contenido: '', interno: false });
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    } catch (error) {
      setErrorAccion(error instanceof ApiError ? error.message : 'No se pudo agregar el comentario');
    }
  };

  const onSubirAdjunto = async () => {
    if (!id || !archivo) return;
    setSubiendoArchivo(true);
    setErrorAccion(null);
    try {
      await uploadAttachment(id, archivo);
      setArchivo(null);
      await queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    } catch (error) {
      setErrorAccion(error instanceof ApiError ? error.message : 'No se pudo subir la imagen');
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const onCambiarEstado = async () => {
    if (!id || !estadoDestino) return;
    setErrorAccion(null);
    setGuardando(true);
    try {
      await api.post(`/api/tickets/${id}/estado`, {
        estado: estadoDestino,
        ...(diagnostico ? { diagnostico } : {}),
        ...(solucion ? { solucion } : {}),
      });
      setEstadoDestino('');
      setDiagnostico('');
      setSolucion('');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    } catch (error) {
      setErrorAccion(error instanceof ApiError ? error.message : 'No se pudo cambiar el estado');
    } finally {
      setGuardando(false);
    }
  };

  const onAsignar = async () => {
    if (!id || !tecnicoId) return;
    setErrorAccion(null);
    setGuardando(true);
    try {
      await api.post(`/api/tickets/${id}/asignar`, { technicianId: tecnicoId });
      setTecnicoId('');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    } catch (error) {
      setErrorAccion(error instanceof ApiError ? error.message : 'No se pudo asignar el ticket');
    } finally {
      setGuardando(false);
    }
  };

  const onCambiarPrioridad = async () => {
    if (!id || !prioridadDestino || motivoPrioridad.trim().length < 10) return;
    setErrorAccion(null);
    setGuardando(true);
    try {
      await api.post(`/api/tickets/${id}/prioridad`, { prioridad: prioridadDestino, motivo: motivoPrioridad });
      setPrioridadDestino('');
      setMotivoPrioridad('');
      await queryClient.invalidateQueries({ queryKey: ['ticket', id] });
    } catch (error) {
      setErrorAccion(error instanceof ApiError ? error.message : 'No se pudo ajustar la prioridad');
    } finally {
      setGuardando(false);
    }
  };

  if (isLoading) return <p className="text-sm text-grafito-500">Cargando ticket...</p>;
  if (isError || !ticket) return <p className="text-sm text-red-600">No se pudo cargar el ticket.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-xl border border-grafito-200 bg-white p-6 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="font-mono text-xs text-grafito-500">{ticket.numero}</span>
            <h1 className="text-xl font-semibold text-marino-950">{ticket.titulo}</h1>
          </div>
          <div className="flex gap-2">
            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${ESTADO_CLASSES[ticket.estado]}`}>
              {ESTADO_LABELS[ticket.estado]}
            </span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${PRIORIDAD_CLASSES[ticket.prioridad]}`}>
              {PRIORIDAD_LABELS[ticket.prioridad]}
            </span>
          </div>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-sm text-marino-800">{ticket.descripcion}</p>

        {ticket.prioridadMotivo && (
          <div className="mt-4 rounded-lg border border-turquesa-500/20 bg-turquesa-500/5 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-turquesa-600">Prioridad calculada: {PRIORIDAD_LABELS[ticket.prioridadCalculada]}</p>
            <p className="mt-1 text-sm text-marino-800">{ticket.prioridadMotivo}</p>
            {ticket.prioridad !== ticket.prioridadCalculada && <p className="mt-1 text-xs text-amber-700">La prioridad actual fue ajustada por un gestor. El motivo figura en el historial.</p>}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-grafito-200 pt-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-grafito-500">Activo</p>
            <p className="text-marino-900">{ticket.asset.tipo} · {ticket.asset.codigoInterno}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-grafito-500">Ubicacion</p>
            <p className="text-marino-900">{ticket.location.nombre}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-grafito-500">Categoria</p>
            <p className="text-marino-900">{ticket.categoria?.nombre ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-grafito-500">Reportante</p>
            <p className="text-marino-900">{ticket.reportante.nombre}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-grafito-500">Tecnico</p>
            <p className="text-marino-900">{ticket.tecnico?.nombre ?? 'Sin asignar'}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-grafito-500">Creado</p>
            <p className="text-marino-900">{formatFecha(ticket.createdAt)}</p>
          </div>
        </div>

        {(ticket.diagnostico || ticket.solucion) && (
          <div className="mt-5 grid grid-cols-1 gap-4 border-t border-grafito-200 pt-4 sm:grid-cols-2">
            {ticket.diagnostico && (
              <div>
                <p className="text-xs uppercase tracking-wide text-grafito-500">Diagnostico</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-marino-800">{ticket.diagnostico}</p>
              </div>
            )}
            {ticket.solucion && (
              <div>
                <p className="text-xs uppercase tracking-wide text-grafito-500">Solucion</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-marino-800">{ticket.solucion}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-5 border-t border-grafito-200 pt-4">
          <p className="text-xs uppercase tracking-wide text-grafito-500">Adjuntos</p>
          {ticket.adjuntos.length > 0 && (
            <ul className="mt-2 space-y-2 text-sm text-marino-800">
              {ticket.adjuntos.map((adjunto) => (
                <li key={adjunto.id} className="flex items-center justify-between rounded-lg bg-grafito-100 px-3 py-2">
                  <span>{adjunto.fileName} <span className="text-xs text-grafito-500">({Math.ceil(adjunto.sizeBytes / 1024)} KB)</span></span>
                  <button type="button" onClick={() => void downloadAttachment(ticket.id, adjunto.id, adjunto.fileName)} className="font-semibold text-turquesa-600 hover:underline">Descargar</button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setArchivo(event.target.files?.[0] ?? null)} className="text-sm text-grafito-600 file:mr-3 file:rounded-lg file:border-0 file:bg-grafito-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-marino-900" />
            <button type="button" disabled={!archivo || subiendoArchivo} onClick={() => void onSubirAdjunto()} className="rounded-lg bg-marino-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {subiendoArchivo ? 'Subiendo...' : 'Adjuntar imagen'}
            </button>
          </div>
          <p className="mt-1 text-xs text-grafito-500">PNG, JPG o WebP. Maximo 5 MB.</p>
        </div>
      </div>

      {esGestor && (
        <div className="space-y-4 rounded-xl border border-grafito-200 bg-white p-6 shadow-panel">
          <h2 className="text-sm font-semibold text-marino-950">Gestion del ticket</h2>
          {errorAccion && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorAccion}
            </div>
          )}

          {!ticket.tecnico && (
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label htmlFor="technicianId" className="mb-1 block text-xs font-medium text-marino-800">Asignar tecnico</label>
                <select
                  id="technicianId"
                  value={tecnicoId}
                  onChange={(e) => setTecnicoId(e.target.value)}
                  className="rounded-lg border border-grafito-300 bg-white px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500"
                >
                  <option value="">Seleccionar...</option>
                  {tecnicos.map((tecnico) => (
                    <option key={tecnico.id} value={tecnico.id}>
                      {tecnico.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={!tecnicoId || guardando}
                onClick={onAsignar}
                className="rounded-lg bg-marino-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Asignar
              </button>
            </div>
          )}

          <div className="space-y-3 border-t border-grafito-200 pt-4">
            <p className="text-xs font-medium text-marino-800">Ajustar prioridad (requiere justificacion)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_1fr_auto]">
              <select value={prioridadDestino} onChange={(event) => setPrioridadDestino(event.target.value)} aria-label="Nueva prioridad" className="rounded-lg border border-grafito-300 bg-white px-3 py-2 text-sm text-marino-900">
                <option value="">Seleccionar...</option>
                {Object.values(TicketPriority).filter((value) => value !== ticket.prioridad).map((value) => <option key={value} value={value}>{PRIORIDAD_LABELS[value]}</option>)}
              </select>
              <input value={motivoPrioridad} onChange={(event) => setMotivoPrioridad(event.target.value)} placeholder="Motivo concreto del ajuste" aria-label="Motivo del ajuste de prioridad" className="rounded-lg border border-grafito-300 px-3 py-2 text-sm text-marino-900" />
              <button type="button" disabled={!prioridadDestino || motivoPrioridad.trim().length < 10 || guardando} onClick={() => void onCambiarPrioridad()} className="rounded-lg bg-marino-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Aplicar</button>
            </div>
          </div>

          {transicionesValidas.length > 0 && (
            <div className="space-y-3 border-t border-grafito-200 pt-4">
              <div>
                <label htmlFor="ticketStatus" className="mb-1 block text-xs font-medium text-marino-800">Cambiar estado</label>
                <select
                  id="ticketStatus"
                  value={estadoDestino}
                  onChange={(e) => setEstadoDestino(e.target.value)}
                  className="rounded-lg border border-grafito-300 bg-white px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500"
                >
                  <option value="">Seleccionar...</option>
                  {transicionesValidas.map((estado) => (
                    <option key={estado} value={estado}>
                      {ESTADO_LABELS[estado]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <textarea
                  placeholder="Diagnostico (opcional)"
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-grafito-300 px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500"
                />
                <textarea
                  placeholder="Solucion (opcional)"
                  value={solucion}
                  onChange={(e) => setSolucion(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-grafito-300 px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500"
                />
              </div>
              <button
                type="button"
                disabled={!estadoDestino || guardando}
                onClick={onCambiarEstado}
                className="rounded-lg bg-turquesa-500 px-4 py-2 text-sm font-semibold text-marino-950 disabled:opacity-50"
              >
                Guardar cambio de estado
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-grafito-200 bg-white p-6 shadow-panel">
        <h2 className="text-sm font-semibold text-marino-950">Comentarios</h2>
        <div className="mt-4 space-y-3">
          {ticket.comentarios.length === 0 && (
            <p className="text-sm text-grafito-500">Todavia no hay comentarios.</p>
          )}
          {ticket.comentarios.map((comentario) => (
            <div
              key={comentario.id}
              className={`rounded-lg border px-3 py-2.5 text-sm ${
                comentario.interno ? 'border-amber-200 bg-amber-50' : 'border-grafito-200 bg-grafito-100/60'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-grafito-500">
                <span className="font-medium text-marino-800">{comentario.author.nombre}</span>
                <span>{formatFecha(comentario.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-marino-900">{comentario.contenido}</p>
              {comentario.interno && (
                <span className="mt-1 inline-block text-xs font-medium text-amber-700">Nota interna</span>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onComentar)} className="mt-4 space-y-2 border-t border-grafito-200 pt-4">
          <textarea
            rows={3}
            placeholder="Escribe un comentario..."
            className="w-full rounded-lg border border-grafito-300 px-3 py-2 text-sm text-marino-900 outline-none focus:border-turquesa-500 focus:ring-2 focus:ring-turquesa-500/20"
            {...register('contenido')}
          />
          {errors.contenido && <p className="text-xs text-red-600">{errors.contenido.message}</p>}
          <div className="flex items-center justify-between">
            {esGestor ? (
              <label className="flex items-center gap-2 text-xs text-grafito-500">
                <input type="checkbox" {...register('interno')} />
                Nota interna (no visible para el empleado)
              </label>
            ) : (
              <span />
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-marino-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Comentar
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-grafito-200 bg-white p-6 shadow-panel">
        <h2 className="text-sm font-semibold text-marino-950">Historial</h2>
        <ol className="mt-4 space-y-3 border-l border-grafito-200 pl-4">
          {ticket.historial.map((item) => (
            <li key={item.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-turquesa-500" />
              <p className="text-marino-900">{item.descripcion}</p>
              <p className="text-xs text-grafito-500">
                {item.actor.nombre} · {formatFecha(item.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
