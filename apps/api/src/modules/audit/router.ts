import { Router } from 'express';
import type { Request, Response } from 'express';
import { auditFilterSchema, type AuditFilterInput } from '@soporteqr/shared';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import { listAuditLogs } from './service.js';

export const auditRouter = Router();

auditRouter.use(requireAuth);
auditRouter.use(requireRole('ADMINISTRADOR'));

auditRouter.get(
  '/',
  validate(auditFilterSchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const resultado = await listAuditLogs(req.user.organizationId, req.query as unknown as AuditFilterInput);
    res.json(resultado);
  }),
);
