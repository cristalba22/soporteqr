import { AuditAction } from '@soporteqr/shared';
import type { CreateUserInput, UpdateUserInput, UserRole } from '@soporteqr/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../utils/httpError.js';
import { hashPassword } from '../auth/password.js';

const userSelect = {
  id: true,
  organizationId: true,
  nombre: true,
  email: true,
  role: true,
  activo: true,
  locationId: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function registrarAuditoria(
  organizationId: string,
  userId: string | null,
  action: string,
  entidadId: string | null,
  ipAddress?: string,
): Promise<void> {
  await prisma.auditLog.create({
    data: { organizationId, userId, action, entidad: 'User', entidadId, ipAddress },
  });
}

export async function listUsers(organizationId: string) {
  return prisma.user.findMany({
    where: { organizationId },
    select: userSelect,
    orderBy: { nombre: 'asc' },
  });
}

export async function getUserByIdInOrganization(organizationId: string, id: string) {
  const user = await prisma.user.findFirst({ where: { id, organizationId }, select: userSelect });
  if (!user) throw HttpError.notFound('Usuario no encontrado');
  return user;
}

export async function createUser(
  organizationId: string,
  actorId: string,
  input: CreateUserInput,
  ipAddress?: string,
) {
  const existente = await prisma.user.findUnique({ where: { email: input.email } });
  if (existente) throw HttpError.conflict('Ya existe un usuario con ese email');

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      organizationId,
      nombre: input.nombre,
      email: input.email,
      passwordHash,
      role: input.role as UserRole,
      locationId: input.locationId ?? null,
    },
    select: userSelect,
  });
  await registrarAuditoria(organizationId, actorId, AuditAction.USUARIO_CREADO, user.id, ipAddress);
  return user;
}

export async function updateUser(
  organizationId: string,
  actorId: string,
  id: string,
  input: UpdateUserInput,
  ipAddress?: string,
) {
  const existente = await prisma.user.findFirst({ where: { id, organizationId } });
  if (!existente) throw HttpError.notFound('Usuario no encontrado');

  const pierdeAccesoAdministrador =
    existente.role === 'ADMINISTRADOR' &&
    (input.activo === false || (input.role !== undefined && input.role !== 'ADMINISTRADOR'));
  if (id === actorId && pierdeAccesoAdministrador) {
    throw HttpError.conflict('No puedes quitar tu propio acceso de administrador');
  }
  if (pierdeAccesoAdministrador) {
    const administradoresActivos = await prisma.user.count({
      where: { organizationId, role: 'ADMINISTRADOR', activo: true },
    });
    if (administradoresActivos <= 1) {
      throw HttpError.conflict('La organizacion debe conservar al menos un administrador activo');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      nombre: input.nombre,
      role: input.role as UserRole | undefined,
      locationId: input.locationId,
      activo: input.activo,
    },
    select: userSelect,
  });

  await registrarAuditoria(organizationId, actorId, AuditAction.USUARIO_ACTUALIZADO, user.id, ipAddress);
  if (input.role && input.role !== existente.role) {
    await registrarAuditoria(organizationId, actorId, AuditAction.ROL_CAMBIADO, user.id, ipAddress);
  }
  return user;
}
