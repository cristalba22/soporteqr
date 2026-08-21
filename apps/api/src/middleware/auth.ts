import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@soporteqr/shared';
import { HttpError } from '../utils/httpError.js';
import { verifyAccessToken } from '../modules/auth/tokens.js';

export interface AuthenticatedUser {
  id: string;
  organizationId: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(HttpError.unauthorized());
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      organizationId: payload.organizationId,
      role: payload.role,
    };
    next();
  } catch {
    next(HttpError.unauthorized('Token invalido o expirado'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(HttpError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(HttpError.forbidden());
      return;
    }
    next();
  };
}
