import { AuditAction } from '@soporteqr/shared';
import type { CreateLocationInput, UpdateLocationInput } from '@soporteqr/shared';
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
    data: { organizationId, userId, action, entidad: 'Location', entidadId, ipAddress },
  });
}

export async function listLocations(organizationId: string) {
  return prisma.location.findMany({
    where: { organizationId },
    include: { _count: { select: { users: true, assets: true, tickets: true } } },
    orderBy: { nombre: 'asc' },
  });
}

export async function getLocationById(organizationId: string, id: string) {
  const location = await prisma.location.findFirst({ where: { id, organizationId } });
  if (!location) throw HttpError.notFound('Ubicacion no encontrada');
  return location;
}

export async function createLocation(
  organizationId: string,
  userId: string,
  input: CreateLocationInput,
  ipAddress?: string,
) {
  const location = await prisma.location.create({
    data: {
      organizationId,
      nombre: input.nombre,
      direccion: input.direccion,
    },
  });
  await registrarAuditoria(organizationId, userId, AuditAction.UBICACION_CREADA, location.id, ipAddress);
  return location;
}

export async function updateLocation(
  organizationId: string,
  userId: string,
  id: string,
  input: UpdateLocationInput,
  ipAddress?: string,
) {
  const existente = await prisma.location.findFirst({ where: { id, organizationId } });
  if (!existente) throw HttpError.notFound('Ubicacion no encontrada');

  const location = await prisma.location.update({
    where: { id },
    data: {
      nombre: input.nombre,
      direccion: input.direccion,
    },
  });
  await registrarAuditoria(organizationId, userId, AuditAction.UBICACION_ACTUALIZADA, location.id, ipAddress);
  return location;
}

export async function deleteLocation(
  organizationId: string,
  userId: string,
  id: string,
  ipAddress?: string,
): Promise<void> {
  const location = await prisma.location.findFirst({
    where: { id, organizationId },
    include: { _count: { select: { users: true, assets: true, tickets: true } } },
  });
  if (!location) throw HttpError.notFound('Ubicacion no encontrada');
  if (location._count.users || location._count.assets || location._count.tickets) {
    throw HttpError.conflict('No se puede eliminar una ubicacion que tiene usuarios, activos o tickets asociados');
  }

  await prisma.location.delete({ where: { id } });
  await registrarAuditoria(organizationId, userId, AuditAction.UBICACION_ELIMINADA, id, ipAddress);
}
