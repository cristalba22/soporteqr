import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Datos invalidos', details: err.flatten() });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  console.error('Error no controlado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
}
