import { randomBytes } from 'node:crypto';
import { AuditAction } from '@soporteqr/shared';
import type { CreateAssetInput, UpdateAssetInput } from '@soporteqr/shared';
import { prisma } from '../../lib/prisma.js';
import { HttpError } from '../../utils/httpError.js';

async function registrarAuditoria(
  organizationId: string,
  userId: string | null,
  action: string,
  entidadId: string | null,
  ipAddress?: string,
): Promise<void> {
  await prisma.auditLog.create({
    data: { organizationId, userId, action, entidad: 'Asset', entidadId, ipAddress },
  });
}

async function generarPublicAssetCode(): Promise<string> {
  for (let intento = 0; intento < 5; intento += 1) {
    const codigo = `QR-${randomBytes(4).toString('hex').toUpperCase()}`;
    const existente = await prisma.asset.findUnique({ where: { publicAssetCode: codigo } });
    if (!existente) return codigo;
  }
  throw HttpError.conflict('No se pudo generar un codigo publico unico');
}

async function validarUbicacion(organizationId: string, locationId: string): Promise<void> {
  const location = await prisma.location.findFirst({ where: { id: locationId, organizationId } });
  if (!location) throw HttpError.badRequest('La ubicacion no pertenece a la organizacion');
}

export async function listAssets(organizationId: string) {
  return prisma.asset.findMany({
    where: { organizationId },
    include: { location: true, _count: { select: { tickets: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAssetById(organizationId: string, id: string) {
  const asset = await prisma.asset.findFirst({
    where: { id, organizationId },
    include: {
      location: true,
      tickets: { orderBy: { createdAt: 'desc' }, take: 20 },
      _count: { select: { tickets: true } },
    },
  });
  if (!asset) throw HttpError.notFound('Activo no encontrado');
  return asset;
}

export async function getAssetByPublicCode(publicAssetCode: string) {
  const asset = await prisma.asset.findUnique({
    where: { publicAssetCode },
    select: {
      publicAssetCode: true,
      codigoInterno: true,
      tipo: true,
      marca: true,
      modelo: true,
      estado: true,
      location: { select: { nombre: true } },
    },
  });
  if (!asset) throw HttpError.notFound('Activo no encontrado');
  return asset;
}

export async function createAsset(
  organizationId: string,
  userId: string,
  input: CreateAssetInput,
  ipAddress?: string,
) {
  await validarUbicacion(organizationId, input.locationId);
  const publicAssetCode = await generarPublicAssetCode();
  const asset = await prisma.asset.create({
    data: {
      organizationId,
      codigoInterno: input.codigoInterno,
      publicAssetCode,
      tipo: input.tipo,
      marca: input.marca,
      modelo: input.modelo,
      numeroSerie: input.numeroSerie,
      locationId: input.locationId,
      estado: input.estado as never,
      fechaAdquisicion: input.fechaAdquisicion ?? undefined,
      notas: input.notas,
    },
  });
  await registrarAuditoria(organizationId, userId, AuditAction.ACTIVO_CREADO, asset.id, ipAddress);
  return asset;
}

export async function updateAsset(
  organizationId: string,
  userId: string,
  id: string,
  input: UpdateAssetInput,
  ipAddress?: string,
) {
  const existente = await prisma.asset.findFirst({ where: { id, organizationId } });
  if (!existente) throw HttpError.notFound('Activo no encontrado');
  if (input.locationId) await validarUbicacion(organizationId, input.locationId);

  const asset = await prisma.asset.update({
    where: { id },
    data: {
      codigoInterno: input.codigoInterno,
      tipo: input.tipo,
      marca: input.marca,
      modelo: input.modelo,
      numeroSerie: input.numeroSerie,
      locationId: input.locationId,
      estado: input.estado as never,
      fechaAdquisicion: input.fechaAdquisicion ?? undefined,
      notas: input.notas,
      ultimoMantenimiento: input.ultimoMantenimiento ?? undefined,
    },
  });
  await registrarAuditoria(organizationId, userId, AuditAction.ACTIVO_ACTUALIZADO, asset.id, ipAddress);
  return asset;
}
