import { TicketPriority, TicketStatus, AssetStatus } from '@soporteqr/shared';

export const ESTADO_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.NUEVO]: 'Nuevo',
  [TicketStatus.ASIGNADO]: 'Asignado',
  [TicketStatus.EN_PROGRESO]: 'En progreso',
  [TicketStatus.ESPERANDO_USUARIO]: 'Esperando usuario',
  [TicketStatus.RESUELTO]: 'Resuelto',
  [TicketStatus.CERRADO]: 'Cerrado',
};

export const ESTADO_CLASSES: Record<TicketStatus, string> = {
  [TicketStatus.NUEVO]: 'bg-marino-200/40 text-marino-700 border-marino-300',
  [TicketStatus.ASIGNADO]: 'bg-turquesa-500/10 text-turquesa-600 border-turquesa-500/30',
  [TicketStatus.EN_PROGRESO]: 'bg-amber-50 text-amber-700 border-amber-200',
  [TicketStatus.ESPERANDO_USUARIO]: 'bg-violet-50 text-violet-700 border-violet-200',
  [TicketStatus.RESUELTO]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [TicketStatus.CERRADO]: 'bg-grafito-100 text-grafito-500 border-grafito-200',
};

export const PRIORIDAD_LABELS: Record<TicketPriority, string> = {
  [TicketPriority.BAJA]: 'Baja',
  [TicketPriority.MEDIA]: 'Media',
  [TicketPriority.ALTA]: 'Alta',
  [TicketPriority.CRITICA]: 'Critica',
};

export const PRIORIDAD_CLASSES: Record<TicketPriority, string> = {
  [TicketPriority.BAJA]: 'bg-grafito-100 text-grafito-500',
  [TicketPriority.MEDIA]: 'bg-turquesa-500/10 text-turquesa-600',
  [TicketPriority.ALTA]: 'bg-amber-100 text-amber-700',
  [TicketPriority.CRITICA]: 'bg-red-100 text-red-700',
};

export const ASSET_ESTADO_LABELS: Record<AssetStatus, string> = {
  [AssetStatus.ACTIVO]: 'Activo',
  [AssetStatus.EN_REPARACION]: 'En reparacion',
  [AssetStatus.DE_BAJA]: 'De baja',
  [AssetStatus.EN_DEPOSITO]: 'En deposito',
};

export function formatFecha(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
