import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  assignTicketSchema,
  createCommentSchema,
  createTicketSchema,
  ticketFilterSchema,
  updateTicketStatusSchema,
} from '@soporteqr/shared';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import {
  addComment,
  assignTicket,
  createTicket,
  getTicketById,
  listTickets,
  updateTicketStatus,
} from './service.js';

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth);

ticketsRouter.get(
  '/',
  validate(ticketFilterSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const resultado = await listTickets(req.user.organizationId, req.query as never);
    res.json(resultado);
  }),
);

ticketsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Ticket no encontrado');
    const ticket = await getTicketById(req.user.organizationId, id);
    res.json({ ticket });
  }),
);

ticketsRouter.post(
  '/',
  validate(createTicketSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const ticket = await createTicket(req.user.organizationId, req.user.id, req.body, req.ip);
    res.status(201).json({ ticket });
  }),
);

ticketsRouter.post(
  '/:id/asignar',
  requireRole('TECNICO', 'ADMINISTRADOR'),
  validate(assignTicketSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Ticket no encontrado');
    const ticket = await assignTicket(req.user.organizationId, req.user.id, id, req.body, req.ip);
    res.json({ ticket });
  }),
);

ticketsRouter.post(
  '/:id/estado',
  requireRole('TECNICO', 'ADMINISTRADOR'),
  validate(updateTicketStatusSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Ticket no encontrado');
    const ticket = await updateTicketStatus(req.user.organizationId, req.user.id, id, req.body, req.ip);
    res.json({ ticket });
  }),
);

ticketsRouter.post(
  '/:id/comentarios',
  validate(createCommentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Ticket no encontrado');
    const comentario = await addComment(req.user.organizationId, req.user.id, id, req.body, req.ip);
    res.status(201).json({ comentario });
  }),
);
