import type { AuditFilterInput } from '@soporteqr/shared';
import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export async function listAuditLogs(organizationId: string, filtro: AuditFilterInput) {
  const where: Prisma.AuditLogWhereInput = {
    organizationId,
    action: filtro.action,
    userId: filtro.userId,
    entidad: filtro.entidad,
  };

  if (filtro.desde || filtro.hasta) {
    where.createdAt = {
      gte: filtro.desde ? new Date(filtro.desde) : undefined,
      lte: filtro.hasta ? new Date(filtro.hasta) : undefined,
    };
  }

  const skip = (filtro.page - 1) * filtro.pageSize;

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: filtro.pageSize,
      include: { user: { select: { id: true, nombre: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items, total, page: filtro.page, pageSize: filtro.pageSize };
}
