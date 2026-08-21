import { Router } from 'express';
import type { Request, Response } from 'express';
import { loginSchema } from '@soporteqr/shared';
import { env, isProduction } from '../../config/env.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { HttpError } from '../../utils/httpError.js';
import { getUserById, login, logout, refreshAccessToken } from './service.js';

export const authRouter = Router();

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/api/auth',
};

authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const resultado = await login(email, password, req.ip);

    res.cookie(env.REFRESH_COOKIE_NAME, resultado.refreshToken, {
      ...refreshCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: resultado.accessToken, user: resultado.user });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[env.REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw HttpError.unauthorized('No hay sesion activa');
    }
    const { accessToken } = await refreshAccessToken(token);
    res.json({ accessToken });
  }),
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    if (req.user) {
      await logout(req.user.organizationId, req.user.id, req.ip);
    }
    res.clearCookie(env.REFRESH_COOKIE_NAME, refreshCookieOptions);
    res.status(204).send();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw HttpError.unauthorized();
    }
    const usuario = await getUserById(req.user.id);
    if (!usuario) {
      throw HttpError.unauthorized('Usuario no encontrado');
    }
    res.json({ user: usuario });
  }),
);
