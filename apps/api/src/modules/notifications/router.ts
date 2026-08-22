import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import { listNotifications, markNotificationAsRead } from './service.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const notificaciones = await listNotifications(req.user.id);
    res.json({ notifications: notificaciones });
  }),
);

notificationsRouter.patch(
  '/:id/leida',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Notificacion no encontrada');
    const notificacion = await markNotificationAsRead(req.user.id, id);
    res.json({ notification: notificacion });
  }),
);
