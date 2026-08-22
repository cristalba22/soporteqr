import { Router } from 'express';
import type { Request, Response } from 'express';
import { createLocationSchema, updateLocationSchema } from '@soporteqr/shared';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import { createLocation, getLocationById, listLocations, updateLocation } from './service.js';

export const locationsRouter = Router();

locationsRouter.use(requireAuth);

locationsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const ubicaciones = await listLocations(req.user.organizationId);
    res.json({ locations: ubicaciones });
  }),
);

locationsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Ubicacion no encontrada');
    const ubicacion = await getLocationById(req.user.organizationId, id);
    res.json({ location: ubicacion });
  }),
);

locationsRouter.post(
  '/',
  requireRole('ADMINISTRADOR'),
  validate(createLocationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const ubicacion = await createLocation(req.user.organizationId, req.user.id, req.body, req.ip);
    res.status(201).json({ location: ubicacion });
  }),
);

locationsRouter.patch(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate(updateLocationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Ubicacion no encontrada');
    const ubicacion = await updateLocation(req.user.organizationId, req.user.id, id, req.body, req.ip);
    res.json({ location: ubicacion });
  }),
);
