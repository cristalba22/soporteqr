import { prisma } from '../../lib/prisma.js';

export async function getDashboardSummary(organizationId: string) {
  const [
    porEstado,
    porPrioridad,
    porCategoria,
    activosConMasIncidencias,
    cargaPorTecnico,
    resueltos,
    evolucionMensual,
  ] = await Promise.all([
    prisma.ticket.groupBy({
      by: ['estado'],
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ['prioridad'],
      where: { organizationId },
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ['categoryId'],
      where: { organizationId, categoryId: { not: null } },
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ['assetId'],
      where: { organizationId },
      _count: { _all: true },
      orderBy: { _count: { assetId: 'desc' } },
      take: 5,
    }),
    prisma.ticket.groupBy({
      by: ['technicianId'],
      where: { organizationId, technicianId: { not: null } },
      _count: { _all: true },
    }),
    prisma.ticket.findMany({
      where: { organizationId, resueltoAt: { not: null } },
      select: { createdAt: true, resueltoAt: true },
    }),
    prisma.$queryRaw<Array<{ mes: Date; total: bigint }>>`
      SELECT date_trunc('month', "createdAt") AS mes, COUNT(*)::bigint AS total
      FROM tickets
      WHERE "organizationId" = ${organizationId}
      GROUP BY mes
      ORDER BY mes ASC
    `,
  ]);

  const categoriaIds = porCategoria.map((c) => c.categoryId).filter((id): id is string => id !== null);
  const assetIds = activosConMasIncidencias.map((a) => a.assetId);
  const technicianIds = cargaPorTecnico
    .map((t) => t.technicianId)
    .filter((id): id is string => id !== null);

  const [categorias, activos, tecnicos] = await Promise.all([
    prisma.category.findMany({ where: { id: { in: categoriaIds } }, select: { id: true, nombre: true } }),
    prisma.asset.findMany({ where: { id: { in: assetIds } }, select: { id: true, codigoInterno: true, tipo: true } }),
    prisma.user.findMany({ where: { id: { in: technicianIds } }, select: { id: true, nombre: true } }),
  ]);

  const tiemposResolucionMs = resueltos
    .filter((t) => t.resueltoAt)
    .map((t) => t.resueltoAt!.getTime() - t.createdAt.getTime());
  const tiempoPromedioResolucionHoras =
    tiemposResolucionMs.length > 0
      ? tiemposResolucionMs.reduce((acc, ms) => acc + ms, 0) / tiemposResolucionMs.length / 3_600_000
      : 0;

  const ticketsAbiertos = porEstado
    .filter((e) => e.estado !== 'RESUELTO' && e.estado !== 'CERRADO')
    .reduce((acc, e) => acc + e._count._all, 0);
  const ticketsResueltos = porEstado
    .filter((e) => e.estado === 'RESUELTO' || e.estado === 'CERRADO')
    .reduce((acc, e) => acc + e._count._all, 0);

  return {
    ticketsAbiertos,
    ticketsResueltos,
    tiempoPromedioResolucionHoras: Math.round(tiempoPromedioResolucionHoras * 100) / 100,
    distribucionPorEstado: porEstado.map((e) => ({ estado: e.estado, total: e._count._all })),
    distribucionPorPrioridad: porPrioridad.map((p) => ({ prioridad: p.prioridad, total: p._count._all })),
    distribucionPorCategoria: porCategoria.map((c) => ({
      categoryId: c.categoryId,
      categoria: categorias.find((cat) => cat.id === c.categoryId)?.nombre ?? 'Sin categoria',
      total: c._count._all,
    })),
    activosConMasIncidencias: activosConMasIncidencias.map((a) => ({
      assetId: a.assetId,
      codigoInterno: activos.find((asset) => asset.id === a.assetId)?.codigoInterno ?? '',
      tipo: activos.find((asset) => asset.id === a.assetId)?.tipo ?? '',
      total: a._count._all,
    })),
    cargaPorTecnico: cargaPorTecnico.map((t) => ({
      technicianId: t.technicianId,
      nombre: tecnicos.find((tec) => tec.id === t.technicianId)?.nombre ?? 'Sin asignar',
      total: t._count._all,
    })),
    evolucionMensual: evolucionMensual.map((e) => ({ mes: e.mes, total: Number(e.total) })),
  };
}
