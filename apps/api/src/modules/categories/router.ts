import { Router } from 'express';
import type { Request, Response } from 'express';
import { createCategorySchema, updateCategorySchema } from '@soporteqr/shared';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import { createCategory, deleteCategory, getCategoryById, listCategories, updateCategory } from './service.js';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const categorias = await listCategories(req.user.organizationId);
    res.json({ categories: categorias });
  }),
);

categoriesRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Categoria no encontrada');
    const categoria = await getCategoryById(req.user.organizationId, id);
    res.json({ category: categoria });
  }),
);

categoriesRouter.post(
  '/',
  requireRole('ADMINISTRADOR'),
  validate(createCategorySchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const categoria = await createCategory(req.user.organizationId, req.user.id, req.body, req.ip);
    res.status(201).json({ category: categoria });
  }),
);

categoriesRouter.patch(
  '/:id',
  requireRole('ADMINISTRADOR'),
  validate(updateCategorySchema),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Categoria no encontrada');
    const categoria = await updateCategory(req.user.organizationId, req.user.id, id, req.body, req.ip);
    res.json({ category: categoria });
  }),
);

categoriesRouter.delete(
  '/:id',
  requireRole('ADMINISTRADOR'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw HttpError.unauthorized();
    const { id } = req.params;
    if (!id) throw HttpError.notFound('Categoria no encontrada');
    await deleteCategory(req.user.organizationId, req.user.id, id, req.ip);
    res.status(204).send();
  }),
);
