import { AuditAction } from '@soporteqr/shared';
import type { CreateCategoryInput, UpdateCategoryInput } from '@soporteqr/shared';
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
    data: { organizationId, userId, action, entidad: 'Category', entidadId, ipAddress },
  });
}

export async function listCategories(organizationId: string) {
  return prisma.category.findMany({
    where: { organizationId },
    orderBy: { nombre: 'asc' },
  });
}

export async function getCategoryById(organizationId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, organizationId } });
  if (!category) throw HttpError.notFound('Categoria no encontrada');
  return category;
}

export async function createCategory(
  organizationId: string,
  userId: string,
  input: CreateCategoryInput,
  ipAddress?: string,
) {
  const category = await prisma.category.create({
    data: {
      organizationId,
      nombre: input.nombre,
      descripcion: input.descripcion,
    },
  });
  await registrarAuditoria(organizationId, userId, AuditAction.CATEGORIA_CREADA, category.id, ipAddress);
  return category;
}

export async function updateCategory(
  organizationId: string,
  userId: string,
  id: string,
  input: UpdateCategoryInput,
  ipAddress?: string,
) {
  const existente = await prisma.category.findFirst({ where: { id, organizationId } });
  if (!existente) throw HttpError.notFound('Categoria no encontrada');

  const category = await prisma.category.update({
    where: { id },
    data: {
      nombre: input.nombre,
      descripcion: input.descripcion,
    },
  });
  await registrarAuditoria(organizationId, userId, AuditAction.CATEGORIA_ACTUALIZADA, category.id, ipAddress);
  return category;
}
