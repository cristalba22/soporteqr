import {
  AuditAction,
  NotificationType,
  TICKET_STATUS_TRANSITIONS,
  buildTicketNumber,
} from '@soporteqr/shared';
import type { UserRole } from '@soporteqr/shared';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import type {
  AssignTicketInput,
  CreateCommentInput,
  CreateTicketInput,
  TicketFilterInput,
  TicketStatus,
  UpdateTicketStatusInput,
} from '@soporteqr/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../utils/httpError.js';

async function registrarAuditoria(
  organizationId: string,
  userId: string | null,
  action: string,
  entidadId: string | null,
  ipAddress?: string,
): Promise<void> {
  await prisma.auditLog.create({
    data: { organizationId, userId, action, entidad: 'Ticket', entidadId, ipAddress },
  });
}

async function generarNumeroTicket(organizationId: string): Promise<string> {
  const year = new Date().getFullYear();
  const inicioAnio = new Date(`${year}-01-01T00:00:00.000Z`);
  const cantidad = await prisma.ticket.count({
    where: { organizationId, createdAt: { gte: inicioAnio } },
  });
  return buildTicketNumber(year, cantidad + 1);
}

const TICKET_INCLUDE = {
  asset: { select: { id: true, codigoInterno: true, publicAssetCode: true, tipo: true } },
  reportante: { select: { id: true, nombre: true, email: true } },
  tecnico: { select: { id: true, nombre: true, email: true } },
  categoria: true,
  location: true,
} as const;

function accesoTicket(organizationId: string, userId: string, role: UserRole) {
  return role === 'EMPLEADO' ? { organizationId, reporterId: userId } : { organizationId };
}

export async function listTickets(organizationId: string, userId: string, role: UserRole, filtro: TicketFilterInput) {
  const where = {
    ...accesoTicket(organizationId, userId, role),
    estado: filtro.estado as never,
    prioridad: filtro.prioridad as never,
    categoryId: filtro.categoryId,
    locationId: filtro.locationId,
    assetId: filtro.assetId,
    technicianId: filtro.technicianId,
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: TICKET_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (filtro.page - 1) * filtro.pageSize,
      take: filtro.pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  return { tickets, total, page: filtro.page, pageSize: filtro.pageSize };
}

export async function getTicketById(organizationId: string, id: string, userId: string, role: UserRole) {
  const ticket = await prisma.ticket.findFirst({
    where: { id, ...accesoTicket(organizationId, userId, role) },
    include: {
      ...TICKET_INCLUDE,
      comentarios: {
        where: role === 'EMPLEADO' ? { interno: false } : undefined,
        include: { author: { select: { id: true, nombre: true } } },
        orderBy: { createdAt: 'asc' },
      },
      adjuntos: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true } },
      historial: { include: { actor: { select: { id: true, nombre: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!ticket) throw HttpError.notFound('Ticket no encontrado');
  return ticket;
}

export async function createTicket(
  organizationId: string,
  reporterId: string,
  input: CreateTicketInput,
  ipAddress?: string,
) {
  const asset = await prisma.asset.findFirst({
    where: { publicAssetCode: input.assetPublicCode, organizationId },
  });
  if (!asset) throw HttpError.notFound('Activo no encontrado');
  if (input.categoryId) {
    const category = await prisma.category.findFirst({ where: { id: input.categoryId, organizationId } });
    if (!category) throw HttpError.badRequest('La categoria no pertenece a la organizacion');
  }

  const numero = await generarNumeroTicket(organizationId);

  const ticket = await prisma.ticket.create({
    data: {
      organizationId,
      numero,
      titulo: input.titulo,
      descripcion: input.descripcion,
      assetId: asset.id,
      reporterId,
      categoryId: input.categoryId ?? undefined,
      locationId: asset.locationId,
      prioridad: input.prioridad as never,
    },
    include: TICKET_INCLUDE,
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      actorId: reporterId,
      estadoAnterior: null,
      estadoNuevo: 'NUEVO',
      descripcion: 'Ticket creado',
    },
  });

  await registrarAuditoria(organizationId, reporterId, AuditAction.TICKET_CREADO, ticket.id, ipAddress);

  return ticket;
}

export async function assignTicket(
  organizationId: string,
  actorId: string,
  ticketId: string,
  input: AssignTicketInput,
  ipAddress?: string,
) {
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, organizationId } });
  if (!ticket) throw HttpError.notFound('Ticket no encontrado');

  const tecnico = await prisma.user.findFirst({
    where: { id: input.technicianId, organizationId, role: 'TECNICO' },
  });
  if (!tecnico) throw HttpError.notFound('Tecnico no encontrado');

  const siguientesEstados = TICKET_STATUS_TRANSITIONS[ticket.estado as TicketStatus];
  const nuevoEstado = siguientesEstados.includes('ASIGNADO') ? 'ASIGNADO' : ticket.estado;

  const actualizado = await prisma.ticket.update({
    where: { id: ticketId },
    data: { technicianId: tecnico.id, estado: nuevoEstado as never },
    include: TICKET_INCLUDE,
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actorId,
      estadoAnterior: ticket.estado,
      estadoNuevo: nuevoEstado as never,
      descripcion: `Ticket asignado a ${tecnico.nombre}`,
    },
  });

  await prisma.notification.create({
    data: {
      userId: tecnico.id,
      ticketId,
      type: NotificationType.TICKET_ASIGNADO,
      mensaje: `Se te asigno el ticket ${ticket.numero}`,
    },
  });

  await registrarAuditoria(organizationId, actorId, AuditAction.TICKET_ASIGNADO, ticketId, ipAddress);

  return actualizado;
}

export async function updateTicketStatus(
  organizationId: string,
  actorId: string,
  ticketId: string,
  input: UpdateTicketStatusInput,
  ipAddress?: string,
) {
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, organizationId } });
  if (!ticket) throw HttpError.notFound('Ticket no encontrado');

  const permitidos = TICKET_STATUS_TRANSITIONS[ticket.estado as TicketStatus];
  if (!permitidos.includes(input.estado as never)) {
    throw HttpError.badRequest(`No se puede pasar de ${ticket.estado} a ${input.estado}`);
  }

  const ahora = new Date();
  const actualizado = await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      estado: input.estado as never,
      diagnostico: input.diagnostico ?? ticket.diagnostico,
      solucion: input.solucion ?? ticket.solucion,
      resueltoAt: input.estado === 'RESUELTO' ? ahora : ticket.resueltoAt,
      cerradoAt: input.estado === 'CERRADO' ? ahora : ticket.cerradoAt,
    },
    include: TICKET_INCLUDE,
  });

  await prisma.ticketHistory.create({
    data: {
      ticketId,
      actorId,
      estadoAnterior: ticket.estado,
      estadoNuevo: input.estado as never,
      descripcion: `Estado cambiado de ${ticket.estado} a ${input.estado}`,
    },
  });

  if (input.estado === 'RESUELTO') {
    await prisma.notification.create({
      data: {
        userId: ticket.reporterId,
        ticketId,
        type: NotificationType.TICKET_RESUELTO,
        mensaje: `Tu ticket ${ticket.numero} fue resuelto`,
      },
    });
  } else {
    await prisma.notification.create({
      data: {
        userId: ticket.reporterId,
        ticketId,
        type: NotificationType.TICKET_CAMBIO_ESTADO,
        mensaje: `Tu ticket ${ticket.numero} cambio a ${input.estado}`,
      },
    });
  }

  await registrarAuditoria(organizationId, actorId, AuditAction.TICKET_CAMBIO_ESTADO, ticketId, ipAddress);

  return actualizado;
}

export async function addComment(
  organizationId: string,
  authorId: string,
  role: UserRole,
  ticketId: string,
  input: CreateCommentInput,
  ipAddress?: string,
) {
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, ...accesoTicket(organizationId, authorId, role) } });
  if (!ticket) throw HttpError.notFound('Ticket no encontrado');
  if (role === 'EMPLEADO' && input.interno) throw HttpError.forbidden('No puedes crear notas internas');

  const comentario = await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId,
      contenido: input.contenido,
      interno: input.interno,
    },
    include: { author: { select: { id: true, nombre: true } } },
  });

  const destinatarioId = authorId === ticket.reporterId ? ticket.technicianId : ticket.reporterId;
  if (destinatarioId && !input.interno) {
    await prisma.notification.create({
      data: {
        userId: destinatarioId,
        ticketId,
        type: NotificationType.TICKET_COMENTARIO,
        mensaje: `Nuevo comentario en el ticket ${ticket.numero}`,
      },
    });
  }

  await registrarAuditoria(organizationId, authorId, AuditAction.TICKET_COMENTARIO_AGREGADO, ticketId, ipAddress);

  return comentario;
}

const EXTENSIONES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export async function addAttachment(
  organizationId: string,
  userId: string,
  role: UserRole,
  ticketId: string,
  file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
) {
  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, ...accesoTicket(organizationId, userId, role) } });
  if (!ticket) throw HttpError.notFound('Ticket no encontrado');

  const storagePath = resolve(env.UPLOAD_DIR, `${randomUUID()}${EXTENSIONES[file.mimetype] ?? ''}`);
  await mkdir(dirname(storagePath), { recursive: true });
  await writeFile(storagePath, file.buffer);
  try {
    return await prisma.ticketAttachment.create({
      data: { ticketId, fileName: file.originalname, mimeType: file.mimetype, sizeBytes: file.size, storagePath },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    });
  } catch (error) {
    await unlink(storagePath).catch(() => undefined);
    throw error;
  }
}

export async function getAttachment(
  organizationId: string,
  userId: string,
  role: UserRole,
  ticketId: string,
  attachmentId: string,
) {
  const attachment = await prisma.ticketAttachment.findFirst({
    where: { id: attachmentId, ticketId, ticket: accesoTicket(organizationId, userId, role) },
  });
  if (!attachment) throw HttpError.notFound('Adjunto no encontrado');
  return attachment;
}
