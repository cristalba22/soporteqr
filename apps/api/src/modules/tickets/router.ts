import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_ATTACHMENT_SIZE_BYTES,
  assignTicketSchema,
  createCommentSchema,
  createTicketSchema,
  ticketFilterSchema,
  updateTicketStatusSchema,
  updateTicketPrioritySchema,
} from '@soporteqr/shared';
import multer from 'multer';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import {
  addComment,
  addAttachment,
  assignTicket,
  createTicket,
  getTicketById,
  getAttachment,
  listTickets,
  updateTicketStatus,
  updateTicketPriority,
} from './service.js';

export const ticketsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
      callback(HttpError.badRequest('Solo se permiten imagenes PNG, JPG o WebP'));
      return;
    }
    callback(null, true);
  },
});

ticketsRouter.use(requireAuth);

ticketsRouter.get(
  '/',
  validate(ticketFilterSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const resultado = await listTickets(
      req.user.organizationId,
      req.user.id,
      req.user.role,
      req.query as never,
    );
    res.json(resultado);
  }),
);

ticketsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Ticket no encontrado');
    const ticket = await getTicketById(req.user.organizationId, id, req.user.id, req.user.role);
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
    const ticket = await updateTicketStatus(
      req.user.organizationId,
      req.user.id,
      id,
      req.body,
      req.ip,
    );
    res.json({ ticket });
  }),
);

ticketsRouter.post(
  '/:id/prioridad',
  requireRole('TECNICO', 'ADMINISTRADOR'),
  validate(updateTicketPrioritySchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Ticket no encontrado');
    const ticket = await updateTicketPriority(
      req.user.organizationId,
      req.user.id,
      id,
      req.body,
      req.ip,
    );
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
    const comentario = await addComment(
      req.user.organizationId,
      req.user.id,
      req.user.role,
      id,
      req.body,
      req.ip,
    );
    res.status(201).json({ comentario });
  }),
);

ticketsRouter.post(
  '/:id/adjuntos',
  upload.single('archivo'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Ticket no encontrado');
    if (!req.file) throw HttpError.badRequest('Debes seleccionar una imagen');
    const adjunto = await addAttachment(
      req.user.organizationId,
      req.user.id,
      req.user.role,
      id,
      req.file,
    );
    res.status(201).json({ attachment: adjunto });
  }),
);

ticketsRouter.get(
  '/:id/adjuntos/:attachmentId',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id, attachmentId } = req.params;
    if (!id || !attachmentId) throw HttpError.notFound('Adjunto no encontrado');
    const adjunto = await getAttachment(
      req.user.organizationId,
      req.user.id,
      req.user.role,
      id,
      attachmentId,
    );
    res.attachment(adjunto.fileName);
    res.type(adjunto.mimeType);
    res.setHeader('Content-Length', adjunto.data.byteLength);
    res.send(adjunto.data);
  }),
);
