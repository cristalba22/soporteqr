import { Router } from 'express';
import type { Request, Response } from 'express';
import { createUserSchema, updateUserSchema } from '@soporteqr/shared';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import { createUser, getUserByIdInOrganization, listActiveTechnicians, listUsers, updateUser } from './service.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.get(
  '/technicians',
  requireRole('TECNICO', 'ADMINISTRADOR'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const technicians = await listActiveTechnicians(req.user.organizationId);
    res.json({ users: technicians });
  }),
);

usersRouter.use(requireRole('ADMINISTRADOR'));

usersRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const usuarios = await listUsers(req.user.organizationId);
    res.json({ users: usuarios });
  }),
);

usersRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Usuario no encontrado');
    const usuario = await getUserByIdInOrganization(req.user.organizationId, id);
    res.json({ user: usuario });
  }),
);

usersRouter.post(
  '/',
  validate(createUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const usuario = await createUser(req.user.organizationId, req.user.id, req.body, req.ip);
    res.status(201).json({ user: usuario });
  }),
);

usersRouter.patch(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Usuario no encontrado');
    const usuario = await updateUser(req.user.organizationId, req.user.id, id, req.body, req.ip);
    res.json({ user: usuario });
  }),
);
