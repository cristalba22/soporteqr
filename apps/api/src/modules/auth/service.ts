import { AuditAction } from '@soporteqr/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../utils/httpError.js';
import { hashPassword, verifyPassword } from './password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AccessTokenPayload,
} from './tokens.js';
import type { UserRole } from '@soporteqr/shared';

export interface AuthenticatedResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    nombre: string;
    email: string;
    role: UserRole;
    organizationId: string;
    locationId: string | null;
  };
}

async function registrarAuditoria(
  organizationId: string,
  userId: string | null,
  action: string,
  ipAddress?: string,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action,
      entidad: 'User',
      entidadId: userId,
      ipAddress,
    },
  });
}

export async function login(
  email: string,
  password: string,
  ipAddress?: string,
): Promise<AuthenticatedResult> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.activo) {
    if (user) {
      await registrarAuditoria(user.organizationId, user.id, AuditAction.LOGIN_FALLIDO, ipAddress);
    }
    throw HttpError.unauthorized('Credenciales invalidas');
  }

  const valido = await verifyPassword(user.passwordHash, password);
  if (!valido) {
    await registrarAuditoria(user.organizationId, user.id, AuditAction.LOGIN_FALLIDO, ipAddress);
    throw HttpError.unauthorized('Credenciales invalidas');
  }

  await registrarAuditoria(user.organizationId, user.id, AuditAction.LOGIN_EXITOSO, ipAddress);

  const payload: AccessTokenPayload = {
    sub: user.id,
    organizationId: user.organizationId,
    role: user.role as UserRole,
  };

  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ sub: user.id }),
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      role: user.role as UserRole,
      organizationId: user.organizationId,
      locationId: user.locationId,
    },
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw HttpError.unauthorized('Refresh token invalido o expirado');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.activo) {
    throw HttpError.unauthorized('Usuario no valido');
  }

  const accessToken = signAccessToken({
    sub: user.id,
    organizationId: user.organizationId,
    role: user.role as UserRole,
  });

  return { accessToken };
}

export async function logout(
  organizationId: string,
  userId: string,
  ipAddress?: string,
): Promise<void> {
  await registrarAuditoria(organizationId, userId, AuditAction.LOGOUT, ipAddress);
}

export async function getUserById(userId: string): Promise<AuthenticatedResult['user'] | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    role: user.role as UserRole,
    organizationId: user.organizationId,
    locationId: user.locationId,
  };
}

export { hashPassword };
