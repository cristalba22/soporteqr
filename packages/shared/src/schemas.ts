import { z } from 'zod';
import {
  ASSET_STATUSES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  USER_ROLES,
} from './enums.js';

export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  role: z.enum(USER_ROLES as [string, ...string[]]),
  locationId: z.string().uuid().nullable().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  nombre: z.string().trim().min(2).max(120).optional(),
  role: z.enum(USER_ROLES as [string, ...string[]]).optional(),
  locationId: z.string().uuid().nullable().optional(),
  activo: z.boolean().optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const createLocationSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  direccion: z.string().trim().max(250).optional(),
});
export type CreateLocationInput = z.infer<typeof createLocationSchema>;

export const createCategorySchema = z.object({
  nombre: z.string().trim().min(2).max(80),
  descripcion: z.string().trim().max(250).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const createAssetSchema = z.object({
  codigoInterno: z.string().trim().min(2).max(40),
  tipo: z.string().trim().min(2).max(60),
  marca: z.string().trim().max(60).optional(),
  modelo: z.string().trim().max(60).optional(),
  numeroSerie: z.string().trim().max(80).optional(),
  locationId: z.string().uuid(),
  estado: z.enum(ASSET_STATUSES as [string, ...string[]]).default('ACTIVO'),
  fechaAdquisicion: z.string().datetime().optional().nullable(),
  notas: z.string().trim().max(1000).optional(),
});
export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = createAssetSchema.partial().extend({
  ultimoMantenimiento: z.string().datetime().optional().nullable(),
});
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;

export const createTicketSchema = z.object({
  titulo: z.string().trim().min(4).max(150),
  descripcion: z.string().trim().min(10).max(3000),
  assetPublicCode: z.string().trim().min(4).max(40),
  categoryId: z.string().uuid().nullable().optional(),
  prioridad: z.enum(TICKET_PRIORITIES as [string, ...string[]]).default('MEDIA'),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketStatusSchema = z.object({
  estado: z.enum(TICKET_STATUSES as [string, ...string[]]),
  diagnostico: z.string().trim().max(3000).optional(),
  solucion: z.string().trim().max(3000).optional(),
});
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;

export const assignTicketSchema = z.object({
  technicianId: z.string().uuid(),
});
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;

export const createCommentSchema = z.object({
  contenido: z.string().trim().min(1).max(2000),
  interno: z.boolean().default(false),
});
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const ticketFilterSchema = z.object({
  estado: z.enum(TICKET_STATUSES as [string, ...string[]]).optional(),
  prioridad: z.enum(TICKET_PRIORITIES as [string, ...string[]]).optional(),
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  technicianId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type TicketFilterInput = z.infer<typeof ticketFilterSchema>;
