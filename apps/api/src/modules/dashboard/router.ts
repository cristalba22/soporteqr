import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import { getDashboardSummary, type DashboardFiltros } from './service.js';

export const dashboardRouter = Router();

const dashboardQuerySchema = z
  .object({
    desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    locationId: z.string().uuid().optional(),
  })
  .refine((query) => !query.desde || !query.hasta || query.desde <= query.hasta, {
    message: 'La fecha desde no puede ser posterior a la fecha hasta',
  });

dashboardRouter.use(requireAuth);
dashboardRouter.use(requireRole('ADMINISTRADOR', 'TECNICO'));

dashboardRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const query = dashboardQuerySchema.parse(req.query);
    const filtros: DashboardFiltros = {
      desde: query.desde ? new Date(`${query.desde}T00:00:00.000Z`) : undefined,
      hasta: query.hasta ? new Date(`${query.hasta}T23:59:59.999Z`) : undefined,
      locationId: query.locationId,
    };
    const resumen = await getDashboardSummary(req.user.organizationId, filtros);
    res.json(resumen);
  }),
);
