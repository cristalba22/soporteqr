export const UserRole = {
  EMPLEADO: 'EMPLEADO',
  TECNICO: 'TECNICO',
  ADMINISTRADOR: 'ADMINISTRADOR',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const USER_ROLES = Object.values(UserRole);

export const TicketStatus = {
  NUEVO: 'NUEVO',
  ASIGNADO: 'ASIGNADO',
  EN_PROGRESO: 'EN_PROGRESO',
  ESPERANDO_USUARIO: 'ESPERANDO_USUARIO',
  RESUELTO: 'RESUELTO',
  CERRADO: 'CERRADO',
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];
export const TICKET_STATUSES = Object.values(TicketStatus);

export const TicketPriority = {
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  CRITICA: 'CRITICA',
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];
export const TICKET_PRIORITIES = Object.values(TicketPriority);

export const AssetStatus = {
  ACTIVO: 'ACTIVO',
  EN_REPARACION: 'EN_REPARACION',
  DE_BAJA: 'DE_BAJA',
  EN_DEPOSITO: 'EN_DEPOSITO',
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];
export const ASSET_STATUSES = Object.values(AssetStatus);

// Transiciones de estado permitidas para tickets (maquina de estados simple).
export const TICKET_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NUEVO: ['ASIGNADO', 'CERRADO'],
  ASIGNADO: ['EN_PROGRESO', 'NUEVO', 'CERRADO'],
  EN_PROGRESO: ['ESPERANDO_USUARIO', 'RESUELTO', 'ASIGNADO'],
  ESPERANDO_USUARIO: ['EN_PROGRESO', 'RESUELTO'],
  RESUELTO: ['CERRADO', 'EN_PROGRESO'],
  CERRADO: [],
};

export const NotificationType = {
  TICKET_CREADO: 'TICKET_CREADO',
  TICKET_ASIGNADO: 'TICKET_ASIGNADO',
  TICKET_CAMBIO_ESTADO: 'TICKET_CAMBIO_ESTADO',
  TICKET_COMENTARIO: 'TICKET_COMENTARIO',
  TICKET_RESUELTO: 'TICKET_RESUELTO',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export const NOTIFICATION_TYPES = Object.values(NotificationType);

export const AuditAction = {
  LOGIN_EXITOSO: 'LOGIN_EXITOSO',
  LOGIN_FALLIDO: 'LOGIN_FALLIDO',
  LOGOUT: 'LOGOUT',
  USUARIO_CREADO: 'USUARIO_CREADO',
  USUARIO_ACTUALIZADO: 'USUARIO_ACTUALIZADO',
  ROL_CAMBIADO: 'ROL_CAMBIADO',
  ACTIVO_CREADO: 'ACTIVO_CREADO',
  ACTIVO_ACTUALIZADO: 'ACTIVO_ACTUALIZADO',
  UBICACION_CREADA: 'UBICACION_CREADA',
  UBICACION_ACTUALIZADA: 'UBICACION_ACTUALIZADA',
  CATEGORIA_CREADA: 'CATEGORIA_CREADA',
  CATEGORIA_ACTUALIZADA: 'CATEGORIA_ACTUALIZADA',
  TICKET_CREADO: 'TICKET_CREADO',
  TICKET_ASIGNADO: 'TICKET_ASIGNADO',
  TICKET_CAMBIO_ESTADO: 'TICKET_CAMBIO_ESTADO',
  TICKET_COMENTARIO_AGREGADO: 'TICKET_COMENTARIO_AGREGADO',
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
export const AUDIT_ACTIONS = Object.values(AuditAction);
