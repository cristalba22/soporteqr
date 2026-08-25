import { Router } from 'express';
import type { Request, Response } from 'express';
import { createAssetSchema, updateAssetSchema } from '@soporteqr/shared';
import { buildReportUrl } from '@soporteqr/shared';
import QRCode from 'qrcode';
import { env } from '../../config/env.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import { createAsset, getAssetByPublicCode, getAssetById, listAssets, resolveAssetCode, updateAsset } from './service.js';

export const assetsRouter = Router();

assetsRouter.get(
  '/publico/:publicAssetCode/qr',
  asyncHandler(async (req: Request, res: Response) => {
    const { publicAssetCode } = req.params;
    if (!publicAssetCode) throw HttpError.notFound('Activo no encontrado');
    const activo = await getAssetByPublicCode(publicAssetCode);
    const reportUrl = buildReportUrl(activo.publicAssetCode, env.APP_BASE_URL);
    const png = await QRCode.toBuffer(reportUrl, { type: 'png', width: 512, margin: 2 });
    res.setHeader('Content-Type', 'image/png');
    const disposition = req.query.download === '1' ? 'attachment' : 'inline';
    res.setHeader('Content-Disposition', `${disposition}; filename="${activo.codigoInterno}-qr.png"`);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(png);
  }),
);

assetsRouter.get(
  '/publico/:publicAssetCode',
  asyncHandler(async (req: Request, res: Response) => {
    const { publicAssetCode } = req.params;
    if (!publicAssetCode) throw HttpError.notFound('Activo no encontrado');
    const activo = await getAssetByPublicCode(publicAssetCode);
    res.json({ asset: activo });
  }),
);

assetsRouter.use(requireAuth);

assetsRouter.get(
  '/resolver/:code',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { code } = req.params;
    if (!code) throw HttpError.notFound('Activo no encontrado');
    const activo = await resolveAssetCode(req.user.organizationId, code);
    res.json({ asset: activo });
  }),
);

assetsRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const activos = await listAssets(req.user.organizationId);
    res.json({ assets: activos });
  }),
);

assetsRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Activo no encontrado');
    const activo = await getAssetById(req.user.organizationId, id);
    res.json({ asset: activo });
  }),
);

assetsRouter.post(
  '/',
  requireRole('ADMINISTRADOR'),
  validate(createAssetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const activo = await createAsset(req.user.organizationId, req.user.id, req.body, req.ip);
    res.status(201).json({ asset: activo });
  }),
);

assetsRouter.patch(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate(updateAssetSchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Activo no encontrado');
    const activo = await updateAsset(req.user.organizationId, req.user.id, id, req.body, req.ip);
    res.json({ asset: activo });
  }),
);
