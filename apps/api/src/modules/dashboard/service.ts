import { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma.js';

export interface DashboardFiltros {
  desde?: Date;
  hasta?: Date;
  locationId?: string;
}

export const SLA_HORAS = 24;

export async function getDashboardSummary(organizationId: string, filtros: DashboardFiltros = {}) {
  const locationId = filtros.locationId;
  const ahora = new Date();
  const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
  const estadosCerrados = ['RESUELTO', 'CERRADO'] as const;

  const whereBase: Prisma.TicketWhereInput = { organizationId, ...(locationId ? { locationId } : {}) };
  const createdAt =
    filtros.desde || filtros.hasta
      ? { ...(filtros.desde ? { gte: filtros.desde } : {}), ...(filtros.hasta ? { lte: filtros.hasta } : {}) }
      : undefined;
  const whereRango: Prisma.TicketWhereInput = {
    ...whereBase,
    ...(createdAt ? { createdAt } : {}),
  };

  const periodoMs =
    filtros.desde && filtros.hasta ? filtros.hasta.getTime() - filtros.desde.getTime() + 1 : null;
  const desdeAnterior = periodoMs && filtros.desde ? new Date(filtros.desde.getTime() - periodoMs) : undefined;
  const hastaAnterior = filtros.desde ? new Date(filtros.desde.getTime() - 1) : undefined;
  const wherePeriodoAnterior: Prisma.TicketWhereInput =
    desdeAnterior && hastaAnterior ? { ...whereBase, createdAt: { gte: desdeAnterior, lte: hastaAnterior } } : { ...whereBase, id: '__sin_periodo_comparable__' };

  const condicionesEvolucion: Prisma.Sql[] = [Prisma.sql`"organizationId" = ${organizationId}`];
  if (locationId) condicionesEvolucion.push(Prisma.sql`"locationId" = ${locationId}`);
  if (filtros.desde) condicionesEvolucion.push(Prisma.sql`"createdAt" >= ${filtros.desde}`);
  if (filtros.hasta) condicionesEvolucion.push(Prisma.sql`"createdAt" <= ${filtros.hasta}`);
  const whereEvolucion = Prisma.join(condicionesEvolucion, ' AND ');

  const [
    porEstado,
    porPrioridad,
    porCategoria,
    activosConMasIncidencias,
    cargaPorTecnico,
    resueltos,
    evolucionMensual,
    criticosAbiertos,
    sinAsignar,
    esperandoUsuario,
    sinActividad,
    creadosUltimos30,
    creados30Anteriores,
    resueltosUltimos30,
    resueltos30Anteriores,
    ticketsAbiertosDetalle,
    criticosAbiertosDetalle,
  ] = await Promise.all([
    prisma.ticket.groupBy({
      by: ['estado'],
      where: whereRango,
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ['prioridad'],
      where: whereRango,
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ['categoryId'],
      where: { ...whereRango, categoryId: { not: null } },
      _count: { _all: true },
    }),
    prisma.ticket.groupBy({
      by: ['assetId'],
      where: whereRango,
      _count: { _all: true },
      orderBy: { _count: { assetId: 'desc' } },
      take: 5,
    }),
    prisma.ticket.groupBy({
      by: ['technicianId'],
      where: { ...whereRango, technicianId: { not: null } },
      _count: { _all: true },
    }),
    prisma.ticket.findMany({
      where: { ...whereRango, resueltoAt: { not: null } },
      select: { createdAt: true, resueltoAt: true },
    }),
    prisma.$queryRaw<Array<{ mes: Date; total: bigint }>>`
      SELECT date_trunc('month', "createdAt") AS mes, COUNT(*)::bigint AS total
      FROM tickets
      WHERE ${whereEvolucion}
      GROUP BY mes
      ORDER BY mes ASC
    `,
    prisma.ticket.count({
      where: { ...whereRango, prioridad: 'CRITICA', estado: { notIn: [...estadosCerrados] } },
    }),
    prisma.ticket.count({
      where: { ...whereRango, technicianId: null, estado: { notIn: [...estadosCerrados] } },
    }),
    prisma.ticket.count({ where: { ...whereRango, estado: 'ESPERANDO_USUARIO' } }),
    prisma.ticket.count({
      where: { ...whereRango, updatedAt: { lt: hace24Horas }, estado: { notIn: [...estadosCerrados] } },
    }),
    prisma.ticket.count({ where: whereRango }),
    prisma.ticket.count({ where: wherePeriodoAnterior }),
    prisma.ticket.count({ where: { ...whereBase, ...(createdAt ? { resueltoAt: createdAt } : { resueltoAt: { not: null } }) } }),
    prisma.ticket.count({ where: desdeAnterior && hastaAnterior ? { ...whereBase, resueltoAt: { gte: desdeAnterior, lte: hastaAnterior } } : { ...whereBase, id: '__sin_periodo_comparable__' } }),
    prisma.ticket.findMany({
      where: { ...whereRango, estado: { notIn: [...estadosCerrados] } },
      select: {
        id: true,
        numero: true,
        titulo: true,
        prioridad: true,
        estado: true,
        technicianId: true,
        createdAt: true,
        updatedAt: true,
        asset: { select: { codigoInterno: true } },
        location: { select: { nombre: true } },
      },
    }),
    prisma.ticket.findMany({
      where: { ...whereRango, prioridad: 'CRITICA', estado: { notIn: [...estadosCerrados] } },
      select: { id: true, numero: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
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

  const variacion = (actual: number, anterior: number) =>
    anterior === 0 ? null : Math.round(((actual - anterior) / anterior) * 100);
  const pesoPrioridad = { CRITICA: 4, ALTA: 3, MEDIA: 2, BAJA: 1 } as const;
  const atencionPrioritaria = ticketsAbiertosDetalle
    .filter(
      (ticket) =>
        ticket.prioridad === 'CRITICA' || ticket.technicianId === null || ticket.updatedAt < hace24Horas,
    )
    .sort((a, b) => {
      const diferenciaPrioridad = pesoPrioridad[b.prioridad] - pesoPrioridad[a.prioridad];
      return diferenciaPrioridad || a.updatedAt.getTime() - b.updatedAt.getTime();
    })
    .slice(0, 3)
    .map((ticket) => ({
      id: ticket.id,
      numero: ticket.numero,
      titulo: ticket.titulo,
      prioridad: ticket.prioridad,
      estado: ticket.estado,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      assetCode: ticket.asset.codigoInterno,
      location: ticket.location.nombre,
      motivo:
        ticket.prioridad === 'CRITICA'
          ? 'Prioridad critica'
          : ticket.technicianId === null
            ? 'Sin tecnico asignado'
            : 'Sin actividad hace mas de 24 h',
      antiguedadHoras: Math.max(0, Math.round((ahora.getTime() - ticket.createdAt.getTime()) / 3_600_000)),
      fueraSla: ahora.getTime() - ticket.createdAt.getTime() > SLA_HORAS * 3_600_000,
      slaHoras: SLA_HORAS,
    }));

  const criticosConAntiguedad = criticosAbiertosDetalle.map((ticket) => ({
    id: ticket.id,
    numero: ticket.numero,
    antiguedadHoras: Math.max(0, Math.round((ahora.getTime() - ticket.createdAt.getTime()) / 3_600_000)),
  }));

  return {
    ticketsAbiertos,
    ticketsResueltos,
    criticosAbiertos,
    sinAsignar,
    esperandoUsuario,
    sinActividad,
    creadosUltimos30,
    variacionCreados: variacion(creadosUltimos30, creados30Anteriores),
    resueltosUltimos30,
    variacionResueltos: variacion(resueltosUltimos30, resueltos30Anteriores),
    brechaCapacidad: creadosUltimos30 - resueltosUltimos30,
    criticosConAntiguedad,
    slaHoras: SLA_HORAS,
    atencionPrioritaria,
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
